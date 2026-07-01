import React from 'react';
import type { Tool, ToolContext } from './Tool';
import { StrokeSmoother } from '../StrokeSmoother';

export class PenTool implements Tool {
  onPointerDown(e: React.PointerEvent, worldPos: { x: number; y: number }, ctx: ToolContext): void {
    const timestamp = Date.now();
    ctx.smoother.reset();
    
    // Resolve CSS vars if needed
    let actualColor = ctx.currentColor;
    if (ctx.currentColor.startsWith('var(')) {
      const varName = ctx.currentColor.slice(4, -1);
      actualColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000';
    }
    
    const size = ctx.currentSize;
    ctx.activeStrokeRef.current = {
      id: `stroke_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      tool: 'gel', // default tool inside PenTool, can be fountain/gel/highlighter
      points: [{ x: worldPos.x, y: worldPos.y, pressure: e.pressure || 0.5, timestamp }],
      brush: {
        size,
        opacity: 1.0,
        flow: 1.0,
        color: actualColor,
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

    // Dynamic width simulation
    const pts = ctx.activeStrokeRef.current.points;
    const idx = pts.length - 1;
    const { pressure } = StrokeSmoother.calculatePressureAndVelocity(pts, idx);
    pts[idx].pressure = pressure;

    // Incremental bbox calculation
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
    // Handled at main Canvas level for storing & committing to allow easy OCR sync.
    // However, Tool can run point decimation and finalization.
    if (!ctx.activeStrokeRef.current) return;
    
    if (ctx.activeStrokeRef.current.points.length > 2) {
      ctx.activeStrokeRef.current.points = StrokeSmoother.optimizePoints(ctx.activeStrokeRef.current.points, 0.35);
    }
  }
}
