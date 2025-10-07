import { IsometricRenderer } from '../rendering/IsometricRenderer';
import { Vector3D, Player3D as Player3DType } from '../types/3DTypes';

export class Player3D {
  private position: Vector3D;
  private team: 'A' | 'B';
  private side: 'left' | 'right';
  private controls: { up: string; down: string; hit: string };
  private name: string;
  private color: string;
  private speed: number = 3; // m/s
  private reach: number = 0.7; // meters
  private isMovingUp: boolean = false;
  private isMovingDown: boolean = false;
  private isHitting: boolean = false;
  private hitCooldown: number = 0;
  private maxHitCooldown: number = 500; // ms

  constructor(config: Player3DType) {
    this.position = { ...config.position };
    this.team = config.team;
    this.side = config.side;
    this.controls = { ...config.controls };
    this.name = config.name;
    this.color = config.color;
    this.setupControls();
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();

      if (key === this.controls.up.toLowerCase()) {
        this.isMovingUp = true;
      }
      if (key === this.controls.down.toLowerCase()) {
        this.isMovingDown = true;
      }
      if (key === this.controls.hit.toLowerCase()) {
        if (this.hitCooldown <= 0) {
          this.isHitting = true;
          this.hitCooldown = this.maxHitCooldown;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();

      if (key === this.controls.up.toLowerCase()) {
        this.isMovingUp = false;
      }
      if (key === this.controls.down.toLowerCase()) {
        this.isMovingDown = false;
      }
      if (key === this.controls.hit.toLowerCase()) {
        this.isHitting = false;
      }
    });
  }

  update(deltaTime: number, courtDimensions: { width: number; length: number }): void {
    const dt = deltaTime / 1000; // Convert to seconds

    // Update hit cooldown
    if (this.hitCooldown > 0) {
      this.hitCooldown -= deltaTime;
    }

    // Movement (along the width of the court)
    if (this.isMovingUp && this.position.x > 0.5) {
      this.position.x -= this.speed * dt;
    }
    if (this.isMovingDown && this.position.x < courtDimensions.width - 0.5) {
      this.position.x += this.speed * dt;
    }

    // Keep player within bounds
    this.position.x = Math.max(0.5, Math.min(courtDimensions.width - 0.5, this.position.x));

    // Keep players on their side of the court
    if (this.team === 'A') {
      this.position.z = Math.max(0.5, Math.min(9, this.position.z));
    } else {
      this.position.z = Math.max(11, Math.min(courtDimensions.length - 0.5, this.position.z));
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw player position indicator
    this.drawPositionIndicator(ctx);

    // Draw player body
    this.drawPlayerBody(ctx);

    // Draw racket
    this.drawRacket(ctx);

    // Draw name label
    this.drawNameLabel(ctx);

    // Draw reach area when hitting
    if (this.isHitting || this.hitCooldown > this.maxHitCooldown * 0.8) {
      this.drawReachArea(ctx);
    }
  }

  private drawPositionIndicator(ctx: CanvasRenderingContext2D): void {
    const footPosition = { x: this.position.x, y: 0, z: this.position.z };
    const footProj = IsometricRenderer.project(footPosition);

    // Position circle
    ctx.fillStyle = this.color + '40'; // Semi-transparent
    ctx.beginPath();
    ctx.arc(footProj.x, footProj.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawPlayerBody(ctx: CanvasRenderingContext2D): void {
    const bodyPosition = { x: this.position.x, y: 0.9, z: this.position.z }; // 1.8m tall
    const bodyProj = IsometricRenderer.project(bodyPosition);

    // Player body (simplified as a colored rectangle)
    ctx.fillStyle = this.color;
    ctx.fillRect(bodyProj.x - 8, bodyProj.y - 20, 16, 20);

    // Head
    ctx.beginPath();
    ctx.arc(bodyProj.x, bodyProj.y - 25, 6, 0, Math.PI * 2);
    ctx.fill();

    // Team indicator
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.team, bodyProj.x, bodyProj.y - 20);
  }

  private drawRacket(ctx: CanvasRenderingContext2D): void {
    const racketPosition = {
      x: this.position.x + (this.side === 'left' ? -0.3 : 0.3),
      y: 1.2,
      z: this.position.z
    };
    const racketProj = IsometricRenderer.project(racketPosition);

    // Racket handle
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(racketProj.x, racketProj.y);
    ctx.lineTo(racketProj.x, racketProj.y + 15);
    ctx.stroke();

    // Racket head
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(racketProj.x, racketProj.y - 8, 12, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Racket strings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath();
      ctx.moveTo(racketProj.x + i, racketProj.y - 16);
      ctx.lineTo(racketProj.x + i, racketProj.y);
      ctx.stroke();
    }
  }

  private drawNameLabel(ctx: CanvasRenderingContext2D): void {
    const labelPosition = { x: this.position.x, y: 2.2, z: this.position.z };
    const labelProj = IsometricRenderer.project(labelPosition);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(labelProj.x - 20, labelProj.y - 10, 40, 15);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, labelProj.x, labelProj.y);

    // Controls hint
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const controlText = `${this.controls.up.toUpperCase()}/${this.controls.down.toUpperCase()} ${this.controls.hit.toUpperCase()}`;
    ctx.fillText(controlText, labelProj.x, labelProj.y + 12);
  }

  private drawReachArea(ctx: CanvasRenderingContext2D): void {
    const reachCenter = { x: this.position.x, y: 1, z: this.position.z };
    const reachProj = IsometricRenderer.project(reachCenter);

    ctx.strokeStyle = this.color + '80';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(reachProj.x, reachProj.y, this.reach * 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ball interaction methods
  canHitBall(ballPosition: Vector3D): boolean {
    const distance = Math.sqrt(
      (this.position.x - ballPosition.x) ** 2 +
      (this.position.y - ballPosition.y) ** 2 +
      (this.position.z - ballPosition.z) ** 2
    );

    return distance <= this.reach && this.hitCooldown <= 0;
  }

  hitBall(ballPosition: Vector3D): { direction: Vector3D; power: number; spin: Vector3D } | null {
    if (!this.canHitBall(ballPosition) || !this.isHitting) {
      return null;
    }

    // Calculate hit direction (towards opponent's side)
    const targetZ = this.team === 'A' ? 15 : 5; // Aim towards opposite side
    const targetX = 5; // Center of court

    const direction = {
      x: targetX - this.position.x,
      y: 1, // Slight upward angle
      z: targetZ - this.position.z
    };

    // Normalize direction
    const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    direction.x /= magnitude;
    direction.y /= magnitude;
    direction.z /= magnitude;

    const power = 8 + Math.random() * 4; // 8-12 m/s

    // Add some spin variation
    const spin = {
      x: (Math.random() - 0.5) * 2,
      y: 0,
      z: (Math.random() - 0.5) * 2
    };

    this.hitCooldown = this.maxHitCooldown;
    return { direction, power, spin };
  }

  reset(initialPosition: Vector3D): void {
    this.position = { ...initialPosition };
    this.hitCooldown = 0;
    this.isHitting = false;
    this.isMovingUp = false;
    this.isMovingDown = false;
  }

  getPosition(): Vector3D {
    return { ...this.position };
  }

  getTeam(): 'A' | 'B' {
    return this.team;
  }

  getSide(): 'left' | 'right' {
    return this.side;
  }

  getName(): string {
    return this.name;
  }

  isCurrentlyHitting(): boolean {
    return this.isHitting && this.hitCooldown > this.maxHitCooldown * 0.8;
  }

  getReach(): number {
    return this.reach;
  }
}