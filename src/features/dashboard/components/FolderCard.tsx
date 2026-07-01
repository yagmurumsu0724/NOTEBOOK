import React, { useState } from 'react';
import { Folder as FolderIcon, Edit2, Trash2, Check, X } from 'lucide-react';
import type { Folder } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconButton } from '../../../components/ui/IconButton';

interface Props {
  folder: Folder;
  onClick: () => void;
}

const PRESET_COLORS = [
  'var(--color-sakura)', 'var(--color-mint)', 'var(--color-peach)', 
  'var(--color-sky)', 'var(--color-lavender)', 'var(--color-lemon)',
  'var(--text-secondary)'
];

export const FolderCard: React.FC<Props> = ({ folder, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(folder.title);
  const [editColor, setEditColor] = useState(folder.color);
  
  const updateFolder = useStore(state => state.updateFolder);
  const deleteFolder = useStore(state => state.deleteFolder);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateFolder(folder.id, { title: editTitle, color: editColor });
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`'${folder.title}' klasörünü silmek istediğinize emin misiniz? (İçindeki öğeler kaybolur)`)) {
      deleteFolder(folder.id);
    }
  };

  return (
    <GlassCard 
      hoverEffect={!isEditing}
      onClick={() => { if (!isEditing) onClick(); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        cursor: isEditing ? 'default' : 'pointer',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        borderLeft: `4px solid ${isEditing ? editColor : folder.color}`,
        position: 'relative'
      }}
    >
      {isEditing ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <FolderIcon size={32} color={editColor} fill={`${editColor}33`} />
            <input 
              value={editTitle} onChange={e => setEditTitle(e.target.value)}
              style={{ flex: 1, fontSize: '1.25rem', fontWeight: 600, background: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: '8px', padding: '4px 8px' }}
            />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESET_COLORS.map(c => (
              <div 
                key={c} onClick={(e) => { e.stopPropagation(); setEditColor(c); }}
                style={{ width: '20px', height: '20px', borderRadius: '50%', background: c, cursor: 'pointer', border: editColor === c ? '2px solid rgba(0,0,0,0.5)' : '2px solid transparent' }} 
              />
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
               <IconButton icon={<Check size={16} color="var(--color-mint)" />} onClick={handleSave} variant="solid" size="sm" />
               <IconButton icon={<X size={16} />} onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} variant="solid" size="sm" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <FolderIcon size={32} color={folder.color} fill={`${folder.color}33`} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={folder.title}>
            {folder.title}
          </span>
          {isHovered && (
            <div style={{ display: 'flex', gap: '5px' }}>
              <IconButton icon={<Edit2 size={16} />} onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} variant="ghost" size="sm" />
              <IconButton icon={<Trash2 size={16} color="var(--color-sakura)" />} onClick={handleDelete} variant="ghost" size="sm" />
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
};
