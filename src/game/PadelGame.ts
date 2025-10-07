import { Player } from './entities/Player';
import { Team } from './entities/Team';
import { PadelBall } from './entities/PadelBall';
import { Court } from './entities/Court';
import { ScoreSystem } from './systems/ScoreSystem';
import { ServiceSystem } from './systems/ServiceSystem';
import { GameState, Team as TeamType } from './types';

export class PadelGame {
  private ctx: CanvasRenderingContext2D;
  private width: number = 1000;
  private height: number = 600;

  // Game entities
  private ball!: PadelBall;
  private court!: Court;
  private teamA!: Team;
  private teamB!: Team;

  // Game systems
  private scoreSystem!: ScoreSystem;
  private serviceSystem!: ServiceSystem;

  // Game state
  private gameState: GameState = GameState.MENU;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private stateTimer: number = 0;
  private gameMessage: string = '';

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d')!;

    this.initializeGame();
  }

  private initializeGame(): void {
    // Initialize court
    this.court = new Court(this.width, this.height);

    // Initialize ball
    this.ball = new PadelBall(this.width, this.height);

    // Initialize teams
    this.teamA = new Team(
      TeamType.A,
      new Player(50, this.height / 4, { up: 'w', down: 's' }, '#ff6b6b', 'A1'),
      new Player(50, this.height * 3 / 4, { up: 'q', down: 'a' }, '#ff8e8e', 'A2'),
      '#ff6b6b'
    );

    this.teamB = new Team(
      TeamType.B,
      new Player(this.width - 70, this.height / 4, { up: 'ArrowUp', down: 'ArrowDown' }, '#4ecdc4', 'B1'),
      new Player(this.width - 70, this.height * 3 / 4, { up: 'i', down: 'k' }, '#26d0ce', 'B2'),
      '#4ecdc4'
    );

    // Initialize systems
    this.scoreSystem = new ScoreSystem();
    this.serviceSystem = new ServiceSystem(this.width, this.height);

    // Setup controls
    this.setupGlobalControls();
  }

  private setupGlobalControls(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Escape':
          if (this.gameState === GameState.RALLY || this.gameState === GameState.SERVICE) {
            this.gameState = GameState.PAUSED;
          } else if (this.gameState === GameState.PAUSED) {
            this.gameState = GameState.RALLY;
          }
          break;
        case ' ':
          if (this.gameState === GameState.SERVICE) {
            this.startService();
          }
          break;
        case 'r':
          if (this.gameState === GameState.MATCH_WON) {
            this.reset();
          }
          break;
      }
    });
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

    switch (this.gameState) {
      case GameState.SERVICE:
        this.updateService();
        break;
      case GameState.RALLY:
        this.updateRally();
        break;
      case GameState.POINT_SCORED:
        this.updatePointScored();
        break;
      case GameState.GAME_WON:
      case GameState.SET_WON:
      case GameState.MATCH_WON:
        this.updateGameEnd();
        break;
    }

    // Update entities
    this.teamA.update(this.height);
    this.teamB.update(this.height);

    if (this.ball.isInPlay) {
      this.ball.update(this.width, this.height);
      this.checkCollisions();
    }
  }

  private updateService(): void {
    if (!this.ball.isInPlay) {
      this.gameMessage = `${this.serviceSystem.getServingPlayerName()} to serve (Press SPACE)`;
    }
  }

  private updateRally(): void {
    this.gameMessage = '';

    // Check if ball is out of bounds or other fault conditions
    if (!this.court.isInBounds(this.ball.x, this.ball.y)) {
      this.handlePoint(this.getOpponentTeam(this.serviceSystem.getServiceInfo().servingTeam));
    }

    // Check if ball bounced twice on ground
    if (this.ball.hasBouncedOnGround && this.ball.y >= this.height - 40) {
      // Ball hit ground twice - point to opponent
      this.handlePoint(this.getOpponentTeam(this.serviceSystem.getServiceInfo().servingTeam));
    }
  }

  private updatePointScored(): void {
    if (this.stateTimer > 2000) {
      this.gameState = GameState.SERVICE;
      this.stateTimer = 0;
      this.prepareNextPoint();
    }
  }

  private updateGameEnd(): void {
    if (this.stateTimer > 3000) {
      if (this.gameState === GameState.MATCH_WON) {
        this.gameMessage = 'Press R to restart';
      } else {
        this.gameState = GameState.SERVICE;
        this.stateTimer = 0;
        this.prepareNextPoint();
      }
    }
  }

  private startService(): void {
    const servicePos = this.serviceSystem.getServicePosition();
    const targetPos = this.serviceSystem.getServiceTarget();

    this.ball.x = servicePos.x;
    this.ball.y = servicePos.y;
    this.ball.serve(targetPos.x, targetPos.y);

    this.gameState = GameState.RALLY;
  }

  private checkCollisions(): void {
    // Check wall collisions
    const walls = this.court.getWalls();
    for (const wall of walls) {
      if (this.ball.checkWallCollision(wall)) {
        break;
      }
    }

    // Check player collisions
    const playerA = this.teamA.checkBallCollision(this.ball);
    const playerB = this.teamB.checkBallCollision(this.ball);

    if (playerA) {
      this.ball.checkPlayerCollision(playerA);
    } else if (playerB) {
      this.ball.checkPlayerCollision(playerB);
    }

    // Check net collision
    if (this.ball.x >= this.width / 2 - 5 && this.ball.x <= this.width / 2 + 5 &&
        this.ball.y >= this.height / 2 - 25 && this.ball.y <= this.height / 2 + 25) {
      // Ball hit net - point to opponent
      this.handlePoint(this.getOpponentTeam(this.serviceSystem.getServiceInfo().servingTeam));
    }
  }

  private handlePoint(winningTeam: TeamType): void {
    const result = this.scoreSystem.addPoint(winningTeam);

    this.gameState = GameState.POINT_SCORED;
    this.gameMessage = `Point to Team ${winningTeam}!`;
    this.stateTimer = 0;

    if (result.matchWon) {
      this.gameState = GameState.MATCH_WON;
      this.gameMessage = `Team ${winningTeam} wins the match!`;
    } else if (result.setWon) {
      this.gameState = GameState.SET_WON;
      this.gameMessage = `Team ${winningTeam} wins the set!`;
    } else if (result.gameWon) {
      this.gameState = GameState.GAME_WON;
      this.gameMessage = `Team ${winningTeam} wins the game!`;
      this.serviceSystem.nextGame();
    }

    this.ball.reset();
  }

  private prepareNextPoint(): void {
    this.ball.reset(this.width / 2, this.height / 2);
    this.teamA.reset(this.height);
    this.teamB.reset(this.height);
  }

  private getOpponentTeam(team: TeamType): TeamType {
    return team === TeamType.A ? TeamType.B : TeamType.A;
  }

  private draw(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw court
    this.court.draw(this.ctx);

    // Draw teams
    this.teamA.draw(this.ctx);
    this.teamB.draw(this.ctx);

    // Draw ball
    this.ball.draw(this.ctx);

    // Draw service indicator
    if (this.gameState === GameState.SERVICE) {
      this.serviceSystem.drawServiceIndicator(this.ctx);
    }

    // Draw UI
    this.drawUI();
  }

  private drawUI(): void {
    const ctx = this.ctx;

    // Score display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';

    // Points
    const pointA = this.scoreSystem.getPointString(TeamType.A);
    const pointB = this.scoreSystem.getPointString(TeamType.B);
    ctx.fillText(`${pointA} - ${pointB}`, this.width / 2, 50);

    // Games
    ctx.font = '18px Arial';
    ctx.fillText(`Games: ${this.scoreSystem.getGameString()}`, this.width / 2, 75);

    // Sets
    ctx.fillText(`Sets: ${this.scoreSystem.getSetString()}`, this.width / 2, 95);

    // Game message
    if (this.gameMessage) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#ffeb3b';
      ctx.fillText(this.gameMessage, this.width / 2, this.height - 30);
    }

    // Controls
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('Team A: W/S (P1), Q/A (P2)', 10, this.height - 40);
    ctx.textAlign = 'right';
    ctx.fillText('Team B: ↑/↓ (P1), I/K (P2)', this.width - 10, this.height - 40);

    ctx.textAlign = 'center';
    ctx.fillText('SPACE: Serve | ESC: Pause', this.width / 2, this.height - 10);
  }

  reset(): void {
    this.scoreSystem.reset();
    this.gameState = GameState.SERVICE;
    this.prepareNextPoint();
  }

  getGameState(): GameState {
    return this.gameState;
  }
}