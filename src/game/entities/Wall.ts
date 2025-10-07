export class Wall {
  public x: number;
  public y: number;
  public width: number = 20;
  public height: number;
  private side: 'left' | 'right';

  constructor(side: 'left' | 'right', canvasWidth: number, canvasHeight: number) {
    this.side = side;
    this.x = side === 'left' ? 0 : canvasWidth - this.width;
    this.y = 0;
    this.height = canvasHeight;
  }

  checkBallCollision(ball: { x: number; y: number; vx: number; radius: number }): boolean {
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;

    if (this.side === 'left' && ballLeft <= this.x + this.width && ball.vx < 0) {
      return true;
    }
    if (this.side === 'right' && ballRight >= this.x && ball.vx > 0) {
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Glass effect with gradient
    const gradient = ctx.createLinearGradient(
      this.x, 0,
      this.x + this.width, 0
    );

    if (this.side === 'left') {
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0.05)');
    } else {
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.05)');
      gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(100, 200, 255, 0.1)');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Glass edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (this.side === 'left') {
      ctx.moveTo(this.x + this.width, 0);
      ctx.lineTo(this.x + this.width, this.height);
    } else {
      ctx.moveTo(this.x, 0);
      ctx.lineTo(this.x, this.height);
    }
    ctx.stroke();
  }
}