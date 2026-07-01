import React, { useState } from 'react';
import type { Notebook } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';

interface Props {
  notebook: Notebook;
  onClick: () => void;
}

const PRESET_COLORS = [
  'var(--color-sakura)', 'var(--color-mint)', 'var(--color-peach)', 
  'var(--color-sky)', 'var(--color-lavender)', 'var(--color-lemon)',
  'var(--color-sky-dark)', 'var(--bg-secondary)'
];

export const NotebookCard: React.FC<Props> = ({ notebook, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editTitle, setEditTitle] = useState(notebook.title);
  const [editIcon, setEditIcon] = useState(notebook.icon);
  const [editColor, setEditColor] = useState(notebook.coverColor);
  
  const updateNotebook = useStore(state => state.updateNotebook);
  const deleteNotebook = useStore(state => state.deleteNotebook);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNotebook(notebook.id, { title: editTitle, icon: editIcon, coverColor: editColor });
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`'${notebook.title}' defterini silmek istediğinize emin misiniz? (İçindeki çizimler kaybolacaktır)`)) {
      deleteNotebook(notebook.id);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditTitle(notebook.title);
    setEditIcon(notebook.icon);
    setEditColor(notebook.coverColor);
  };

  const getBackgroundStyle = () => {
    if (notebook.coverType === 'image' && notebook.coverImage && !isEditing) {
      return {
        background: `url(${notebook.coverImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      background: `linear-gradient(135deg, ${isEditing ? editColor : notebook.coverColor} 0%, rgba(255,255,255,0.3) 100%)`
    };
  };

  return (
    <GlassCard
      hoverEffect={!isEditing}
      onClick={() => { if (!isEditing) onClick(); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: isEditing ? 'default' : 'pointer',
        aspectRatio: '210/297',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        ...getBackgroundStyle()
      }}
    >
      {/* Binding spiral effect on the left */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '20px',
        background: 'rgba(0,0,0,0.1)',
        borderRight: '1px solid rgba(255,255,255,0.4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        padding: '10px 0',
        zIndex: 1
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ width: '8px', height: '12px', background: '#fff', borderRadius: '0 4px 4px 0', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.3)' }} />
        ))}
      </div>
      
      {/* Action Buttons */}
      {!isEditing && isHovered && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
          <IconButton icon={<Edit2 size={16} />} onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} variant="solid" size="sm" />
          <IconButton icon={<Trash2 size={16} color="var(--color-sakura)" />} onClick={handleDelete} variant="solid" size="sm" />
        </div>
      )}

      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 10px 10px 30px', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px', marginBottom: '10px' }}>
             <IconButton icon={<Check size={16} color="var(--color-mint)" />} onClick={handleSave} variant="solid" size="sm" />
             <IconButton icon={<X size={16} />} onClick={handleCancel} variant="solid" size="sm" />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input 
              value={editIcon} onChange={e => setEditIcon(e.target.value)}
              style={{ width: '40px', fontSize: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '8px' }}
              maxLength={2}
            />
            <input 
              value={editTitle} onChange={e => setEditTitle(e.target.value)}
              style={{ flex: 1, fontSize: '1.1rem', fontWeight: 600, background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '8px', padding: '0 8px' }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PRESET_COLORS.map(c => (
              <div 
                key={c} onClick={(e) => { e.stopPropagation(); setEditColor(c); }}
                style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer', border: editColor === c ? '2px solid rgba(0,0,0,0.5)' : '2px solid transparent' }} 
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Simge (icon) kaldırıldı, sadece kapak resmi veya rengi görünecek */}
          </div>
          
          <div style={{ padding: '1rem', paddingLeft: '1.5rem', background: 'var(--bg-glass-strong)', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={notebook.title}>
              {notebook.title}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{notebook.updatedAt}</p>
          </div>
        </>
      )}
    </GlassCard>
  );
};
