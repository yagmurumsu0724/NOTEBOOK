import React from 'react';
import { motion } from 'framer-motion';
import { renderToString } from 'react-dom/server';
import { 
  Square, Circle, Triangle, Hexagon, Octagon, Pentagon, Diamond, Star, Heart, Cloud, Sun, Moon, Zap,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowUpRight, ArrowUpLeft, ArrowDownRight, ArrowDownLeft, CornerDownRight, CornerUpLeft, CornerDownLeft, CornerUpRight, Reply, Forward,
  MessageCircle, MessageSquare, Speech, Phone, Mail, Send,
  File, Folder, Box, Archive, Database, Server,
  Shield, Key, Lock, Unlock, Tag, Bookmark,
  Check, X, Plus, Minus, Info, AlertTriangle, AlertCircle, HelpCircle, Target, Award, Crown, MapPin
} from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';

const shapeIcons = [
  { icon: Square, name: 'Kare' }, { icon: Circle, name: 'Daire' }, { icon: Triangle, name: 'Üçgen' }, { icon: Hexagon, name: 'Altıgen' }, { icon: Octagon, name: 'Sekizgen' }, { icon: Pentagon, name: 'Beşgen' }, { icon: Diamond, name: 'Elmas' }, { icon: Star, name: 'Yıldız' }, { icon: Heart, name: 'Kalp' }, { icon: Cloud, name: 'Bulut' }, { icon: Sun, name: 'Güneş' }, { icon: Moon, name: 'Ay' }, { icon: Zap, name: 'Şimşek' },
  { icon: ArrowRight, name: 'Sağ Ok' }, { icon: ArrowLeft, name: 'Sol Ok' }, { icon: ArrowUp, name: 'Yukarı Ok' }, { icon: ArrowDown, name: 'Aşağı Ok' }, { icon: ArrowUpRight, name: 'Sağ Yukarı Ok' }, { icon: ArrowUpLeft, name: 'Sol Yukarı Ok' }, { icon: ArrowDownRight, name: 'Sağ Aşağı Ok' }, { icon: ArrowDownLeft, name: 'Sol Aşağı Ok' }, { icon: CornerDownRight, name: 'Sağ Aşağı Köşe' }, { icon: CornerUpLeft, name: 'Sol Yukarı Köşe' }, { icon: CornerDownLeft, name: 'Sol Aşağı Köşe' }, { icon: CornerUpRight, name: 'Sağ Yukarı Köşe' }, { icon: Reply, name: 'Yanıtla' }, { icon: Forward, name: 'İlet' },
  { icon: MessageCircle, name: 'Yuvarlak Mesaj' }, { icon: MessageSquare, name: 'Kare Mesaj' }, { icon: Speech, name: 'Konuşma' }, { icon: Phone, name: 'Telefon' }, { icon: Mail, name: 'Posta' }, { icon: Send, name: 'Gönder' },
  { icon: File, name: 'Dosya' }, { icon: Folder, name: 'Klasör' }, { icon: Box, name: 'Kutu' }, { icon: Archive, name: 'Arşiv' }, { icon: Database, name: 'Veritabanı' }, { icon: Server, name: 'Sunucu' },
  { icon: Shield, name: 'Kalkan' }, { icon: Key, name: 'Anahtar' }, { icon: Lock, name: 'Kilit' }, { icon: Unlock, name: 'Açık Kilit' }, { icon: Tag, name: 'Etiket' }, { icon: Bookmark, name: 'Yer İmi' },
  { icon: Check, name: 'Onay' }, { icon: X, name: 'Çarpı' }, { icon: Plus, name: 'Artı' }, { icon: Minus, name: 'Eksi' }, { icon: Info, name: 'Bilgi' }, { icon: AlertTriangle, name: 'Uyarı Üçgeni' }, { icon: AlertCircle, name: 'Uyarı Dairesi' }, { icon: HelpCircle, name: 'Yardım Dairesi' }, { icon: Target, name: 'Hedef' }, { icon: Award, name: 'Ödül' }, { icon: Crown, name: 'Taç' }, { icon: MapPin, name: 'Konum' }
];

interface ShapesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (svgDataUrl: string) => void;
  currentColor: string;
}

export const ShapesModal: React.FC<ShapesModalProps> = ({ isOpen, onClose, onSelectShape, currentColor }) => {
  if (!isOpen) return null;

  const handleSelect = (IconComponent: any) => {
    try {
      const color = currentColor.startsWith('var(') ? '#000000' : currentColor;
      let svgString = renderToString(<IconComponent size={200} color={color} strokeWidth={2} />);
      
      if (!svgString.includes('xmlns=')) {
        svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      const dataUrl = `data:image/svg+xml;base64,${base64}`;
      
      onSelectShape(dataUrl);
      onClose();
    } catch (e) {
      console.error("Failed to generate SVG", e);
    }
  };

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
          maxHeight: '80vh',
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Hazır Şekiller (50+)</h2>
          <IconButton icon={<X size={24} />} onClick={onClose} variant="ghost" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '16px', overflowY: 'auto', padding: '8px' }}>
          {shapeIcons.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                onClick={() => handleSelect(Icon)}
                title={item.name}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  padding: '12px', borderRadius: '16px', cursor: 'pointer',
                  background: 'transparent', transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Icon size={32} color={currentColor.startsWith('var(') ? '#000' : currentColor} strokeWidth={1.5} />
                <span style={{ fontSize: '0.65rem', marginTop: '8px', textAlign: 'center', color: '#4b5563', fontWeight: 500 }}>{item.name}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
