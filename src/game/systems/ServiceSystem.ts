import { Team, ServiceInfo, ServiceState } from '../types';

export class ServiceSystem {
  private serviceInfo: ServiceInfo;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Start with random team serving
    this.serviceInfo = {
      servingTeam: Math.random() > 0.5 ? Team.A : Team.B,
      servingPlayer: 1,
      serviceAttempt: ServiceState.FIRST,
      serviceSide: 'right'
    };
  }

  getServiceInfo(): ServiceInfo {
    return { ...this.serviceInfo };
  }

  getServicePosition(): { x: number; y: number } {
    const courtWidth = this.canvasWidth - 80; // Account for walls
    const courtHeight = this.canvasHeight - 40;
    const startX = 40;
    const startY = 20;

    if (this.serviceInfo.servingTeam === Team.A) {
      // Team A serves from left side
      const x = startX + courtWidth * 0.25;
      const y = this.serviceInfo.serviceSide === 'right'
        ? startY + courtHeight * 0.25
        : startY + courtHeight * 0.75;
      return { x, y };
    } else {
      // Team B serves from right side
      const x = startX + courtWidth * 0.75;
      const y = this.serviceInfo.serviceSide === 'right'
        ? startY + courtHeight * 0.25
        : startY + courtHeight * 0.75;
      return { x, y };
    }
  }

  getServiceTarget(): { x: number; y: number } {
    const courtWidth = this.canvasWidth - 80;
    const courtHeight = this.canvasHeight - 40;
    const startX = 40;
    const startY = 20;

    if (this.serviceInfo.servingTeam === Team.A) {
      // Serve to Team B's side
      const x = startX + courtWidth * 0.75;
      const y = this.serviceInfo.serviceSide === 'right'
        ? startY + courtHeight * 0.75  // Cross-court
        : startY + courtHeight * 0.25;
      return { x, y };
    } else {
      // Serve to Team A's side
      const x = startX + courtWidth * 0.25;
      const y = this.serviceInfo.serviceSide === 'right'
        ? startY + courtHeight * 0.75
        : startY + courtHeight * 0.25;
      return { x, y };
    }
  }

  isServiceValid(ballX: number, ballY: number, hasBouncedOnGround: boolean): { isValid: boolean; isLet: boolean } {
    if (!hasBouncedOnGround) {
      return { isValid: false, isLet: false };
    }

    const target = this.getServiceTarget();
    const serviceBoxSize = 150;

    const inServiceBox =
      ballX >= target.x - serviceBoxSize/2 &&
      ballX <= target.x + serviceBoxSize/2 &&
      ballY >= target.y - serviceBoxSize/2 &&
      ballY <= target.y + serviceBoxSize/2;

    // TODO: Add net collision detection for "let"
    return { isValid: inServiceBox, isLet: false };
  }

  handleServiceResult(isValid: boolean, isLet: boolean): { nextState: 'continue' | 'fault' | 'doubleFault' } {
    if (isLet) {
      // Let - replay service, doesn't count as fault
      return { nextState: 'continue' };
    }

    if (isValid) {
      // Good service - switch sides for next service
      this.serviceSide = this.serviceInfo.serviceSide === 'left' ? 'right' : 'left';
      this.serviceInfo.serviceAttempt = ServiceState.FIRST;
      return { nextState: 'continue' };
    } else {
      // Service fault
      if (this.serviceInfo.serviceAttempt === ServiceState.FIRST) {
        // First fault - get second serve
        this.serviceInfo.serviceAttempt = ServiceState.SECOND;
        return { nextState: 'fault' };
      } else {
        // Double fault - point to opponent
        this.switchServer();
        return { nextState: 'doubleFault' };
      }
    }
  }

  switchServer(): void {
    // Switch to other team
    this.serviceInfo.servingTeam = this.serviceInfo.servingTeam === Team.A ? Team.B : Team.A;
    this.serviceInfo.servingPlayer = 1;
    this.serviceInfo.serviceAttempt = ServiceState.FIRST;
    this.serviceInfo.serviceSide = 'right';
  }

  nextGame(): void {
    // After each game, switch serving team
    this.switchServer();
  }

  private set serviceSide(side: 'left' | 'right') {
    this.serviceInfo.serviceSide = side;
  }

  getServingPlayerName(): string {
    const team = this.serviceInfo.servingTeam;
    const player = this.serviceInfo.servingPlayer;
    return `Team ${team} Player ${player}`;
  }

  drawServiceIndicator(ctx: CanvasRenderingContext2D): void {
    const servicePos = this.getServicePosition();
    const targetPos = this.getServiceTarget();

    // Draw service position
    ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
    ctx.beginPath();
    ctx.arc(servicePos.x, servicePos.y, 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw target service box
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(targetPos.x - 75, targetPos.y - 75, 150, 150);
    ctx.setLineDash([]);

    // Draw service attempt indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    const attemptText = this.serviceInfo.serviceAttempt === ServiceState.FIRST ? '1st Serve' : '2nd Serve';
    ctx.fillText(attemptText, servicePos.x, servicePos.y - 25);
  }
}