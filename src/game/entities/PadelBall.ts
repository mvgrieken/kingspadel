import { BallState } from '../types';

export class PadelBall {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number = 6;
  public hasBouncedOnGround: boolean = false;
  public hasBouncedOnWall: boolean = false;
  public isInPlay: boolean = false;
  private gravity: number = 0.3;
  private friction: number = 0.98;
  private bounceDecay: number = 0.7;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
  }

  reset(x?: number, y?: number): void {
    this.x = x || this.x;
    this.y = y || this.y;
    this.vx = 0;
    this.vy = 0;
    this.hasBouncedOnGround = false;
    this.hasBouncedOnWall = false;
    this.isInPlay = false;
  }

  serve(targetX: number, targetY: number, power: number = 8): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.vx = (dx / distance) * power;
    this.vy = (dy / distance) * power - 2; // Upward arc for serve
    this.isInPlay = true;
    this.hasBouncedOnGround = false;
    this.hasBouncedOnWall = false;
  }

  update(_canvasWidth: number, canvasHeight: number): void {
    if (!this.isInPlay) return;

    // Apply gravity
    this.vy += this.gravity;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Check ground bounce
    if (this.y + this.radius >= canvasHeight) {
      this.y = canvasHeight - this.radius;
      this.vy = -this.vy * this.bounceDecay;
      this.vx *= this.friction;
      this.hasBouncedOnGround = true;
    }

    // Apply air resistance
    this.vx *= 0.999;
    this.vy *= 0.999;
  }

  checkWallCollision(wall: { x: number; y: number; width: number; height: number }): boolean {
    const ballLeft = this.x - this.radius;
    const ballRight = this.x + this.radius;
    const ballTop = this.y - this.radius;
    const ballBottom = this.y + this.radius;

    const wallLeft = wall.x;
    const wallRight = wall.x + wall.width;
    const wallTop = wall.y;
    const wallBottom = wall.y + wall.height;

    // Check if ball is colliding with wall
    if (ballRight >= wallLeft && ballLeft <= wallRight &&
        ballBottom >= wallTop && ballTop <= wallBottom) {

      // Determine which side of the wall was hit
      const overlapLeft = ballRight - wallLeft;
      const overlapRight = wallRight - ballLeft;
      const overlapTop = ballBottom - wallTop;
      const overlapBottom = wallBottom - ballTop;

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft) {
        // Hit left side
        this.x = wallLeft - this.radius;
        this.vx = -Math.abs(this.vx) * 0.8;
      } else if (minOverlap === overlapRight) {
        // Hit right side
        this.x = wallRight + this.radius;
        this.vx = Math.abs(this.vx) * 0.8;
      } else if (minOverlap === overlapTop) {
        // Hit top side
        this.y = wallTop - this.radius;
        this.vy = -Math.abs(this.vy) * 0.8;
      } else {
        // Hit bottom side
        this.y = wallBottom + this.radius;
        this.vy = Math.abs(this.vy) * 0.8;
      }

      this.hasBouncedOnWall = true;
      return true;
    }
    return false;
  }

  checkPlayerCollision(player: { x: number; y: number; width: number; height: number }): boolean {
    const ballLeft = this.x - this.radius;
    const ballRight = this.x + this.radius;
    const ballTop = this.y - this.radius;
    const ballBottom = this.y + this.radius;

    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;

    if (ballRight >= playerLeft && ballLeft <= playerRight &&
        ballBottom >= playerTop && ballTop <= playerBottom) {

      // Calculate bounce angle based on where ball hits player
      const playerCenter = player.y + player.height / 2;
      const hitPosition = (this.y - playerCenter) / (player.height / 2);
      const bounceAngle = hitPosition * Math.PI / 4; // Max 45 degrees

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const direction = this.x < player.x + player.width / 2 ? -1 : 1;

      this.vx = direction * Math.cos(bounceAngle) * speed * 1.1;
      this.vy = Math.sin(bounceAngle) * speed * 0.8;

      // Move ball outside player to prevent sticking
      if (direction === 1) {
        this.x = playerRight + this.radius;
      } else {
        this.x = playerLeft - this.radius;
      }

      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Ball shadow on ground
    if (this.y < ctx.canvas.height - 20) {
      const shadowY = ctx.canvas.height - 10;
      const shadowSize = Math.max(2, 8 - (this.y / ctx.canvas.height) * 6);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(this.x, shadowY, shadowSize, shadowSize * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    ctx.fillStyle = '#fff59d';
    ctx.beginPath();
    ctx.arc(this.x - 1, this.y - 1, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  getState(): BallState {
    return {
      position: { x: this.x, y: this.y },
      velocity: { vx: this.vx, vy: this.vy },
      hasBouncedOnGround: this.hasBouncedOnGround,
      hasBouncedOnWall: this.hasBouncedOnWall,
      isInPlay: this.isInPlay
    };
  }
}