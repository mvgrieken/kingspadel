export class SideViewCourt {
  private width: number = 1400;
  private groundY: number = 550;
  private netX: number = 700; // Center of court

  // Court dimensions (in pixels)
  private dimensions = {
    courtWidth: 1200, // 20m
    wallHeight: 240, // 4m back walls
    sideWallHeight: 180, // 3m side walls first section
    netHeight: 53, // 0.88m at center
    serviceLineDistance: 417, // 6.95m from net
    wallThickness: 50
  };

  getGroundY(): number {
    return this.groundY;
  }

  getNetX(): number {
    return this.netX;
  }

  getNetHeight(): number {
    return this.dimensions.netHeight;
  }

  getWallHeight(x: number): number {
    // Back walls (4m high)
    if (x < this.dimensions.wallThickness || x > this.width - this.dimensions.wallThickness) {
      return this.dimensions.wallHeight;
    }

    // Side walls - first 2m sections (3m high)
    const distanceFromWall = Math.min(x - this.dimensions.wallThickness, this.width - this.dimensions.wallThickness - x);
    if (distanceFromWall < 120) { // First 2m = 120px
      return this.dimensions.sideWallHeight;
    }

    // Middle sections (2m high)
    return 120; // 2m
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Clear background
    this.drawBackground(ctx);

    // Draw court surface
    this.drawCourtSurface(ctx);

    // Draw court lines
    this.drawCourtLines(ctx);

    // Draw net
    this.drawNet(ctx);

    // Draw walls
    this.drawWalls(ctx);

    // Draw service boxes (when serving)
    this.drawServiceBoxes(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(1, '#E0F6FF'); // Light blue

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.groundY);
  }

  private drawCourtSurface(ctx: CanvasRenderingContext2D): void {
    // Court surface (artificial grass color)
    ctx.fillStyle = '#2d8659';
    ctx.fillRect(100, this.groundY, 1200, 150);

    // Add some texture lines for court surface
    ctx.strokeStyle = '#1e5f3a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const y = this.groundY + (i * 15);
      ctx.beginPath();
      ctx.moveTo(100, y);
      ctx.lineTo(1300, y);
      ctx.stroke();
    }

    // Court boundaries
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeRect(100, this.groundY, 1200, 0);
  }

  private drawCourtLines(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;

    // Service lines (6.95m from net on both sides)
    const leftServiceLine = this.netX - this.dimensions.serviceLineDistance;
    const rightServiceLine = this.netX + this.dimensions.serviceLineDistance;

    // Left service line
    ctx.beginPath();
    ctx.moveTo(leftServiceLine, this.groundY - 20);
    ctx.lineTo(leftServiceLine, this.groundY + 20);
    ctx.stroke();

    // Right service line
    ctx.beginPath();
    ctx.moveTo(rightServiceLine, this.groundY - 20);
    ctx.lineTo(rightServiceLine, this.groundY + 20);
    ctx.stroke();

    // Center service line (horizontal - not visible in side view but mark it)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(leftServiceLine, this.groundY - 10);
    ctx.lineTo(rightServiceLine, this.groundY - 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawNet(ctx: CanvasRenderingContext2D): void {
    // Net post
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(this.netX - 2, this.groundY - this.dimensions.netHeight - 20, 4, this.dimensions.netHeight + 20);

    // Net mesh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;

    // Horizontal net lines
    for (let i = 0; i <= this.dimensions.netHeight; i += 8) {
      ctx.beginPath();
      ctx.moveTo(this.netX - 1, this.groundY - i);
      ctx.lineTo(this.netX + 1, this.groundY - i);
      ctx.stroke();
    }

    // Net shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(this.netX + 2, this.groundY, 8, 10);
  }

  private drawWalls(ctx: CanvasRenderingContext2D): void {
    // Back walls (glass effect)
    this.drawGlassWall(ctx, 50, this.groundY - this.dimensions.wallHeight, 50, this.dimensions.wallHeight);
    this.drawGlassWall(ctx, 1300, this.groundY - this.dimensions.wallHeight, 50, this.dimensions.wallHeight);

    // Side walls - first sections (3m high)
    this.drawGlassWall(ctx, 100, this.groundY - this.dimensions.sideWallHeight, 120, this.dimensions.sideWallHeight);
    this.drawGlassWall(ctx, 1180, this.groundY - this.dimensions.sideWallHeight, 120, this.dimensions.sideWallHeight);

    // Side walls - middle sections (2m high)
    this.drawGlassWall(ctx, 220, this.groundY - 120, 960, 120);

    // Mesh fence on top of 2m sections
    this.drawMeshFence(ctx, 220, this.groundY - 180, 960, 60);
  }

  private drawGlassWall(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    // Glass wall with transparency
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, 'rgba(100, 150, 200, 0.15)');
    gradient.addColorStop(0.5, 'rgba(100, 150, 200, 0.25)');
    gradient.addColorStop(1, 'rgba(100, 150, 200, 0.15)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Glass border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Glass reflection effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x + 5, y + 5, width - 10, height * 0.3);
  }

  private drawMeshFence(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
    ctx.lineWidth = 1;

    const meshSize = 15;

    // Draw diamond mesh pattern
    for (let i = 0; i < width; i += meshSize) {
      for (let j = 0; j < height; j += meshSize) {
        ctx.beginPath();
        ctx.moveTo(x + i, y + j);
        ctx.lineTo(x + i + meshSize/2, y + j + meshSize/2);
        ctx.lineTo(x + i, y + j + meshSize);
        ctx.lineTo(x + i - meshSize/2, y + j + meshSize/2);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  private drawServiceBoxes(ctx: CanvasRenderingContext2D): void {
    // This will be called when serving to highlight service areas
    // Left service box
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.fillRect(100, this.groundY - 20, this.netX - 100, 20);

    // Right service box
    ctx.fillRect(this.netX, this.groundY - 20, 1200 - (this.netX - 100), 20);
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 100 && x <= 1300 && y >= this.groundY - 300;
  }

  checkWallCollision(x: number, y: number, radius: number = 4): string | null {
    const ballTop = y - radius;

    // Left back wall
    if (x - radius <= 100 && ballTop < this.groundY) {
      const wallHeight = this.getWallHeight(x);
      if (this.groundY - y < wallHeight) {
        return 'left_wall';
      }
    }

    // Right back wall
    if (x + radius >= 1300 && ballTop < this.groundY) {
      const wallHeight = this.getWallHeight(x);
      if (this.groundY - y < wallHeight) {
        return 'right_wall';
      }
    }

    return null;
  }

  checkNetCollision(x: number, y: number, radius: number = 4): boolean {
    return Math.abs(x - this.netX) < radius + 2 &&
           y >= this.groundY - this.dimensions.netHeight &&
           y <= this.groundY;
  }

  getServiceBox(team: 'A' | 'B'): { minX: number; maxX: number; minY: number; maxY: number } {
    if (team === 'A') {
      // Left service area
      return {
        minX: 100,
        maxX: this.netX - 20,
        minY: this.groundY - 20,
        maxY: this.groundY
      };
    } else {
      // Right service area
      return {
        minX: this.netX + 20,
        maxX: 1300,
        minY: this.groundY - 20,
        maxY: this.groundY
      };
    }
  }

  highlightServiceBox(ctx: CanvasRenderingContext2D, team: 'A' | 'B'): void {
    const box = this.getServiceBox(team);

    ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.fillRect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY);

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY);
    ctx.setLineDash([]);
  }
}