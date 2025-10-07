import { SideViewCourt } from './entities/SideViewCourt';
import { SideViewBall } from './entities/SideViewBall';
import { SideViewPlayer } from './entities/SideViewPlayer';
import { SideViewService, ServiceState } from './systems/SideViewService';
import { ScoreSystem } from './systems/ScoreSystem';
import { PointResult } from './physics/SideViewPhysics';

export enum GameState {
  MENU = 'menu',
  SERVICE = 'service',
  RALLY = 'rally',
  POINT_SCORED = 'point_scored',
  GAME_WON = 'game_won',
  SET_WON = 'set_won',
  MATCH_WON = 'match_won',
  PAUSED = 'paused'
}

export class SideViewPadelGame {
  private ctx: CanvasRenderingContext2D;
  private width: number = 1400;
  private height: number = 700;

  // Game entities
  private court!: SideViewCourt;
  private ball!: SideViewBall;
  private players: SideViewPlayer[] = [];

  // Game systems
  private serviceSystem!: SideViewService;
  private scoreSystem!: ScoreSystem;

  // Game state
  private gameState: GameState = GameState.MENU;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private stateTimer: number = 0;
  private gameMessage: string = '';
  private debugMode: boolean = false;
  private autoAssist: boolean = false;

  // Particles for visual effects
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
  }> = [];

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d')!;

    this.initializeGame();
  }

  private initializeGame(): void {
    // Initialize court
    this.court = new SideViewCourt();

    // Initialize ball
    this.ball = new SideViewBall();

    // Initialize players
    this.initializePlayers();

    // Initialize systems
    this.serviceSystem = new SideViewService();
    this.scoreSystem = new ScoreSystem();

    // Setup global controls
    this.setupGlobalControls();
  }

  private initializePlayers(): void {
    // Team A players (left side)
    this.players.push(
      new SideViewPlayer(
        300, // front player
        'A',
        'front',
        { up: 'w', down: 's', hit: ' ' },
        'A1',
        '#FF6B6B'
      ),
      new SideViewPlayer(
        200, // back player
        'A',
        'back',
        { up: 'a', down: 'd', hit: 'q' },
        'A2',
        '#FF8E8E'
      )
    );

    // Team B players (right side)
    this.players.push(
      new SideViewPlayer(
        1100, // front player
        'B',
        'front',
        { up: 'ArrowUp', down: 'ArrowDown', hit: 'Shift' },
        'B1',
        '#4ECDC4'
      ),
      new SideViewPlayer(
        1200, // back player
        'B',
        'back',
        { up: 'i', down: 'k', hit: 'Enter' },
        'B2',
        '#26D0CE'
      )
    );
  }

  private setupGlobalControls(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 'escape':
          if (this.gameState === GameState.RALLY || this.gameState === GameState.SERVICE) {
            this.gameState = GameState.PAUSED;
          } else if (this.gameState === GameState.PAUSED) {
            this.gameState = GameState.RALLY;
          }
          break;

        case ' ':
          if (this.gameState === GameState.SERVICE) {
            this.handleServiceInput();
          }
          break;

        case 'd':
          this.debugMode = !this.debugMode;
          break;

        case 'h':
          this.autoAssist = !this.autoAssist;
          break;

        case 'r':
          if (this.gameState === GameState.MATCH_WON) {
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
      if (this.serviceSystem.startBallToss()) {
        const servePos = this.serviceSystem.getServePosition();
        this.ball.toss(servePos.x, servePos.y);
      }
    } else if (serviceState === ServiceState.BALL_TOSS && this.serviceSystem.canServe()) {
      // Execute serve
      const serveData = this.serviceSystem.executeServe();
      if (serveData) {
        this.ball.serve(serveData.serveX, serveData.serveY, serveData.targetX, serveData.targetY, serveData.power);
        this.gameState = GameState.RALLY;
      }
    }
  }

  start(): void {
    this.isRunning = true;
    this.gameState = GameState.SERVICE;
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
      const ballPos = this.ball.getPosition();
      player.update(deltaTime, ballPos.x, ballPos.y, this.autoAssist);
    });

    // Update particles
    this.updateParticles(deltaTime);

    // Update ball and handle game logic
    this.updateBallAndGameLogic(deltaTime);

    // Update game state
    this.updateGameState();
  }

  private updateBallAndGameLogic(deltaTime: number): void {
    if (this.gameState !== GameState.RALLY && this.gameState !== GameState.SERVICE) return;

    // Update ball physics
    const ballResult = this.ball.update(deltaTime, this.court);

    // Check if point was scored
    if ('winner' in ballResult) {
      this.handlePoint(ballResult);
      return;
    }

    // Check player-ball interactions
    this.checkPlayerBallInteractions();

    // Check service validation if ball has bounced
    if (this.serviceSystem.getServiceState() === ServiceState.SERVE_HIT) {
      this.checkServiceValidation();
    }
  }

  private checkPlayerBallInteractions(): void {
    const ballPos = this.ball.getPosition();

    for (const player of this.players) {
      const playerPos = player.getPosition();

      if (player.canHitBall(ballPos.x, ballPos.y)) {
        const hitData = player.hitBall(ballPos.x, ballPos.y);
        if (hitData) {
          this.ball.hit(playerPos.x, playerPos.y, hitData.targetX, hitData.targetY, hitData.power);

          // Create impact particles
          this.createImpactParticles(ballPos.x, ballPos.y);

          // Screen shake effect (subtle)
          this.createScreenShake();

          break; // Only one player can hit at a time
        }
      }
    }
  }

  private checkServiceValidation(): void {
    const ballState = this.ball.getState();
    const ballPos = this.ball.getPosition();

    if (ballState.groundBounces > 0) {
      // Ball has bounced - validate service
      const validation = this.serviceSystem.validateService(
        ballPos.x,
        ballPos.y,
        ballState.groundBounces > 0
      );

      const result = this.serviceSystem.handleServiceResult(validation.isValid, validation.isLet);

      this.gameMessage = validation.message;
      this.showNotification(validation.message, validation.isValid ? '#4CAF50' : '#FF5722');

      switch (result.nextState) {
        case 'rally':
          // Continue rally
          break;

        case 'fault':
          this.ball.reset();
          this.gameState = GameState.SERVICE;
          break;

        case 'doubleFault':
          this.handlePoint({
            winner: this.serviceSystem.getServingTeam() === 'A' ? 'B' : 'A',
            reason: 'double_fault',
            message: 'DOUBLE FAULT!'
          });
          break;

        case 'continue':
          // Let or replay
          this.ball.reset();
          this.gameState = GameState.SERVICE;
          break;
      }
    }
  }

  private handlePoint(pointResult: PointResult): void {
    const result = this.scoreSystem.addPoint(pointResult.winner === 'A' ? 'Team.A' as any : 'Team.B' as any);

    this.gameState = GameState.POINT_SCORED;
    this.gameMessage = `${pointResult.message} - Point to Team ${pointResult.winner}!`;
    this.stateTimer = 0;

    // Show big notification
    this.showNotification(`POINT - TEAM ${pointResult.winner}`, '#FFD700', 2000);

    if (result.matchWon) {
      this.gameState = GameState.MATCH_WON;
      this.gameMessage = `Team ${pointResult.winner} wins the match!`;
      this.showNotification(`MATCH WON - TEAM ${pointResult.winner}!`, '#4CAF50', 3000);
    } else if (result.setWon) {
      this.gameState = GameState.SET_WON;
      this.gameMessage = `Team ${pointResult.winner} wins the set!`;
      this.showNotification(`SET WON - TEAM ${pointResult.winner}!`, '#2196F3', 2500);
    } else if (result.gameWon) {
      this.gameState = GameState.GAME_WON;
      this.gameMessage = `Team ${pointResult.winner} wins the game!`;
      this.showNotification(`GAME WON - TEAM ${pointResult.winner}!`, '#FF9800', 2000);
      this.serviceSystem.nextGame();
    } else {
      this.serviceSystem.nextService();
    }

    this.ball.reset();
  }

  private updateGameState(): void {
    switch (this.gameState) {
      case GameState.POINT_SCORED:
      case GameState.GAME_WON:
      case GameState.SET_WON:
        if (this.stateTimer > 2500) {
          this.gameState = GameState.SERVICE;
          this.stateTimer = 0;
          this.prepareNextPoint();
        }
        break;

      case GameState.MATCH_WON:
        this.gameMessage = 'Match finished! Press R to restart';
        break;
    }
  }

  private prepareNextPoint(): void {
    this.ball.reset(700, 400);
    this.serviceSystem.reset();

    // Reset players to default positions
    this.players.forEach(player => player.reset());
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // Gravity
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private createImpactParticles(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * -6 - 2,
        life: 500 + Math.random() * 300,
        maxLife: 800,
        color: '#FFEB3B'
      });
    }
  }

  private createScreenShake(): void {
    // Subtle screen shake could be implemented here
    // For now, we'll skip this to keep it simple
  }

  private notifications: Array<{
    message: string;
    color: string;
    life: number;
    maxLife: number;
    y: number;
  }> = [];

  private showNotification(message: string, color: string = '#FFFFFF', duration: number = 1500): void {
    this.notifications.push({
      message,
      color,
      life: duration,
      maxLife: duration,
      y: 350 + this.notifications.length * 40
    });

    // Remove old notifications
    setTimeout(() => {
      this.notifications.shift();
    }, duration);
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw court
    this.court.draw(this.ctx);

    // Draw service system indicators
    if (this.gameState === GameState.SERVICE) {
      this.serviceSystem.draw(this.ctx, this.court);
    }

    // Draw players (sorted by y position for proper depth)
    const sortedPlayers = [...this.players].sort((a, b) => a.getPosition().y - b.getPosition().y);
    sortedPlayers.forEach(player => player.draw(this.ctx));

    // Draw ball
    this.ball.draw(this.ctx);

    // Draw particles
    this.drawParticles();

    // Draw UI
    this.drawUI();

    // Draw notifications
    this.drawNotifications();

    // Draw debug info
    if (this.debugMode) {
      this.drawDebugInfo();
    }
  }

  private drawParticles(): void {
    this.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      this.ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private drawUI(): void {
    // Scoreboard
    this.drawScoreboard();

    // Game message
    if (this.gameMessage && this.gameState !== GameState.SERVICE) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(this.width/2 - 300, 100, 600, 40);

      this.ctx.fillStyle = '#FFEB3B';
      this.ctx.font = 'bold 18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.gameMessage, this.width/2, 125);
    }

    // Controls and status
    this.drawStatusBar();
  }

  private drawScoreboard(): void {
    const centerX = this.width / 2;

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(centerX - 350, 10, 700, 80);

    // Team names and colors
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Team A', centerX - 330, 35);

    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Team B', centerX + 330, 35);

    // Points
    const pointA = this.scoreSystem.getPointString('Team.A' as any);
    const pointB = this.scoreSystem.getPointString('Team.B' as any);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${pointA} - ${pointB}`, centerX, 55);

    // Games and sets
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`Games: ${this.scoreSystem.getGameString()}`, centerX, 75);
    this.ctx.fillText(`Sets: ${this.scoreSystem.getSetString()}`, centerX, 85);
  }

  private drawStatusBar(): void {
    const y = this.height - 50;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, y - 20, this.width, 50);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';

    const controls = [
      'Team A: W/S+SPACE (A1), A/D+Q (A2) | Team B: ↑/↓+SHIFT (B1), I/K+ENTER (B2)',
      `SPACE: Serve | ESC: Pause | D: Debug ${this.debugMode ? 'ON' : 'OFF'} | H: Auto-Assist ${this.autoAssist ? 'ON' : 'OFF'}`
    ];

    controls.forEach((control, index) => {
      this.ctx.fillText(control, 20, y + index * 15);
    });
  }

  private drawNotifications(): void {
    this.notifications.forEach((notification, _index) => {
      const alpha = Math.min(1, notification.life / 500);
      const scale = Math.min(1, (notification.maxLife - notification.life) / 200);

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.translate(this.width/2, notification.y);
      this.ctx.scale(scale, scale);

      // Background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(-200, -20, 400, 40);

      // Text
      this.ctx.fillStyle = notification.color;
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(notification.message, 0, 5);

      this.ctx.restore();
    });
  }

  private drawDebugInfo(): void {
    if (!this.debugMode) return;

    const ballState = this.ball.getState();
    const ballPos = this.ball.getPosition();

    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';

    const debugInfo = [
      `Ball Position: (${ballPos.x.toFixed(1)}, ${ballPos.y.toFixed(1)})`,
      `Ball Velocity: (${ballState.vx.toFixed(1)}, ${ballState.vy.toFixed(1)})`,
      `Ball Speed: ${this.ball.getSpeed().toFixed(1)}`,
      `Ground Bounces: ${ballState.groundBounces}`,
      `In Play: ${ballState.isInPlay}`,
      `Game State: ${this.gameState}`,
      `Service State: ${this.serviceSystem.getServiceState()}`,
      `Auto Assist: ${this.autoAssist}`,
      `Particles: ${this.particles.length}`
    ];

    debugInfo.forEach((info, index) => {
      this.ctx.fillText(info, 10, 150 + index * 15);
    });
  }

  reset(): void {
    this.scoreSystem.reset();
    this.gameState = GameState.SERVICE;
    this.gameMessage = '';
    this.notifications = [];
    this.particles = [];
    this.prepareNextPoint();
  }

  getGameState(): GameState {
    return this.gameState;
  }
}