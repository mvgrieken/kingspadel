export class ScoreSystem {
  private pointsA: number = 0  // 0, 15, 30, 40
  private pointsB: number = 0
  private gamesA: number = 0
  private gamesB: number = 0
  private setsA: number = 0
  private setsB: number = 0
  private isDeuce: boolean = false
  private advantage: 'A' | 'B' | null = null
  private matchWinner: 'A' | 'B' | null = null
  private tiebreak: boolean = false
  private tiebreakPointsA: number = 0
  private tiebreakPointsB: number = 0

  addPoint(team: 'A' | 'B'): { gameWon?: 'A' | 'B', setWon?: 'A' | 'B', matchWon?: 'A' | 'B' } {
    const result: { gameWon?: 'A' | 'B', setWon?: 'A' | 'B', matchWon?: 'A' | 'B' } = {}

    if (this.tiebreak) {
      return this.addTiebreakPoint(team)
    }

    if (team === 'A') {
      if (this.isDeuce) {
        if (this.advantage === 'B') {
          this.advantage = null
        } else if (this.advantage === 'A') {
          result.gameWon = 'A'
          this.winGame('A')
        } else {
          this.advantage = 'A'
        }
      } else {
        this.pointsA++
        if (this.pointsA >= 4) {
          if (this.pointsA >= this.pointsB + 2) {
            result.gameWon = 'A'
            this.winGame('A')
          } else if (this.pointsB >= 3) {
            this.isDeuce = true
          }
        } else if (this.pointsA === 3 && this.pointsB === 3) {
          this.isDeuce = true
        }
      }
    } else {
      if (this.isDeuce) {
        if (this.advantage === 'A') {
          this.advantage = null
        } else if (this.advantage === 'B') {
          result.gameWon = 'B'
          this.winGame('B')
        } else {
          this.advantage = 'B'
        }
      } else {
        this.pointsB++
        if (this.pointsB >= 4) {
          if (this.pointsB >= this.pointsA + 2) {
            result.gameWon = 'B'
            this.winGame('B')
          } else if (this.pointsA >= 3) {
            this.isDeuce = true
          }
        } else if (this.pointsB === 3 && this.pointsA === 3) {
          this.isDeuce = true
        }
      }
    }

    // Check for set and match wins
    if (result.gameWon) {
      const setResult = this.checkSetWin()
      if (setResult) {
        result.setWon = setResult
        const matchResult = this.checkMatchWin()
        if (matchResult) {
          result.matchWon = matchResult
          this.matchWinner = matchResult
        }
      }
    }

    return result
  }

  private addTiebreakPoint(team: 'A' | 'B'): { gameWon?: 'A' | 'B', setWon?: 'A' | 'B', matchWon?: 'A' | 'B' } {
    const result: { gameWon?: 'A' | 'B', setWon?: 'A' | 'B', matchWon?: 'A' | 'B' } = {}

    if (team === 'A') {
      this.tiebreakPointsA++
      if (this.tiebreakPointsA >= 7 && this.tiebreakPointsA >= this.tiebreakPointsB + 2) {
        this.tiebreak = false
        this.tiebreakPointsA = 0
        this.tiebreakPointsB = 0
        result.setWon = 'A'
        this.winSet('A')
        const matchResult = this.checkMatchWin()
        if (matchResult) {
          result.matchWon = matchResult
          this.matchWinner = matchResult
        }
      }
    } else {
      this.tiebreakPointsB++
      if (this.tiebreakPointsB >= 7 && this.tiebreakPointsB >= this.tiebreakPointsA + 2) {
        this.tiebreak = false
        this.tiebreakPointsA = 0
        this.tiebreakPointsB = 0
        result.setWon = 'B'
        this.winSet('B')
        const matchResult = this.checkMatchWin()
        if (matchResult) {
          result.matchWon = matchResult
          this.matchWinner = matchResult
        }
      }
    }

    return result
  }

  private winGame(team: 'A' | 'B') {
    if (team === 'A') {
      this.gamesA++
    } else {
      this.gamesB++
    }

    // Reset points
    this.pointsA = 0
    this.pointsB = 0
    this.isDeuce = false
    this.advantage = null
  }

  private checkSetWin(): 'A' | 'B' | null {
    if (this.gamesA >= 6 && this.gamesA >= this.gamesB + 2) {
      this.winSet('A')
      return 'A'
    } else if (this.gamesB >= 6 && this.gamesB >= this.gamesA + 2) {
      this.winSet('B')
      return 'B'
    } else if (this.gamesA === 6 && this.gamesB === 6) {
      // Start tiebreak
      this.tiebreak = true
      this.tiebreakPointsA = 0
      this.tiebreakPointsB = 0
    }
    return null
  }

  private winSet(team: 'A' | 'B') {
    if (team === 'A') {
      this.setsA++
    } else {
      this.setsB++
    }

    // Reset games
    this.gamesA = 0
    this.gamesB = 0
  }

  private checkMatchWin(): 'A' | 'B' | null {
    if (this.setsA === 2) {
      return 'A'
    } else if (this.setsB === 2) {
      return 'B'
    }
    return null
  }

  getPointDisplay(team: 'A' | 'B'): string {
    if (this.tiebreak) {
      return team === 'A' ? this.tiebreakPointsA.toString() : this.tiebreakPointsB.toString()
    }

    if (this.isDeuce) {
      if (this.advantage === team) return 'AD'
      if (this.advantage !== null) return '40'
      return '40'
    }

    const points = team === 'A' ? this.pointsA : this.pointsB
    return ['0', '15', '30', '40'][points] || '0'
  }

  getGames(team: 'A' | 'B'): number {
    return team === 'A' ? this.gamesA : this.gamesB
  }

  getSets(team: 'A' | 'B'): number {
    return team === 'A' ? this.setsA : this.setsB
  }

  getMatchWinner(): 'A' | 'B' | null {
    return this.matchWinner
  }

  isTiebreak(): boolean {
    return this.tiebreak
  }

  reset() {
    this.pointsA = 0
    this.pointsB = 0
    this.gamesA = 0
    this.gamesB = 0
    this.setsA = 0
    this.setsB = 0
    this.isDeuce = false
    this.advantage = null
    this.matchWinner = null
    this.tiebreak = false
    this.tiebreakPointsA = 0
    this.tiebreakPointsB = 0
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, 1400, 80)

    // Team A side
    ctx.fillStyle = '#FF6B6B'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('Team A', 50, 35)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 36px Arial'
    ctx.fillText(this.getPointDisplay('A'), 50, 68)

    // Games and Sets for Team A
    ctx.font = '18px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillText(`Games: ${this.gamesA} | Sets: ${this.setsA}`, 150, 68)

    // Center info
    ctx.textAlign = 'center'
    ctx.fillStyle = 'white'
    ctx.font = '20px Arial'

    if (this.tiebreak) {
      ctx.fillStyle = '#FFD700'
      ctx.fillText('TIEBREAK', 700, 35)
    } else if (this.isDeuce) {
      ctx.fillStyle = '#FFA500'
      ctx.fillText('DEUCE', 700, 35)
    }

    // Score summary
    ctx.font = '16px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(`${this.gamesA} - ${this.gamesB}`, 700, 58)

    // Team B side
    ctx.fillStyle = '#4ECDC4'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'right'
    ctx.fillText('Team B', 1350, 35)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 36px Arial'
    ctx.fillText(this.getPointDisplay('B'), 1350, 68)

    // Games and Sets for Team B
    ctx.font = '18px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillText(`Sets: ${this.setsB} | Games: ${this.gamesB}`, 1250, 68)
  }
}