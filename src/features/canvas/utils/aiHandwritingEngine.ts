import type { Point } from './PenEngine';
import type { CanvasElement, Stroke } from '../../../store/useCanvasStore';
import { getStroke } from 'perfect-freehand';
import Tesseract from 'tesseract.js';

export interface BeautifiedStroke {
  points: Point[];
  type: 'vector' | 'text';
  text?: string;
}

export class LiveWordDetector {
  private currentWordStrokes: Stroke[] = [];
  private lastStrokeTime: number = 0;
  private detectionTimeout: number = 1000; // 1 second to wait for user to finish a word/sentence

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
   * Performs real OCR using Tesseract.js
   */
  static async performOCR(strokes: Stroke[], fontId: string, color: string): Promise<CanvasElement> {
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

    // Add padding
    const PADDING = 20;
    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const width = Math.max(maxX - minX, 50);
    const height = Math.max(maxY - minY, 50);

    // 2. Rasterize strokes to a temporary canvas for OCR
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    
    if (ctx) {
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw strokes in solid black for best OCR results
      ctx.fillStyle = '#000000';
      
      strokes.forEach(stroke => {
        const localPoints = stroke.points.map(p => [p.x - minX, p.y - minY, p.pressure || 0.5]);
        const outline = getStroke(localPoints, {
          size: stroke.brush?.size || (stroke as any).size || 4,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.5,
        });

        if (outline.length > 0) {
          ctx.beginPath();
          ctx.moveTo(outline[0][0], outline[0][1]);
          for (let i = 1; i < outline.length; i++) {
            ctx.lineTo(outline[i][0], outline[i][1]);
          }
          ctx.fill();
        }
      });
    }

    const dataUrl = tempCanvas.toDataURL('image/png');

    // 3. Run Tesseract OCR (Turkish language)
    let textContent = "Metin anlaşılamadı...";
    let confidence = 50;

    try {
      const result = await Tesseract.recognize(dataUrl, 'tur', {
        logger: m => console.log(m)
      });
      textContent = result.data.text.trim();
      confidence = result.data.confidence;
    } catch (e) {
      console.error("OCR Error:", e);
    }

    if (!textContent) {
      textContent = "?";
    }

    const fontSize = Math.max(24, Math.floor((height - PADDING * 2) * 0.8));

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: 'text',
      x: minX + PADDING,
      y: minY + PADDING,
      width: width - PADDING * 2,
      height: height - PADDING * 2,
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
