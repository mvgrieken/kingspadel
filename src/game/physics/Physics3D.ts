import { Vector3D, BallState3D, PointResult } from '../types/3DTypes';

export class Physics3D {
  private static readonly GRAVITY = 9.8; // m/s²
  private static readonly GROUND_BOUNCE_FACTOR = 0.75;
  private static readonly WALL_BOUNCE_FACTOR = 0.85;
  private static readonly AIR_RESISTANCE = 0.999;
  private static readonly COURT_LENGTH = 20;
  private static readonly COURT_WIDTH = 10;
  private static readonly MAX_WALL_HEIGHT = 4;

  static updateBall(ballState: BallState3D, deltaTime: number): BallState3D | PointResult {
    if (!ballState.isInPlay) return ballState;

    const dt = deltaTime / 1000; // Convert to seconds
    const newState = { ...ballState };

    // Apply gravity
    newState.velocity.y -= Physics3D.GRAVITY * dt;

    // Apply air resistance
    newState.velocity.x *= Physics3D.AIR_RESISTANCE;
    newState.velocity.y *= Physics3D.AIR_RESISTANCE;
    newState.velocity.z *= Physics3D.AIR_RESISTANCE;

    // Update position
    newState.position.x += newState.velocity.x * dt;
    newState.position.y += newState.velocity.y * dt;
    newState.position.z += newState.velocity.z * dt;

    // Check ground collision
    if (newState.position.y <= 0) {
      newState.position.y = 0;
      newState.velocity.y = -newState.velocity.y * Physics3D.GROUND_BOUNCE_FACTOR;

      // Apply friction on ground contact
      newState.velocity.x *= 0.9;
      newState.velocity.z *= 0.9;

      newState.groundBounces++;

      // Check if ball bounced twice (fault!)
      if (newState.groundBounces >= 2) {
        return {
          winner: Physics3D.getOpponentTeam(newState.position),
          reason: 'double_bounce',
          message: 'Ball bounced twice!'
        };
      }
    }

    // Check out of bounds
    if (newState.position.x < 0 || newState.position.x > Physics3D.COURT_WIDTH ||
        newState.position.z < 0 || newState.position.z > Physics3D.COURT_LENGTH) {
      return {
        winner: Physics3D.getOpponentTeam(newState.position),
        reason: 'out',
        message: 'Ball out of bounds!'
      };
    }

    // Check if ball goes over maximum height (out of cage)
    if (newState.position.y > Physics3D.MAX_WALL_HEIGHT) {
      return {
        winner: Physics3D.getOpponentTeam(newState.position),
        reason: 'out',
        message: 'Ball over the cage!'
      };
    }

    // Check wall collisions
    const wallCollision = Physics3D.checkWallCollisions(newState);
    if (wallCollision) {
      // If ball hits wall before bouncing on ground = FAULT
      if (newState.groundBounces === 0) {
        newState.hitWallBeforeGround = true;
        return {
          winner: Physics3D.getOpponentTeam(newState.position),
          reason: 'wall_first',
          message: 'Ball hit wall before ground!'
        };
      }

      // Valid wall bounce
      Physics3D.handleWallBounce(newState, wallCollision);
    }

    return newState;
  }

  static checkWallCollisions(ballState: BallState3D): string | null {
    const pos = ballState.position;
    const ballRadius = 0.033; // Standard padel ball radius in meters

    // Back walls
    if (pos.z <= ballRadius) return 'back_team_a';
    if (pos.z >= Physics3D.COURT_LENGTH - ballRadius) return 'back_team_b';

    // Side walls (considering wall heights)
    if (pos.x <= ballRadius) {
      // Left wall height depends on position
      const wallHeight = Physics3D.getSideWallHeight(pos.z);
      if (pos.y <= wallHeight) return 'side_left';
    }

    if (pos.x >= Physics3D.COURT_WIDTH - ballRadius) {
      // Right wall height depends on position
      const wallHeight = Physics3D.getSideWallHeight(pos.z);
      if (pos.y <= wallHeight) return 'side_right';
    }

    return null;
  }

  static getSideWallHeight(z: number): number {
    // First 2m and last 2m: 3m high
    if (z <= 2 || z >= 18) return 3;
    // Middle section: 2m high
    return 2;
  }

  static handleWallBounce(ballState: BallState3D, wallType: string): void {
    const damping = Physics3D.WALL_BOUNCE_FACTOR;

    switch (wallType) {
      case 'back_team_a':
      case 'back_team_b':
        ballState.velocity.z = -ballState.velocity.z * damping;
        // Add small random variation for realism
        ballState.velocity.x += (Math.random() - 0.5) * 0.5;
        break;

      case 'side_left':
        ballState.velocity.x = Math.abs(ballState.velocity.x) * damping;
        ballState.velocity.z += (Math.random() - 0.5) * 0.5;
        break;

      case 'side_right':
        ballState.velocity.x = -Math.abs(ballState.velocity.x) * damping;
        ballState.velocity.z += (Math.random() - 0.5) * 0.5;
        break;
    }

    // Reduce upward velocity slightly
    ballState.velocity.y *= 0.9;
  }

