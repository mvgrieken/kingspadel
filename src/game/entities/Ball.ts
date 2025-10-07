export class Ball {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number = 8;
  public speed: number = 5;
  private initialSpeed: number = 5;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.reset();
  }

  reset(): void {
    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.vx = direction * Math.cos(angle) * this.initialSpeed;
    this.vy = Math.sin(angle) * this.initialSpeed;
    this.speed = this.initialSpeed;
  }

  update(_canvasWidth: number, canvasHeight: number): void {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off top and bottom walls
    if (this.y - this.radius <= 0 || this.y + this.radius >= canvasHeight) {
      this.vy = -this.vy;
      this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
    }

    // Speed up ball slightly over time
    if (Math.abs(this.vx) < 15) {
      this.vx *= 1.0002;
      this.vy *= 1.0002;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  checkPaddleCollision(paddle: { x: number; y: number; width: number; height: number }): boolean {
    const ballLeft = this.x - this.radius;
    const ballRight = this.x + this.radius;
    const ballTop = this.y - this.radius;
    const ballBottom = this.y + this.radius;

    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;

    if (ballRight >= paddleLeft && ballLeft <= paddleRight &&
        ballBottom >= paddleTop && ballTop <= paddleBottom) {

      // Calculate bounce angle based on where ball hits paddle
      const paddleCenter = paddle.y + paddle.height / 2;
      const hitPosition = (this.y - paddleCenter) / (paddle.height / 2);
      const bounceAngle = hitPosition * Math.PI / 4;

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const direction = this.x < paddle.x + paddle.width / 2 ? -1 : 1;

      this.vx = direction * Math.cos(bounceAngle) * speed * 1.05;
      this.vy = Math.sin(bounceAngle) * speed * 1.05;

      // Move ball outside paddle to prevent sticking
      if (direction === 1) {
        this.x = paddleRight + this.radius;
      } else {
        this.x = paddleLeft - this.radius;
      }

      return true;
    }
    return false;
  }
}