import { Ball } from './entities/Ball';
import { Paddle } from './entities/Paddle';
import { Wall } from './entities/Wall';

export class Game {
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 500;
  private ball: Ball;
  private paddleLeft: Paddle;
  private paddleRight: Paddle;
  private wallLeft: Wall;
  private wallRight: Wall;
  private scoreLeft: number = 0;
  private scoreRight: number = 0;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d')!;

    // Initialize game entities
    this.ball = new Ball(this.width, this.height);
    this.paddleLeft = new Paddle(40, this.height, 'w', 's');
    this.paddleRight = new Paddle(this.width - 55, this.height, 'ArrowUp', 'ArrowDown');
    this.wallLeft = new Wall('left', this.width, this.height);
    this.wallRight = new Wall('right', this.width, this.height);
  }

  start(): void {
    this.isRunning = true;
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

    // Calculate delta time for smooth 60fps
    const deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 1000 / 60) {
      this.update();
      this.draw();
      this.lastTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    // Update game entities
    this.ball.update(this.width, this.height);
    this.paddleLeft.update(this.height);
    this.paddleRight.update(this.height);

    // Check paddle collisions
    this.ball.checkPaddleCollision(this.paddleLeft);
    this.ball.checkPaddleCollision(this.paddleRight);

    // Check wall collisions (glass walls bounce the ball)
    if (this.wallLeft.checkBallCollision(this.ball)) {
      this.ball.vx = Math.abs(this.ball.vx);
      this.ball.x = this.wallLeft.x + this.wallLeft.width + this.ball.radius;
    }
    if (this.wallRight.checkBallCollision(this.ball)) {
      this.ball.vx = -Math.abs(this.ball.vx);
      this.ball.x = this.wallRight.x - this.ball.radius;
    }

    // Check for scoring
    if (this.ball.x < -this.ball.radius) {
      this.scoreRight++;
      this.resetRound();
    } else if (this.ball.x > this.width + this.ball.radius) {
      this.scoreLeft++;
      this.resetRound();
    }
  }

  private resetRound(): void {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.reset();
    this.paddleLeft.reset(this.height);
    this.paddleRight.reset(this.height);
  }

  private draw(): void {
    // Clear canvas with dark background
    this.ctx.fillStyle = '#2d3748';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw center line (dashed)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2, 0);
    this.ctx.lineTo(this.width / 2, this.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw walls (glass effect)
    this.wallLeft.draw(this.ctx);
    this.wallRight.draw(this.ctx);

    // Draw game entities
    this.paddleLeft.draw(this.ctx);
    this.paddleRight.draw(this.ctx);
    this.ball.draw(this.ctx);

    // Draw scores
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.scoreLeft.toString(), this.width / 4, 80);
    this.ctx.fillText(this.scoreRight.toString(), (this.width * 3) / 4, 80);

    // Draw controls hint
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Player 1: W/S', 10, this.height - 10);
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Player 2: ↑/↓', this.width - 10, this.height - 10);
  }

  reset(): void {
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.resetRound();
  }
}