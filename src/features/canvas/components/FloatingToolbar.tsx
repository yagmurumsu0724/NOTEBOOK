import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  PenTool, Highlighter, Eraser, Type, MousePointer2, 
  Hand, ChevronRight, ChevronLeft, Image as ImageIcon, Sparkles, Shapes, Sticker, Layout
} from 'lucide-react';
import type { ToolType } from '../../../store/useCanvasStore';
import { IconButton } from '../../../components/ui/IconButton';

interface FloatingToolbarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  currentColor: string;
  currentSize: number;
  setCurrentSize: (size: number) => void;
  onOpenColorStudio: () => void;
  onOpenAI: () => void;
  onAddImage: () => void;
  onOpenShapes: () => void;
  onOpenStickers: () => void;
  onOpenBackgrounds: () => void;
  isAIMode: boolean;
  setIsAIMode: (val: boolean) => void;
}

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Seç' },
  { id: 'pan', icon: Hand, label: 'Kaydır' },
  { id: 'gel', icon: PenTool, label: 'Kalemler' },
  { id: 'highlighter', icon: Highlighter, label: 'Fosforlu' },
  { id: 'eraser', icon: Eraser, label: 'Silgi' },
  { id: 'text', icon: Type, label: 'Metin' }
] as const;

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  tool, setTool, currentColor, currentSize, setCurrentSize, onOpenColorStudio, onOpenAI, onAddImage, onOpenShapes, onOpenStickers, onOpenBackgrounds, isAIMode, setIsAIMode
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const dragControls = useDragControls();

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ x: window.innerWidth / 2 - 200, y: window.innerHeight - 100 }}
      className="fixed z-50 flex items-center shadow-2xl rounded-2xl"
      style={{
        position: 'fixed',
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        padding: '6px',
        touchAction: 'none'
      }}
    >
      <div className="flex items-center gap-1">
        {/* Grip Handle for Dragging */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="w-4 h-12 flex flex-col items-center justify-center gap-1 cursor-grab opacity-30 hover:opacity-100 px-1"
          style={{ touchAction: 'none' }}
        >
          <div className="w-1 h-1 bg-gray-600 rounded-full" />
          <div className="w-1 h-1 bg-gray-600 rounded-full" />
          <div className="w-1 h-1 bg-gray-600 rounded-full" />
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex items-center gap-1 overflow-hidden"
              style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
            >
              {tools.map(t => (
                <IconButton
                  key={t.id}
                  icon={<t.icon size={22} />}
                  variant={tool === t.id ? 'solid' : 'ghost'}
                  onClick={() => setTool(t.id as ToolType)}
                  title={t.label}
                />
              ))}

              <div className="w-[1px] h-6 bg-gray-300 mx-1 opacity-50 flex-shrink-0" />
              
              <IconButton icon={<Shapes size={22} />} variant="ghost" onClick={onOpenShapes} title="Hazır Şekiller" />
              <IconButton icon={<Sticker size={22} />} variant="ghost" onClick={onOpenStickers} title="Çıkartmalar" />
              <IconButton icon={<ImageIcon size={22} />} variant="ghost" onClick={onAddImage} title="Görsel Ekle" />
              <IconButton icon={<Layout size={22} />} variant="ghost" onClick={onOpenBackgrounds} title="Arkaplan ve Sayfa Ayarları" />
              <div 
                className={`relative flex items-center p-1 rounded-lg ${isAIMode ? 'bg-purple-100 border border-purple-300' : ''}`}
                title="AI El Yazısı Motoru"
              >
                <IconButton 
                  icon={<Sparkles size={22} color={isAIMode ? "#8b5cf6" : "#6b7280"} />} 
                  variant="ghost" 
                  onClick={() => setIsAIMode(!isAIMode)} 
                />
                <button onClick={onOpenAI} className="ml-1 text-xs font-semibold text-purple-600 hover:text-purple-800">
                  Ayarlar
                </button>
              </div>

              <div className="w-[1px] h-6 bg-gray-300 mx-1 opacity-50 flex-shrink-0" />

              {/* Color Preview & Studio Button */}
              <div 
                className="w-8 h-8 rounded-full cursor-pointer flex items-center justify-center shadow-sm ml-1 relative flex-shrink-0"
                style={{ background: currentColor, border: '2px solid white' }}
                onClick={onOpenColorStudio}
                title="Renk Stüdyosu (Color Studio)"
              >
              </div>
              
              {/* Size slider (simplified) */}
              <div className="flex flex-col gap-1 ml-3 mr-2 flex-shrink-0">
                <input 
                  type="range" 
                  min="1" max="20" 
                  value={currentSize} 
                  onChange={(e) => setCurrentSize(parseInt(e.target.value))}
                  className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  title={`Kalınlık: ${currentSize}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors ml-1 flex-shrink-0 border-none bg-transparent"
        >
          {isExpanded ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.div>
  );
};
