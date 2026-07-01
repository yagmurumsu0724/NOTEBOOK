import React, { useRef, useEffect } from 'react';
import { useCanvasStore } from '../../../store/useCanvasStore';

export const RulerTool: React.FC = () => {
  const ruler = useCanvasStore(state => state.ruler);
  const setRuler = useCanvasStore(state => state.setRuler);
  const rulerRef = useRef<HTMLDivElement>(null);

  if (!ruler.active) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    
    // Check if dragging from rotation handles (corners)
    const target = e.target as HTMLElement;
    if (target.dataset.rotateHandle) {
      const rect = rulerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const onMove = (ev: PointerEvent) => {
        const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
        setRuler({ rotation: angle });
      };
      
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      return;
    }

    // Normal dragging
    const startX = e.clientX;
    const startY = e.clientY;
    const startRulerX = ruler.x;
    const startRulerY = ruler.y;

    const onMoveDrag = (ev: PointerEvent) => {
      setRuler({
        x: startRulerX + (ev.clientX - startX),
        y: startRulerY + (ev.clientY - startY)
      });
    };

    const onUpDrag = () => {
      window.removeEventListener('pointermove', onMoveDrag);
      window.removeEventListener('pointerup', onUpDrag);
    };

    window.addEventListener('pointermove', onMoveDrag);
    window.addEventListener('pointerup', onUpDrag);
  };

  return (
    <div
      ref={rulerRef}
      onPointerDown={handlePointerDown}
      style={{
        position: 'absolute',
        left: ruler.x,
        top: ruler.y,
        width: '600px',
        height: '60px',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(0,0,0,0.2)',
        borderRadius: '8px',
        transform: `translate(-50%, -50%) rotate(${ruler.rotation}deg)`,
        transformOrigin: 'center center',
        cursor: 'grab',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 50,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      {/* Top markings */}
      <div className="w-full flex h-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.2)' }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={`t-${i}`} className="flex-1 flex justify-start">
            <div 
              style={{ 
                width: '1px', 
                height: i % 10 === 0 ? '12px' : (i % 5 === 0 ? '8px' : '4px'), 
                background: 'rgba(0,0,0,0.4)' 
              }} 
            />
          </div>
        ))}
      </div>

      {/* Rotation Handles */}
      <div 
        data-rotate-handle="true"
        className="absolute -left-3 -top-3 w-6 h-6 bg-white border border-gray-300 rounded-full cursor-alias shadow-sm flex justify-center items-center"
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full pointer-events-none" />
      </div>
      <div 
        data-rotate-handle="true"
        className="absolute -right-3 -top-3 w-6 h-6 bg-white border border-gray-300 rounded-full cursor-alias shadow-sm flex justify-center items-center"
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full pointer-events-none" />
      </div>
      <div 
        data-rotate-handle="true"
        className="absolute -left-3 -bottom-3 w-6 h-6 bg-white border border-gray-300 rounded-full cursor-alias shadow-sm flex justify-center items-center"
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full pointer-events-none" />
      </div>
      <div 
        data-rotate-handle="true"
        className="absolute -right-3 -bottom-3 w-6 h-6 bg-white border border-gray-300 rounded-full cursor-alias shadow-sm flex justify-center items-center"
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full pointer-events-none" />
      </div>

      <div className="w-full flex items-center justify-center text-xs font-bold opacity-30 select-none pointer-events-none">
        KAWAIINOTE RULER
      </div>

      {/* Bottom markings */}
      <div className="w-full flex h-3" style={{ borderTop: '1px solid rgba(0,0,0,0.2)' }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={`b-${i}`} className="flex-1 flex justify-start items-end">
            <div 
              style={{ 
                width: '1px', 
                height: i % 10 === 0 ? '12px' : (i % 5 === 0 ? '8px' : '4px'), 
                background: 'rgba(0,0,0,0.4)' 
              }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};
