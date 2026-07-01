import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
}

const PALETTES = {
  "Kawaii & Pastel": ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#F3B0C3', '#FDFD96', '#FF9AA2', '#C8E6C9', '#BBDEF0', '#F8B195', '#F67280'],
  "Anime & Neon": ['#FF007F', '#7FFF00', '#00FFFF', '#FF1493', '#9400D3', '#FF4500', '#39FF14', '#00FF00', '#FFFF00', '#FF00FF'],
  "Vintage Diary": ['#D4C5B9', '#C3B091', '#A67B5B', '#8B5A2B', '#654321', '#8C7A6B', '#E6D5B8', '#E1C699', '#D2A679', '#C68E58'],
  "Dark Mode Study": ['#1E1E1E', '#2D2D2D', '#3C3C3C', '#4B4B4B', '#5A5A5A', '#696969', '#787878', '#878787', '#969696', '#A5A5A5'],
  "Ocean & Forest": ['#006994', '#005b96', '#03396c', '#011f4b', '#228B22', '#006400', '#556B2F', '#8FBC8F', '#2E8B57', '#3CB371']
};

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ isOpen, onClose, currentColor, onSelectColor }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-6 shadow-2xl w-[90%] max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            style={{ border: '1px solid rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Sonsuz Renk Stüdyosu</h2>
              <IconButton icon={<X size={20} />} variant="ghost" onClick={onClose} />
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div 
                  className="w-12 h-12 rounded-full shadow-inner border-2 border-gray-200"
                  style={{ background: currentColor }}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Şu Anki Renk</p>
                  <p className="font-mono text-gray-800">{currentColor}</p>
                </div>
              </div>
              <input 
                type="color" 
                value={currentColor.startsWith('#') ? currentColor : '#000000'}
                onChange={(e) => onSelectColor(e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer"
                title="Gelişmiş Renk Seçici"
              />
            </div>

            <div className="space-y-6">
              {Object.entries(PALETTES).map(([name, colors]) => (
                <div key={name}>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                      <div
                        key={c}
                        onClick={() => onSelectColor(c)}
                        className="w-8 h-8 rounded-full cursor-pointer shadow-sm hover:scale-110 transition-transform"
                        style={{ 
                          background: c,
                          border: currentColor === c ? '2px solid #000' : '1px solid rgba(0,0,0,0.1)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
