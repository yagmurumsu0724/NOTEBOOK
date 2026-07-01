import React from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from '../../../components/ui/IconButton';
import { useStore } from '../../../store/useStore';
import type { PageSettings } from '../../../store/useStore';

interface BackgroundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string;
}

const PATTERNS = [
  { id: 'blank', label: 'Boş' },
  { id: 'lined', label: 'Çizgili' },
  { id: 'grid', label: 'Kareli' },
  { id: 'dots', label: 'Noktalı' },
];

const COLORS = [
  '#b2bec3', // gray
  '#ff7675', // red/pink
  '#74b9ff', // blue
  '#55efc4', // mint
  '#ffeaa7', // yellow
];

export const BackgroundsModal: React.FC<BackgroundsModalProps> = ({ isOpen, onClose, notebookId }) => {
  const notebook = useStore(state => state.notebooks.find(n => n.id === notebookId));
  const updateNotebook = useStore(state => state.updateNotebook);

  if (!notebook) return null;

  const currentSettings = notebook.pageSettings || {
    pattern: notebook.pageStyle || 'dots',
    opacity: 0.5,
    thickness: 1,
    density: 1,
    color: '#b2bec3'
  };

  const handleUpdate = (updates: Partial<PageSettings>) => {
    updateNotebook(notebookId, {
      pageSettings: { ...currentSettings, ...updates } as PageSettings
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed z-50 bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
          style={{ width: '320px', bottom: '100px', left: '50%', marginLeft: '-160px' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Sayfa Arkaplanı</h3>
            <IconButton icon={<X size={18} />} onClick={onClose} variant="ghost" />
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Desen</label>
              <div className="grid grid-cols-2 gap-2">
                {PATTERNS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleUpdate({ pattern: p.id as any })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentSettings.pattern === p.id 
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-400' 
                        : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Çizgi Rengi</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => handleUpdate({ color: c })}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: c, border: currentSettings.color === c ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.1)' }}
                  >
                    {currentSettings.color === c && <Check size={16} color="white" />}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="w-full mt-2 bg-blue-500 text-white rounded-xl py-2 font-semibold hover:bg-blue-600 transition-colors"
              onClick={onClose}
            >
              Uygula
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
