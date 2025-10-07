export interface PlayerControls {
  up: string
  down: string
  hit: string
}

export class Player {
  id: string
  team: 'A' | 'B'
  position: 'front' | 'back'
  x: number
  y: number
  color: string
  controls: PlayerControls
  velocityY: number = 0
  isActive: boolean = false
  isSwinging: boolean = false
  swingCooldown: number = 0
  swingAnimation: number = 0
  reach: number = 60
  speed: number = 5

  constructor(
    id: string,
    team: 'A' | 'B',
    position: 'front' | 'back',
    x: number,
    y: number,
    color: string,
    controls: PlayerControls
  ) {
    this.id = id
    this.team = team
    this.position = position
    this.x = x
    this.y = y
    this.color = color
    this.controls = controls
  }

  update(deltaTime: number) {
    // Update position
    this.y += this.velocityY
    this.y = Math.max(350, Math.min(540, this.y)) // Keep within bounds

    // Update swing cooldown
    if (this.swingCooldown > 0) {
      this.swingCooldown -= deltaTime
    }

    // Update swing animation
    if (this.swingAnimation > 0) {
      this.swingAnimation -= deltaTime
      if (this.swingAnimation <= 0) {
        this.isSwinging = false
      }
    }
  }

  moveUp() {
    this.velocityY = -this.speed
  }

  moveDown() {
    this.velocityY = this.speed
  }

  stopMoving() {
    this.velocityY = 0
  }

  canHit(ballX: number, ballY: number): boolean {
    const distance = Math.sqrt(
      Math.pow(this.x - ballX, 2) +
      Math.pow(this.y - ballY, 2)
    )
    return distance <= this.reach && this.swingCooldown <= 0
  }

  swing() {
    if (this.swingCooldown <= 0) {
      this.isSwinging = true
      this.swingAnimation = 300
      this.swingCooldown = 500 // Half second cooldown
      return true
    }
    return false
  }

  draw(ctx: CanvasRenderingContext2D, isServing: boolean = false) {
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.ellipse(this.x, 555, 10, 5, 0, 0, Math.PI * 2)
    ctx.fill()

    // Draw player body (stick figure)
    ctx.strokeStyle = this.color
    ctx.lineWidth = 4
    ctx.lineCap = 'round'

    // Body
    ctx.beginPath()
    ctx.moveTo(this.x, this.y - 30)
    ctx.lineTo(this.x, this.y)
    ctx.stroke()

    // Head
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y - 40, 8, 0, Math.PI * 2)
    ctx.fill()

    // Arms
    const armSpread = this.isSwinging ? 20 : 12
    const armAngle = this.isSwinging ? -0.5 : 0
    ctx.beginPath()
    ctx.moveTo(this.x - armSpread, this.y - 20 + armAngle * 10)
    ctx.lineTo(this.x, this.y - 20)
    ctx.lineTo(this.x + armSpread, this.y - 20 - armAngle * 10)
    ctx.stroke()

    // Legs
    ctx.beginPath()
    ctx.moveTo(this.x - 8, this.y + 20)
    ctx.lineTo(this.x, this.y)
    ctx.lineTo(this.x + 8, this.y + 20)
    ctx.stroke()

    // Racket
    const racketX = this.team === 'A' ? this.x + 15 : this.x - 15
    const racketY = this.y - 20
    const racketAngle = this.isSwinging ? (this.swingAnimation / 300) * Math.PI / 4 : 0

    ctx.save()
    ctx.translate(racketX, racketY)
    ctx.rotate(racketAngle)

    // Racket handle
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, 15)
    ctx.stroke()

    // Racket head
    ctx.strokeStyle = this.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Racket strings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 1
    for (let i = -6; i <= 6; i += 3) {
      ctx.beginPath()
      ctx.moveTo(i, -15)
      ctx.lineTo(i, 5)
      ctx.stroke()
    }
    for (let i = -10; i <= 0; i += 3) {
      ctx.beginPath()
      ctx.moveTo(-8, i)
      ctx.lineTo(8, i)
      ctx.stroke()
    }

    ctx.restore()

    // Player name and controls hint
    ctx.fillStyle = 'white'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(this.id, this.x, this.y - 55)

    // Control hints (smaller)
    ctx.font = '10px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    const controlText = `${this.controls.up}/${this.controls.down} ${this.controls.hit}`
    ctx.fillText(controlText, this.x, this.y - 68)

    // Active indicator
    if (this.isActive || isServing) {
      ctx.strokeStyle = isServing ? '#FFD700' : 'yellow'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(this.x, this.y - 10, this.reach, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Swing effect
    if (this.isSwinging && this.swingAnimation > 200) {
      ctx.strokeStyle = this.color
      ctx.lineWidth = 3
      ctx.globalAlpha = (this.swingAnimation - 200) / 100
      ctx.beginPath()
      const swingRadius = 40
      const startAngle = this.team === 'A' ? -Math.PI / 4 : Math.PI + Math.PI / 4
      const endAngle = this.team === 'A' ? Math.PI / 4 : Math.PI - Math.PI / 4
      ctx.arc(this.x, this.y - 20, swingRadius, startAngle, endAngle)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
}