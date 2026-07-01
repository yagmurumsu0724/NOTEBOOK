import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { indexedDBStorage } from './indexedDBStorage';

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  tiltX?: number;
  tiltY?: number;
  timestamp: number;
}
export type ToolType = 'fountain' | 'gel' | 'highlighter' | 'eraser' | 'pan' | 'text' | 'image' | 'select';
export type EraserType = 'pixel' | 'stroke' | 'lasso';

export interface StrokeBrush {
  size: number;
  opacity: number;
  flow: number;
  color: string;
  smoothing: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Stroke {
  id: string;
  tool: ToolType;
  points: StrokePoint[];
  brush: StrokeBrush;
  boundingBox: Rect;
  createdAt: number;
}

export function migrateStrokes(strokes: any[]): Stroke[] {
  if (!strokes) return [];
  return strokes.map((s, idx) => {
    if (s && s.id && s.brush && s.boundingBox) {
      return s as Stroke;
    }
    const points: StrokePoint[] = (s.points || []).map((p: any) => ({
      x: typeof p.x === 'number' ? p.x : 0,
      y: typeof p.y === 'number' ? p.y : 0,
      pressure: typeof p.pressure === 'number' ? p.pressure : 0.5,
      timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now()
    }));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    if (minX === Infinity) {
      minX = 0; minY = 0; maxX = 0; maxY = 0;
    }
    return {
      id: s.id || `stroke_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
      tool: s.tool || 'gel',
      points,
      brush: {
        size: s.size || 4,
        opacity: s.tool === 'highlighter' ? 0.4 : 1.0,
        flow: 1.0,
        color: s.color || '#000000',
        smoothing: 0.5
      },
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      },
      createdAt: s.createdAt || Date.now()
    };
  });
}

export type ElementType = 'text' | 'image';

export interface PenSettings {
  size: number;
  thinning: number;
  smoothing: number;
  streamline: number;
}

export interface RulerState {
  x: number;
  y: number;
  rotation: number;
  active: boolean;
}
export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string; // text content or base64 image data
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
  originalStrokes?: Stroke[];
  confidenceScore?: number;
  isConvertedText?: boolean;
}

interface CanvasState {
  notebookStrokes: Record<string, Stroke[]>;
  notebookElements: Record<string, CanvasElement[]>;
  addStroke: (notebookId: string, stroke: Stroke) => void;
  removeStrokes: (notebookId: string, strokeIds: string[]) => void;
  clearStrokes: (notebookId: string) => void;
  addElement: (notebookId: string, element: CanvasElement) => void;
  updateElement: (notebookId: string, elementId: string, updates: Partial<CanvasElement>) => void;
  removeElement: (notebookId: string, elementId: string) => void;
  toggleConversion: (notebookId: string, elementId: string, showConverted: boolean) => void;
  bringToFront: (notebookId: string, elementId: string) => void;
  sendToBack: (notebookId: string, elementId: string) => void;
  bringForward: (notebookId: string, elementId: string) => void;
  sendBackward: (notebookId: string, elementId: string) => void;
  penSettings: PenSettings;
  setPenSettings: (updates: Partial<PenSettings>) => void;
  ruler: RulerState;
  setRuler: (updates: Partial<RulerState>) => void;
  eraserType: EraserType;
  setEraserType: (type: EraserType) => void;
}

export const useCanvasStore = create<CanvasState>()(
  temporal(
    persist(
      (set) => ({
        notebookStrokes: {},
        notebookElements: {},
        penSettings: { size: 4, thinning: 0.5, smoothing: 0.5, streamline: 0.5 },
        setPenSettings: (updates) => set((state) => ({ penSettings: { ...state.penSettings, ...updates } })),
        ruler: { x: 400, y: 400, rotation: 0, active: false },
        setRuler: (updates) => set((state) => ({ ruler: { ...state.ruler, ...updates } })),
        eraserType: 'pixel',
        setEraserType: (type) => set({ eraserType: type }),
        addStroke: (notebookId, stroke) => set((state) => {
          const existing = migrateStrokes(state.notebookStrokes[notebookId] || []);
          return { notebookStrokes: { ...state.notebookStrokes, [notebookId]: [...existing, stroke] } };
        }),
        removeStrokes: (notebookId, strokeIds) => set((state) => {
          const existing = migrateStrokes(state.notebookStrokes[notebookId] || []);
          if (existing.length === 0) return state;
          const filtered = existing.filter(s => !strokeIds.includes(s.id));
          return { notebookStrokes: { ...state.notebookStrokes, [notebookId]: filtered } };
        }),
        clearStrokes: (notebookId) => set((state) => {
          const nextS = { ...state.notebookStrokes };
          delete nextS[notebookId];
          const nextE = { ...state.notebookElements };
          delete nextE[notebookId];
          return { notebookStrokes: nextS, notebookElements: nextE };
        }),
        addElement: (notebookId, element) => set((state) => {
          const existing = state.notebookElements[notebookId] || [];
          return { notebookElements: { ...state.notebookElements, [notebookId]: [...existing, element] } };
        }),
        updateElement: (notebookId, elementId, updates) => set((state) => {
          const existing = state.notebookElements[notebookId] || [];
          return {
            notebookElements: {
              ...state.notebookElements,
              [notebookId]: existing.map(el => el.id === elementId ? { ...el, ...updates } : el)
            }
          };
        }),
        removeElement: (notebookId, elementId) => set((state) => ({
          notebookElements: {
            ...state.notebookElements,
            [notebookId]: (state.notebookElements[notebookId] || []).filter((e) => e.id !== elementId)
          }
        })),
        toggleConversion: (notebookId, elementId, showConverted) => set((state) => ({
          notebookElements: {
            ...state.notebookElements,
            [notebookId]: (state.notebookElements[notebookId] || []).map((el) =>
              el.id === elementId ? { ...el, isConvertedText: showConverted } : el
            )
          }
        })),
        bringToFront: (notebookId, elementId) => set((state) => {
          const elements = state.notebookElements[notebookId] || [];
          const index = elements.findIndex(el => el.id === elementId);
          if (index === -1 || index === elements.length - 1) return state;
          const newElements = [...elements];
          const [el] = newElements.splice(index, 1);
          newElements.push(el);
          return { notebookElements: { ...state.notebookElements, [notebookId]: newElements } };
        }),
        sendToBack: (notebookId, elementId) => set((state) => {
          const elements = state.notebookElements[notebookId] || [];
          const index = elements.findIndex(el => el.id === elementId);
          if (index <= 0) return state;
          const newElements = [...elements];
          const [el] = newElements.splice(index, 1);
          newElements.unshift(el);
          return { notebookElements: { ...state.notebookElements, [notebookId]: newElements } };
        }),
        bringForward: (notebookId, elementId) => set((state) => {
          const elements = state.notebookElements[notebookId] || [];
          const index = elements.findIndex(el => el.id === elementId);
          if (index === -1 || index === elements.length - 1) return state;
          const newElements = [...elements];
          const temp = newElements[index];
          newElements[index] = newElements[index + 1];
          newElements[index + 1] = temp;
          return { notebookElements: { ...state.notebookElements, [notebookId]: newElements } };
        }),
        sendBackward: (notebookId, elementId) => set((state) => {
          const elements = state.notebookElements[notebookId] || [];
          const index = elements.findIndex(el => el.id === elementId);
          if (index <= 0) return state;
          const newElements = [...elements];
          const temp = newElements[index];
          newElements[index] = newElements[index - 1];
          newElements[index - 1] = temp;
          return { notebookElements: { ...state.notebookElements, [notebookId]: newElements } };
        }),
      }),
      { 
        name: 'kawaiinote-canvas-storage',
        storage: createJSONStorage(() => indexedDBStorage)
      }
    ),
    { limit: 50, partialize: (state) => ({ notebookElements: state.notebookElements, notebookStrokes: state.notebookStrokes }) }
  )
);
