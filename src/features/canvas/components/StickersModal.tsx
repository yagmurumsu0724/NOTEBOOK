import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';
import { extractedStickers } from './stickers_data';

const stickers = [
  // Cute Animals
  '🐱', '🐶', '🐰', '🐼', '🐨', '🦊', '🐷', '🐸', '🦄', '🦋', '🐥', '🐧',
  // Food & Drink
  '🍓', '🍉', '🍒', '🍑', '🥑', '🍔', '🍕', '🍩', '🍦', '🍰', '☕', '🧋',
  // Nature & Magic
  '🌸', '🌺', '🌻', '🌵', '🍀', '🍄', '⭐', '✨', '🌈', '☀️', '🌙', '☁️',
  // Objects & Hearts
  '🎀', '🎈', '🎁', '🧸', '🎨', '📚', '💌', '💖', '💕', '💘', '💫', '🔥',
  // Faces
  '🥺', '🥰', '😂', '😎', '😋', '😴', '🤩', '🥳', '🤔', '🤫', '🫠', '🤭'
];

interface StickersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (svgDataUrl: string) => void;
}

export const StickersModal: React.FC<StickersModalProps> = ({ isOpen, onClose, onSelectSticker }) => {
  const [activeTab, setActiveTab] = React.useState<number>(0);
  if (!isOpen) return null;

  const handleSelect = (item: string) => {
    try {
      if (item.length > 10) {
        onSelectSticker(item);
      } else {
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-size="80" font-family="sans-serif">${item}</text>
          </svg>
        `.trim();

        const base64 = btoa(unescape(encodeURIComponent(svgString)));
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        onSelectSticker(dataUrl);
      }
      onClose();
    } catch (e) {
      console.error("Failed to generate Sticker", e);
    }
  };

  const ITEMS_PER_PAGE = 50;
  const numPages = Math.ceil(extractedStickers.length / ITEMS_PER_PAGE);
  const tabs = Array.from({ length: numPages }).map((_, i) => `Paket ${i + 1}`);
  tabs.push('Emojiler');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          position: 'relative',
          width: '90%',
          maxWidth: '800px',
          height: '80vh',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Çıkartmalar</h2>
          <IconButton icon={<X size={24} />} onClick={onClose} variant="ghost" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px' }}>
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '8px 16px',
                borderRadius: '99px',
                border: 'none',
                background: activeTab === i ? 'var(--color-sky-dark)' : 'rgba(0,0,0,0.05)',
                color: activeTab === i ? 'white' : '#555',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {activeTab < numPages ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
              {extractedStickers.slice(activeTab * ITEMS_PER_PAGE, (activeTab + 1) * ITEMS_PER_PAGE).map((src, index) => (
                <div 
                  key={`ext-${index}`}
                  onClick={() => handleSelect(src)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    padding: '8px', borderRadius: '16px', cursor: 'pointer',
                    background: 'rgba(0,0,0,0.02)', border: '1px solid #eee', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <img src={src} alt="Sticker" style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15)) drop-shadow(0 1px 3px rgba(0,0,0,0.1))' }} loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '12px' }}>
              {stickers.map((emoji, index) => (
                <div 
                  key={`emoji-${index}`}
                  onClick={() => handleSelect(emoji)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    padding: '8px', borderRadius: '16px', cursor: 'pointer',
                    background: 'transparent', transition: 'all 0.2s',
                    fontSize: '2rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
