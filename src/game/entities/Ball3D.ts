import { IsometricRenderer } from '../rendering/IsometricRenderer';
import { BallState3D, Vector3D, PointResult } from '../types/3DTypes';
import { Physics3D } from '../physics/Physics3D';

export class Ball3D {
  private state: BallState3D;
  private radius: number = 0.033; // Standard padel ball radius in meters
  private trail: Vector3D[] = [];
  private maxTrailLength: number = 10;

  constructor() {
    this.state = Physics3D.resetBallState();
  }

  update(deltaTime: number): BallState3D | PointResult {
    if (!this.state.isInPlay) return this.state;

    // Apply spin effects
    Physics3D.applySpin(this.state);

    // Update physics
    const result = Physics3D.updateBall(this.state, deltaTime);

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
    this.trail.push({ ...this.state.position });

    // Remove old trail points
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw ball shadow on court
    this.drawShadow(ctx);

    // Draw ball trail
    this.drawTrail(ctx);

    // Draw ball
    this.drawBall(ctx);

    // Draw debug info if needed
    if (this.shouldShowDebug()) {
      this.drawDebugInfo(ctx);
    }
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    const shadow = Physics3D.calculateBallShadow(this.state.position);

    const shadowProj = IsometricRenderer.project({
      x: shadow.x,
      y: 0.001, // Slightly above court
      z: shadow.z
    });

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      shadowProj.x,
      shadowProj.y,
      shadow.size * 30, // Convert to pixels
      shadow.size * 15, // Ellipse for isometric view
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  private drawTrail(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;

    ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < this.trail.length - 1; i++) {
      const current = IsometricRenderer.project(this.trail[i]);
      const next = IsometricRenderer.project(this.trail[i + 1]);

      if (i === 0) {
        ctx.moveTo(current.x, current.y);
      }
      ctx.lineTo(next.x, next.y);
    }

    ctx.stroke();
  }

  private drawBall(ctx: CanvasRenderingContext2D): void {
    const ballProj = IsometricRenderer.project(this.state.position);

    // Ball main body
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(ballProj.x, ballProj.y, this.radius * 30, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    ctx.fillStyle = '#FFF59D';
    ctx.beginPath();
    ctx.arc(ballProj.x - 3, ballProj.y - 3, this.radius * 20, 0, Math.PI * 2);
    ctx.fill();

    // Ball glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(ballProj.x, ballProj.y, this.radius * 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw spin lines if ball has spin
    if (this.state.spin.x !== 0 || this.state.spin.z !== 0) {
      this.drawSpinLines(ctx, ballProj);
    }
  }

  private drawSpinLines(ctx: CanvasRenderingContext2D, ballProj: { x: number; y: number }): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;

    const spinMagnitude = Math.sqrt(this.state.spin.x ** 2 + this.state.spin.z ** 2);
    const numLines = Math.min(4, Math.floor(spinMagnitude * 2));

    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const startX = ballProj.x + Math.cos(angle) * (this.radius * 20);
      const startY = ballProj.y + Math.sin(angle) * (this.radius * 20);
      const endX = ballProj.x + Math.cos(angle) * (this.radius * 25);
      const endY = ballProj.y + Math.sin(angle) * (this.radius * 25);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  private drawDebugInfo(ctx: CanvasRenderingContext2D): void {
    const ballProj = IsometricRenderer.project(this.state.position);

    ctx.fillStyle = '#FF0000';
    ctx.font = '12px Arial';
    ctx.fillText(`Y: ${this.state.position.y.toFixed(2)}`, ballProj.x + 20, ballProj.y - 20);
    ctx.fillText(`Bounces: ${this.state.groundBounces}`, ballProj.x + 20, ballProj.y - 5);
    ctx.fillText(`Speed: ${Math.sqrt(
      this.state.velocity.x ** 2 +
      this.state.velocity.y ** 2 +
      this.state.velocity.z ** 2
    ).toFixed(1)}`, ballProj.x + 20, ballProj.y + 10);
  }

  private shouldShowDebug(): boolean {
    // Check if debug mode is enabled (D key pressed)
    return false; // Implement debug key detection if needed
  }

  // Ball control methods
  serve(servePosition: Vector3D, targetPosition: Vector3D, power: number = 12): void {
    this.state = Physics3D.createServeBall(servePosition, targetPosition, power);
    this.trail = [];
  }

  hit(direction: Vector3D, power: number = 8, spin: Vector3D = { x: 0, y: 0, z: 0 }): void {
    if (!this.state.isInPlay) return;

    // Normalize direction
    const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    if (magnitude === 0) return;

    this.state.velocity.x = (direction.x / magnitude) * power;
    this.state.velocity.y = (direction.y / magnitude) * power;
    this.state.velocity.z = (direction.z / magnitude) * power;

    // Add spin
    this.state.spin = { ...spin };

    // Reset ground bounces when hit
    this.state.groundBounces = 0;
    this.state.hitWallBeforeGround = false;
  }

  reset(position?: Vector3D): void {
    this.state = Physics3D.resetBallState();
    if (position) {
      this.state.position = { ...position };
    }
    this.trail = [];
  }

  getState(): BallState3D {
    return { ...this.state };
  }

  getPosition(): Vector3D {
    return { ...this.state.position };
  }

  isInPlay(): boolean {
    return this.state.isInPlay;
  }

  setInPlay(inPlay: boolean): void {
    this.state.isInPlay = inPlay;
  }

  checkPlayerCollision(playerPosition: Vector3D, playerReach: number = 0.5): boolean {
    const distance = Math.sqrt(
      (this.state.position.x - playerPosition.x) ** 2 +
      (this.state.position.y - playerPosition.y) ** 2 +
      (this.state.position.z - playerPosition.z) ** 2
    );

    return distance <= (playerReach + this.radius);
  }

  getTrajectoryPrediction(steps: number = 20): Vector3D[] {
    // Predict ball trajectory for visual aids
    const prediction: Vector3D[] = [];
    const tempState = { ...this.state };

    for (let i = 0; i < steps; i++) {
      const result = Physics3D.updateBall(tempState, 50); // 50ms steps
      if ('winner' in result) break;

      prediction.push({ ...tempState.position });
    }

    return prediction;
  }
}