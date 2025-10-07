import { IsometricRenderer } from './rendering/IsometricRenderer';
import { FIPCourt } from './entities/FIPCourt';
import { Ball3D } from './entities/Ball3D';
import { Player3D } from './entities/Player3D';
import { ServiceSystem3D } from './systems/ServiceSystem3D';
import { ScoreSystem } from './systems/ScoreSystem';
import { GameState3D, ServiceState, PointResult } from './types/3DTypes';
import { Physics3D } from './physics/Physics3D';

export class PadelGame3D {
  private ctx: CanvasRenderingContext2D;
  private width: number = 1200;
  private height: number = 800;

  // Game entities
  private court!: FIPCourt;
  private ball!: Ball3D;
  private players: Player3D[] = [];

  // Game systems
  private serviceSystem!: ServiceSystem3D;
  private scoreSystem!: ScoreSystem;

  // Game state
  private gameState: GameState3D = GameState3D.MENU;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private stateTimer: number = 0;
  private gameMessage: string = '';
  private debugMode: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d')!;

    this.initializeGame();
  }

  private initializeGame(): void {
    // Initialize court
    this.court = new FIPCourt();

    // Initialize ball
    this.ball = new Ball3D();

    // Initialize players
    this.initializePlayers();

    // Initialize systems
    this.serviceSystem = new ServiceSystem3D({ width: 10, length: 20 });
    this.scoreSystem = new ScoreSystem();

    // Setup global controls
    this.setupGlobalControls();
  }

  private initializePlayers(): void {
    // Team A players (bottom side)
    this.players.push(
      new Player3D({
        position: { x: 2.5, y: 0, z: 3 },
        team: 'A',
        side: 'left',
        controls: { up: 'w', down: 's', hit: ' ' },
        name: 'A1',
        color: '#FF6B6B'
      }),
      new Player3D({
        position: { x: 7.5, y: 0, z: 3 },
        team: 'A',
        side: 'right',
        controls: { up: 'q', down: 'a', hit: 'Tab' },
        name: 'A2',
        color: '#FF8E8E'
      })
    );

    // Team B players (top side)
    this.players.push(
      new Player3D({
        position: { x: 2.5, y: 0, z: 17 },
        team: 'B',
        side: 'left',
        controls: { up: 'ArrowUp', down: 'ArrowDown', hit: 'Shift' },
        name: 'B1',
        color: '#4ECDC4'
      }),
      new Player3D({
        position: { x: 7.5, y: 0, z: 17 },
        team: 'B',
        side: 'right',
        controls: { up: 'i', down: 'k', hit: 'Enter' },
        name: 'B2',
        color: '#26D0CE'
      })
    );
  }

  private setupGlobalControls(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 'escape':
          if (this.gameState === GameState3D.RALLY || this.gameState === GameState3D.SERVICE) {
            this.gameState = GameState3D.PAUSED;
          } else if (this.gameState === GameState3D.PAUSED) {
            this.gameState = GameState3D.RALLY;
          }
          break;

        case ' ':
          if (this.gameState === GameState3D.SERVICE) {
            this.handleServiceInput();
          }
          break;

        case 'd':
          this.debugMode = !this.debugMode;
          break;

        case 'r':
          if (this.gameState === GameState3D.MATCH_WON) {
            this.reset();
          }
          break;
      }
    });
  }

  private handleServiceInput(): void {
    const serviceState = this.serviceSystem.getServiceState();

    if (serviceState === ServiceState.WAITING_TO_SERVE) {
      // Start ball toss
      this.serviceSystem.startBallToss();
    } else if (serviceState === ServiceState.BALL_TOSS && this.serviceSystem.canServe()) {
      // Execute serve
      const serveData = this.serviceSystem.serve();
      if (serveData) {
        this.ball.serve(serveData.position, serveData.target);
        this.gameState = GameState3D.RALLY;
      }
    }
  }

  start(): void {
    this.isRunning = true;
    this.gameState = GameState3D.SERVICE;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private gameLoop = (currentTime: number = 0): void => {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000 / 60) {
      this.update(deltaTime);
      this.draw();
      this.lastTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    this.stateTimer += deltaTime;

    // Update game systems
    this.serviceSystem.update(deltaTime);

    // Update players
    this.players.forEach(player => {
      player.update(deltaTime, { width: 10, length: 20 });
    });

    // Update ball and handle game logic
    this.updateBallAndGameLogic(deltaTime);

    // Update game state
    this.updateGameState(deltaTime);
  }

  private updateBallAndGameLogic(deltaTime: number): void {
    if (this.gameState !== GameState3D.RALLY) return;

    // Update ball physics
    const ballResult = this.ball.update(deltaTime);

    // Check if point was scored
    if ('winner' in ballResult) {
      this.handlePoint(ballResult);
      return;
    }

    // Check player-ball interactions
    this.checkPlayerBallInteractions();

    // Check service validation if in service rally
    if (this.serviceSystem.getServiceState() === ServiceState.SERVE_HIT) {
      this.checkServiceValidation();
    }

    // Check net collision
    if (Physics3D.checkNetCollision(this.ball.getState())) {
      this.handlePoint({
        winner: Physics3D.getOpponentTeam(this.ball.getPosition()),
        reason: 'net',
        message: 'Ball hit the net!'
      });
    }
  }

  private checkPlayerBallInteractions(): void {
    for (const player of this.players) {
      if (player.canHitBall(this.ball.getPosition())) {
        const hitData = player.hitBall(this.ball.getPosition());
        if (hitData) {
          this.ball.hit(hitData.direction, hitData.power, hitData.spin);
          break; // Only one player can hit at a time
        }
      }
    }
  }

  private checkServiceValidation(): void {
    const ballState = this.ball.getState();

    if (ballState.groundBounces > 0) {
      // Ball has bounced - validate service
      const validation = this.serviceSystem.validateService(
        ballState.position,
        ballState.groundBounces > 0
      );

      const result = this.serviceSystem.handleServiceResult(validation.isValid, validation.isLet);

      this.gameMessage = validation.message;

      switch (result.nextState) {
        case 'rally':
          // Continue rally
          break;

        case 'fault':
          this.gameMessage = 'Service FAULT - Second serve';
          this.ball.reset();
          this.gameState = GameState3D.SERVICE;
          break;

        case 'doubleFault':
          this.handlePoint({
            winner: this.serviceSystem.getServiceInfo().servingTeam === 'A' ? 'B' : 'A',
            reason: 'double_fault',
            message: 'DOUBLE FAULT!'
          });
          break;

        case 'continue':
          // Let or replay
          this.ball.reset();
          this.gameState = GameState3D.SERVICE;
          break;
      }
    }
  }

  private handlePoint(pointResult: PointResult): void {
    const result = this.scoreSystem.addPoint(pointResult.winner === 'A' ? 'Team.A' as any : 'Team.B' as any);

    this.gameState = GameState3D.POINT_DISPLAY;
    this.gameMessage = `${pointResult.message} - Point to Team ${pointResult.winner}!`;
    this.stateTimer = 0;

    if (result.matchWon) {
      this.gameState = GameState3D.MATCH_WON;
      this.gameMessage = `Team ${pointResult.winner} wins the match!`;
    } else if (result.setWon) {
      this.gameState = GameState3D.SET_WON;
      this.gameMessage = `Team ${pointResult.winner} wins the set!`;
    } else if (result.gameWon) {
      this.gameState = GameState3D.GAME_WON;
      this.gameMessage = `Team ${pointResult.winner} wins the game!`;
      this.serviceSystem.nextGame();
    } else {
      this.serviceSystem.nextService();
    }

    this.ball.reset();
  }

  private updateGameState(_deltaTime: number): void {
    switch (this.gameState) {
      case GameState3D.POINT_DISPLAY:
      case GameState3D.GAME_WON:
      case GameState3D.SET_WON:
        if (this.stateTimer > 2500) {
          this.gameState = GameState3D.SERVICE;
          this.stateTimer = 0;
          this.prepareNextPoint();
        }
        break;

      case GameState3D.MATCH_WON:
        this.gameMessage = 'Match finished! Press R to restart';
        break;
    }
  }

  private prepareNextPoint(): void {
    this.ball.reset({ x: 5, y: 1, z: 10 });
    this.serviceSystem.reset();

    // Reset players to starting positions
    this.players[0].reset({ x: 2.5, y: 0, z: 3 });  // A1
    this.players[1].reset({ x: 7.5, y: 0, z: 3 });  // A2
    this.players[2].reset({ x: 2.5, y: 0, z: 17 }); // B1
    this.players[3].reset({ x: 7.5, y: 0, z: 17 }); // B2
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#0D47A1';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Setup isometric rendering
    IsometricRenderer.setupCanvas(this.ctx, this.width, this.height);

    // Draw court
    this.court.draw(this.ctx);

    // Draw service system indicators
    if (this.gameState === GameState3D.SERVICE) {
      this.serviceSystem.draw(this.ctx);
    }

    // Draw players (sorted by depth)
    const sortedPlayers = this.players.sort((a, b) =>
      IsometricRenderer.getDepth(a.getPosition()) - IsometricRenderer.getDepth(b.getPosition())
    );

    sortedPlayers.forEach(player => player.draw(this.ctx));

    // Draw ball
    this.ball.draw(this.ctx);

    // Restore canvas
    IsometricRenderer.restoreCanvas(this.ctx);

    // Draw UI
    this.drawUI();

    // Draw debug info
    if (this.debugMode) {
      this.drawDebugInfo();
    }
  }

  private drawUI(): void {
    const centerX = this.width / 2;

    // Score display
    this.drawScoreboard();

    // Game message
    if (this.gameMessage) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(centerX - 250, 150, 500, 40);

      this.ctx.fillStyle = '#FFEB3B';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.gameMessage, centerX, 175);
    }

    // Controls hint
    this.drawControlsHint();
  }

  private drawScoreboard(): void {
    const centerX = this.width / 2;

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(centerX - 300, 10, 600, 100);

    // Team scores
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Team A', centerX - 280, 35);

    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Team B', centerX + 280, 35);

    // Points
    const pointA = this.scoreSystem.getPointString('Team.A' as any);
    const pointB = this.scoreSystem.getPointString('Team.B' as any);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${pointA} - ${pointB}`, centerX, 65);

    // Games and sets
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Games: ${this.scoreSystem.getGameString()}`, centerX, 85);
    this.ctx.fillText(`Sets: ${this.scoreSystem.getSetString()}`, centerX, 105);
  }

  private drawControlsHint(): void {
    const y = this.height - 60;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, y - 20, this.width - 20, 50);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';

    const controls = [
      'Team A: W/S + SPACE (P1), Q/A + TAB (P2)',
      'Team B: ↑/↓ + SHIFT (P1), I/K + ENTER (P2)',
      'SPACE: Serve | ESC: Pause | D: Debug | R: Restart'
    ];

    controls.forEach((control, index) => {
      this.ctx.fillText(control, 20, y + index * 15);
    });
  }

  private drawDebugInfo(): void {
    if (!this.debugMode) return;

    const ballState = this.ball.getState();

    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';

    const debugInfo = [
      `Ball Position: (${ballState.position.x.toFixed(2)}, ${ballState.position.y.toFixed(2)}, ${ballState.position.z.toFixed(2)})`,
      `Ball Velocity: (${ballState.velocity.x.toFixed(2)}, ${ballState.velocity.y.toFixed(2)}, ${ballState.velocity.z.toFixed(2)})`,
      `Ground Bounces: ${ballState.groundBounces}`,
      `Hit Wall First: ${ballState.hitWallBeforeGround}`,
      `In Play: ${ballState.isInPlay}`,
      `Game State: ${this.gameState}`,
      `Service State: ${this.serviceSystem.getServiceState()}`,
      `FPS: ${Math.round(1000 / (performance.now() - this.lastTime))}`
    ];

    debugInfo.forEach((info, index) => {
      this.ctx.fillText(info, 10, 150 + index * 15);
    });
  }

  reset(): void {
    this.scoreSystem.reset();
    this.gameState = GameState3D.SERVICE;
    this.gameMessage = '';
    this.prepareNextPoint();
  }

  getGameState(): GameState3D {
    return this.gameState;
  }
}