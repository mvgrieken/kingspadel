import { Player } from './Player'
import { Ball } from './Ball'

export enum ServiceState {
  READY = 'ready',
  TOSS = 'toss',
  HIT = 'hit',
  CHECKING = 'checking',
  FAULT = 'fault',
  DOUBLE_FAULT = 'double_fault',
  LET = 'let',
  VALID = 'valid'
}

export class ServiceSystem {
  private servingTeam: 'A' | 'B' = 'A'
  private servingPlayerIndex: number = 0
  private serviceAttempt: 1 | 2 = 1
  private serviceSide: 'left' | 'right' = 'right' // Always start right
  private state: ServiceState = ServiceState.READY
  private tossTime: number = 0

  constructor() {
    // Randomly choose starting team
    this.servingTeam = Math.random() > 0.5 ? 'A' : 'B'
  }

  getState(): ServiceState {
    return this.state
  }

  getServingTeam(): 'A' | 'B' {
    return this.servingTeam
  }

  getServiceSide(): 'left' | 'right' {
    return this.serviceSide
  }

  getServiceAttempt(): 1 | 2 {
    return this.serviceAttempt
  }

  startService(player: Player, ball: Ball) {
    this.state = ServiceState.READY

    // Position ball at service position
    const serviceX = player.team === 'A' ? 200 : 1200
    const serviceY = 480
    ball.reset(serviceX, serviceY)
  }

  tossBall(ball: Ball) {
    if (this.state !== ServiceState.READY) return false

    this.state = ServiceState.TOSS
    this.tossTime = 0
    ball.toss()
    return true
  }

  canServe(): boolean {
    return this.state === ServiceState.TOSS && this.tossTime > 200
  }

  executeServe(ball: Ball, player: Player, power: number = 12) {
    if (!this.canServe()) return false

    this.state = ServiceState.HIT

    // Calculate target based on service side
    let targetX: number
    let targetY: number = 500

    if (player.team === 'A') {
      // Serving to right side
      targetX = this.serviceSide === 'right' ? 900 : 800
    } else {
      // Serving to left side
      targetX = this.serviceSide === 'right' ? 500 : 400
    }

    // Add some randomness
    targetX += (Math.random() - 0.5) * 100
    targetY += (Math.random() - 0.5) * 30

    ball.serve(player.x, player.y - 30, targetX, targetY, power)
    return true
  }

  update(deltaTime: number) {
    if (this.state === ServiceState.TOSS) {
      this.tossTime += deltaTime
      // Auto-reset if toss takes too long
      if (this.tossTime > 3000) {
        this.state = ServiceState.READY
      }
    }
  }

  checkServiceResult(ballX: number, _ballY: number, hasBouncedGround: boolean, hitNet: boolean): {
    valid: boolean
    fault: boolean
    doubleFault: boolean
    let: boolean
    message: string
  } {
    if (!hasBouncedGround) {
      return {
        valid: false,
        fault: false,
        doubleFault: false,
        let: false,
        message: 'Waiting for ball to land...'
      }
    }

    // Check if ball is in correct service box
    const inCorrectSide = this.serviceSide === 'left'
      ? ballX < 700
      : ballX > 700

    const inServiceBox = this.serviceSide === 'left'
      ? ballX >= 283 && ballX <= 700
      : ballX >= 700 && ballX <= 1117

    // Check for let (hit net but landed in service box)
    if (hitNet && inCorrectSide && inServiceBox) {
      this.state = ServiceState.LET
      return {
        valid: false,
        fault: false,
        doubleFault: false,
        let: true,
        message: 'LET - Replay serve'
      }
    }

    // Check if service is valid
    if (inCorrectSide && inServiceBox) {
      this.state = ServiceState.VALID
      return {
        valid: true,
        fault: false,
        doubleFault: false,
        let: false,
        message: 'Good serve!'
      }
    }

    // Service fault
    if (this.serviceAttempt === 1) {
      this.serviceAttempt = 2
      this.state = ServiceState.FAULT
      return {
        valid: false,
        fault: true,
        doubleFault: false,
        let: false,
        message: 'FAULT - Second serve'
      }
    } else {
      this.state = ServiceState.DOUBLE_FAULT
      return {
        valid: false,
        fault: false,
        doubleFault: true,
        let: false,
        message: 'DOUBLE FAULT!'
      }
    }
  }

  nextPoint() {
    // Switch service side after each point
    this.serviceSide = this.serviceSide === 'left' ? 'right' : 'left'
    this.serviceAttempt = 1
    this.state = ServiceState.READY
  }

  nextGame() {
    // Switch serving team after each game
    this.servingTeam = this.servingTeam === 'A' ? 'B' : 'A'
    this.servingPlayerIndex = (this.servingPlayerIndex + 1) % 2
    this.serviceSide = 'right' // Always start from right
    this.serviceAttempt = 1
    this.state = ServiceState.READY
  }

  reset() {
    this.serviceAttempt = 1
    this.state = ServiceState.READY
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Service indicator
    if (this.state === ServiceState.READY || this.state === ServiceState.TOSS) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'center'

      const text = this.state === ServiceState.READY
        ? `Team ${this.servingTeam} to serve - Press SPACE to toss`
        : 'Ball tossed - Press SPACE to serve!'

      // Background for text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(450, 100, 500, 40)

      // Text
      ctx.fillStyle = '#FFD700'
      ctx.fillText(text, 700, 125)

      // Service attempt indicator
      ctx.font = '14px Arial'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillText(
        `${this.serviceAttempt === 1 ? '1st' : '2nd'} Serve - ${this.serviceSide === 'left' ? 'Left' : 'Right'} Box`,
        700,
        145
      )
    }
  }
}