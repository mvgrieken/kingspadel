import { Team, Score } from '../types';

export class ScoreSystem {
  private scores: Map<Team, Score> = new Map();
  private pointNames: string[] = ['0', '15', '30', '40'];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.scores.set(Team.A, { points: 0, games: 0, sets: 0 });
    this.scores.set(Team.B, { points: 0, games: 0, sets: 0 });
  }

  addPoint(team: Team): { gameWon: boolean; setWon: boolean; matchWon: boolean } {
    const score = this.scores.get(team)!;
    const opponentScore = this.scores.get(team === Team.A ? Team.B : Team.A)!;

    score.points++;

    // Check if game is won
    let gameWon = false;
    let setWon = false;
    let matchWon = false;

    if (this.isGameWon(score, opponentScore)) {
      score.games++;
      score.points = 0;
      opponentScore.points = 0;
      gameWon = true;

      // Check if set is won
      if (this.isSetWon(score, opponentScore)) {
        score.sets++;
        score.games = 0;
        opponentScore.games = 0;
        setWon = true;

        // Check if match is won (best of 3 sets)
        if (score.sets >= 2) {
          matchWon = true;
        }
      }
    }

    return { gameWon, setWon, matchWon };
  }

  private isGameWon(score: Score, opponentScore: Score): boolean {
    // Regular game (not deuce)
    if (score.points >= 4 && score.points >= opponentScore.points + 2) {
      return true;
    }
    return false;
  }

  private isSetWon(score: Score, opponentScore: Score): boolean {
    // First to 6 games with 2 game difference
    if (score.games >= 6 && score.games >= opponentScore.games + 2) {
      return true;
    }
    // Tiebreak at 6-6 (simplified: first to 7 games wins)
    if (score.games >= 7 && opponentScore.games === 6) {
      return true;
    }
    return false;
  }

  getScore(team: Team): Score {
    return { ...this.scores.get(team)! };
  }

  getPointString(team: Team): string {
    const score = this.scores.get(team)!;
    const opponentScore = this.scores.get(team === Team.A ? Team.B : Team.A)!;

    // Handle deuce and advantage
    if (score.points >= 3 && opponentScore.points >= 3) {
      if (score.points === opponentScore.points) {
        return 'DEUCE';
      } else if (score.points > opponentScore.points) {
        return 'ADV';
      } else {
        return '';
      }
    }

    // Regular scoring
    return this.pointNames[Math.min(score.points, 3)] || '40';
  }

  isDeuce(): boolean {
    const scoreA = this.scores.get(Team.A)!;
    const scoreB = this.scores.get(Team.B)!;
    return scoreA.points >= 3 && scoreB.points >= 3 && scoreA.points === scoreB.points;
  }

  hasAdvantage(): Team | null {
    const scoreA = this.scores.get(Team.A)!;
    const scoreB = this.scores.get(Team.B)!;

    if (scoreA.points >= 3 && scoreB.points >= 3) {
      if (scoreA.points > scoreB.points) return Team.A;
      if (scoreB.points > scoreA.points) return Team.B;
    }
    return null;
  }

  getGameString(): string {
    const scoreA = this.scores.get(Team.A)!;
    const scoreB = this.scores.get(Team.B)!;
    return `${scoreA.games}-${scoreB.games}`;
  }

  getSetString(): string {
    const scoreA = this.scores.get(Team.A)!;
    const scoreB = this.scores.get(Team.B)!;
    return `${scoreA.sets}-${scoreB.sets}`;
  }
}