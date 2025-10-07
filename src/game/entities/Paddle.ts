export class Paddle {
  public x: number;
  public y: number;
  public width: number = 15;
  public height: number = 80;
  public speed: number = 6;
  private upKey: string;
  private downKey: string;
  private isMovingUp: boolean = false;
  private isMovingDown: boolean = false;

  constructor(x: number, canvasHeight: number, upKey: string, downKey: string) {
    this.x = x;
    this.y = canvasHeight / 2 - this.height / 2;
    this.upKey = upKey;
    this.downKey = downKey;
    this.setupControls();
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === this.upKey) {
        this.isMovingUp = true;
      }
      if (e.key === this.downKey) {
        this.isMovingDown = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === this.upKey) {
        this.isMovingUp = false;
      }
      if (e.key === this.downKey) {
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

    // Keep paddle within bounds
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }

  reset(canvasHeight: number): void {
    this.y = canvasHeight / 2 - this.height / 2;
  }
}