import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { FolderCard } from './components/FolderCard';
import { NotebookCard } from './components/NotebookCard';
import { Breadcrumb } from './components/Breadcrumb';
import { CreateNotebookModal } from './components/CreateNotebookModal';
import { GlassCard } from '../../components/ui/GlassCard';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { folders, notebooks, currentFolderId, searchQuery, setSearchQuery, setCurrentFolder, addFolder } = useStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    document.title = 'KawaiiNote | Ana Sayfa';
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const searchLower = searchQuery.toLowerCase();

  const currentFolders = folders.filter(f => 
    isSearching 
      ? f.title.toLowerCase().includes(searchLower)
      : f.parentId === currentFolderId
  );
  
  const currentNotebooks = notebooks.filter(n => 
    isSearching 
      ? n.title.toLowerCase().includes(searchLower)
      : n.folderId === currentFolderId
  );

  const getFolderPath = (id: string | null): string => {
    if (!id) return 'Ana Dizin';
    const folder = folders.find(f => f.id === id);
    if (!folder) return '';
    if (folder.parentId) return `${getFolderPath(folder.parentId)} / ${folder.title}`;
    return folder.title;
  };

  return (
    <div className="dashboard-container">
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="dashboard-title"
          style={{ margin: 0, fontSize: '2.5rem' }}
        >
          KawaiiNote
        </motion.h1>

        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={20} color="var(--text-tertiary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Tüm defter ve klasörlerde ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem 0.8rem 3rem',
              borderRadius: 'var(--border-radius-full)',
              border: '1px solid var(--text-tertiary)',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(10px)',
              fontFamily: 'inherit',
              fontSize: '1rem',
              color: 'var(--text-primary)',
              outline: 'none',
              boxShadow: 'var(--shadow-soft)'
            }}
          />
        </div>
      </div>

      {!isSearching && <Breadcrumb />}
      {isSearching && <div style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>"{searchQuery}" için arama sonuçları:</div>}

      {/* Folders Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Klasörler</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          
          {!isSearching && (
            <GlassCard 
              hoverEffect
              onClick={() => addFolder({ title: 'Yeni Klasör', parentId: currentFolderId, color: 'var(--color-sky)' })}
              style={{ 
                border: '2px dashed var(--text-tertiary)', 
                display: 'flex', alignItems: 'center', gap: '1rem',
                cursor: 'pointer', color: 'var(--text-secondary)', padding: '1.5rem'
              }}
            >
              <div style={{ background: 'var(--color-sky)', borderRadius: '50%', padding: '0.5rem', color: '#fff' }}>
                <Plus size={24} />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Yeni Klasör</span>
            </GlassCard>
          )}

          {currentFolders.map(folder => (
            <div key={folder.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <FolderCard folder={folder} onClick={() => { setCurrentFolder(folder.id); setSearchQuery(''); }} />
              {isSearching && <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', paddingLeft: '0.5rem' }}>Konum: {getFolderPath(folder.parentId)}</span>}
            </div>
          ))}
          
          {currentFolders.length === 0 && isSearching && <div style={{ color: 'var(--text-tertiary)' }}>Sonuç bulunamadı.</div>}
        </div>
      </div>

      {/* Notebooks Section */}
      <div>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Defterler</h2>
        <div className="grid-container">
          
          {!isSearching && (
            <GlassCard 
              hoverEffect
              onClick={() => setIsModalOpen(true)}
              style={{ 
                border: '2px dashed var(--text-tertiary)', 
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ background: 'var(--color-primary)', borderRadius: '50%', padding: '1rem', marginBottom: '1rem', color: '#fff', boxShadow: 'var(--shadow-glow)' }}>
                <Plus size={32} />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Yeni Defter</span>
            </GlassCard>
          )}

          {currentNotebooks.map(notebook => (
            <div key={notebook.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <NotebookCard notebook={notebook} onClick={() => { navigate(`/canvas/${notebook.id}`); setSearchQuery(''); }} />
              {isSearching && <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', paddingLeft: '0.5rem' }}>Konum: {getFolderPath(notebook.folderId)}</span>}
            </div>
          ))}

          {currentNotebooks.length === 0 && isSearching && <div style={{ color: 'var(--text-tertiary)' }}>Sonuç bulunamadı.</div>}
        </div>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem 0', color: 'var(--text-tertiary)', fontSize: '0.9rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <p>🌸 Made with Kawaii - Digital Stationery</p>
      </footer>
      
      {isModalOpen && <CreateNotebookModal onClose={() => setIsModalOpen(false)} folderId={currentFolderId} />}
    </div>
  );
};
