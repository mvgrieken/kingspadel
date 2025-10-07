import { IsometricRenderer, Point3D } from '../rendering/IsometricRenderer';
import { CourtDimensions } from '../types/3DTypes';

export class FIPCourt {
  private dimensions: CourtDimensions = {
    length: 20,
    width: 10,
    serviceLineDistance: 6.95,
    netHeight: {
      center: 0.88,
      sides: 0.92
    },
    backWallHeight: 4,
    sideWallHeight: {
      first2m: 3,
      after2m: 2
    }
  };

  private walls: Array<{
    position: Point3D;
    width: number;
    depth: number;
    height: number;
    type: 'back' | 'side' | 'glass';
  }> = [];

  constructor() {
    this.initializeWalls();
  }

  private initializeWalls(): void {
    // Back walls (4m high)
    this.walls.push(
      // Team A back wall
      {
        position: { x: -0.2, y: 0, z: -0.2 },
        width: 10.4,
        depth: 0.2,
        height: 4,
        type: 'back'
      },
      // Team B back wall
      {
        position: { x: -0.2, y: 0, z: 20 },
        width: 10.4,
        depth: 0.2,
        height: 4,
        type: 'back'
      }
    );

    // Side walls
    const sideWalls = [
      // Left side
      { x: -0.2, z: 0, isLeft: true },
      // Right side
      { x: 10, z: 0, isLeft: false }
    ];

    sideWalls.forEach(side => {
      // First 2m: 3m high
      this.walls.push({
        position: { x: side.x, y: 0, z: side.z },
        width: 0.2,
        depth: 2,
        height: 3,
        type: 'glass'
      });

      // After 2m: 2m high (bottom part)
      this.walls.push({
        position: { x: side.x, y: 0, z: side.z + 2 },
        width: 0.2,
        depth: 16,
        height: 2,
        type: 'glass'
      });

      // After 2m: mesh fence (1m high on top)
      this.walls.push({
        position: { x: side.x, y: 2, z: side.z + 2 },
        width: 0.2,
        depth: 16,
        height: 1,
        type: 'glass'
      });

      // Last 2m: 3m high
      this.walls.push({
        position: { x: side.x, y: 0, z: side.z + 18 },
        width: 0.2,
        depth: 2,
        height: 3,
        type: 'glass'
      });
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    IsometricRenderer.setupCanvas(ctx, ctx.canvas.width, ctx.canvas.height);

    // Draw court surface
    this.drawCourtSurface(ctx);

    // Draw court lines
    this.drawCourtLines(ctx);

    // Draw net
    this.drawNet(ctx);

    // Draw walls (sorted by depth for proper rendering)
    this.drawWalls(ctx);

    IsometricRenderer.restoreCanvas(ctx);
  }

  private drawCourtSurface(ctx: CanvasRenderingContext2D): void {
    // Main court surface (blue/green padel color)
    IsometricRenderer.drawIsoRect(
      ctx,
      { x: 0, y: 0, z: 0 },
      this.dimensions.width,
      this.dimensions.length,
      0,
      '#1e3a8a' // Dark blue court
    );

    // Service boxes (slightly different color)
    const serviceBoxes = [
      // Team A left service box
      { x: 0, z: 0 },
      // Team A right service box
      { x: 5, z: 0 },
      // Team B left service box
      { x: 0, z: this.dimensions.serviceLineDistance + 6.1 },
      // Team B right service box
      { x: 5, z: this.dimensions.serviceLineDistance + 6.1 }
    ];

    serviceBoxes.forEach(box => {
      IsometricRenderer.drawIsoRect(
        ctx,
        { x: box.x, y: 0.001, z: box.z }, // Slightly elevated to show on top
        5,
        this.dimensions.serviceLineDistance,
        0,
        'rgba(34, 197, 94, 0.1)' // Light green tint
      );
    });
  }

  private drawCourtLines(ctx: CanvasRenderingContext2D): void {
    const lineWidth = 0.05; // 5cm lines
    const lineHeight = 0.002; // Slightly elevated

    // Center line (divides court lengthwise)
    IsometricRenderer.drawIsoRect(
      ctx,
      { x: 5 - lineWidth/2, y: lineHeight, z: 0 },
      lineWidth,
      this.dimensions.length,
      0,
      '#FFFFFF'
    );

    // Service lines (6.95m from net on both sides)
    IsometricRenderer.drawIsoRect(
      ctx,
      { x: 0, y: lineHeight, z: this.dimensions.serviceLineDistance },
      this.dimensions.width,
      lineWidth,
      0,
      '#FFFFFF'
    );

    IsometricRenderer.drawIsoRect(
      ctx,
      { x: 0, y: lineHeight, z: this.dimensions.length - this.dimensions.serviceLineDistance },
      this.dimensions.width,
      lineWidth,
      0,
      '#FFFFFF'
    );

    // Service box center line (horizontal)
    IsometricRenderer.drawIsoRect(
      ctx,
      { x: 0, y: lineHeight, z: this.dimensions.length / 2 - lineWidth/2 },
      this.dimensions.width,
      lineWidth,
      0,
      '#FFFFFF'
    );

    // Outer boundary lines
    // Left boundary
    IsometricRenderer.drawIsoRect(
      ctx,
      { x: -lineWidth/2, y: lineHeight, z: 0 },
      lineWidth,
      this.dimensions.length,
      0,
      '#FFFFFF'
    );

    // Right boundary
    IsometricRenderer.drawIsoRect(
      ctx,
      { x: this.dimensions.width - lineWidth/2, y: lineHeight, z: 0 },
      lineWidth,
      this.dimensions.length,
      0,
      '#FFFFFF'
    );

    // Bottom boundary
    IsometricRenderer.drawIsoRect(
      ctx,
      { x: 0, y: lineHeight, z: -lineWidth/2 },
      this.dimensions.width,
      lineWidth,
      0,
      '#FFFFFF'
    );

    // Top boundary
    IsometricRenderer.drawIsoRect(
      ctx,
      { x: 0, y: lineHeight, z: this.dimensions.length - lineWidth/2 },
      this.dimensions.width,
      lineWidth,
      0,
      '#FFFFFF'
    );
  }

  private drawNet(ctx: CanvasRenderingContext2D): void {
    const netPosition = { x: 0, y: 0, z: this.dimensions.length / 2 };

    // Net posts
    IsometricRenderer.drawIsoCube(
      ctx,
      { x: -0.5, y: 0, z: netPosition.z - 0.05 },
      0.1,
      0.1,
      1.2,
      '#8D6E63'
    );

    IsometricRenderer.drawIsoCube(
      ctx,
      { x: this.dimensions.width + 0.4, y: 0, z: netPosition.z - 0.05 },
      0.1,
      0.1,
      1.2,
      '#8D6E63'
    );

    // Net (drawn as multiple horizontal lines for mesh effect)
    for (let i = 0; i <= 10; i++) {
      const height = (this.dimensions.netHeight.center / 10) * i;
      IsometricRenderer.drawIsoLine(
        ctx,
        { x: 0, y: height, z: netPosition.z },
        { x: this.dimensions.width, y: height, z: netPosition.z },
        'rgba(255, 255, 255, 0.8)',
        1
      );
    }

    // Vertical net lines
    for (let i = 0; i <= this.dimensions.width; i += 0.5) {
      IsometricRenderer.drawIsoLine(
        ctx,
        { x: i, y: 0, z: netPosition.z },
        { x: i, y: this.dimensions.netHeight.center, z: netPosition.z },
        'rgba(255, 255, 255, 0.6)',
        1
      );
    }
  }

  private drawWalls(ctx: CanvasRenderingContext2D): void {
    // Sort walls by depth for proper rendering
    const sortedWalls = this.walls.sort((a, b) =>
      IsometricRenderer.getDepth(a.position) - IsometricRenderer.getDepth(b.position)
    );

    sortedWalls.forEach(wall => {
      let color = '#87CEEB80'; // Glass color with transparency

      if (wall.type === 'back') {
        color = '#616161'; // Concrete back wall
      }

      IsometricRenderer.drawIsoCube(
        ctx,
        wall.position,
        wall.width,
        wall.depth,
        wall.height,
        color
      );

      // Add mesh pattern for fence sections
      if (wall.type === 'glass' && wall.position.y > 1.5) {
        this.drawMeshPattern(ctx, wall);
      }
    });
  }

  private drawMeshPattern(ctx: CanvasRenderingContext2D, wall: any): void {
    // Draw diamond mesh pattern on fence sections
    const meshSize = 0.2;
    const startX = wall.position.x;
    const startZ = wall.position.z;
    const endX = startX + wall.width;
    const endZ = startZ + wall.depth;
    const y = wall.position.y + wall.height / 2;

    for (let x = startX; x < endX; x += meshSize) {
      for (let z = startZ; z < endZ; z += meshSize) {
        IsometricRenderer.drawIsoLine(
          ctx,
          { x, y, z },
          { x: x + meshSize, y, z: z + meshSize },
          'rgba(255, 255, 255, 0.3)',
          1
        );
        IsometricRenderer.drawIsoLine(
          ctx,
          { x: x + meshSize, y, z },
          { x, y, z: z + meshSize },
          'rgba(255, 255, 255, 0.3)',
          1
        );
      }
    }
  }

  getWalls() {
    return this.walls;
  }

  getDimensions() {
    return this.dimensions;
  }

  isInBounds(position: Point3D): boolean {
    return position.x >= 0 && position.x <= this.dimensions.width &&
           position.z >= 0 && position.z <= this.dimensions.length;
  }

  getServiceBox(team: 'A' | 'B', side: 'left' | 'right'): {
    minX: number; maxX: number; minZ: number; maxZ: number;
  } {
    const boxWidth = this.dimensions.width / 2;
    const boxDepth = this.dimensions.serviceLineDistance;

    if (team === 'A') {
      return {
        minX: side === 'left' ? 0 : boxWidth,
        maxX: side === 'left' ? boxWidth : this.dimensions.width,
        minZ: 0,
        maxZ: boxDepth
      };
    } else {
      return {
        minX: side === 'left' ? 0 : boxWidth,
        maxX: side === 'left' ? boxWidth : this.dimensions.width,
        minZ: this.dimensions.length - boxDepth,
        maxZ: this.dimensions.length
      };
    }
  }
}