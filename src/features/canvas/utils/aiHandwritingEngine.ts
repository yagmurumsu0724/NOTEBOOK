import type { Point } from './PenEngine';
// removed HandwritingFont
import type { CanvasElement, Stroke } from '../../../store/useCanvasStore';

export interface BeautifiedStroke {
  points: Point[];
  type: 'vector' | 'text';
  text?: string;
}

export class LiveWordDetector {
  private currentWordStrokes: Stroke[] = [];
  private lastStrokeTime: number = 0;
  private detectionTimeout: number = 600; // ms to wait before classifying as a word

  addStroke(stroke: Stroke) {
    this.currentWordStrokes.push(stroke);
    this.lastStrokeTime = Date.now();
  }

  shouldProcess(): boolean {
    if (this.currentWordStrokes.length === 0) return false;
    return (Date.now() - this.lastStrokeTime) > this.detectionTimeout;
  }

  getAndClearStrokes(): Stroke[] {
    const strokes = [...this.currentWordStrokes];
    this.currentWordStrokes = [];
    return strokes;
  }
}

export class AIHandwritingEngine {
  private static smoothingFactor = 0.5;
  static detector = new LiveWordDetector();

  static setSmoothingStrength(strength: number) {
    this.smoothingFactor = Math.max(0, Math.min(1, strength));
  }

  static processStroke(rawPoints: Point[]): BeautifiedStroke {
    const beautifiedPoints = this.applyTremorReduction(rawPoints, this.smoothingFactor);
    return {
      points: beautifiedPoints,
      type: 'vector'
    };
  }

  /**
   * Simulates handwriting OCR by converting a group of strokes into a text element
   */
  static simulateOCR(strokes: Stroke[], fontId: string, color: string): CanvasElement {
    // 1. Calculate bounding box of all strokes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    strokes.forEach(stroke => {
      stroke.points.forEach((p: Point) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    // Handle empty or tiny strokes
    if (minX === Infinity || (maxX - minX) < 10) {
      minX = 100; minY = 100; maxX = 200; maxY = 150;
    }

    const width = maxX - minX;
    const height = maxY - minY;

    // Simulate OCR Confidence (Random between 80 and 100)
    const confidence = Math.floor(Math.random() * 21) + 80;
    
    // Determine fontSize based on stroke bounding box height
    const fontSize = Math.max(24, Math.floor(height * 0.8));

    // Mock words based on length or just randomly
    const mockWords = ["Merhaba", "AI Engine", "Harika", "Notlar", "Önemli", "Proje", "Yapay Zeka", "Kaligrafi"];
    const textContent = mockWords[Math.floor(Math.random() * mockWords.length)];

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: 'text',
      x: minX,
      y: minY,
      width,
      height,
      content: textContent,
      color: color,
      fontSize: fontSize,
      fontFamily: fontId,
      originalStrokes: strokes,
      confidenceScore: confidence,
      isConvertedText: true
    };
  }

  private static applyTremorReduction(points: Point[], factor: number): Point[] {
    if (points.length < 3) return points;
    const windowSize = Math.floor(factor * 10) + 1;
    const result: Point[] = [];

    for (let i = 0; i < points.length; i++) {
      let sumX = 0;
      let sumY = 0;
      let sumP = 0;
      let count = 0;

      for (let j = Math.max(0, i - windowSize); j <= Math.min(points.length - 1, i + windowSize); j++) {
        sumX += points[j].x;
        sumY += points[j].y;
        sumP += points[j].pressure || 0.5;
        count++;
      }

      result.push({
        x: sumX / count,
        y: sumY / count,
        pressure: points[i].pressure !== undefined ? (sumP / count) : undefined
      });
    }

    return result;
  }
}
