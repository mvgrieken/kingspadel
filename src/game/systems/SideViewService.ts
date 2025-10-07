export enum ServiceState {
  WAITING_TO_SERVE = 'waiting_to_serve',
  BALL_TOSS = 'ball_toss',
  SERVE_HIT = 'serve_hit',
  RALLY = 'rally'
}

export class SideViewService {
  private servingTeam: 'A' | 'B';
  private servingPlayer: 1 | 2 = 1;
  private serviceAttempt: 1 | 2 = 1;
  private serviceState: ServiceState = ServiceState.WAITING_TO_SERVE;
  private ballTossTimer: number = 0;
  private hitWindow: number = 0;

  constructor() {
    // Start with random serving team
    this.servingTeam = Math.random() > 0.5 ? 'A' : 'B';
  }

  update(deltaTime: number): void {
    switch (this.serviceState) {
      case ServiceState.BALL_TOSS:
        this.ballTossTimer += deltaTime;
        // Ball toss lasts about 1 second before auto-reset
        if (this.ballTossTimer > 2000) {
          this.resetToWaiting();
        }
        break;

      case ServiceState.SERVE_HIT:
        this.hitWindow += deltaTime;
        // Auto-serve if player doesn't hit within reasonable time
        if (this.hitWindow > 1000) {
          this.resetToWaiting();
        }
        break;
    }
  }

  private resetToWaiting(): void {
    this.serviceState = ServiceState.WAITING_TO_SERVE;
    this.ballTossTimer = 0;
    this.hitWindow = 0;
  }

  startBallToss(): boolean {
    if (this.serviceState !== ServiceState.WAITING_TO_SERVE) {
      return false;
    }

    this.serviceState = ServiceState.BALL_TOSS;
    this.ballTossTimer = 0;
    return true;
  }

  canServe(): boolean {
    return this.serviceState === ServiceState.BALL_TOSS && this.ballTossTimer > 200; // Minimum toss time
  }

  executeServe(): {
    serveX: number;
    serveY: number;
    targetX: number;
    targetY: number;
    power: number;
  } | null {
    if (!this.canServe()) {
      return null;
    }

    this.serviceState = ServiceState.SERVE_HIT;
    this.hitWindow = 0;

    const servePos = this.getServePosition();
    const target = this.getServeTarget();

    return {
      serveX: servePos.x,
      serveY: servePos.y,
      targetX: target.x,
      targetY: target.y,
      power: 10 + Math.random() * 4 // 10-14 power
    };
  }

  getServePosition(): { x: number; y: number } {
    // Serve from behind service line (6.95m = 417px from net)
    const serviceLineOffset = 450; // Distance from net to service line

    if (this.servingTeam === 'A') {
      return {
        x: 700 - serviceLineOffset + 50, // Left side, behind service line
        y: 400 // Above ground for toss
      };
    } else {
      return {
        x: 700 + serviceLineOffset - 50, // Right side, behind service line
        y: 400
      };
    }
  }

  getServeTarget(): { x: number; y: number } {
    // Serve diagonally to opposite service box
    if (this.servingTeam === 'A') {
      // Serve to Team B side
      return {
        x: 900 + Math.random() * 200, // Right service area
        y: 530 // Near ground level
      };
    } else {
      // Serve to Team A side
      return {
        x: 300 + Math.random() * 200, // Left service area
        y: 530
      };
    }
  }

  validateService(ballX: number, ballY: number, hasBouncedGround: boolean): {
    isValid: boolean;
    isLet: boolean;
    message: string;
  } {
    if (!hasBouncedGround) {
      return { isValid: false, isLet: false, message: 'Ball must bounce first!' };
    }

    // Check if ball landed in correct service area
    const inServiceArea = this.isInServiceArea(ballX, ballY);

    // TODO: Check for let (ball hits net but lands in service area)
    const isLet = false;

    if (isLet) {
      return { isValid: false, isLet: true, message: 'LET - Net touched, replay serve' };
    }

    if (!inServiceArea) {
      return { isValid: false, isLet: false, message: 'Service FAULT - Ball out of service area' };
    }

    return { isValid: true, isLet: false, message: 'Good serve!' };
  }

