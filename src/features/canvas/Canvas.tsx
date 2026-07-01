import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Download } from 'lucide-react';
import { IconButton } from '../../components/ui/IconButton';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useStore } from '../../store/useStore';
import type { Stroke, ToolType, CanvasElement } from '../../store/useCanvasStore';
import { FloatingToolbar } from './components/FloatingToolbar';
import { ColorPickerModal } from './components/ColorPickerModal';
import { FontPickerModal } from './components/FontPickerModal';
import { ShapesModal } from './components/ShapesModal';
import { StickersModal } from './components/StickersModal';
import { BackgroundsModal } from './components/BackgroundsModal';
import { PenSettingsModal } from './components/PenSettingsModal';
import { RulerTool } from './components/RulerTool';
import { HANDWRITING_FONTS, loadFont } from './fonts';
import { getStroke } from 'perfect-freehand';
import { AIHandwritingEngine } from './utils/aiHandwritingEngine';
import './Canvas.css';

const EMPTY_ELEMENTS: CanvasElement[] = [];

// Removed unused allColors

export const Canvas: React.FC = () => {
  const { notebookId } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });
  const [tool, setTool] = useState<ToolType>('gel');
  const [currentColor, setCurrentColor] = useState('var(--text-primary)');
  const [currentSize, setCurrentSize] = useState(4);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isColorStudioOpen, setIsColorStudioOpen] = useState(false);
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [currentFont, setCurrentFont] = useState(HANDWRITING_FONTS[0].id);
  const [isAIMode, setIsAIMode] = useState(false);
  const [isShapesOpen, setIsShapesOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [isBackgroundsOpen, setIsBackgroundsOpen] = useState(false);
  const [isPenSettingsOpen, setIsPenSettingsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, id: string} | null>(null);
  
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current font on mount
  useEffect(() => {
    const font = HANDWRITING_FONTS.find(f => f.id === currentFont);
    if (font) loadFont(font.googleFont);
  }, [currentFont]);
  
  const elements = useCanvasStore(state => notebookId ? state.notebookElements[notebookId] || EMPTY_ELEMENTS : EMPTY_ELEMENTS);
  const addElement = useCanvasStore(state => state.addElement);
  const updateElement = useCanvasStore(state => state.updateElement);
  const notebook = useStore(state => state.notebooks.find(n => n.id === notebookId));
  const updateNotebook = useStore(state => state.updateNotebook);

  const isPanning = useRef(false);
  const isDrawing = useRef(false);
  const needsRender = useRef(true); 
  const lastMousePos = useRef({ x: 0, y: 0 });
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  
  const dragInfo = useRef<{ id: string, startWorldX: number, startWorldY: number, startElX: number, startElY: number } | null>(null);

  useEffect(() => {
    if (notebookId) {
      strokesRef.current = useCanvasStore.getState().notebookStrokes[notebookId] || [];
      const title = useStore.getState().notebooks.find(n => n.id === notebookId)?.title || 'Sayfa';
      document.title = `KawaiiNote | ${title}`;
      needsRender.current = true;
    }
  }, [notebookId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          useCanvasStore.temporal.getState().redo();
        } else {
          useCanvasStore.temporal.getState().undo();
        }
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        useCanvasStore.temporal.getState().redo();
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedElementId) {
        const el = useCanvasStore.getState().notebookElements[notebookId!]?.find(e => e.id === selectedElementId);
        if (el) {
          navigator.clipboard.writeText(JSON.stringify({ type: 'kawaiinote-element', data: el }));
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        navigator.clipboard.readText().then(text => {
          try {
            const parsed = JSON.parse(text);
            if (parsed.type === 'kawaiinote-element') {
              const newEl = { ...parsed.data, id: Date.now().toString(), x: parsed.data.x + 50, y: parsed.data.y + 50 };
              useCanvasStore.getState().addElement(notebookId!, newEl);
            }
          } catch(e) {}
        });
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        useCanvasStore.getState().removeElement(notebookId!, selectedElementId);
        setSelectedElementId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notebookId, selectedElementId]);

  const handleClear = () => {
    if (notebookId && window.confirm('Bu defterdeki tüm çizim ve metinleri silmek istediğinize emin misiniz?')) {
      useCanvasStore.getState().clearStrokes(notebookId);
      strokesRef.current = [];
      needsRender.current = true;
    }
  };

  const handleExport = async () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 800;
    exportCanvas.height = 1131;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const rootStyle = getComputedStyle(document.documentElement);
    const bgSecondary = rootStyle.getPropertyValue('--bg-secondary').trim() || '#ffffff';
    ctx.fillStyle = bgSecondary;
    ctx.fillRect(0, 0, 800, 1131);

    ctx.save();
    ctx.translate(-100, -100);

    drawAllStrokes(ctx);

    const imagePromises = elements.filter(el => el.type === 'image').map(el => {
      return new Promise<{img: HTMLImageElement, el: CanvasElement}>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ img, el });
        img.src = el.content;
      });
    });

    const loadedImages = await Promise.all(imagePromises);

    elements.forEach(el => {
        const isSelected = selectedElementId === el.id;
        
        // If not converted and we have original strokes, draw them instead
        if (el.isConvertedText === false && el.originalStrokes) {
          el.originalStrokes.forEach(stroke => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.strokeStyle = el.color || '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
          });
        } else if (el.type === 'text') {
          // Draw AI Text
          let actualColor = el.color || '#000';
          if (actualColor.startsWith('var(')) {
             const varName = actualColor.slice(4, -1);
             actualColor = rootStyle.getPropertyValue(varName).trim() || '#000';
          }
          ctx.fillStyle = actualColor;
          const fontFamily = el.fontFamily || 'Quicksand';
          ctx.font = `${el.fontSize || 24}px "${fontFamily}", sans-serif`;
          const lines = el.content.split('\n');
          lines.forEach((line, index) => {
             ctx.fillText(line, el.x + 4, el.y + 24 + (index * (el.fontSize || 24) * 1.2));
          });
          
          // Low Confidence Underline
          if (el.confidenceScore && el.confidenceScore < 90) {
            const textWidth = ctx.measureText(lines[0]).width;
            ctx.beginPath();
            ctx.moveTo(el.x, el.y + 30);
            ctx.lineTo(el.x + textWidth, el.y + 30);
            ctx.strokeStyle = '#ffb347'; // subtle warning orange
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);
          }

          if (isSelected) {
            const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
            const textHeight = lines.length * (el.fontSize || 24) * 1.2;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.strokeRect(el.x, el.y, textWidth + 8, textHeight + 8);
          }
        }
    });

    loadedImages.forEach(({ img, el }) => {
      const maxW = 400;
      const maxH = 400;
      let w = img.width;
      let h = img.height;
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w *= ratio;
        h *= ratio;
      }
      ctx.drawImage(img, el.x, el.y, w, h);
    });

    ctx.restore();

    const link = document.createElement('a');
    // Unused: const notebookTitle = useCanvasStore.getState().notebookElements[notebookId!]?.[0]?.content || 'Sayfa';
    link.download = `kawaiinote-${notebookId}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const drawAllStrokes = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allStrokes = [...strokesRef.current];
    if (activeStrokeRef.current) {
      allStrokes.push(activeStrokeRef.current);
    }
    
    const globalPenSettings = useCanvasStore.getState().penSettings;

    allStrokes.forEach(stroke => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = stroke.color;
      
      let finalSize = stroke.size * (globalPenSettings.size / 4);
      let thinning = globalPenSettings.thinning;
      let streamline = globalPenSettings.streamline;
      let smoothing = globalPenSettings.smoothing;
      
      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        finalSize = stroke.size * 3 * (camera.z < 1 ? 1/camera.z : 1);
        thinning = 0;
      } else if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = stroke.color;
        finalSize = stroke.size * 4;
        ctx.globalAlpha = 0.4;
        thinning = -0.2;
      } else if (stroke.tool === 'fountain') {
        finalSize = stroke.size * 2;
        thinning = 0.7;
        streamline = 0.8;
      } else if (stroke.tool === 'gel') {
        finalSize = stroke.size;
        thinning = 0.1;
      }
      
      const points = stroke.points.map(p => [p.x, p.y, p.pressure]);
      const outline = getStroke(points, {
        size: finalSize,
        thinning,
        smoothing,
        streamline,
        simulatePressure: stroke.tool !== 'eraser' && stroke.tool !== 'highlighter'
      });

      if (outline.length === 0) return;

      ctx.beginPath();
      ctx.moveTo(outline[0][0], outline[0][1]);
      for (let i = 1; i < outline.length; i++) {
        ctx.lineTo(outline[i][0], outline[i][1]);
      }
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const zoomSensitivity = 0.005;
      const zoomDelta = e.deltaY * zoomSensitivity;
      setCamera(prev => {
        const newZ = Math.min(Math.max(0.1, prev.z - zoomDelta), 5);
        if (prev.z !== newZ) needsRender.current = true;
        return { ...prev, z: newZ };
      });
    } else {
      setCamera(prev => {
        needsRender.current = true;
        return { ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY };
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let initialDist: number | null = null;
    let initialZ = 1;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        
        if (initialDist === null) {
          initialDist = dist;
          setCamera(prev => { initialZ = prev.z; return prev; });
        } else {
          const scale = dist / initialDist;
          setCamera(prev => {
            const newZ = Math.min(Math.max(0.1, initialZ * scale), 5);
            if (prev.z !== newZ) needsRender.current = true;
            return { ...prev, z: newZ };
          });
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) initialDist = null;
    };

    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);

    return () => {
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const screenToWorld = (sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const wx = (sx - canvas.width / 2) / camera.z + canvas.width / 2 - camera.x;
    const wy = (sy - canvas.height / 2) / camera.z + canvas.height / 2 - camera.y;
    return { x: wx, y: wy };
  };

  const processImageFile = (file: File, sx: number, sy: number) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && typeof ev.target.result === 'string') {
        const wPos = screenToWorld(sx, sy);
        addElement(notebookId!, {
          id: Date.now().toString(),
          type: 'image',
          x: wPos.x,
          y: wPos.y,
          content: ev.target.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectShape = (svgDataUrl: string) => {
    const wPos = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    addElement(notebookId!, {
      id: Date.now().toString(),
      type: 'image',
      x: wPos.x - 50, // Center the shape a bit (assuming 100x100 default size)
      y: wPos.y - 50,
      content: svgDataUrl,
    });
    setTool('select'); // Switch to select tool so they can move it immediately
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        processImageFile(file, e.clientX, e.clientY);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleElementPointerDown = (e: React.PointerEvent, el: CanvasElement) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    setSelectedElementId(el.id);
    const wPos = screenToWorld(e.clientX, e.clientY);
    dragInfo.current = {
      id: el.id,
      startWorldX: wPos.x,
      startWorldY: wPos.y,
      startElX: el.x,
      startElY: el.y,
    };
    if (canvasRef.current) canvasRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const isPanIntent = tool === 'pan' || e.button === 1 || e.altKey || (e.pointerType === 'touch' && !e.isPrimary);
    
    if (isPanIntent) {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    } 
    
    if (tool === 'select') {
      setSelectedElementId(null);
      return;
    }

    if (tool === 'text') {
      const wPos = screenToWorld(e.clientX, e.clientY);
      let actualColor = currentColor;
      if (currentColor.startsWith('var(')) {
        const varName = currentColor.slice(4, -1);
        actualColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000';
      }
      addElement(notebookId!, {
        id: Date.now().toString(),
        type: 'text',
        x: wPos.x,
        y: wPos.y,
        content: '',
        color: actualColor,
        fontSize: 24,
        fontFamily: HANDWRITING_FONTS.find(f => f.id === currentFont)?.googleFont || 'Quicksand'
      });
      return;
    }
    
    isDrawing.current = true;
    const wPos = screenToWorld(e.clientX, e.clientY);
    
    let actualColor = currentColor;
    if (currentColor.startsWith('var(')) {
      const varName = currentColor.slice(4, -1);
      actualColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000';
    }
    if(tool === 'highlighter' && currentColor.startsWith('var(--text')) {
      actualColor = '#FDFD96';
    }

    activeStrokeRef.current = {
      color: actualColor,
      size: tool === 'highlighter' ? currentSize * 2 : currentSize,
      tool,
      points: [{ x: wPos.x, y: wPos.y, pressure: e.pressure || 0.5 }]
    };
    if (canvasRef.current) {
      canvasRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      needsRender.current = true;
    } else if (tool === 'select' && dragInfo.current) {
      const wPos = screenToWorld(e.clientX, e.clientY);
      const dx = wPos.x - dragInfo.current.startWorldX;
      const dy = wPos.y - dragInfo.current.startWorldY;
      updateElement(notebookId!, dragInfo.current.id, {
        x: dragInfo.current.startElX + dx,
        y: dragInfo.current.startElY + dy
      });
    } else if (isDrawing.current && activeStrokeRef.current) {
      const wPos = screenToWorld(e.clientX, e.clientY);
      activeStrokeRef.current.points.push({ x: wPos.x, y: wPos.y, pressure: e.pressure || 0.5 });
      needsRender.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
    }
    if (tool === 'select') {
      dragInfo.current = null;
      if (canvasRef.current) canvasRef.current.releasePointerCapture(e.pointerId);
    }
    if (isDrawing.current) {
      isDrawing.current = false;
      if (activeStrokeRef.current) {
        strokesRef.current.push(activeStrokeRef.current);
        if (notebookId) {
          useCanvasStore.getState().addStroke(notebookId, activeStrokeRef.current);
          
          if (isAIMode) {
            AIHandwritingEngine.detector.addStroke(activeStrokeRef.current);
            if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
            
            aiTimeoutRef.current = setTimeout(async () => {
              if (AIHandwritingEngine.detector.shouldProcess()) {
                const strokes = AIHandwritingEngine.detector.getAndClearStrokes();
                const actualColor = currentColor.startsWith('var(') 
                  ? getComputedStyle(document.documentElement).getPropertyValue(currentColor.slice(4, -1)).trim() 
                  : currentColor;
                
                const newTextElement = await AIHandwritingEngine.performOCR(strokes, currentFont, actualColor || '#000');
                
                // Add the new text element
                useCanvasStore.getState().addElement(notebookId, newTextElement);
                
                // Clear original strokes since they are now encapsulated inside newTextElement
                useCanvasStore.getState().clearStrokes(notebookId); // Simplified for demo: assuming all uncommitted strokes are the word. In a real app we'd remove exactly these strokes from the store.
                
                needsRender.current = true;
              }
            }, 1000);
          }
        }
        activeStrokeRef.current = null;
        needsRender.current = true;
      }
      if (canvasRef.current) {
        canvasRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(camera.z, camera.z);
      ctx.translate(-canvas.width / 2 + camera.x, -canvas.height / 2 + camera.y);

      const rootStyle = getComputedStyle(document.documentElement);
      const textTertiary = rootStyle.getPropertyValue('--text-tertiary').trim() || '#b2bec3';
      
      const PAGE_WIDTH = 800;
      const PAGE_HEIGHT = 1131; // A4 ratio
      const PAGE_GAP = 50;
      const pageCount = notebook?.pageCount || 1;
      const settings = notebook?.pageSettings || {
        pattern: notebook?.pageStyle || 'dots',
        opacity: 0.5,
        thickness: 1,
        density: 1,
        color: textTertiary
      };

      // Draw Pages
      for (let i = 0; i < pageCount; i++) {
        const pageY = i * (PAGE_HEIGHT + PAGE_GAP);
        
        // Draw page shadow & background
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = '#ffffff'; // Pages are always white/off-white in real notebooks
        ctx.fillRect(-PAGE_WIDTH / 2, pageY, PAGE_WIDTH, PAGE_HEIGHT);
        ctx.shadowColor = 'transparent';

        // Draw Pattern
        ctx.save();
        ctx.beginPath();
        ctx.rect(-PAGE_WIDTH / 2, pageY, PAGE_WIDTH, PAGE_HEIGHT);
        ctx.clip(); // Ensure pattern doesn't bleed out of the page

        ctx.fillStyle = settings.color;
        ctx.strokeStyle = settings.color;
        ctx.globalAlpha = settings.opacity;
        ctx.lineWidth = settings.thickness;

        const gridSize = 40 / settings.density;
        const startX = -PAGE_WIDTH / 2;
        const startY = pageY;
        const endX = PAGE_WIDTH / 2;
        const endY = pageY + PAGE_HEIGHT;

        if (settings.pattern === 'dots') {
          for (let x = startX + gridSize; x < endX; x += gridSize) {
            for (let y = startY + gridSize; y < endY; y += gridSize) {
              ctx.beginPath();
              ctx.arc(x, y, 1.5 * settings.thickness, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (settings.pattern === 'grid') {
          for (let x = startX + gridSize; x < endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
          }
          for (let y = startY + gridSize; y < endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
          }
        } else if (settings.pattern === 'lined') {
          for (let y = startY + gridSize; y < endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
          }
        }
        
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;      
      ctx.shadowColor = 'transparent';
      
      // Draw Strokes
      drawAllStrokes(ctx);

      ctx.restore();
    };

    let animationFrameId: number;
    const loop = () => {
      if (needsRender.current) {
        render();
        needsRender.current = false;
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      needsRender.current = true;
    };
    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [camera]);

  // Removed unused presetColors
  const domOverlayTransform = `translate(${window.innerWidth / 2}px, ${window.innerHeight / 2}px) scale(${camera.z}) translate(${-window.innerWidth / 2 + camera.x}px, ${-window.innerHeight / 2 + camera.y}px)`;

  return (
    <div className="canvas-container" onDrop={handleDrop} onDragOver={handleDragOver} onClick={() => setContextMenu(null)}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: tool === 'pan' ? 'grab' : (tool === 'select' ? 'default' : (tool === 'text' ? 'text' : 'crosshair')), touchAction: 'none', position: 'absolute', zIndex: 1 }}
      />

      <div className="canvas-dom-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', overflow: 'hidden', zIndex: 2 }}>
        <RulerTool />
        <div style={{ transformOrigin: '0 0', transform: domOverlayTransform, width: '100%', height: '100%', position: 'absolute' }}>
          {elements.map(el => {
            const isSelected = selectedElementId === el.id;
            const borderStyle = isSelected ? '2px solid var(--color-mint)' : (tool === 'text' ? '1px dashed rgba(0,0,0,0.2)' : 'none');
            
            return (
              <div
                key={el.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedElementId(el.id);
                  setContextMenu({ x: e.clientX, y: e.clientY, id: el.id });
                }}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  transformOrigin: 'center center',
                  zIndex: 10
                }}
              >
                {isSelected && tool === 'select' && (
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      // Simple rotation handling: store initial state
                      const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
                      if (!rect) return;
                      const cx = rect.left + rect.width / 2;
                      const cy = rect.top + rect.height / 2;
                      
                      const onMove = (ev: PointerEvent) => {
                         const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
                         updateElement(notebookId!, el.id, { rotation: angle + 90 });
                      };
                      const onUp = () => {
                         window.removeEventListener('pointermove', onMove);
                         window.removeEventListener('pointerup', onUp);
                      };
                      window.addEventListener('pointermove', onMove);
                      window.addEventListener('pointerup', onUp);
                    }}
                    style={{
                      position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
                      width: '16px', height: '16px', background: 'var(--color-mint)', borderRadius: '50%',
                      cursor: 'grab', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  />
                )}
                
                {el.type === 'text' ? (
                  <textarea
                    value={el.content}
                    onChange={(e) => updateElement(notebookId!, el.id, { content: e.target.value })}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    style={{
                      color: el.color, fontSize: `${el.fontSize}px`,
                      fontFamily: notebook?.fontFamily || 'var(--font-family-base)', background: 'transparent',
                      border: borderStyle,
                      boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
                      resize: 'none', pointerEvents: (tool === 'text' || tool === 'pan' || tool === 'select') ? 'auto' : 'none',
                      outline: 'none', minWidth: '200px', minHeight: '50px', lineHeight: 1.2,
                      cursor: tool === 'select' ? 'grab' : 'text'
                    }}
                    placeholder={tool === 'text' ? "Metin..." : ""}
                    autoFocus={tool === 'text'}
                  />
                ) : (
                  <div 
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    style={{ 
                      pointerEvents: tool === 'select' ? 'auto' : 'none',
                      border: borderStyle,
                      boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.1)' : 'none',
                      cursor: tool === 'select' ? 'grab' : 'default'
                    }}
                  >
                    <img src={el.content} alt="canvas-image" style={{ maxWidth: '400px', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', boxShadow: 'var(--shadow-soft)', pointerEvents: 'none' }} />
                  </div>
                )}
              </div>
            );
            return null;
          })}
        </div>
      </div>
      
      <div className="canvas-navbar glass-panel" style={{ zIndex: 10 }}>
        <IconButton icon={<ArrowLeft size={20} />} onClick={() => navigate('/dashboard')} style={{ marginRight: '1rem' }} />
        <div style={{ fontWeight: 600 }}>Defter: {notebookId}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
           <IconButton icon={<Download size={20} />} onClick={handleExport} variant="ghost" title="Resim Olarak İndir" />
           <IconButton icon={<Trash2 size={20} color="var(--color-sakura)" />} onClick={handleClear} variant="ghost" title="Tuvali Temizle" />
        </div>
      </div>

      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => {
        if (e.target.files && e.target.files[0]) {
          processImageFile(e.target.files[0], window.innerWidth / 2, window.innerHeight / 2);
        }
      }} />

      <FloatingToolbar 
        tool={tool} 
        setTool={setTool} 
        currentColor={currentColor} 
        currentSize={currentSize} 
        setCurrentSize={setCurrentSize}
        onOpenColorStudio={() => setIsColorStudioOpen(true)}
        onOpenAI={() => setIsFontPickerOpen(true)}
        onAddImage={() => fileInputRef.current?.click()}
        onOpenShapes={() => setIsShapesOpen(true)}
        onOpenStickers={() => setIsStickersOpen(true)}
        onOpenBackgrounds={() => setIsBackgroundsOpen(true)}
        isAIMode={isAIMode}
        setIsAIMode={setIsAIMode}
        onOpenPenSettings={() => setIsPenSettingsOpen(true)}
        notebookId={notebookId!}
      />

      <ColorPickerModal 
        isOpen={isColorStudioOpen} 
        onClose={() => setIsColorStudioOpen(false)} 
        currentColor={currentColor} 
        onSelectColor={setCurrentColor} 
      />

      <FontPickerModal 
        isOpen={isFontPickerOpen}
        onClose={() => setIsFontPickerOpen(false)}
        currentFont={currentFont}
        onSelectFont={setCurrentFont}
      />

      <ShapesModal
        isOpen={isShapesOpen}
        onClose={() => setIsShapesOpen(false)}
        onSelectShape={handleSelectShape}
        currentColor={currentColor}
      />

      <StickersModal
        isOpen={isStickersOpen}
        onClose={() => setIsStickersOpen(false)}
        onSelectSticker={handleSelectShape}
      />

      <BackgroundsModal
        isOpen={isBackgroundsOpen}
        onClose={() => setIsBackgroundsOpen(false)}
        notebookId={notebookId!}
      />

      <PenSettingsModal
        isOpen={isPenSettingsOpen}
        onClose={() => setIsPenSettingsOpen(false)}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 9999,
            background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '8px', minWidth: '150px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '4px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md font-medium"
            onClick={() => {
              useCanvasStore.getState().bringToFront(notebookId!, contextMenu.id);
              setContextMenu(null);
            }}
          >
            En Öne Getir
          </button>
          <button 
            className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md font-medium"
            onClick={() => {
              useCanvasStore.getState().sendToBack(notebookId!, contextMenu.id);
              setContextMenu(null);
            }}
          >
            En Arkaya Gönder
          </button>
          <div className="h-[1px] bg-gray-200 my-1" />
          <button 
            className="text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md font-medium flex items-center gap-2"
            onClick={() => {
              useCanvasStore.getState().removeElement(notebookId!, contextMenu.id);
              setContextMenu(null);
              setSelectedElementId(null);
            }}
          >
            <Trash2 size={14} /> Sil
          </button>
        </div>
      )}
    </div>
  );
};
