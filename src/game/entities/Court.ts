export class Court {
  private width: number;
  private height: number;
  private wallThickness: number = 20;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getWalls(): Array<{ x: number; y: number; width: number; height: number; type: string }> {
    return [
      // Left wall
      { x: 0, y: 0, width: this.wallThickness, height: this.height, type: 'left' },
      // Right wall
      { x: this.width - this.wallThickness, y: 0, width: this.wallThickness, height: this.height, type: 'right' },
      // Top wall
      { x: 0, y: 0, width: this.width, height: this.wallThickness, type: 'top' },
      // Bottom wall
      { x: 0, y: this.height - this.wallThickness, width: this.width, height: this.wallThickness, type: 'bottom' }
    ];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Court background
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(this.wallThickness, this.wallThickness,
                 this.width - 2 * this.wallThickness,
                 this.height - 2 * this.wallThickness);

    // Draw walls with glass effect
    this.drawWalls(ctx);

    // Draw court lines
    this.drawCourtLines(ctx);

    // Draw net
    this.drawNet(ctx);
  }

  private drawWalls(ctx: CanvasRenderingContext2D): void {
    const walls = this.getWalls();

    walls.forEach(wall => {
      // Glass wall background
      const gradient = ctx.createLinearGradient(
        wall.x, wall.y,
        wall.x + wall.width, wall.y + wall.height
      );

      gradient.addColorStop(0, 'rgba(135, 206, 250, 0.1)');
      gradient.addColorStop(0.5, 'rgba(135, 206, 250, 0.25)');
      gradient.addColorStop(1, 'rgba(135, 206, 250, 0.1)');

      ctx.fillStyle = gradient;
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

      // Glass edge highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    });
  }

  private drawCourtLines(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    const startX = this.wallThickness;
    const startY = this.wallThickness;
    const courtWidth = this.width - 2 * this.wallThickness;
    const courtHeight = this.height - 2 * this.wallThickness;

    // Center line (vertical)
    ctx.beginPath();
    ctx.moveTo(startX + courtWidth / 2, startY);
    ctx.lineTo(startX + courtWidth / 2, startY + courtHeight);
    ctx.stroke();

    // Service line (horizontal center)
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(startX, startY + courtHeight / 2);
    ctx.lineTo(startX + courtWidth, startY + courtHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Service boxes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;

    // Left service boxes
    ctx.strokeRect(startX, startY, courtWidth / 2, courtHeight / 2);
    ctx.strokeRect(startX, startY + courtHeight / 2, courtWidth / 2, courtHeight / 2);

    // Right service boxes
    ctx.strokeRect(startX + courtWidth / 2, startY, courtWidth / 2, courtHeight / 2);
    ctx.strokeRect(startX + courtWidth / 2, startY + courtHeight / 2, courtWidth / 2, courtHeight / 2);
  }

  private drawNet(ctx: CanvasRenderingContext2D): void {
    const netX = this.width / 2 - 2;
    const netHeight = 50;
    const netY = this.height / 2 - netHeight / 2;

    // Net post
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(netX, netY, 4, netHeight);

    // Net mesh
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;

    for (let i = 0; i < netHeight; i += 5) {
      ctx.beginPath();
      ctx.moveTo(netX, netY + i);
      ctx.lineTo(netX + 4, netY + i);
      ctx.stroke();
    }
  }

  isInBounds(x: number, y: number): boolean {
    return x >= this.wallThickness &&
           x <= this.width - this.wallThickness &&
           y >= this.wallThickness &&
           y <= this.height - this.wallThickness;
  }

  getServiceBox(team: 'A' | 'B', side: 'left' | 'right'): { x: number; y: number; width: number; height: number } {
    const startX = this.wallThickness;
    const startY = this.wallThickness;
    const courtWidth = this.width - 2 * this.wallThickness;
    const courtHeight = this.height - 2 * this.wallThickness;

    const boxWidth = courtWidth / 2;
    const boxHeight = courtHeight / 2;

    if (team === 'A') {
      return {
        x: startX,
        y: side === 'left' ? startY : startY + boxHeight,
        width: boxWidth,
        height: boxHeight
      };
    } else {
      return {
        x: startX + boxWidth,
        y: side === 'left' ? startY : startY + boxHeight,
        width: boxWidth,
        height: boxHeight
      };
    }
  }
}