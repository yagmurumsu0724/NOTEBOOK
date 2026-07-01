import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Type, Layout, Upload } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';
import { useStore } from '../../../store/useStore';
// removed unused Notebook import

interface CreateNotebookModalProps {
  onClose: () => void;
  folderId: string | null;
}

const PAGE_STYLES = [
  { id: 'blank', label: 'Boş', icon: '📄' },
  { id: 'lined', label: 'Çizgili', icon: '📝' },
  { id: 'grid', label: 'Kareli', icon: '🧮' },
  { id: 'dots', label: 'Noktalı', icon: '🫥' }
];

const FONTS = [
  { id: 'var(--font-family-base)', label: 'Modern (Sans-serif)' },
  { id: '"Comic Sans MS", cursive, sans-serif', label: 'Eğlenceli (Comic)' },
  { id: '"Courier New", Courier, monospace', label: 'Daktilo (Mono)' },
  { id: '"Brush Script MT", cursive', label: 'El Yazısı' }
];

const COLORS = [
  'var(--color-peach)', 'var(--color-mint)', 'var(--color-lavender)', 
  'var(--color-lemon)', 'var(--color-sky)', 'var(--color-sky-dark)'
];

const EXTENDED_PALETTES = {
  "Geleneksel Pembeler (Anime & Kiraz Çiçeği)": [
    '#EFC4CE', '#F6B3C8', '#EE88C3', '#E2A2AC', '#D9A0B3', '#CE8892', 
    '#F091A0', '#DC6B82', '#DD6B7B', '#C35C6A', '#C35C5D', '#C25160'
  ],
  "Pastel & Tatlı (Kawaii)": [
    '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#F3B0C3',
    '#FDFD96', '#FF9AA2', '#C8E6C9', '#BBDEF0', '#F8B195', '#F67280'
  ],
  "Ten, Göz & Saç Tonları (Portre)": [
    '#FAD6B1', '#E8C39E', '#D6B08B', '#C49D78', '#B28A65', '#A07752',
    '#FFE0C2', '#FFCBA4', '#E8A382', '#C67A5D', '#A45138', '#822813',
    '#3D2314', '#2B1910', '#1A0F09', '#5C7457', '#93A8AC', '#4C5C68'
  ],
  "Canlı & Doğa": [
    '#55EBA8', '#26C485', '#32936F', '#2274A5', '#326273', '#5C6F68',
    '#E0CA3C', '#F29E4C', '#F17105', '#D90368', '#902923', '#2E294E'
  ]
};

// 12 örnek sevimli (kawaii) kapak URL'si
const PREDEFINED_COVERS = [
  '/covers/real_user_32.jpg',
  '/covers/real_user_33.jpg',
  '/covers/real_user_23.jpg',
  '/covers/real_user_24.jpg',
  '/covers/real_user_25.jpg',
  '/covers/real_user_26.jpg',
  '/covers/real_user_18.jpg',
  '/covers/real_user_19.jpg',
  '/covers/real_user_20.jpg',
  '/covers/real_user_21.jpg',
  '/covers/real_user_22.jpg',
  '/covers/real_user_13.jpg',
  '/covers/real_user_14.jpg',
  '/covers/real_user_15.jpg',
  '/covers/real_user_16.jpg',
  '/covers/real_user_17.jpg',
  '/covers/real_user_9.jpg',
  '/covers/real_user_10.jpg',
  '/covers/real_user_11.jpg',
  '/covers/real_user_12.jpg',
  '/covers/real_user_1.jpg',
  '/covers/real_user_2.jpg',
  '/covers/real_user_3.jpg',
  '/covers/real_user_4.jpg',
  '/covers/real_user_5.jpg',
  '/covers/real_user_6.jpg',
  '/covers/real_user_7.jpg',
  '/covers/real_user_8.jpg',
  '/covers/user_1.png',
  '/covers/user_2.png',
  '/covers/user_3.png',
  '/covers/user_4.png',
  '/covers/kawaii_1.png',
  '/covers/kawaii_2.png',
  '/covers/kawaii_3.png',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
  'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=400&q=80',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80',
  'https://images.unsplash.com/photo-1581850518616-bcb8077a2336?w=400&q=80',
  'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&q=80',
  'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=400&q=80',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80'
];

