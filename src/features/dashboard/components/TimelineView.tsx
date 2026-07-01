import React from 'react';
import { useStore } from '../../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';

export const TimelineView: React.FC = () => {
  const navigate = useNavigate();
  const { notebooks, folders } = useStore();

  // Sort notebooks by updatedAt descending
  const sortedNotebooks = [...notebooks].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const getFolderPath = (folderId: string | null): string => {
    if (!folderId) return 'Ana Dizin';
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return '';
    return folder.title;
  };

  const getRelativeGroup = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    
    // Normalize times to count days correctly
    const d1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Bugün';
    if (diffDays === 1) return 'Dün';
    if (diffDays <= 7) return 'Bu Hafta';
    if (diffDays <= 14) return 'Geçen Hafta';
    
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  // Group notebooks
  const grouped: { [key: string]: typeof notebooks } = {};
  sortedNotebooks.forEach(n => {
    const group = getRelativeGroup(n.updatedAt);
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(n);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingLeft: '1rem', position: 'relative' }}>
      
      {/* Visual vertical timeline line */}
      <div 
        style={{
          position: 'absolute',
          left: '24px',
          top: '10px',
          bottom: '20px',
          width: '4px',
          background: 'linear-gradient(180deg, var(--color-sakura) 0%, rgba(255, 183, 178, 0.15) 100%)',
          borderRadius: '2px',
          zIndex: 0
        }}
      />

      {sortedNotebooks.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.5)',
          borderRadius: '16px',
          padding: '4rem 1rem',
          textAlign: 'center',
          border: '1px dashed rgba(0,0,0,0.06)',
          zIndex: 1
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>⏳</div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)' }}>Zaman Tüneliniz Boş</h3>
          <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            Not defteri oluşturdukça ve güncelledikçe zaman tüneliniz burada şekillenecek!
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([groupName, items]) => (
          <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', zIndex: 1 }}>
            
            {/* Timeline Group Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div 
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--color-sakura)',
                  border: '4px solid #fff',
                  boxShadow: '0 0 10px rgba(255, 183, 178, 0.8)',
                  marginLeft: '10px',
                  zIndex: 2
                }}
              />
              <span 
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: 'linear-gradient(135deg, rgba(255,183,178,0.1), rgba(255,183,178,0.02))',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,183,178,0.15)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {groupName}
              </span>
            </div>

            {/* Timeline Cards for Group */}
            <div style={{ paddingLeft: '3rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {items.map(notebook => (
                <div key={notebook.id} style={{ position: 'relative' }}>
                  
                  {/* Left pointing arrow connector */}
                  <div 
                    style={{
                      position: 'absolute',
                      left: '-10px',
                      top: '25px',
                      width: '10px',
                      height: '10px',
                      background: '#fff',
                      borderLeft: '1px solid rgba(0,0,0,0.06)',
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                      transform: 'rotate(45deg)',
                      zIndex: 1
                    }}
                  />

                  <GlassCard 
                    hoverEffect
                    onClick={() => navigate(`/canvas/${notebook.id}`)}
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem',
                      cursor: 'pointer',
                      border: '1px solid rgba(0,0,0,0.04)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.015)'
                    }}
                  >
                    
                    {/* Header Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>{notebook.icon}</span>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {notebook.title}
                        </h4>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        <Clock size={12} />
                        <span>Son Güncelleme: {notebook.updatedAt}</span>
                      </div>
                    </div>

                    {/* Folder Path & Tags */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        📁 {getFolderPath(notebook.folderId)}
                      </span>
                      {notebook.tags && notebook.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* AI Memory / Summary Segment */}
                    <div 
                      style={{ 
                        background: notebook.aiSummary ? 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(168,85,247,0.02))' : 'rgba(0,0,0,0.02)',
                        border: notebook.aiSummary ? '1px solid rgba(139,92,246,0.1)' : '1px dashed rgba(0,0,0,0.05)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginTop: '0.2rem',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                    >
                      {notebook.aiSummary ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                            <Sparkles size={14} />
                            <span>AI HAFIZA ÖZETİ</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {notebook.aiSummary}
                          </p>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(`/canvas/${notebook.id}?ai=true`); }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 500 }}>
                            <Sparkles size={14} /> Yapay zeka hafıza özetini çıkarmak için notu analiz edin.
                          </span>
                          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                            Şimdi Analiz Et <ArrowRight size={12} />
                          </span>
                        </div>
                      )}
                    </div>

                  </GlassCard>
                </div>
              ))}
            </div>

          </div>
        ))
      )}

    </div>
  );
};
