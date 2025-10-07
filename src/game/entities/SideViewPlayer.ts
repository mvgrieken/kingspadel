export class SideViewPlayer {
  public x: number;
  public y: number;
  private team: 'A' | 'B';
  private controls: {
    up: string;
    down: string;
    hit: string;
  };
  private name: string;
  private color: string;
  private speed: number = 4;
  private reach: number = 40;
  private isMovingUp: boolean = false;
  private isMovingDown: boolean = false;
  private isSwinging: boolean = false;
  private swingCooldown: number = 0;
  private swingAnimation: number = 0;

  constructor(
    x: number,
    team: 'A' | 'B',
    _position: 'front' | 'back',
    controls: { up: string; down: string; hit: string },
    name: string,
    color: string
  ) {
    this.x = x;
    this.y = 450; // Default Y position
    this.team = team;
    this.controls = controls;
    this.name = name;
    this.color = color;
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
      if (key === this.controls.hit.toLowerCase() || e.key === this.controls.hit) {
        if (this.swingCooldown <= 0) {
          this.isSwinging = true;
          this.swingCooldown = 300; // 300ms cooldown
          this.swingAnimation = 200; // Animation duration
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
    });
  }

  update(deltaTime: number, ballX: number, ballY: number, autoAssist: boolean = false): void {
    // Update cooldowns
    if (this.swingCooldown > 0) {
      this.swingCooldown -= deltaTime;
    }
    if (this.swingAnimation > 0) {
      this.swingAnimation -= deltaTime;
    } else {
      this.isSwinging = false;
    }

    // Manual movement
    if (this.isMovingUp && this.y > 200) {
      this.y -= this.speed;
    }
    if (this.isMovingDown && this.y < 540) {
      this.y += this.speed;
    }

    // Auto-assist (optional - helps with ball tracking)
    if (autoAssist && this.shouldTrackBall(ballX, ballY)) {
      const ballDistance = Math.abs(this.y - ballY);
      if (ballDistance > 20) {
        const moveDirection = ballY > this.y ? 1 : -1;
        this.y += moveDirection * (this.speed * 0.3); // Gentle assist
      }
    }

    // Keep player within bounds
    this.y = Math.max(200, Math.min(540, this.y));
  }

  private shouldTrackBall(ballX: number, _ballY: number): boolean {
    // Only track ball if it's on player's side and reasonably close
    const onMySide = (this.team === 'A' && ballX < 700) || (this.team === 'B' && ballX > 700);
    const inRange = Math.abs(this.x - ballX) < 150;
    return onMySide && inRange;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw player shadow
    this.drawShadow(ctx);

    // Draw player body
    this.drawPlayer(ctx);

    // Draw racket
    this.drawRacket(ctx);

    // Draw name label
    this.drawNameLabel(ctx);

    // Draw reach indicator when swinging
    if (this.isSwinging) {
      this.drawReachIndicator(ctx);
    }
  }

  private drawShadow(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(this.x, 555, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const playerHeight = 20;

    // Player body (stick figure style)
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;

    // Head
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y - playerHeight/2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Body line
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - playerHeight/2 + 4);
    ctx.lineTo(this.x, this.y + playerHeight/2);
    ctx.stroke();

    // Arms
    const armOffset = this.isSwinging ? 8 : 5;
    ctx.beginPath();
    ctx.moveTo(this.x - armOffset, this.y - 2);
    ctx.lineTo(this.x + armOffset, this.y - 2);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + playerHeight/2);
    ctx.lineTo(this.x - 4, this.y + playerHeight/2 + 8);
    ctx.moveTo(this.x, this.y + playerHeight/2);
    ctx.lineTo(this.x + 4, this.y + playerHeight/2 + 8);
    ctx.stroke();

    // Glow effect when swinging
    if (this.isSwinging) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      ctx.fillStyle = this.color + '40';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private drawRacket(ctx: CanvasRenderingContext2D): void {
    const racketX = this.x + (this.team === 'A' ? 8 : -8);
    const racketY = this.y - 2;

    // Racket handle
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(racketX, racketY);
    ctx.lineTo(racketX, racketY + 8);
    ctx.stroke();

    // Racket head
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;

    if (this.isSwinging && this.swingAnimation > 150) {
      // Swing animation - show motion blur
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.3 + (i * 0.2);
        ctx.beginPath();
        ctx.arc(racketX + (i * 2), racketY - 4 - (i * 1), 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      // Normal racket
      ctx.beginPath();
      ctx.arc(racketX, racketY - 4, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Racket strings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i += 2) {
      ctx.beginPath();
      ctx.moveTo(racketX + i, racketY - 8);
      ctx.lineTo(racketX + i, racketY);
      ctx.stroke();
    }
  }

  private drawNameLabel(ctx: CanvasRenderingContext2D): void {
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(this.x - 15, this.y - 35, 30, 12);

    // Name text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.x, this.y - 27);

    // Controls hint
    ctx.font = '8px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const controlText = `${this.controls.up.toUpperCase()}/${this.controls.down.toUpperCase()} ${this.controls.hit.toUpperCase()}`;
    ctx.fillText(controlText, this.x, this.y - 40);
  }

  private drawReachIndicator(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this.color + '80';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.reach, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  canHitBall(ballX: number, ballY: number): boolean {
    const distance = Math.sqrt(
      (this.x - ballX) ** 2 + (this.y - ballY) ** 2
    );
    return distance <= this.reach && this.swingCooldown <= 0;
  }

  hitBall(ballX: number, ballY: number): {
    targetX: number;
    targetY: number;
    power: number;
  } | null {
    if (!this.canHitBall(ballX, ballY) || !this.isSwinging) {
      return null;
    }

    // Calculate hit target (aim towards opponent side)
    let targetX: number;
    let targetY: number;

    if (this.team === 'A') {
      // Aim towards Team B side
      targetX = 1000 + Math.random() * 200;
      targetY = 350 + Math.random() * 100;
    } else {
      // Aim towards Team A side
      targetX = 200 + Math.random() * 200;
      targetY = 350 + Math.random() * 100;
    }

    const power = 8 + Math.random() * 4; // 8-12 power

    this.swingCooldown = 300; // Reset cooldown
    return { targetX, targetY, power };
  }

  reset(): void {
    this.y = 450;
    this.swingCooldown = 0;
    this.swingAnimation = 0;
    this.isSwinging = false;
    this.isMovingUp = false;
    this.isMovingDown = false;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getTeam(): 'A' | 'B' {
    return this.team;
  }

  getName(): string {
    return this.name;
  }

  getReach(): number {
    return this.reach;
  }

  isCurrentlySwinging(): boolean {
    return this.isSwinging && this.swingAnimation > 150;
  }

  // Set auto-assist mode for easier gameplay
  enableAutoAssist(_enabled: boolean): void {
    // This could be expanded to make the game more accessible
  }
}