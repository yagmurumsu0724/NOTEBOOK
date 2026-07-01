import React from 'react';
import type { Tool, ToolContext } from './Tool';
import { useCanvasStore } from '../../../../store/useCanvasStore';

const pointInPolygon = (point: {x: number, y: number}, vs: {x: number, y: number}[]) => {
  let x = point.x, y = point.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x, yi = vs[i].y;
    let xj = vs[j].x, yj = vs[j].y;
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export class LassoTool implements Tool {
  onPointerDown(e: React.PointerEvent, worldPos: { x: number; y: number }, ctx: ToolContext): void {
    const timestamp = Date.now();
    ctx.smoother.reset();

    ctx.activeStrokeRef.current = {
      id: `stroke_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      tool: 'eraser', // lasso eraser acts like eraser
      points: [{ x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5, timestamp }],
      brush: {
        size: 2,
        opacity: 1.0,
        flow: 1.0,
        color: '#3b82f6',
        smoothing: 0.5
      },
      boundingBox: { x: worldPos.x, y: worldPos.y, width: 0, height: 0 },
      createdAt: timestamp
    };

    if (ctx.canvasRef.current) {
      ctx.canvasRef.current.setPointerCapture(e.pointerId);
    }
  }

  onPointerMove(e: React.PointerEvent, worldPos: { x: number; y: number }, ctx: ToolContext): void {
    if (!ctx.activeStrokeRef.current) return;
    const timestamp = Date.now();
    const filtered = ctx.smoother.filter(worldPos.x, worldPos.y);

    ctx.activeStrokeRef.current.points.push({
      x: filtered.x,
      y: filtered.y,
      pressure: e.pressure || 0.5,
      timestamp
    });

    const bbox = ctx.activeStrokeRef.current.boundingBox;
    const minX = bbox.width === 0 && bbox.height === 0 ? filtered.x : Math.min(bbox.x, filtered.x);
    const minY = bbox.width === 0 && bbox.height === 0 ? filtered.y : Math.min(bbox.y, filtered.y);
    const maxX = bbox.width === 0 && bbox.height === 0 ? filtered.x : Math.max(bbox.x + bbox.width, filtered.x);
    const maxY = bbox.width === 0 && bbox.height === 0 ? filtered.y : Math.max(bbox.y + bbox.height, filtered.y);
    ctx.activeStrokeRef.current.boundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    ctx.needsRender.current = true;
  }

  onPointerUp(_e: React.PointerEvent, _worldPos: { x: number; y: number }, ctx: ToolContext): void {
    if (!ctx.activeStrokeRef.current) return;

    const polygon = ctx.activeStrokeRef.current.points;
    const strokes = ctx.strokesRef.current;
    const toDeleteIds: string[] = [];

    strokes.forEach((s) => {
      if (s.points.some(p => pointInPolygon(p, polygon))) {
        toDeleteIds.push(s.id);
      }
    });

    if (toDeleteIds.length > 0) {
      useCanvasStore.getState().removeStrokes(ctx.notebookId, toDeleteIds);
      ctx.strokesRef.current = ctx.strokesRef.current.filter((s) => !toDeleteIds.includes(s.id));
    }

    ctx.activeStrokeRef.current = null;
    ctx.needsRender.current = true;
  }
}
