import React from 'react';
import type { Tool, ToolContext } from './Tool';
import { useCanvasStore } from '../../../../store/useCanvasStore';

const distToSegmentSquared = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
};

export class EraserTool implements Tool {
  onPointerDown(e: React.PointerEvent, worldPos: { x: number; y: number }, ctx: ToolContext): void {
    const type = useCanvasStore.getState().eraserType;
    const timestamp = Date.now();
    ctx.smoother.reset();

    if (type === 'stroke' || type === 'pixel') {
      ctx.activeStrokeRef.current = {
        id: `stroke_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        tool: 'eraser',
        points: type === 'pixel' ? [{ x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5, timestamp }] : [],
        brush: {
          size: ctx.currentSize,
          opacity: 1.0,
          flow: 1.0,
          color: 'transparent',
          smoothing: 0.5
        },
        boundingBox: { x: worldPos.x, y: worldPos.y, width: 0, height: 0 },
        createdAt: timestamp
      };
      
      if (ctx.canvasRef.current) {
        ctx.canvasRef.current.setPointerCapture(e.pointerId);
      }
    }
  }

  onPointerMove(e: React.PointerEvent, worldPos: { x: number; y: number }, ctx: ToolContext): void {
    if (!ctx.activeStrokeRef.current) return;
    const type = useCanvasStore.getState().eraserType;
    const timestamp = Date.now();

    if (type === 'pixel') {
      const filtered = ctx.smoother.filter(worldPos.x, worldPos.y);
      ctx.activeStrokeRef.current.points.push({
        x: filtered.x,
        y: filtered.y,
        pressure: e.pressure || 0.5,
        timestamp
      });
      ctx.needsRender.current = true;
    } else if (type === 'stroke') {
      const thresholdSq = Math.pow(ctx.currentSize * 2 + 5, 2);
      const strokes = ctx.strokesRef.current;
      const toDeleteIds: string[] = [];
      
      strokes.forEach((stroke) => {
        for (let i = 0; i < stroke.points.length - 1; i++) {
          if (distToSegmentSquared(worldPos, stroke.points[i], stroke.points[i+1]) < thresholdSq) {
            toDeleteIds.push(stroke.id);
            break;
          }
        }
      });

      if (toDeleteIds.length > 0) {
        useCanvasStore.getState().removeStrokes(ctx.notebookId, toDeleteIds);
        ctx.strokesRef.current = ctx.strokesRef.current.filter((s) => !toDeleteIds.includes(s.id));
        ctx.needsRender.current = true;
      }
    }
  }

  onPointerUp(_e: React.PointerEvent, _worldPos: { x: number; y: number }, ctx: ToolContext): void {
    const type = useCanvasStore.getState().eraserType;
    if (type === 'stroke') {
      ctx.activeStrokeRef.current = null;
      ctx.needsRender.current = true;
    }
  }
}
