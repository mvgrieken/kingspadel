import { PlayerControls } from '../types';

export class Player {
  public x: number;
  public y: number;
  public width: number = 12;
  public height: number = 60;
  public speed: number = 5;
  private controls: PlayerControls;
  private isMovingUp: boolean = false;
  private isMovingDown: boolean = false;
  public color: string;
  public name: string;

  constructor(
    x: number,
    y: number,
    controls: PlayerControls,
    color: string,
    name: string
  ) {
    this.x = x;
    this.y = y;
    this.controls = controls;
    this.color = color;
    this.name = name;
    this.setupControls();
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === this.controls.up || e.key === this.controls.up.toUpperCase()) {
        this.isMovingUp = true;
      }
      if (e.key === this.controls.down || e.key === this.controls.down.toUpperCase()) {
        this.isMovingDown = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === this.controls.up || e.key === this.controls.up.toUpperCase()) {
        this.isMovingUp = false;
      }
      if (e.key === this.controls.down || e.key === this.controls.down.toUpperCase()) {
        this.isMovingDown = false;
      }
    });
  }

  update(canvasHeight: number): void {
    if (this.isMovingUp && this.y > 0) {
      this.y -= this.speed;
    }
    if (this.isMovingDown && this.y + this.height < canvasHeight) {
      this.y += this.speed;
    }

    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }

  reset(initialY: number): void {
    this.y = initialY;
  }

  checkBallCollision(ball: { x: number; y: number; radius: number }): boolean {
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;

    const paddleLeft = this.x;
    const paddleRight = this.x + this.width;
    const paddleTop = this.y;
    const paddleBottom = this.y + this.height;

    return ballRight >= paddleLeft && ballLeft <= paddleRight &&
           ballBottom >= paddleTop && ballTop <= paddleBottom;
  }
}