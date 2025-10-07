export interface GameEvent {
  type: 'POINT' | 'FAULT' | 'OUT' | 'NET' | 'WALL_BOUNCE' | 'DOUBLE_BOUNCE'
  reason?: string
  winner?: 'A' | 'B'
}

export class Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number = 8
  gravity: number = 0.6

  // Rally tracking - CRITICAL FOR RULES
  groundBounces: number = 0
  hasBouncedGroundThisSide: boolean = false
  currentSide: 'left' | 'right'
  hitWallBeforeGround: boolean = false
  isInPlay: boolean = false

  // Trail for visual effect
  trail: Array<{x: number, y: number, alpha: number}> = []

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.currentSide = x < 700 ? 'left' : 'right'
  }

  update(): GameEvent | null {
    if (!this.isInPlay) return null

    // Update trail
    this.trail.push({x: this.x, y: this.y, alpha: 1})
    if (this.trail.length > 10) {
      this.trail.shift()
    }
    this.trail.forEach(t => t.alpha *= 0.95)

    // Update position
    this.x += this.vx
    this.y += this.vy
    this.vy += this.gravity

    // Apply air resistance
    this.vx *= 0.995
    this.vy *= 0.995

    // Check side switching (over net)
    const newSide = this.x < 700 ? 'left' : 'right'
    if (newSide !== this.currentSide) {
      this.currentSide = newSide
      this.groundBounces = 0
      this.hasBouncedGroundThisSide = false
      this.hitWallBeforeGround = false
    }

    // GROUND COLLISION - Most important rule
    if (this.y >= 550 - this.radius) {
      this.y = 550 - this.radius
      this.vy = -this.vy * 0.75 // Bounce with energy loss
      this.groundBounces++
      this.hasBouncedGroundThisSide = true

      // RULE: Ball can only bounce once per side
      if (this.groundBounces > 1) {
        const winner = this.x < 700 ? 'B' : 'A'
        this.isInPlay = false
        return {
          type: 'DOUBLE_BOUNCE',
          reason: 'Ball bounced twice on same side',
          winner
        }
      }
    }

    // WALL COLLISION
    const wallCheck = this.checkWallCollision()
    if (wallCheck) {
      // RULE: Ball cannot hit wall before ground
      if (!this.hasBouncedGroundThisSide) {
        this.hitWallBeforeGround = true
        const winner = this.x < 700 ? 'B' : 'A'
        this.isInPlay = false
        return {
          type: 'FAULT',
          reason: 'Ball hit wall before ground - NOT ALLOWED',
          winner
        }
      }

      // Ball bounces off wall (valid after ground bounce)
      if (wallCheck === 'left') {
        this.x = 100 + this.radius
        this.vx = Math.abs(this.vx) * 0.85
      } else if (wallCheck === 'right') {
        this.x = 1300 - this.radius
        this.vx = -Math.abs(this.vx) * 0.85
      }

      return { type: 'WALL_BOUNCE' }
    }

    // NET COLLISION
    if (Math.abs(this.x - 700) < this.radius + 2) {
      if (this.y > 497 && this.y < 550) {
        // Ball hit net
        const winner = this.x < 700 ? 'B' : 'A'
        this.isInPlay = false
        return {
          type: 'NET',
          reason: 'Ball hit the net',
          winner
        }
      }
    }

    // OUT OF BOUNDS
    if (this.x < 50 || this.x > 1350 || this.y < -100) {
      const winner = this.x < 700 ? 'B' : 'A'
      this.isInPlay = false
      return {
        type: 'OUT',
        reason: 'Ball went out of bounds',
        winner
      }
    }

    return null
  }

  checkWallCollision(): 'left' | 'right' | null {
    // Back walls
    if (this.x - this.radius < 100) return 'left'
    if (this.x + this.radius > 1300) return 'right'

    // Side walls are partial, check height
    const wallHeight = this.getWallHeightAtPosition()
    if (wallHeight > 0 && this.y < 550 - wallHeight) {
      if (this.x < 290) return 'left'
      if (this.x > 1110) return 'right'
    }

    return null
  }

  getWallHeightAtPosition(): number {
    // Back walls: 4m high
    if (this.x < 100) return 240
    if (this.x > 1300) return 240

    // Side walls sections
    if (this.x < 170) return 180 // 3m section
    if (this.x < 290) return 120 // 2m section
    if (this.x > 1230) return 180 // 3m section
    if (this.x > 1110) return 120 // 2m section

    return 0 // No wall
  }

  serve(fromX: number, fromY: number, targetX: number, targetY: number, power: number = 12) {
    this.reset(fromX, fromY)
    const dx = targetX - fromX
    const dy = targetY - fromY
    const dist = Math.sqrt(dx * dx + dy * dy)

    this.vx = (dx / dist) * power
    this.vy = (dy / dist) * power - 5 // Add upward arc
    this.isInPlay = true
  }

  hit(fromX: number, fromY: number, targetX: number, targetY: number, power: number = 10) {
    const dx = targetX - fromX
    const dy = targetY - fromY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0) {
      this.vx = (dx / dist) * power
      this.vy = (dy / dist) * power

      // Reset ground bounces when hit by player
      this.groundBounces = 0
      this.hasBouncedGroundThisSide = false
      this.hitWallBeforeGround = false
    }
  }

  reset(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.groundBounces = 0
    this.hasBouncedGroundThisSide = false
    this.hitWallBeforeGround = false
    this.currentSide = x < 700 ? 'left' : 'right'
    this.isInPlay = false
    this.trail = []
  }

  toss() {
    // Service toss - ball goes up
    this.vy = -15
    this.vx = 0
    this.isInPlay = true
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw trail
    this.trail.forEach(t => {
      ctx.fillStyle = `rgba(255, 215, 0, ${t.alpha * 0.3})`
      ctx.beginPath()
      ctx.arc(t.x, t.y, this.radius * 0.8, 0, Math.PI * 2)
      ctx.fill()
    })

    // Shadow (based on height from ground)
    const shadowY = 550
    const heightFromGround = shadowY - this.y
    const shadowSize = Math.max(4, Math.min(12, 12 - heightFromGround / 50))
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.ellipse(this.x, shadowY + 5, shadowSize, shadowSize * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Ball
    const gradient = ctx.createRadialGradient(
      this.x - 2, this.y - 2, 0,
      this.x, this.y, this.radius
    )
    gradient.addColorStop(0, '#FFEB3B')
    gradient.addColorStop(0.7, '#FFD700')
    gradient.addColorStop(1, '#FFA500')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(this.x - 2, this.y - 2, this.radius * 0.3, 0, Math.PI * 2)
    ctx.fill()

    // Speed lines when moving fast
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    if (speed > 8 && this.isInPlay) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(this.x - this.vx * 2, this.y - this.vy * 2)
      ctx.lineTo(this.x - this.vx * 0.5, this.y - this.vy * 0.5)
      ctx.stroke()
    }
  }
}