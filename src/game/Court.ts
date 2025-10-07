export class Court {
  private width = 1400
  private height = 700
  private groundY = 550
  private netX = 700

  // Court dimensions in pixels (1m = 60px)
  private serviceLineLeft = 283  // 6.95m from net
  private serviceLineRight = 1117 // 6.95m from net

  draw(ctx: CanvasRenderingContext2D, highlightServiceSide?: 'left' | 'right') {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.groundY)
    skyGradient.addColorStop(0, '#87CEEB')
    skyGradient.addColorStop(0.7, '#B0E0E6')
    skyGradient.addColorStop(1, '#E0F6FF')
    ctx.fillStyle = skyGradient
    ctx.fillRect(0, 0, this.width, this.groundY)

    // Court surface (artificial grass)
    const courtGradient = ctx.createLinearGradient(0, this.groundY, 0, this.height)
    courtGradient.addColorStop(0, '#2d8659')
    courtGradient.addColorStop(1, '#1e5f3a')
    ctx.fillStyle = courtGradient
    ctx.fillRect(0, this.groundY, this.width, 150)

    // Court texture lines
    ctx.strokeStyle = 'rgba(30, 95, 58, 0.3)'
    ctx.lineWidth = 1
    for (let i = 0; i < 10; i++) {
      const y = this.groundY + (i * 15)
      ctx.beginPath()
      ctx.moveTo(100, y)
      ctx.lineTo(1300, y)
      ctx.stroke()
    }

    // Draw court lines
    this.drawCourtLines(ctx)

    // Draw walls
    this.drawWalls(ctx)

    // Draw net
    this.drawNet(ctx)

    // Highlight service box if needed
    if (highlightServiceSide) {
      this.highlightServiceBox(ctx, highlightServiceSide)
    }
  }

  private drawCourtLines(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3

    // Baseline
    ctx.beginPath()
    ctx.moveTo(100, this.groundY)
    ctx.lineTo(1300, this.groundY)
    ctx.stroke()

    // Service lines (vertical indicators)
    ctx.lineWidth = 3

    // Left service line
    ctx.beginPath()
    ctx.moveTo(this.serviceLineLeft, this.groundY - 25)
    ctx.lineTo(this.serviceLineLeft, this.groundY + 25)
    ctx.stroke()

    // Right service line
    ctx.beginPath()
    ctx.moveTo(this.serviceLineRight, this.groundY - 25)
    ctx.lineTo(this.serviceLineRight, this.groundY + 25)
    ctx.stroke()

    // Center service line (divides service boxes)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 5])

    // Left service box center line
    ctx.beginPath()
    ctx.moveTo(this.serviceLineLeft, this.groundY - 10)
    ctx.lineTo(this.netX, this.groundY - 10)
    ctx.stroke()

    // Right service box center line
    ctx.beginPath()
    ctx.moveTo(this.netX, this.groundY - 10)
    ctx.lineTo(this.serviceLineRight, this.groundY - 10)
    ctx.stroke()

    ctx.setLineDash([])

    // Service box markers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('SERVICE', (this.serviceLineLeft + this.netX) / 2, this.groundY - 30)
    ctx.fillText('SERVICE', (this.serviceLineRight + this.netX) / 2, this.groundY - 30)
  }

  private drawWalls(ctx: CanvasRenderingContext2D) {
    // Glass effect gradient
    const createGlassGradient = (x: number, y: number, w: number, h: number) => {
      const gradient = ctx.createLinearGradient(x, y, x + w, y + h)
      gradient.addColorStop(0, 'rgba(150, 200, 255, 0.15)')
      gradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.25)')
      gradient.addColorStop(1, 'rgba(150, 200, 255, 0.15)')
      return gradient
    }

    // Back walls (4m high)
    // Left back wall
    ctx.fillStyle = createGlassGradient(50, 310, 50, 240)
    ctx.fillRect(50, 310, 50, 240)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(50, 310, 50, 240)

    // Right back wall
    ctx.fillStyle = createGlassGradient(1300, 310, 50, 240)
    ctx.fillRect(1300, 310, 50, 240)
    ctx.strokeRect(1300, 310, 50, 240)

    // Side walls - front sections (3m high)
    // Left front
    ctx.fillStyle = createGlassGradient(100, 370, 70, 180)
    ctx.fillRect(100, 370, 70, 180)
    ctx.strokeRect(100, 370, 70, 180)

    // Right front
    ctx.fillStyle = createGlassGradient(1230, 370, 70, 180)
    ctx.fillRect(1230, 370, 70, 180)
    ctx.strokeRect(1230, 370, 70, 180)

    // Side walls - back sections (2m high)
    // Left back
    ctx.fillStyle = createGlassGradient(170, 430, 120, 120)
    ctx.fillRect(170, 430, 120, 120)
    ctx.strokeRect(170, 430, 120, 120)

    // Right back
    ctx.fillStyle = createGlassGradient(1110, 430, 120, 120)
    ctx.fillRect(1110, 430, 120, 120)
    ctx.strokeRect(1110, 430, 120, 120)

    // Glass reflection effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(55, 315, 40, 80)
    ctx.fillRect(1305, 315, 40, 80)
    ctx.fillRect(105, 375, 60, 60)
    ctx.fillRect(1235, 375, 60, 60)

    // Mesh fence on top of 2m sections
    this.drawMeshFence(ctx, 290, 370, 820, 60)
  }

  private drawMeshFence(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.4)'
    ctx.lineWidth = 1

    // Diamond mesh pattern
    const meshSize = 20
    for (let i = 0; i < width; i += meshSize) {
      for (let j = 0; j < height; j += meshSize) {
        ctx.beginPath()
        ctx.moveTo(x + i, y + j)
        ctx.lineTo(x + i + meshSize/2, y + j + meshSize/2)
        ctx.lineTo(x + i, y + j + meshSize)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(x + i + meshSize, y + j)
        ctx.lineTo(x + i + meshSize/2, y + j + meshSize/2)
        ctx.lineTo(x + i + meshSize, y + j + meshSize)
        ctx.stroke()
      }
    }
  }

  private drawNet(ctx: CanvasRenderingContext2D) {
    // Net post
    const gradient = ctx.createLinearGradient(this.netX - 3, 497, this.netX + 3, 550)
    gradient.addColorStop(0, '#606060')
    gradient.addColorStop(1, '#303030')
    ctx.fillStyle = gradient
    ctx.fillRect(this.netX - 3, 497, 6, 53)

    // Net mesh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = -2; x <= 2; x += 2) {
      ctx.beginPath()
      ctx.moveTo(this.netX + x, 497)
      ctx.lineTo(this.netX + x, 550)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 497; y <= 550; y += 8) {
      ctx.beginPath()
      ctx.moveTo(this.netX - 3, y)
      ctx.lineTo(this.netX + 3, y)
      ctx.stroke()
    }

    // Net top tape
    ctx.fillStyle = 'white'
    ctx.fillRect(this.netX - 3, 497, 6, 3)

    // Net shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.fillRect(this.netX + 3, this.groundY, 10, 8)
  }

  private highlightServiceBox(ctx: CanvasRenderingContext2D, side: 'left' | 'right') {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.15)'
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'
    ctx.lineWidth = 3
    ctx.setLineDash([10, 5])

    if (side === 'left') {
      // Left service box
      ctx.fillRect(this.serviceLineLeft, 450, this.netX - this.serviceLineLeft, 100)
      ctx.strokeRect(this.serviceLineLeft, 450, this.netX - this.serviceLineLeft, 100)
    } else {
      // Right service box
      ctx.fillRect(this.netX, 450, this.serviceLineRight - this.netX, 100)
      ctx.strokeRect(this.netX, 450, this.serviceLineRight - this.netX, 100)
    }

    ctx.setLineDash([])

    // Service box label
    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    const centerX = side === 'left'
      ? (this.serviceLineLeft + this.netX) / 2
      : (this.netX + this.serviceLineRight) / 2
    ctx.fillText('TARGET SERVICE AREA', centerX, 480)
  }

  checkNetCollision(ballX: number, ballY: number, ballRadius: number): boolean {
    return Math.abs(ballX - this.netX) < ballRadius + 3 &&
           ballY > 497 && ballY < 550
  }

  isInServiceBox(x: number, y: number, side: 'left' | 'right'): boolean {
    if (side === 'left') {
      return x >= this.serviceLineLeft && x <= this.netX && y >= 540 && y <= 560
    } else {
      return x >= this.netX && x <= this.serviceLineRight && y >= 540 && y <= 560
    }
  }

  getGroundY(): number {
    return this.groundY
  }
}