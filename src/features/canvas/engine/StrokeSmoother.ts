import type { StrokePoint } from '../../../store/useCanvasStore';

export class StrokeSmoother {
  // Kalman Filter State
  private lastX = 0;
  private lastY = 0;
  private p = 1.0; // estimation error covariance
  private q = 0.125; // process noise covariance
  private r = 2.0; // measurement noise covariance

  constructor(q = 0.125, r = 2.0) {
    this.q = q;
    this.r = r;
  }

  reset() {
    this.p = 1.0;
    this.lastX = 0;
    this.lastY = 0;
  }

  // Kalman filter step
  filter(x: number, y: number): { x: number, y: number } {
    if (this.lastX === 0 && this.lastY === 0) {
      this.lastX = x;
      this.lastY = y;
      return { x, y };
    }

    // Prediction update
    this.p = this.p + this.q;

    // Measurement update
    const k = this.p / (this.p + this.r); // Kalman gain
    this.lastX = this.lastX + k * (x - this.lastX);
    this.lastY = this.lastY + k * (y - this.lastY);
    this.p = (1 - k) * this.p;

    return { x: this.lastX, y: this.lastY };
  }

  /**
   * Douglas-Peucker point reduction algorithm for path optimization
   */
  static optimizePoints(points: StrokePoint[], epsilon: number): StrokePoint[] {
    if (points.length <= 2) return points;

    let dmax = 0;
    let index = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
      const d = this.perpendicularDistance(points[i], points[0], points[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }

    if (dmax > epsilon) {
      const recResults1 = this.optimizePoints(points.slice(0, index + 1), epsilon);
      const recResults2 = this.optimizePoints(points.slice(index), epsilon);
      return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
    } else {
      return [points[0], points[end]];
    }
  }

  private static perpendicularDistance(p: StrokePoint, lineStart: StrokePoint, lineEnd: StrokePoint): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const denominator = Math.sqrt(dx * dx + dy * dy);

    if (denominator === 0) {
      return Math.sqrt((p.x - lineStart.x) ** 2 + (p.y - lineStart.y) ** 2);
    }

    return Math.abs(dy * p.x - dx * p.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / denominator;
  }

  /**
   * Calculate velocity and apply velocity-based width/pressure simulation
   */
  static calculatePressureAndVelocity(
    points: StrokePoint[],
    index: number
  ): { pressure: number; velocity: number } {
    if (index === 0) return { pressure: 0.5, velocity: 0 };
    const p1 = points[index - 1];
    const p2 = points[index];
    const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const time = Math.max(1, p2.timestamp - p1.timestamp);
    const velocity = dist / time;

    // Apply standard pressure scaling (higher velocity -> thinner line, simulating Apple Notes fountain pen feel)
    // We scale the simulated pressure from 0.15 to 1.0 based on velocity
    const maxVelocity = 4.0; // px per millisecond
    const velocityFactor = Math.min(1.0, velocity / maxVelocity);
    const simulatedPressure = 1.0 - velocityFactor * 0.7; // faster -> thinner

    // Blend stylus pressure and simulated velocity-based pressure if stylus is used
    const stylusWeight = p2.pressure > 0.05 && p2.pressure < 0.95 ? 0.7 : 0.0;
    const finalPressure = p2.pressure * stylusWeight + simulatedPressure * (1 - stylusWeight);

    return { pressure: finalPressure, velocity };
  }
}
