import { ServiceState, ServiceInfo3D, Vector3D } from '../types/3DTypes';
import { Physics3D } from '../physics/Physics3D';
import { IsometricRenderer } from '../rendering/IsometricRenderer';

export class ServiceSystem3D {
  private serviceInfo: ServiceInfo3D;
  private serviceState: ServiceState = ServiceState.WAITING_TO_SERVE;
  private ballTossHeight: number = 0;
  private ballTossPosition: Vector3D = { x: 0, y: 0, z: 0 };
  private serviceTimer: number = 0;
  private courtDimensions: { width: number; length: number };

  constructor(courtDimensions: { width: number; length: number }) {
    this.courtDimensions = courtDimensions;

    // Initialize with random serving team
    this.serviceInfo = {
      servingTeam: Math.random() > 0.5 ? 'A' : 'B',
      servingPlayer: 1,
      serviceAttempt: 1,
      serviceSide: 'right'
    };
  }

  update(deltaTime: number): void {
    this.serviceTimer += deltaTime;

    switch (this.serviceState) {
      case ServiceState.BALL_TOSS:
        this.updateBallToss(deltaTime);
        break;

      case ServiceState.SERVE_HIT:
        // Waiting for server to hit the ball
        if (this.serviceTimer > 3000) {
          // Timeout - reset to waiting
          this.serviceState = ServiceState.WAITING_TO_SERVE;
          this.serviceTimer = 0;
        }
        break;
    }
  }

  private updateBallToss(deltaTime: number): void {
    const dt = deltaTime / 1000;

    // Ball toss physics (simple upward motion with gravity)
    this.ballTossHeight += 4 * dt - 4.9 * dt * dt; // Initial upward velocity of 4 m/s

    if (this.ballTossHeight <= 0) {
      // Ball has landed - reset toss
      this.ballTossHeight = 0;
      this.serviceState = ServiceState.WAITING_TO_SERVE;
      this.serviceTimer = 0;
    }
  }

  startBallToss(): boolean {
    if (this.serviceState !== ServiceState.WAITING_TO_SERVE) {
      return false;
    }

    this.serviceState = ServiceState.BALL_TOSS;
    this.ballTossHeight = 0;
    this.ballTossPosition = this.getServicePosition();
    this.serviceTimer = 0;

    return true;
  }

  canServe(): boolean {
    return this.serviceState === ServiceState.BALL_TOSS && this.ballTossHeight > 0.5;
  }

  serve(): { position: Vector3D; target: Vector3D } | null {
    if (!this.canServe()) {
      return null;
    }

    this.serviceState = ServiceState.SERVE_HIT;
    this.serviceTimer = 0;

    const servePosition = {
      x: this.ballTossPosition.x,
      y: this.ballTossHeight,
      z: this.ballTossPosition.z
    };

    const target = this.getServiceTarget();

    return { position: servePosition, target };
  }

  getServicePosition(): Vector3D {
    const serviceLineOffset = 3; // 3m behind service line
    const courtWidth = this.courtDimensions.width;
    const courtLength = this.courtDimensions.length;

    if (this.serviceInfo.servingTeam === 'A') {
      // Team A serves from bottom of court
      return {
        x: this.serviceInfo.serviceSide === 'left' ? courtWidth * 0.25 : courtWidth * 0.75,
        y: 0,
        z: serviceLineOffset
      };
    } else {
      // Team B serves from top of court
      return {
        x: this.serviceInfo.serviceSide === 'left' ? courtWidth * 0.25 : courtWidth * 0.75,
        y: 0,
        z: courtLength - serviceLineOffset
      };
    }
  }

  getServiceTarget(): Vector3D {
    const courtWidth = this.courtDimensions.width;
    const courtLength = this.courtDimensions.length;
    const serviceLineDistance = 6.95;

    if (this.serviceInfo.servingTeam === 'A') {
      // Serve to Team B's service box (diagonal)
      return {
        x: this.serviceInfo.serviceSide === 'left' ? courtWidth * 0.75 : courtWidth * 0.25,
        y: 0,
        z: courtLength - serviceLineDistance / 2
      };
    } else {
      // Serve to Team A's service box (diagonal)
      return {
        x: this.serviceInfo.serviceSide === 'left' ? courtWidth * 0.75 : courtWidth * 0.25,
        y: 0,
        z: serviceLineDistance / 2
      };
    }
  }

  validateService(ballPosition: Vector3D, hasBouncedGround: boolean): {
    isValid: boolean;
    isLet: boolean;
    message: string;
  } {
    const result = Physics3D.isValidServe(
      ballPosition,
      this.serviceInfo.servingTeam,
      this.serviceInfo.serviceSide,
      hasBouncedGround
    );

    if (!hasBouncedGround) {
      return { isValid: false, isLet: false, message: 'Ball must bounce first!' };
    }

    if (result.isLet) {
      return { isValid: false, isLet: true, message: 'LET - Net touched, replay serve' };
    }

    if (!result.isValid) {
      return { isValid: false, isLet: false, message: 'Service FAULT - Out of service box' };
    }

    return { isValid: true, isLet: false, message: 'Good serve!' };
  }

