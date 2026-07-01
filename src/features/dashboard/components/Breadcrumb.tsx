import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { IconButton } from '../../../components/ui/IconButton';

export const Breadcrumb: React.FC = () => {
  const { currentFolderId, folders, setCurrentFolder } = useStore();

  const getPath = () => {
    const path = [];
    let current = folders.find(f => f.id === currentFolderId);
    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current?.parentId);
    }
    return path;
  };

  const path = getPath();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
      <IconButton 
        icon={<Home size={20} />} 
        onClick={() => setCurrentFolder(null)} 
        size="sm"
        style={{ color: currentFolderId === null ? 'var(--color-primary)' : 'var(--text-secondary)' }}
      />
      
      {path.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight size={16} color="var(--text-tertiary)" />
          <button
            onClick={() => setCurrentFolder(folder.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: index === path.length - 1 ? 700 : 500,
              color: index === path.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'inherit'
            }}
          >
            {folder.title}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
