export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export class PenEngine {
  /**
   * Applies Chaikin's corner cutting algorithm to smooth out a line.
   * Higher iterations = smoother line.
   */
  static smoothPoints(points: Point[], iterations: number = 2): Point[] {
    if (points.length <= 2) return points;

    let smoothed = [...points];

    for (let i = 0; i < iterations; i++) {
      const current = smoothed;
      smoothed = [current[0]];

      for (let j = 0; j < current.length - 1; j++) {
        const p0 = current[j];
        const p1 = current[j + 1];

        const p0x = p0.x + (p1.x - p0.x) * 0.25;
        const p0y = p0.y + (p1.y - p0.y) * 0.25;
        const p0p = p0.pressure !== undefined && p1.pressure !== undefined
          ? p0.pressure + (p1.pressure - p0.pressure) * 0.25
          : undefined;

        const p1x = p0.x + (p1.x - p0.x) * 0.75;
        const p1y = p0.y + (p1.y - p0.y) * 0.75;
        const p1p = p0.pressure !== undefined && p1.pressure !== undefined
          ? p0.pressure + (p1.pressure - p0.pressure) * 0.75
          : undefined;

        smoothed.push(
          { x: p0x, y: p0y, pressure: p0p },
          { x: p1x, y: p1y, pressure: p1p }
        );
      }
      smoothed.push(current[current.length - 1]);
    }

    return smoothed;
  }

  /**
   * Calculates the stroke width based on the pen speed and pressure.
   */
  static calculateWidth(
    baseWidth: number, 
    pressure: number = 0.5, 
    velocity: number = 0
  ): number {
    // Basic implementation of pressure sensitivity
    // A pressure of 1.0 means max width (e.g. 1.5x base), 0.0 means min width (e.g. 0.5x base)
    const pressureMultiplier = 0.5 + (pressure * 1.0); 
    
    // Decrease width slightly if velocity is high (simulating real ink flow)
    const velocityMultiplier = Math.max(0.5, 1 - (velocity * 0.05));
    
    return baseWidth * pressureMultiplier * velocityMultiplier;
  }
}
