export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BallState3D {
  position: Vector3D;
  velocity: Vector3D;
  groundBounces: number;
  hitWallBeforeGround: boolean;
  isInPlay: boolean;
  spin: Vector3D;
}

export enum ServiceState {
  WAITING_TO_SERVE = 'waiting_to_serve',
  BALL_TOSS = 'ball_toss',
  SERVE_HIT = 'serve_hit',
  RALLY = 'rally',
  POINT_SCORED = 'point_scored'
}

export enum GameState3D {
  MENU = 'menu',
  COIN_TOSS = 'coin_toss',
  SERVICE = 'service',
  RALLY = 'rally',
  POINT_DISPLAY = 'point_display',
  GAME_WON = 'game_won',
  SET_WON = 'set_won',
  MATCH_WON = 'match_won',
  PAUSED = 'paused'
}

export interface Player3D {
  position: Vector3D;
  team: 'A' | 'B';
  side: 'left' | 'right';
  controls: {
    up: string;
    down: string;
    hit: string;
  };
  name: string;
  color: string;
}

export interface ServiceInfo3D {
  servingTeam: 'A' | 'B';
  servingPlayer: 1 | 2;
  serviceAttempt: 1 | 2;
  serviceSide: 'left' | 'right';
}

export interface CourtDimensions {
  // Official FIP dimensions in meters
  length: 20;
  width: 10;

  // Service lines
  serviceLineDistance: 6.95; // from net

  // Net
  netHeight: {
    center: 0.88;
    sides: 0.92;
  };

  // Walls
  backWallHeight: 4;
  sideWallHeight: {
    first2m: 3;
    after2m: 2;
  };
}

export interface RallyRules {
  maxGroundBounces: 1;
  canHitWallFirst: false;
  maxWallHeight: 4; // meters
}

export interface PointResult {
  winner: 'A' | 'B';
  reason: 'out' | 'double_bounce' | 'wall_first' | 'net' | 'double_fault' | 'winner';
  message: string;
}

export interface ParticleEffect {
  position: Vector3D;
  velocity: Vector3D;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}