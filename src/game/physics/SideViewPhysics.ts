export interface Ball2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  groundBounces: number;
  isInPlay: boolean;
  radius: number;
}

export interface PointResult {
  winner: 'A' | 'B';
  reason: 'out' | 'double_bounce' | 'wall_first' | 'net' | 'double_fault' | 'winner';
  message: string;
}

export class SideViewPhysics {
  private static readonly GRAVITY = 0.5;
  private static readonly GROUND_BOUNCE_FACTOR = 0.75;
  private static readonly WALL_BOUNCE_FACTOR = 0.85;
  private static readonly AIR_RESISTANCE = 0.998;
  private static readonly GROUND_Y = 550;
  private static readonly NET_X = 700;

  static updateBall(ball: Ball2D, court: any): Ball2D | PointResult {
    if (!ball.isInPlay) return ball;

    const newBall = { ...ball };

    // Apply gravity
    newBall.vy += SideViewPhysics.GRAVITY;

    // Apply air resistance
    newBall.vx *= SideViewPhysics.AIR_RESISTANCE;
    newBall.vy *= SideViewPhysics.AIR_RESISTANCE;

    // Update position
    newBall.x += newBall.vx;
    newBall.y += newBall.vy;

    // Check ground collision
    if (newBall.y + newBall.radius >= SideViewPhysics.GROUND_Y) {
      newBall.y = SideViewPhysics.GROUND_Y - newBall.radius;
      newBall.vy = -newBall.vy * SideViewPhysics.GROUND_BOUNCE_FACTOR;
      newBall.vx *= 0.95; // Friction

      newBall.groundBounces++;

      // Ball bounced twice = point to opponent
      if (newBall.groundBounces >= 2) {
        const winner = SideViewPhysics.getOpponentTeam(newBall.x);
        return {
          winner,
          reason: 'double_bounce',
          message: `Ball bounced twice! Point to Team ${winner}`
        };
      }
    }

    // Check wall collisions
    const wallCollision = court.checkWallCollision(newBall.x, newBall.y, newBall.radius);
    if (wallCollision) {
      // If ball hits wall before bouncing on ground = FAULT
      if (newBall.groundBounces === 0) {
        const winner = SideViewPhysics.getOpponentTeam(newBall.x);
        return {
          winner,
          reason: 'wall_first',
          message: `Ball hit wall before ground! Point to Team ${winner}`
        };
      }

      // Valid wall bounce
      SideViewPhysics.handleWallBounce(newBall, wallCollision, court);
    }

    // Check if ball goes out of bounds (over walls)
    if (newBall.y < SideViewPhysics.GROUND_Y - 300 || newBall.x < 50 || newBall.x > 1350) {
      const winner = SideViewPhysics.getOpponentTeam(newBall.x);
      return {
        winner,
        reason: 'out',
        message: `Ball out of bounds! Point to Team ${winner}`
      };
    }

    // Check net collision
    if (court.checkNetCollision(newBall.x, newBall.y, newBall.radius)) {
      const winner = SideViewPhysics.getOpponentTeam(newBall.x);
      return {
        winner,
        reason: 'net',
        message: `Ball hit the net! Point to Team ${winner}`
      };
    }

    return newBall;
  }

  private static handleWallBounce(ball: Ball2D, wallType: string, _court: any): void {
    const damping = SideViewPhysics.WALL_BOUNCE_FACTOR;

    switch (wallType) {
      case 'left_wall':
        ball.vx = Math.abs(ball.vx) * damping;
        ball.x = 100 + ball.radius;
        break;

      case 'right_wall':
        ball.vx = -Math.abs(ball.vx) * damping;
        ball.x = 1300 - ball.radius;
        break;
    }

    // Add some randomness for realism
    ball.vx += (Math.random() - 0.5) * 0.5;
    ball.vy *= 0.9; // Reduce upward velocity slightly
  }

  static getOpponentTeam(ballX: number): 'A' | 'B' {
    // Team A is on the left, Team B on the right
    return ballX < SideViewPhysics.NET_X ? 'B' : 'A';
  }

  static isValidServe(
    ballX: number,
    ballY: number,
    servingTeam: 'A' | 'B',
    hasBouncedGround: boolean,
    court: any
  ): { isValid: boolean; isLet: boolean } {
    if (!hasBouncedGround) {
      return { isValid: false, isLet: false };
    }

    // Check if ball landed in correct service box
    const targetTeam = servingTeam === 'A' ? 'B' : 'A';
    const serviceBox = court.getServiceBox(targetTeam);

    const inServiceBox = ballX >= serviceBox.minX &&
                        ballX <= serviceBox.maxX &&
                        ballY >= serviceBox.minY &&
                        ballY <= serviceBox.maxY;

    // TODO: Check for let (ball hits net but lands in service box)
    const isLet = false;

    return { isValid: inServiceBox, isLet };
  }

  static createServeBall(
    serveX: number,
    serveY: number,
    targetX: number,
    targetY: number,
    power: number = 12
  ): Ball2D {
    const dx = targetX - serveX;
    const dy = targetY - serveY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return {
      x: serveX,
      y: serveY,
      vx: (dx / distance) * power,
      vy: (dy / distance) * power - 3, // Add upward arc
      groundBounces: 0,
      isInPlay: true,
      radius: 4
    };
  }

  static hitBall(
    ball: Ball2D,
    playerX: number,
    playerY: number,
    targetX: number,
    targetY: number,
    power: number = 10
  ): void {
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    ball.vx = (dx / distance) * power;
    ball.vy = (dy / distance) * power;

    // Reset ground bounces when hit by player
    ball.groundBounces = 0;
  }

  static checkPlayerCollision(
    ball: Ball2D,
    playerX: number,
    playerY: number,
    reach: number = 40
  ): boolean {
    const distance = Math.sqrt(
      (ball.x - playerX) ** 2 + (ball.y - playerY) ** 2
    );
    return distance <= reach + ball.radius;
  }

  static resetBall(): Ball2D {
    return {
      x: 700, // Center
      y: 400, // Above ground
      vx: 0,
      vy: 0,
      groundBounces: 0,
      isInPlay: false,
      radius: 4
    };
  }

  static calculateBallShadow(ball: Ball2D): { x: number; y: number; size: number } {
    const groundDistance = SideViewPhysics.GROUND_Y - ball.y;
    const shadowSize = Math.max(2, 8 - (groundDistance / 50));

    return {
      x: ball.x,
      y: SideViewPhysics.GROUND_Y + 5,
      size: shadowSize
    };
  }

  static isPlayerInPosition(playerX: number, ballX: number, team: 'A' | 'B'): boolean {
    if (team === 'A') {
      // Team A covers left side
      return ballX < SideViewPhysics.NET_X && Math.abs(playerX - ballX) < 200;
    } else {
      // Team B covers right side
      return ballX > SideViewPhysics.NET_X && Math.abs(playerX - ballX) < 200;
    }
  }
}