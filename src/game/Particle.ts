export class Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number

  constructor(x: number, y: number, vx: number, vy: number, color: string = '#FFD700') {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.life = 1
    this.color = color
    this.size = Math.random() * 4 + 2
  }

  update(deltaTime: number) {
    this.x += this.vx * (deltaTime / 16)
    this.y += this.vy * (deltaTime / 16)
    this.vy += 0.3 // Gravity
    this.life -= deltaTime / 1000

    // Slow down
    this.vx *= 0.98
    this.vy *= 0.98
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.life <= 0) return

    ctx.save()
    ctx.globalAlpha = Math.max(0, this.life)
    ctx.fillStyle = this.color
    ctx.shadowBlur = 10
    ctx.shadowColor = this.color

    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}