import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';
import { HANDWRITING_FONTS, loadFont } from '../fonts';

interface FontPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFont: string;
  onSelectFont: (fontId: string) => void;
}

export const FontPickerModal: React.FC<FontPickerModalProps> = ({ isOpen, onClose, currentFont, onSelectFont }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string>('all');

  // Lazy load fonts as they are displayed
  useEffect(() => {
    if (isOpen) {
      HANDWRITING_FONTS.forEach(f => loadFont(f.googleFont));
    }
  }, [isOpen]);

  const filteredFonts = HANDWRITING_FONTS.filter(f => 
    (activeCategory === 'all' || f.category === activeCategory) &&
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [
    { id: 'all', label: 'Tümü' },
    { id: 'kawaii', label: 'Sevimli & Tatlı' },
    { id: 'professional', label: 'Akademik' },
    { id: 'calligraphy', label: 'Kaligrafi' },
    { id: 'casual', label: 'Günlük' },
    { id: 'vintage', label: 'Vintage' }
  ];

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
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl p-6 shadow-2xl w-[90%] max-w-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ border: '1px solid rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">El Yazısı Stilleri</h2>
              <IconButton icon={<X size={24} />} variant="ghost" onClick={onClose} />
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Font ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                    activeCategory === c.id 
                      ? 'bg-purple-600 text-white font-semibold' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFonts.map(font => {
                const isSelected = currentFont === font.id;
                return (
                  <div
                    key={font.id}
                    onClick={() => onSelectFont(font.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      isSelected ? 'border-purple-500 bg-purple-50 shadow-md scale-[1.02]' : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-1">{font.category.toUpperCase()}</p>
                    <p 
                      style={{ fontFamily: `'${font.googleFont}', sans-serif`, fontSize: '1.5rem', lineHeight: 1.2 }}
                      className="text-gray-900"
                    >
                      {font.name}
                    </p>
                    <p 
                      style={{ fontFamily: `'${font.googleFont}', sans-serif`, fontSize: '1rem', opacity: 0.6 }}
                      className="text-gray-700 mt-2 truncate"
                    >
                      Hızlı kahverengi tilki tembel köpeğin üstünden atlar.
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
