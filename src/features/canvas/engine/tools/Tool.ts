import React from 'react';
import type { Stroke } from '../../../../store/useCanvasStore';

export interface ToolContext {
  notebookId: string;
  currentColor: string;
  currentSize: number;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeStrokeRef: React.MutableRefObject<Stroke | null>;
  strokesRef: React.MutableRefObject<Stroke[]>;
  needsRender: React.MutableRefObject<boolean>;
  screenToWorld: (x: number, y: number) => { x: number; y: number };
  smoother: any;
}

export interface Tool {
  onPointerDown(e: React.PointerEvent, worldPos: { x: number; y: number }, ctx: ToolContext): void;
  onPointerMove(e: React.PointerEvent, worldPos: { x: number; y: number }, ctx: ToolContext): void;
  onPointerUp(e: React.PointerEvent, worldPos: { x: number; y: number }, ctx: ToolContext): void;
}
