import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from '../../../components/ui/IconButton';
import { useCanvasStore } from '../../../store/useCanvasStore';

interface PenSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PenSettingsModal: React.FC<PenSettingsModalProps> = ({ isOpen, onClose }) => {
  const settings = useCanvasStore(state => state.penSettings);
  const setSettings = useCanvasStore(state => state.setPenSettings);

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
            <h3 className="font-bold text-gray-800">Kalem Ayarları</h3>
            <IconButton icon={<X size={18} />} onClick={onClose} variant="ghost" />
          </div>

          <div className="p-4 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">Kalınlık (Size)</label>
                <span className="text-xs text-gray-500 font-mono">{settings.size.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="1" max="40" step="1" 
                value={settings.size} 
                onChange={(e) => setSettings({ size: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <p className="text-[10px] text-gray-400">Çizginin temel kalınlığını belirler.</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">İncelme (Thinning)</label>
                <span className="text-xs text-gray-500 font-mono">{settings.thinning.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="-1" max="1" step="0.05" 
                value={settings.thinning} 
                onChange={(e) => setSettings({ thinning: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <p className="text-[10px] text-gray-400">Hızlı çizimlerde fırçanın ne kadar inceleceğini (veya kalınlaşacağını) ayarlar.</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">Yumuşatma (Smoothing)</label>
                <span className="text-xs text-gray-500 font-mono">{settings.smoothing.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={settings.smoothing} 
                onChange={(e) => setSettings({ smoothing: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <p className="text-[10px] text-gray-400">Çizginin köşe pürüzlerini otomatik yumuşatır.</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-700">Hassasiyet (Streamline)</label>
                <span className="text-xs text-gray-500 font-mono">{settings.streamline.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={settings.streamline} 
                onChange={(e) => setSettings({ streamline: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <p className="text-[10px] text-gray-400">Kalemin elinizin hareketlerine verdiği tepki hızını düzenler.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
