import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';

export interface StrokePoint { x: number; y: number; pressure: number }
export type ToolType = 'fountain' | 'gel' | 'highlighter' | 'eraser' | 'pan' | 'text' | 'image' | 'select';
export interface Stroke { points: StrokePoint[]; color: string; size: number; tool: ToolType }

export type ElementType = 'text' | 'image';

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
  clearStrokes: (notebookId: string) => void;
  addElement: (notebookId: string, element: CanvasElement) => void;
  updateElement: (notebookId: string, elementId: string, updates: Partial<CanvasElement>) => void;
  removeElement: (notebookId: string, elementId: string) => void;
  toggleConversion: (notebookId: string, elementId: string, showConverted: boolean) => void;
  bringToFront: (notebookId: string, elementId: string) => void;
  sendToBack: (notebookId: string, elementId: string) => void;
  bringForward: (notebookId: string, elementId: string) => void;
  sendBackward: (notebookId: string, elementId: string) => void;
}

export const useCanvasStore = create<CanvasState>()(
  temporal(
    persist(
      (set) => ({
        notebookStrokes: {},
        notebookElements: {},
        addStroke: (notebookId, stroke) => set((state) => {
          const existing = state.notebookStrokes[notebookId] || [];
          return { notebookStrokes: { ...state.notebookStrokes, [notebookId]: [...existing, stroke] } };
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
      { name: 'kawaiinote-canvas-storage' }
    ),
    { limit: 50, partialize: (state) => ({ notebookElements: state.notebookElements, notebookStrokes: state.notebookStrokes }) }
  )
);
