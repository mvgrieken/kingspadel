import { SideViewPhysics, Ball2D, PointResult } from '../physics/SideViewPhysics';

export class SideViewBall {
  private state: Ball2D;
  private trail: Array<{ x: number; y: number }> = [];
  private maxTrailLength: number = 8;

  constructor() {
    this.state = SideViewPhysics.resetBall();
  }

  update(_deltaTime: number, court: any): Ball2D | PointResult {
    if (!this.state.isInPlay) return this.state;

    // Update physics
    const result = SideViewPhysics.updateBall(this.state, court);

    if ('winner' in result) {
      // Point scored
      this.state.isInPlay = false;
      return result;
    }

    this.state = result;

    // Update trail
    this.updateTrail();

    return this.state;
  }

  private updateTrail(): void {
    // Add current position to trail
    this.trail.push({ x: this.state.x, y: this.state.y });

    // Remove old trail points
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw ball shadow
    this.drawShadow(ctx);

    // Draw ball trail
    this.drawTrail(ctx);

    // Draw ball
    this.drawBall(ctx);
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    const shadow = SideViewPhysics.calculateBallShadow(this.state);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(shadow.x, shadow.y, shadow.size, shadow.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTrail(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;

    ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < this.trail.length - 1; i++) {
      const current = this.trail[i];
      const next = this.trail[i + 1];
      const alpha = (i / this.trail.length) * 0.6;

      ctx.globalAlpha = alpha;

      if (i === 0) {
        ctx.moveTo(current.x, current.y);
      }
      ctx.lineTo(next.x, next.y);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawBall(ctx: CanvasRenderingContext2D): void {
    // Ball main body
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(this.state.x, this.state.y, this.state.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.arc(this.state.x - 1, this.state.y - 1, this.state.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Ball glow effect
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(this.state.x, this.state.y, this.state.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Speed lines if ball is moving fast
    const speed = Math.sqrt(this.state.vx ** 2 + this.state.vy ** 2);
    if (speed > 8) {
      this.drawSpeedLines(ctx);
    }
  }

  private drawSpeedLines(ctx: CanvasRenderingContext2D): void {
    const speed = Math.sqrt(this.state.vx ** 2 + this.state.vy ** 2);
    const angle = Math.atan2(this.state.vy, this.state.vx);
    const numLines = Math.min(4, Math.floor(speed / 3));

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;

    for (let i = 0; i < numLines; i++) {
      const lineLength = 10 + (i * 3);
      const startX = this.state.x - Math.cos(angle) * (this.state.radius + 5 + i * 3);
      const startY = this.state.y - Math.sin(angle) * (this.state.radius + 5 + i * 3);
      const endX = startX - Math.cos(angle) * lineLength;
      const endY = startY - Math.sin(angle) * lineLength;

      ctx.globalAlpha = 0.7 - (i * 0.15);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  // Ball control methods
  serve(serveX: number, serveY: number, targetX: number, targetY: number, power: number = 12): void {
    this.state = SideViewPhysics.createServeBall(serveX, serveY, targetX, targetY, power);
    this.trail = [];
  }

  hit(playerX: number, playerY: number, targetX: number, targetY: number, power: number = 10): void {
    if (!this.state.isInPlay) return;

    SideViewPhysics.hitBall(this.state, playerX, playerY, targetX, targetY, power);
    this.trail = []; // Clear trail on hit
  }

  toss(x: number, y: number): void {
    // Ball toss for service
    this.state.x = x;
    this.state.y = y;
    this.state.vx = 0;
    this.state.vy = -8; // Upward toss
    this.state.isInPlay = true;
    this.state.groundBounces = 0;
    this.trail = [];
  }

  reset(x?: number, y?: number): void {
    this.state = SideViewPhysics.resetBall();
    if (x !== undefined) this.state.x = x;
    if (y !== undefined) this.state.y = y;
    this.trail = [];
  }

  getState(): Ball2D {
    return { ...this.state };
  }

  getPosition(): { x: number; y: number } {
    return { x: this.state.x, y: this.state.y };
  }

  isInPlay(): boolean {
    return this.state.isInPlay;
  }

  setInPlay(inPlay: boolean): void {
    this.state.isInPlay = inPlay;
  }

  checkPlayerCollision(playerX: number, playerY: number, reach: number = 40): boolean {
    return SideViewPhysics.checkPlayerCollision(this.state, playerX, playerY, reach);
  }

  getGroundBounces(): number {
    return this.state.groundBounces;
  }

  // Visual effects
  createImpactParticles(): Array<{ x: number; y: number; vx: number; vy: number; life: number }> {
    const particles = [];
    const numParticles = 8;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: this.state.x + (Math.random() - 0.5) * 10,
        y: this.state.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 500 + Math.random() * 300
      });
    }

    return particles;
  }

  getVelocity(): { vx: number; vy: number } {
    return { vx: this.state.vx, vy: this.state.vy };
  }

  getSpeed(): number {
    return Math.sqrt(this.state.vx ** 2 + this.state.vy ** 2);
  }
}