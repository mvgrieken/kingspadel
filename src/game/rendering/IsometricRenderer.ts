export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export class IsometricRenderer {
  private static readonly ANGLE = Math.PI / 6; // 30 degrees
  private static readonly COS_ANGLE = Math.cos(IsometricRenderer.ANGLE);
  private static readonly SIN_ANGLE = Math.sin(IsometricRenderer.ANGLE);
  private static readonly SCALE = 30; // 1 meter = 30 pixels

  // Convert 3D world coordinates to 2D screen coordinates
  static project(point: Point3D): Point2D {
    const x = (point.x - point.z) * IsometricRenderer.COS_ANGLE * IsometricRenderer.SCALE;
    const y = (point.x + point.z) * IsometricRenderer.SIN_ANGLE * IsometricRenderer.SCALE - point.y * IsometricRenderer.SCALE;

    return { x, y };
  }

  // Convert screen coordinates back to world coordinates (useful for input)
  static unproject(screenPoint: Point2D, worldY: number = 0): Point3D {
    const x = screenPoint.x / IsometricRenderer.SCALE / IsometricRenderer.COS_ANGLE;
    const z = screenPoint.y / IsometricRenderer.SCALE / IsometricRenderer.SIN_ANGLE;

    // Solve for world coordinates
    const worldX = (x + z) / 2;
    const worldZ = (z - x) / 2;

    return { x: worldX, y: worldY, z: worldZ };
  }

  // Draw an isometric rectangle (for court surfaces, walls, etc.)
  static drawIsoRect(
    ctx: CanvasRenderingContext2D,
    position: Point3D,
    width: number,
    depth: number,
    height: number = 0,
    color: string = '#4CAF50'
  ): void {
    const corners = [
      { x: position.x, y: position.y + height, z: position.z },
      { x: position.x + width, y: position.y + height, z: position.z },
      { x: position.x + width, y: position.y + height, z: position.z + depth },
      { x: position.x, y: position.y + height, z: position.z + depth }
    ];

    const projectedCorners = corners.map(corner => this.project(corner));

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(projectedCorners[0].x, projectedCorners[0].y);
    projectedCorners.forEach(corner => ctx.lineTo(corner.x, corner.y));
    ctx.closePath();
    ctx.fill();

    // Draw border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw an isometric cube (for walls)
  static drawIsoCube(
    ctx: CanvasRenderingContext2D,
    position: Point3D,
    width: number,
    depth: number,
    height: number,
    color: string = '#87CEEB'
  ): void {

    // Bottom face
    this.drawIsoRect(ctx, position, width, depth, 0, color);

    // Front face
    const frontColor = this.darkenColor(color, 0.8);
    const frontCorners = [
      this.project({ x: position.x, y: position.y, z: position.z + depth }),
      this.project({ x: position.x + width, y: position.y, z: position.z + depth }),
      this.project({ x: position.x + width, y: position.y + height, z: position.z + depth }),
      this.project({ x: position.x, y: position.y + height, z: position.z + depth })
    ];

    ctx.fillStyle = frontColor;
    ctx.beginPath();
    ctx.moveTo(frontCorners[0].x, frontCorners[0].y);
    frontCorners.forEach(corner => ctx.lineTo(corner.x, corner.y));
    ctx.closePath();
    ctx.fill();

    // Right face
    const rightColor = this.darkenColor(color, 0.6);
    const rightCorners = [
      this.project({ x: position.x + width, y: position.y, z: position.z }),
      this.project({ x: position.x + width, y: position.y, z: position.z + depth }),
      this.project({ x: position.x + width, y: position.y + height, z: position.z + depth }),
      this.project({ x: position.x + width, y: position.y + height, z: position.z })
    ];

    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(rightCorners[0].x, rightCorners[0].y);
    rightCorners.forEach(corner => ctx.lineTo(corner.x, corner.y));
    ctx.closePath();
    ctx.fill();

    // Top face
    this.drawIsoRect(ctx, { x: position.x, y: position.y + height, z: position.z }, width, depth, 0, color);
  }

  // Draw an isometric line
  static drawIsoLine(
    ctx: CanvasRenderingContext2D,
    start: Point3D,
    end: Point3D,
    color: string = '#FFFFFF',
    width: number = 2
  ): void {
    const startProj = this.project(start);
    const endProj = this.project(end);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(startProj.x, startProj.y);
    ctx.lineTo(endProj.x, endProj.y);
    ctx.stroke();
  }

  // Draw an isometric circle (ellipse in 2D)
  static drawIsoCircle(
    ctx: CanvasRenderingContext2D,
    center: Point3D,
    radius: number,
    color: string = '#FFEB3B'
  ): void {
    const centerProj = this.project(center);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(
      centerProj.x,
      centerProj.y,
      radius * IsometricRenderer.COS_ANGLE * IsometricRenderer.SCALE,
      radius * IsometricRenderer.SIN_ANGLE * IsometricRenderer.SCALE,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Helper function to darken colors
  private static darkenColor(color: string, factor: number): string {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = Math.floor(parseInt(hex.slice(0, 2), 16) * factor);
      const g = Math.floor(parseInt(hex.slice(2, 4), 16) * factor);
      const b = Math.floor(parseInt(hex.slice(4, 6), 16) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  // Get depth for z-sorting
  static getDepth(point: Point3D): number {
    return point.x + point.z;
  }

  // Transform canvas to center the court
  static setupCanvas(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    ctx.save();
    // Translate to center and add offset for better viewing
    ctx.translate(canvasWidth / 2, canvasHeight / 4);
  }

  static restoreCanvas(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}