export class Notification {
  private message: string = ''
  private duration: number = 0
  private alpha: number = 1
  private scale: number = 1
  private color: string = 'white'

  show(message: string, duration: number = 2000, color: string = 'white') {
    this.message = message
    this.duration = duration
    this.alpha = 1
    this.scale = 1.2
    this.color = color
  }

  update(deltaTime: number) {
    if (this.duration > 0) {
      this.duration -= deltaTime

      // Fade out in last 500ms
      if (this.duration < 500) {
        this.alpha = this.duration / 500
      }

      // Scale animation
      if (this.scale > 1) {
        this.scale = Math.max(1, this.scale - deltaTime * 0.001)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.duration <= 0 || !this.message) return

    ctx.save()
    ctx.globalAlpha = this.alpha

    // Calculate text dimensions
    ctx.font = 'bold 48px Arial'
    const textWidth = ctx.measureText(this.message).width
    const boxWidth = textWidth + 80
    const boxHeight = 100
    const x = (1400 - boxWidth) / 2
    const y = 250

    // Background with scale
    ctx.translate(700, 300)
    ctx.scale(this.scale, this.scale)
    ctx.translate(-700, -300)

    // Draw background
    const gradient = ctx.createLinearGradient(x, y, x + boxWidth, y + boxHeight)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)')
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, boxWidth, boxHeight)

    // Border
    ctx.strokeStyle = this.color
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, boxWidth, boxHeight)

    // Text shadow
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Text
    ctx.fillStyle = this.color
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.message, 700, 300)

    ctx.restore()
  }

  isActive(): boolean {
    return this.duration > 0
  }

  clear() {
    this.duration = 0
    this.message = ''
  }
}