  handleServiceResult(isValid: boolean, isLet: boolean): {
    nextState: 'continue' | 'fault' | 'doubleFault' | 'rally';
  } {
    if (isLet) {
      // Let - replay service without penalty
      this.serviceState = ServiceState.WAITING_TO_SERVE;
      return { nextState: 'continue' };
    }

    if (isValid) {
      // Good service - start rally
      this.serviceState = ServiceState.RALLY;
      return { nextState: 'rally' };
    } else {
      // Service fault
      if (this.serviceInfo.serviceAttempt === 1) {
        // First fault - second serve
        this.serviceInfo.serviceAttempt = 2;
        this.serviceState = ServiceState.WAITING_TO_SERVE;
        return { nextState: 'fault' };
      } else {
        // Double fault - point to opponent
        this.nextService();
        return { nextState: 'doubleFault' };
      }
    }
  }

  nextService(): void {
    // Switch service side after each point
    this.serviceInfo.serviceSide = this.serviceInfo.serviceSide === 'left' ? 'right' : 'left';
    this.serviceInfo.serviceAttempt = 1;
    this.serviceState = ServiceState.WAITING_TO_SERVE;
  }

  nextGame(): void {
    // Switch serving team after each game
    this.serviceInfo.servingTeam = this.serviceInfo.servingTeam === 'A' ? 'B' : 'A';
    this.serviceInfo.serviceSide = 'right';
    this.serviceInfo.serviceAttempt = 1;
    this.serviceState = ServiceState.WAITING_TO_SERVE;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw service indicators
    this.drawServicePosition(ctx);
    this.drawServiceTarget(ctx);

    // Draw ball toss if active
    if (this.serviceState === ServiceState.BALL_TOSS) {
      this.drawBallToss(ctx);
    }

    // Draw service instructions
    this.drawServiceInstructions(ctx);
  }

  private drawServicePosition(ctx: CanvasRenderingContext2D): void {
    const servicePos = this.getServicePosition();
    const servicePosProj = IsometricRenderer.project(servicePos);

    // Service position indicator
    ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
    ctx.beginPath();
    ctx.arc(servicePosProj.x, servicePosProj.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Server indicator
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SERVER', servicePosProj.x, servicePosProj.y + 35);
  }

  private drawServiceTarget(ctx: CanvasRenderingContext2D): void {
    const target = this.getServiceTarget();
    const serviceBox = this.getTargetServiceBox();

    // Draw service box highlight
    const corners = [
      { x: serviceBox.minX, y: 0.01, z: serviceBox.minZ },
      { x: serviceBox.maxX, y: 0.01, z: serviceBox.minZ },
      { x: serviceBox.maxX, y: 0.01, z: serviceBox.maxZ },
      { x: serviceBox.minX, y: 0.01, z: serviceBox.maxZ }
    ];

    const projectedCorners = corners.map(corner => IsometricRenderer.project(corner));

    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.beginPath();
    ctx.moveTo(projectedCorners[0].x, projectedCorners[0].y);
    projectedCorners.forEach(corner => ctx.lineTo(corner.x, corner.y));
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target center
    const targetProj = IsometricRenderer.project(target);
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(targetProj.x, targetProj.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBallToss(ctx: CanvasRenderingContext2D): void {
    const ballPos = {
      x: this.ballTossPosition.x,
      y: this.ballTossHeight,
      z: this.ballTossPosition.z
    };

    const ballProj = IsometricRenderer.project(ballPos);

    // Tossed ball
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath();
    ctx.arc(ballProj.x, ballProj.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFEB3B';
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawServiceInstructions(ctx: CanvasRenderingContext2D): void {
    const centerX = ctx.canvas.width / 2;
    const topY = 60;

    let instructions = '';
    let color = '#FFFFFF';

    switch (this.serviceState) {
      case ServiceState.WAITING_TO_SERVE:
        instructions = `${this.getServingPlayerName()} to serve - Press SPACE to toss ball`;
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(centerX - 200, topY - 15, 400, 30);

    // Text
    ctx.fillStyle = color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(instructions, centerX, topY + 5);

    // Service attempt indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Arial';
    const attemptText = `${this.serviceInfo.serviceAttempt === 1 ? '1st' : '2nd'} Serve`;
    ctx.fillText(attemptText, centerX, topY + 25);
  }

  private getTargetServiceBox(): { minX: number; maxX: number; minZ: number; maxZ: number } {
    const courtWidth = this.courtDimensions.width;
    const courtLength = this.courtDimensions.length;
    const serviceLineDistance = 6.95;

    const boxWidth = courtWidth / 2;

    if (this.serviceInfo.servingTeam === 'A') {
      // Target Team B's service box
      return {
        minX: this.serviceInfo.serviceSide === 'left' ? boxWidth : 0,
        maxX: this.serviceInfo.serviceSide === 'left' ? courtWidth : boxWidth,
        minZ: courtLength - serviceLineDistance,
        maxZ: courtLength
      };
    } else {
      // Target Team A's service box
      return {
        minX: this.serviceInfo.serviceSide === 'left' ? boxWidth : 0,
        maxX: this.serviceInfo.serviceSide === 'left' ? courtWidth : boxWidth,
        minZ: 0,
        maxZ: serviceLineDistance
      };
    }
  }

  getServingPlayerName(): string {
    return `Team ${this.serviceInfo.servingTeam} Player ${this.serviceInfo.servingPlayer}`;
  }

  getServiceInfo(): ServiceInfo3D {
    return { ...this.serviceInfo };
  }

  getServiceState(): ServiceState {
    return this.serviceState;
  }

  setServiceState(state: ServiceState): void {
    this.serviceState = state;
  }

  reset(): void {
    this.serviceState = ServiceState.WAITING_TO_SERVE;
    this.serviceTimer = 0;
    this.ballTossHeight = 0;
  }
}