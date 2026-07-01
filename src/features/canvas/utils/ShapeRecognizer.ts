import type { Point } from './PenEngine';

export type ShapeType = 'line' | 'rectangle' | 'circle' | 'triangle' | 'unknown';

export interface RecognizedShape {
  type: ShapeType;
  path: Point[];
  score: number;
}

export class ShapeRecognizer {
  /**
   * Recognizes a drawn stroke and converts it into a perfect geometric shape.
   * If the shape is unrecognized or too messy, returns 'unknown'.
   */
  static recognize(points: Point[]): RecognizedShape {
    if (points.length < 5) return { type: 'unknown', path: points, score: 0 };

    const { minX, minY, maxX, maxY } = this.getBoundingBox(points);
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Very small strokes shouldn't be auto-shaped
    if (width < 20 && height < 20) return { type: 'unknown', path: points, score: 0 };

    const startP = points[0];
    const endP = points[points.length - 1];
    
    // 1. Line detection
    // If the bounding box is very thin, or start and end are far apart and intermediate points are close to a line
    if (this.isLine(points, startP, endP)) {
      return {
        type: 'line',
        path: [startP, endP],
        score: 0.9
      };
    }

    // Is it a closed shape? (start and end points are close together)
    const distanceStartEnd = this.distance(startP, endP);
    const diagonal = Math.sqrt(width * width + height * height);
    const isClosed = distanceStartEnd < diagonal * 0.2;

    if (isClosed) {
      // 2. Circle detection
      // A circle's bounding box is roughly square, and all points are roughly equidistant from the center
      const centerX = minX + width / 2;
      const centerY = minY + height / 2;
      const radius = (width + height) / 4;
      
      if (this.isCircle(points, centerX, centerY, radius)) {
        return {
          type: 'circle',
          path: this.generateCircle(centerX, centerY, radius),
          score: 0.85
        };
      }

      // 3. Rectangle detection
      if (this.isRectangle(points, minX, minY, maxX, maxY)) {
        return {
          type: 'rectangle',
          path: [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY },
            { x: minX, y: minY } // close the loop
          ],
          score: 0.85
        };
      }
      
      // 4. Triangle detection (rough estimation based on extreme points)
      // This is a placeholder for a more complex convex hull / corner detection
      const corners = this.findCorners(points);
      if (corners.length === 3) {
        return {
          type: 'triangle',
          path: [...corners, corners[0]],
          score: 0.8
        };
      }
    }

    return { type: 'unknown', path: points, score: 0 };
  }

  private static getBoundingBox(points: Point[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }

  private static distance(p1: Point, p2: Point) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  private static isLine(points: Point[], start: Point, end: Point): boolean {
    const totalDist = this.distance(start, end);
    if (totalDist === 0) return false;
    
    // Check if points deviate significantly from the straight line
    let maxDev = 0;
    for (const p of points) {
      const num = Math.abs((end.y - start.y) * p.x - (end.x - start.x) * p.y + end.x * start.y - end.y * start.x);
      const dev = num / totalDist;
      if (dev > maxDev) maxDev = dev;
    }
    return maxDev < totalDist * 0.1; // 10% tolerance
  }

  private static isCircle(points: Point[], cx: number, cy: number, r: number): boolean {
    let maxDev = 0;
    for (const p of points) {
      const d = this.distance(p, { x: cx, y: cy });
      const dev = Math.abs(d - r);
      if (dev > maxDev) maxDev = dev;
    }
    return maxDev < r * 0.25; // 25% tolerance
  }

  private static isRectangle(points: Point[], minX: number, minY: number, maxX: number, maxY: number): boolean {
    // If it's closed and NOT a circle, we check if points are mostly on the edges of the bounding box
    const w = maxX - minX;
    const h = maxY - minY;
    
    let outOfBoundsCount = 0;
    for (const p of points) {
      const distToLeft = Math.abs(p.x - minX);
      const distToRight = Math.abs(p.x - maxX);
      const distToTop = Math.abs(p.y - minY);
      const distToBottom = Math.abs(p.y - maxY);
      
      const minDev = Math.min(distToLeft, distToRight, distToTop, distToBottom);
      if (minDev > Math.max(w, h) * 0.15) {
        outOfBoundsCount++;
      }
    }
    return outOfBoundsCount < points.length * 0.1;
  }

  private static findCorners(points: Point[]): Point[] {
    // Highly simplified corner detection for triangle heuristic
    const { minY, maxY } = this.getBoundingBox(points);
    // Find points closest to top, bottom-left, bottom-right (assuming triangle points up)
    let top = points[0], bl = points[0], br = points[0];
    for (const p of points) {
      if (p.y < top.y) top = p;
      if (p.x < bl.x && p.y > minY + (maxY - minY) / 2) bl = p;
      if (p.x > br.x && p.y > minY + (maxY - minY) / 2) br = p;
    }
    
    // This is naive, a real app would use Douglas-Peucker algorithm
    return [top, br, bl];
  }

  private static generateCircle(cx: number, cy: number, r: number): Point[] {
    const circlePoints: Point[] = [];
    const segments = 36;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      circlePoints.push({
        x: cx + r * Math.cos(theta),
        y: cy + r * Math.sin(theta)
      });
    }
    return circlePoints;
  }
}