export const CreateNotebookModal: React.FC<CreateNotebookModalProps> = ({ onClose, folderId }) => {
  const addNotebook = useStore(state => state.addNotebook);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('Yeni Defter');
  const [coverType, setCoverType] = useState<'color' | 'image'>('color');
  const [coverColor, setCoverColor] = useState(COLORS[0]);
  const [coverImage, setCoverImage] = useState<string>('');
  const [pageStyle, setPageStyle] = useState<'blank' | 'lined' | 'grid' | 'dots'>('lined');
  const [fontFamily, setFontFamily] = useState(FONTS[0].id);
  const [icon, setIcon] = useState('📓');

  const [activeTab, setActiveTab] = useState<'cover' | 'page' | 'font'>('cover');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverImage(event.target.result as string);
          setCoverType('image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = () => {
    addNotebook({
      title,
      folderId,
      coverType,
      coverColor,
      coverImage: coverType === 'image' ? coverImage : undefined,
      pageStyle,
      pageSettings: {
        pattern: pageStyle as any,
        opacity: 0.5,
        thickness: 1,
        density: 1,
        color: 'var(--text-tertiary)'
      },
      pageCount: 1,
      fontFamily,
      icon
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => {
              const newIcon = prompt('Yeni ikon (Emoji) girin:', icon);
              if (newIcon) setIcon(newIcon);
            }}>{icon}</span>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', outline: 'none' }}
            />
          </h2>
          <IconButton icon={<X size={20} />} onClick={onClose} variant="ghost" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg-glass)' }}>
          <button onClick={() => setActiveTab('cover')} style={{ flex: 1, padding: '1rem', background: activeTab === 'cover' ? 'var(--bg-secondary)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', fontWeight: activeTab === 'cover' ? 'bold' : 'normal', color: 'var(--text-primary)' }}>
            <ImageIcon size={18} /> Kapak
          </button>
          <button onClick={() => setActiveTab('page')} style={{ flex: 1, padding: '1rem', background: activeTab === 'page' ? 'var(--bg-secondary)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', fontWeight: activeTab === 'page' ? 'bold' : 'normal', color: 'var(--text-primary)' }}>
            <Layout size={18} /> Sayfa Stili
          </button>
          <button onClick={() => setActiveTab('font')} style={{ flex: 1, padding: '1rem', background: activeTab === 'font' ? 'var(--bg-secondary)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', fontWeight: activeTab === 'font' ? 'bold' : 'normal', color: 'var(--text-primary)' }}>
            <Type size={18} /> Yazı Tipi
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          
          {activeTab === 'cover' && (
            <div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>Sınırsız Renk Seçici</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-glass-strong)', padding: '0.5rem', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--text-primary)', cursor: 'pointer', background: 'conic-gradient(red, yellow, green, cyan, blue, magenta, red)' }}>
                    <input 
                      type="color" 
                      value={coverColor.startsWith('#') ? coverColor : '#000000'}
                      onChange={(e) => { setCoverType('color'); setCoverColor(e.target.value); }}
                      style={{ opacity: 0, position: 'absolute', top: -10, left: -10, width: '200%', height: '200%', cursor: 'pointer' }}
                      title="Sınırsız Renk Seç"
                    />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>16 Milyon Renk</span>
                </div>
              </div>

              {Object.entries(EXTENDED_PALETTES).map(([category, colors]) => (
                <div key={category} style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{category}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {colors.map(color => (
                      <div 
                        key={color} 
                        onClick={() => { setCoverType('color'); setCoverColor(color); }}
                        style={{ 
                          width: '40px', height: '40px', background: color, borderRadius: '50%', cursor: 'pointer', 
                          border: coverType === 'color' && coverColor === color ? '3px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.1)',
                          boxShadow: 'var(--shadow-soft)',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '2rem 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Görsel & Desenler</h3>
                <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem', background: 'var(--bg-glass-strong)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '20px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <Upload size={16} /> Dışarıdan Yükle
                </button>
                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Galeriden seçin veya cihazınızdan resim yükleyin. Sınırsız resim yükleyebilirsiniz.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem' }}>
                {PREDEFINED_COVERS.map((url, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setCoverType('image'); setCoverImage(url); }}
                    style={{ 
                      aspectRatio: '3/4', 
                      backgroundImage: `url(${url})`, 
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      border: coverType === 'image' && coverImage === url ? '3px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.1)',
                      boxShadow: 'var(--shadow-soft)'
                    }}
                  />
                ))}
                {coverType === 'image' && !PREDEFINED_COVERS.includes(coverImage) && (
                   <div 
                   style={{ 
                     aspectRatio: '3/4', 
                     backgroundImage: `url(${coverImage})`, 
                     backgroundSize: 'cover', 
                     backgroundPosition: 'center', 
                     borderRadius: '8px', 
                     cursor: 'pointer', 
                     border: '3px solid var(--text-primary)',
                     boxShadow: 'var(--shadow-soft)'
                   }}
                 />
                )}
              </div>
            </div>
          )}

          {activeTab === 'page' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {PAGE_STYLES.map(style => (
                <div 
                  key={style.id}
                  onClick={() => setPageStyle(style.id as any)}
                  style={{ 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    border: pageStyle === style.id ? '2px solid var(--color-mint)' : '1px solid rgba(0,0,0,0.1)',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{style.icon}</span>
                  <span style={{ fontWeight: 600 }}>{style.label}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'font' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FONTS.map(font => (
                <div 
                  key={font.id}
                  onClick={() => setFontFamily(font.id)}
                  style={{ 
                    padding: '1.5rem', 
                    borderRadius: '12px', 
                    border: fontFamily === font.id ? '2px solid var(--color-mint)' : '1px solid rgba(0,0,0,0.1)',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontFamily: font.id,
                    fontSize: '1.2rem'
                  }}
                >
                  Abc - {font.label}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'var(--bg-secondary)' }}>
          <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '20px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>İptal</button>
          <button onClick={handleCreate} style={{ padding: '0.75rem 2rem', borderRadius: '20px', border: 'none', background: 'var(--color-mint)', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)', boxShadow: 'var(--shadow-soft)' }}>Defteri Oluştur</button>
        </div>
      </div>
    </div>
  );
};
