import { Player } from './Player';
import { Team as TeamType } from '../types';

export class Team {
  public players: [Player, Player];
  public teamType: TeamType;
  public color: string;

  constructor(
    teamType: TeamType,
    player1: Player,
    player2: Player,
    color: string
  ) {
    this.teamType = teamType;
    this.players = [player1, player2];
    this.color = color;
  }

  update(canvasHeight: number): void {
    this.players.forEach(player => player.update(canvasHeight));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.players.forEach(player => player.draw(ctx));
  }

  reset(canvasHeight: number): void {
    const quarterHeight = canvasHeight / 4;
    this.players[0].reset(quarterHeight - this.players[0].height / 2);
    this.players[1].reset(quarterHeight * 3 - this.players[1].height / 2);
  }

  checkBallCollision(ball: { x: number; y: number; radius: number }): Player | null {
    for (const player of this.players) {
      if (player.checkBallCollision(ball)) {
        return player;
      }
    }
    return null;
  }
}