  static checkNetCollision(ballState: BallState3D): boolean {
    const netZ = Physics3D.COURT_LENGTH / 2;
    const netHeight = 0.88; // Center height
    const tolerance = 0.1;

    return Math.abs(ballState.position.z - netZ) < tolerance &&
           ballState.position.y <= netHeight &&
           ballState.position.x >= 0 &&
           ballState.position.x <= Physics3D.COURT_WIDTH;
  }

  static getOpponentTeam(ballPosition: Vector3D): 'A' | 'B' {
    // Determine which side of court ball is on
    return ballPosition.z < Physics3D.COURT_LENGTH / 2 ? 'B' : 'A';
  }

  static isValidServe(
    ballPosition: Vector3D,
    servingTeam: 'A' | 'B',
    serviceSide: 'left' | 'right',
    hasBouncedGround: boolean
  ): { isValid: boolean; isLet: boolean } {
    if (!hasBouncedGround) {
      return { isValid: false, isLet: false };
    }

    // Determine target service box
    const serviceBoxWidth = Physics3D.COURT_WIDTH / 2;
    const serviceLineDistance = 6.95;

    let targetMinX: number, targetMaxX: number, targetMinZ: number, targetMaxZ: number;

    if (servingTeam === 'A') {
      // Serving from team A side, ball must land in team B service box
      targetMinX = serviceSide === 'left' ? serviceBoxWidth : 0;
      targetMaxX = serviceSide === 'left' ? Physics3D.COURT_WIDTH : serviceBoxWidth;
      targetMinZ = Physics3D.COURT_LENGTH - serviceLineDistance;
      targetMaxZ = Physics3D.COURT_LENGTH;
    } else {
      // Serving from team B side, ball must land in team A service box
      targetMinX = serviceSide === 'left' ? serviceBoxWidth : 0;
      targetMaxX = serviceSide === 'left' ? Physics3D.COURT_WIDTH : serviceBoxWidth;
      targetMinZ = 0;
      targetMaxZ = serviceLineDistance;
    }

    const inServiceBox = ballPosition.x >= targetMinX &&
                        ballPosition.x <= targetMaxX &&
                        ballPosition.z >= targetMinZ &&
                        ballPosition.z <= targetMaxZ;

    // TODO: Check for let (ball hits net but lands in service box)
    const isLet = false;

    return { isValid: inServiceBox, isLet };
  }

  static calculateBallShadow(ballPosition: Vector3D): { x: number; z: number; size: number } {
    // Calculate shadow on court floor
    const shadowSize = Math.max(0.1, 0.2 - ballPosition.y * 0.02);
    return {
      x: ballPosition.x,
      z: ballPosition.z,
      size: shadowSize
    };
  }

  static applySpin(ballState: BallState3D): void {
    // Apply spin effects to ball trajectory
    const spinFactor = 0.1;

    ballState.velocity.x += ballState.spin.z * spinFactor;
    ballState.velocity.z -= ballState.spin.x * spinFactor;

    // Magnus effect on y velocity
    const spinMagnitude = Math.sqrt(ballState.spin.x ** 2 + ballState.spin.z ** 2);
    ballState.velocity.y += spinMagnitude * 0.05;

    // Decay spin over time
    ballState.spin.x *= 0.995;
    ballState.spin.y *= 0.995;
    ballState.spin.z *= 0.995;
  }

  static createServeBall(
    servePosition: Vector3D,
    targetPosition: Vector3D,
    power: number = 12
  ): BallState3D {
    const dx = targetPosition.x - servePosition.x;
    const dz = targetPosition.z - servePosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Calculate serve trajectory with arc
    const normalizedX = dx / distance;
    const normalizedZ = dz / distance;

    return {
      position: { ...servePosition },
      velocity: {
        x: normalizedX * power,
        y: 4, // Initial upward velocity for serve arc
        z: normalizedZ * power
      },
      groundBounces: 0,
      hitWallBeforeGround: false,
      isInPlay: true,
      spin: { x: 0, y: 0, z: 0 }
    };
  }

  static resetBallState(): BallState3D {
    return {
      position: { x: 5, y: 1, z: 10 }, // Center of court, elevated
      velocity: { x: 0, y: 0, z: 0 },
      groundBounces: 0,
      hitWallBeforeGround: false,
      isInPlay: false,
      spin: { x: 0, y: 0, z: 0 }
    };
  }
}