  private isInServiceArea(ballX: number, ballY: number): boolean {
    // Service areas extend from service line to baseline
    if (this.servingTeam === 'A') {
      // Ball should land in Team B's service area (right side)
      return ballX >= 700 && ballX <= 1300 && ballY >= 540 && ballY <= 560;
    } else {
      // Ball should land in Team A's service area (left side)
      return ballX >= 100 && ballX <= 700 && ballY >= 540 && ballY <= 560;
    }
  }

  handleServiceResult(isValid: boolean, isLet: boolean): {
    nextState: 'continue' | 'fault' | 'doubleFault' | 'rally';
    message: string;
  } {
    if (isLet) {
      // Let - replay service without penalty
      this.resetToWaiting();
      return { nextState: 'continue', message: 'LET - Replay serve' };
    }

    if (isValid) {
      // Good service - start rally
      this.serviceState = ServiceState.RALLY;
      return { nextState: 'rally', message: 'Good serve - Rally starts!' };
    } else {
      // Service fault
      if (this.serviceAttempt === 1) {
        // First fault - second serve
        this.serviceAttempt = 2;
        this.resetToWaiting();
        return { nextState: 'fault', message: 'First serve FAULT - Second serve' };
      } else {
        // Double fault - point to opponent
        this.nextService();
        return { nextState: 'doubleFault', message: 'DOUBLE FAULT! Point to opponent' };
      }
    }
  }

  nextService(): void {
    // After each point, switch to other team's serve
    this.servingTeam = this.servingTeam === 'A' ? 'B' : 'A';
    this.serviceAttempt = 1;
    this.resetToWaiting();
  }

  nextGame(): void {
    // After each game, change serving team
    this.nextService();
  }

  draw(ctx: CanvasRenderingContext2D, court: any): void {
    // Highlight service area when serving
    if (this.serviceState !== ServiceState.RALLY) {
      this.drawServiceIndicators(ctx, court);
    }

    // Draw service instructions
    this.drawServiceInstructions(ctx);
  }

  private drawServiceIndicators(ctx: CanvasRenderingContext2D, court: any): void {
    // Highlight target service area
    const targetTeam = this.servingTeam === 'A' ? 'B' : 'A';
    court.highlightServiceBox(ctx, targetTeam);

    // Draw serve position indicator
    const servePos = this.getServePosition();

    ctx.fillStyle = 'rgba(255, 193, 7, 0.7)';
    ctx.beginPath();
    ctx.arc(servePos.x, 550, 15, 0, Math.PI * 2); // Ground level indicator
    ctx.fill();

    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Server label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.servingTeam}${this.servingPlayer}`, servePos.x, 535);
  }

  private drawServiceInstructions(ctx: CanvasRenderingContext2D): void {
    const centerX = 700;
    const topY = 50;

    let instructions = '';
    let color = '#FFFFFF';

    switch (this.serviceState) {
      case ServiceState.WAITING_TO_SERVE:
        instructions = `Team ${this.servingTeam} Player ${this.servingPlayer} to serve - Press SPACE to toss ball`;
        color = '#FFC107';
        break;

      case ServiceState.BALL_TOSS:
        instructions = 'Ball tossed - Press SPACE again to serve!';
        color = '#FF5722';
        break;

      case ServiceState.SERVE_HIT:
        instructions = 'Serve in progress...';
        color = '#4CAF50';
        break;

      case ServiceState.RALLY:
        instructions = 'Rally in progress';
        color = '#2196F3';
        break;
    }

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(centerX - 300, topY - 15, 600, 30);

    // Text
    ctx.fillStyle = color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(instructions, centerX, topY + 5);

    // Service attempt indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px Arial';
    const attemptText = `${this.serviceAttempt === 1 ? '1st' : '2nd'} Serve`;
    ctx.fillText(attemptText, centerX, topY + 25);
  }

  getServingTeam(): 'A' | 'B' {
    return this.servingTeam;
  }

  getServingPlayer(): 1 | 2 {
    return this.servingPlayer;
  }

  getServiceAttempt(): 1 | 2 {
    return this.serviceAttempt;
  }

  getServiceState(): ServiceState {
    return this.serviceState;
  }

  setServiceState(state: ServiceState): void {
    this.serviceState = state;
  }

  reset(): void {
    this.resetToWaiting();
    this.serviceAttempt = 1;
  }

  getServingPlayerName(): string {
    return `Team ${this.servingTeam} Player ${this.servingPlayer}`;
  }
}