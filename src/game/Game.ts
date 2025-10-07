import { Ball, GameEvent } from './Ball'
import { Court } from './Court'
import { Player } from './Player'
import { ScoreSystem } from './ScoreSystem'
import { ServiceSystem, ServiceState } from './ServiceSystem'
import { Notification } from './Notification'
import { Particle } from './Particle'

export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  SERVICE = 'service',
  RALLY = 'rally',
  POINT_SCORED = 'point_scored',
  GAME_WON = 'game_won',
  SET_WON = 'set_won',
  MATCH_WON = 'match_won',
  PAUSED = 'paused'
}

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private state: GameState = GameState.MENU
  private lastTime: number = 0
  private animationId: number | null = null

  // Game objects
  private court: Court
  private ball: Ball
  private players: Player[]
  private scoreSystem: ScoreSystem
  private serviceSystem: ServiceSystem
  private notification: Notification
  private particles: Particle[] = []

  // Game settings
  private debugMode: boolean = false
  private showControls: boolean = false
  private autoServe: boolean = false

  // Input state
  private keysPressed: Set<string> = new Set()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.canvas.width = 1400
    this.canvas.height = 700
    this.ctx = canvas.getContext('2d')!

    // Initialize game objects
    this.court = new Court()
    this.ball = new Ball(700, 400)
    this.scoreSystem = new ScoreSystem()
    this.serviceSystem = new ServiceSystem()
    this.notification = new Notification()

    // Initialize players
    this.players = [
      new Player('A1', 'A', 'front', 350, 500, '#FF6B6B', {
        up: 'w', down: 's', hit: ' '
      }),
      new Player('A2', 'A', 'back', 200, 500, '#FF8E8E', {
        up: 'q', down: 'a', hit: 'Tab'
      }),
      new Player('B1', 'B', 'front', 1050, 500, '#4ECDC4', {
        up: 'ArrowUp', down: 'ArrowDown', hit: 'Shift'
      }),
      new Player('B2', 'B', 'back', 1200, 500, '#6ED3CF', {
        up: 'i', down: 'k', hit: 'Enter'
      })
    ]

    this.setupControls()
  }

  private setupControls() {
    document.addEventListener('keydown', (e) => {
      // Prevent defaults for game keys
      const gameKeys = [' ', 'Tab', 'ArrowUp', 'ArrowDown', 'Enter', 'Shift']
      if (gameKeys.includes(e.key)) {
        e.preventDefault()
      }

      this.keysPressed.add(e.key)

      // Global controls
      if (e.key === 'Escape') {
        this.togglePause()
      } else if (e.key === 'r' || e.key === 'R') {
        this.reset()
      } else if (e.key === 'd' || e.key === 'D') {
        this.debugMode = !this.debugMode
      } else if (e.key === 'c' || e.key === 'C') {
        this.showControls = !this.showControls
      } else if (e.key === 'h' || e.key === 'H') {
        this.autoServe = !this.autoServe
        this.notification.show(
          `Auto-serve ${this.autoServe ? 'ON' : 'OFF'}`,
          1000,
          this.autoServe ? '#4CAF50' : '#F44336'
        )
      }

      // Game state specific controls
      this.handleGameControls(e.key)

      // Player controls
      this.handlePlayerControls(e.key, true)
    })

    document.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.key)
      this.handlePlayerControls(e.key, false)
    })
  }

  private handleGameControls(key: string) {
    const servingPlayer = this.getServingPlayer()
    if (!servingPlayer) return

    switch (this.state) {
      case GameState.SERVICE:
        if (this.serviceSystem.getState() === ServiceState.READY) {
          if (key === servingPlayer.controls.hit || (this.autoServe && key === ' ')) {
            this.serviceSystem.tossBall(this.ball)
          }
        } else if (this.serviceSystem.getState() === ServiceState.TOSS) {
          if (key === servingPlayer.controls.hit || (this.autoServe && key === ' ')) {
            if (this.serviceSystem.canServe()) {
              this.serviceSystem.executeServe(this.ball, servingPlayer)
            }
          }
        }
        break

      case GameState.RALLY:
        this.players.forEach(player => {
          if (key === player.controls.hit) {
            if (player.canHit(this.ball.x, this.ball.y)) {
              if (player.swing()) {
                this.hitBall(player)
              }
            }
          }
        })
        break
    }
  }

  private handlePlayerControls(key: string, pressed: boolean) {
    this.players.forEach(player => {
      if (key === player.controls.up) {
        if (pressed) {
          player.moveUp()
        } else if (!this.keysPressed.has(player.controls.down)) {
          player.stopMoving()
        }
      } else if (key === player.controls.down) {
        if (pressed) {
          player.moveDown()
        } else if (!this.keysPressed.has(player.controls.up)) {
          player.stopMoving()
        }
      }
    })
  }

  private hitBall(player: Player) {
    // Calculate hit direction and power
    const targetX = player.team === 'A' ? 1000 + Math.random() * 200 : 200 + Math.random() * 200
    const targetY = 400 + Math.random() * 100
    const power = 8 + Math.random() * 6

    this.ball.hit(player.x, player.y, targetX, targetY, power)

    // Create hit particles
    for (let i = 0; i < 10; i++) {
      this.particles.push(new Particle(
        player.x,
        player.y - 20,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        player.color
      ))
    }
  }

  private getServingPlayer(): Player | null {
    const team = this.serviceSystem.getServingTeam()
    const teamPlayers = this.players.filter(p => p.team === team)
    return teamPlayers[0] || null
  }

  private togglePause() {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.RALLY
    } else if (this.state === GameState.RALLY || this.state === GameState.SERVICE) {
      this.state = GameState.PAUSED
      this.notification.show('PAUSED', 500)
    }
  }

  start() {
    this.state = GameState.SERVICE
    this.startNewPoint()
    this.gameLoop()
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private startNewPoint() {
    const servingPlayer = this.getServingPlayer()
    if (servingPlayer) {
      this.serviceSystem.startService(servingPlayer, this.ball)
      this.state = GameState.SERVICE
    }
  }

  private update(deltaTime: number) {
    if (this.state === GameState.PAUSED) return

    // Update players
    this.players.forEach(player => player.update(deltaTime))

    // Update service system
    this.serviceSystem.update(deltaTime)

    // Update ball
    const event = this.ball.update()
    if (event) {
      this.handleBallEvent(event)
    }

    // Check service result
    if (this.state === GameState.SERVICE && this.serviceSystem.getState() === ServiceState.HIT) {
      if (this.ball.y >= 540) {
        const result = this.serviceSystem.checkServiceResult(
          this.ball.x,
          this.ball.y,
          true,
          false // TODO: track net hits
        )

        if (result.valid) {
          this.state = GameState.RALLY
          this.notification.show('Good serve!', 1000, '#4CAF50')
        } else if (result.let) {
          this.notification.show('LET - Replay', 1500, '#FFA500')
          this.serviceSystem.reset()
          this.startNewPoint()
        } else if (result.fault) {
          this.notification.show('FAULT', 1500, '#F44336')
          this.ball.reset(700, 400)
          setTimeout(() => this.startNewPoint(), 1000)
        } else if (result.doubleFault) {
          this.handlePoint(this.serviceSystem.getServingTeam() === 'A' ? 'B' : 'A', 'Double fault')
        }
      }
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.update(deltaTime)
      return p.life > 0
    })

    // Update notification
    this.notification.update(deltaTime)
  }

  private handleBallEvent(event: GameEvent) {
    switch (event.type) {
      case 'DOUBLE_BOUNCE':
      case 'FAULT':
      case 'OUT':
      case 'NET':
        if (event.winner) {
          this.handlePoint(event.winner, event.reason || '')
        }
        break

      case 'WALL_BOUNCE':
        // Create wall bounce particles
        for (let i = 0; i < 5; i++) {
          this.particles.push(new Particle(
            this.ball.x,
            this.ball.y,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            '#88CCFF'
          ))
        }
        break
    }
  }

  private handlePoint(winner: 'A' | 'B', _reason: string) {
    this.state = GameState.POINT_SCORED
    this.ball.isInPlay = false

    const result = this.scoreSystem.addPoint(winner)

    // Show notifications
    this.notification.show(`POINT Team ${winner}!`, 2000, winner === 'A' ? '#FF6B6B' : '#4ECDC4')

    if (result.matchWon) {
      this.state = GameState.MATCH_WON
      setTimeout(() => {
        this.notification.show(`MATCH WON - Team ${result.matchWon}!`, 5000, '#FFD700')
      }, 2000)
    } else if (result.setWon) {
      this.state = GameState.SET_WON
      setTimeout(() => {
        this.notification.show(`SET WON - Team ${result.setWon}!`, 3000, '#FFA500')
      }, 2000)
      this.serviceSystem.nextGame()
    } else if (result.gameWon) {
      this.state = GameState.GAME_WON
      setTimeout(() => {
        this.notification.show(`GAME - Team ${result.gameWon}!`, 2500, '#4CAF50')
      }, 2000)
      this.serviceSystem.nextGame()
    } else {
      this.serviceSystem.nextPoint()
    }

    // Start next point after delay
    if (this.state !== GameState.MATCH_WON) {
      setTimeout(() => {
        this.startNewPoint()
      }, 3000)
    }
  }

  private draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw court
    const highlightSide = this.state === GameState.SERVICE ? this.serviceSystem.getServiceSide() : undefined
    this.court.draw(this.ctx, highlightSide)

    // Draw particles (behind players)
    this.particles.forEach(p => p.draw(this.ctx))

    // Draw players
    const servingPlayer = this.getServingPlayer()
    this.players.forEach(player => {
      const isServing = this.state === GameState.SERVICE && player === servingPlayer
      player.draw(this.ctx, isServing)
    })

    // Draw ball
    this.ball.draw(this.ctx)

    // Draw UI
    this.scoreSystem.draw(this.ctx)
    this.serviceSystem.draw(this.ctx)
    this.notification.draw(this.ctx)

    // Draw controls overlay
    if (this.showControls) {
      this.drawControls()
    }

    // Draw debug info
    if (this.debugMode) {
      this.drawDebug()
    }
  }

  private drawControls() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
    this.ctx.fillRect(350, 150, 700, 400)

    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(350, 150, 700, 400)

    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 28px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('CONTROLS', 700, 190)

    this.ctx.font = '18px Arial'
    this.ctx.textAlign = 'left'

    const controls = [
      '',
      'TEAM A (Red)',
      '  Player A1: W/S move, SPACE hit',
      '  Player A2: Q/A move, TAB hit',
      '',
      'TEAM B (Cyan)',
      '  Player B1: ↑/↓ move, SHIFT hit',
      '  Player B2: I/K move, ENTER hit',
      '',
      'GENERAL',
      '  ESC - Pause/Resume',
      '  R - Reset match',
      '  D - Debug mode',
      '  C - Toggle this help',
      '  H - Auto-serve mode',
      '',
      'Press C to close'
    ]

    controls.forEach((line, i) => {
      const y = 220 + i * 20
      if (line.startsWith('TEAM') || line === 'GENERAL') {
        this.ctx.fillStyle = '#FFD700'
        this.ctx.font = 'bold 18px Arial'
      } else {
        this.ctx.fillStyle = 'white'
        this.ctx.font = '16px Arial'
      }
      this.ctx.fillText(line, 380, y)
    })
  }

  private drawDebug() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(10, 100, 250, 200)

    this.ctx.fillStyle = '#00FF00'
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'left'

    const debugInfo = [
      `State: ${this.state}`,
      `Service: ${this.serviceSystem.getState()}`,
      `Ball: ${Math.round(this.ball.x)}, ${Math.round(this.ball.y)}`,
      `Ball velocity: ${this.ball.vx.toFixed(1)}, ${this.ball.vy.toFixed(1)}`,
      `Ground bounces: ${this.ball.groundBounces}`,
      `Current side: ${this.ball.currentSide}`,
      `In play: ${this.ball.isInPlay}`,
      `Particles: ${this.particles.length}`,
      `Auto-serve: ${this.autoServe}`
    ]

    debugInfo.forEach((info, i) => {
      this.ctx.fillText(info, 20, 120 + i * 18)
    })
  }

  reset() {
    this.ball.reset(700, 400)
    this.scoreSystem.reset()
    this.serviceSystem.reset()
    this.particles = []
    this.notification.clear()
    this.state = GameState.SERVICE
    this.startNewPoint()
  }

  private gameLoop = () => {
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.update(deltaTime)
    this.draw()

    this.animationId = requestAnimationFrame(this.gameLoop)
  }
}