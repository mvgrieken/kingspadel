export enum GameState {
  MENU = 'menu',
  SERVICE = 'service',
  RALLY = 'rally',
  POINT_SCORED = 'point_scored',
  GAME_WON = 'game_won',
  SET_WON = 'set_won',
  MATCH_WON = 'match_won',
  PAUSED = 'paused'
}

export enum Team {
  A = 'A',
  B = 'B'
}

export enum ServiceState {
  FIRST = 'first',
  SECOND = 'second'
}

export interface Score {
  points: number;
  games: number;
  sets: number;
}

export interface ServiceInfo {
  servingTeam: Team;
  servingPlayer: 1 | 2;
  serviceAttempt: ServiceState;
  serviceSide: 'left' | 'right';
}

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface BallState {
  position: Position;
  velocity: Velocity;
  hasBouncedOnGround: boolean;
  hasBouncedOnWall: boolean;
  isInPlay: boolean;
}

export interface PlayerControls {
  up: string;
  down: string;
}