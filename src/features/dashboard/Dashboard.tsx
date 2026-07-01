import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Folder as FolderIcon, Star, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { FolderCard } from './components/FolderCard';
import { NotebookCard } from './components/NotebookCard';
import { Breadcrumb } from './components/Breadcrumb';
import { CreateNotebookModal } from './components/CreateNotebookModal';
import { GlassCard } from '../../components/ui/GlassCard';
import './Dashboard.css';

type ViewMode = 'all' | 'pinned' | 'folder' | 'tag';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { folders, notebooks, currentFolderId, searchQuery, setSearchQuery, setCurrentFolder, addFolder } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('folder');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = 'KawaiiNote | Ana Sayfa';
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const searchLower = searchQuery.toLowerCase();

  // Extract all unique tags from notebooks
  const allTags = Array.from(new Set(notebooks.flatMap(n => n.tags || [])));

  // Filter logic based on view mode
  let displayFolders = folders;
  let displayNotebooks = notebooks;

  if (isSearching) {
    displayFolders = folders.filter(f => f.title.toLowerCase().includes(searchLower));
    displayNotebooks = notebooks.filter(n => 
      n.title.toLowerCase().includes(searchLower) ||
      (n.tags || []).some(t => t.toLowerCase().includes(searchLower))
    );
  } else {
    if (viewMode === 'all') {
      displayFolders = folders;
      displayNotebooks = notebooks;
    } else if (viewMode === 'pinned') {
      displayFolders = [];
      displayNotebooks = notebooks.filter(n => n.isPinned);
    } else if (viewMode === 'tag' && activeTag) {
      displayFolders = [];
      displayNotebooks = notebooks.filter(n => n.tags?.includes(activeTag));
    } else {
      // folder view (default)
      displayFolders = folders.filter(f => f.parentId === currentFolderId);
      displayNotebooks = notebooks.filter(n => n.folderId === currentFolderId);
    }
  }

  const getFolderPath = (id: string | null): string => {
    if (!id) return 'Ana Dizin';
    const folder = folders.find(f => f.id === id);
    if (!folder) return '';
    if (folder.parentId) return `${getFolderPath(folder.parentId)} / ${folder.title}`;
    return folder.title;
  };

  const NavItem = ({ icon: Icon, label, isActive, onClick, badge }: any) => (
    <div 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem', 
        borderRadius: '12px', cursor: 'pointer',
        background: isActive ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(168,85,247,0.08))' : 'transparent',
        color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
        fontWeight: isActive ? 600 : 500,
        transition: 'all 0.2s ease',
        position: 'relative' as const
      }}
    >
      <Icon size={18} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          background: isActive ? 'var(--color-primary)' : 'rgba(0,0,0,0.08)',
          color: isActive ? '#fff' : 'var(--text-tertiary)',
          fontSize: '0.7rem', fontWeight: 700,
          padding: '2px 8px', borderRadius: '10px',
          minWidth: '20px', textAlign: 'center' as const
        }}>{badge}</span>
      )}
    </div>
  );

  return (
    <div className="dashboard-layout">
      
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="sidebar-brand"
        >
          <span className="sidebar-logo">🌸</span>
          <h1 className="sidebar-title">KawaiiNote</h1>
        </motion.div>

        <div className="sidebar-nav">
          <NavItem 
            icon={Home} label="Tüm Notlar" badge={notebooks.length}
            isActive={viewMode === 'all' && !isSearching} 
            onClick={() => { setViewMode('all'); setSearchQuery(''); }} 
          />
          <NavItem 
            icon={FolderIcon} label="Klasörler" badge={folders.length}
            isActive={viewMode === 'folder' && !isSearching} 
            onClick={() => { setViewMode('folder'); setCurrentFolder(null); setSearchQuery(''); }} 
          />
          <NavItem 
            icon={Star} label="Pinlenenler" badge={notebooks.filter(n => n.isPinned).length}
            isActive={viewMode === 'pinned' && !isSearching} 
            onClick={() => { setViewMode('pinned'); setSearchQuery(''); }} 
          />
        </div>

        {/* Tags Section */}
        {allTags.length > 0 && (
          <div className="sidebar-tags">
            <div className="sidebar-section-title">Etiketler</div>
            <div className="tags-list">
              {allTags.map(tag => (
                <span 
                  key={tag}
                  onClick={() => { setViewMode('tag'); setActiveTag(tag); setSearchQuery(''); }}
                  className={`tag-chip ${viewMode === 'tag' && activeTag === tag ? 'tag-chip-active' : ''}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>🌸 Made with Kawaii</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <div className="dashboard-topbar">
          <div>
            <h2 className="dashboard-view-title">
              {isSearching ? `"${searchQuery}" Sonuçları` : 
               viewMode === 'all' ? 'Tüm Notlar' :
               viewMode === 'pinned' ? '⭐ Pinlenen Defterler' :
               viewMode === 'tag' ? `#${activeTag} Etiketli Notlar` :
               currentFolderId ? getFolderPath(currentFolderId) : '📁 Ana Dizin'}
            </h2>
            <p className="dashboard-view-subtitle">
              {displayNotebooks.length} defter{displayFolders.length > 0 ? `, ${displayFolders.length} klasör` : ''}
            </p>
          </div>

          <div className="dashboard-search-wrapper">
            <Search size={18} className="dashboard-search-icon" />
            <input 
              type="text" 
              placeholder="Defter, klasör veya etiket ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dashboard-search-input"
            />
          </div>
        </div>

        {viewMode === 'folder' && !isSearching && <Breadcrumb />}

        {/* Pinned Section (shown in 'all' mode) */}
        {viewMode === 'all' && !isSearching && notebooks.filter(n => n.isPinned).length > 0 && (
          <div className="dashboard-section">
            <h3 className="dashboard-section-title">📌 Pinlenenler</h3>
            <div className="grid-container">
              {notebooks.filter(n => n.isPinned).map(notebook => (
                <div key={notebook.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <NotebookCard notebook={notebook} onClick={() => { navigate(`/canvas/${notebook.id}`); setSearchQuery(''); }} />
                  <span className="notebook-location">📍 {getFolderPath(notebook.folderId)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Folders Section */}
        {displayFolders.length > 0 && (
          <div className="dashboard-section">
            <h3 className="dashboard-section-title">📁 Klasörler</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              
              {!isSearching && viewMode === 'folder' && (
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

              {displayFolders.map(folder => (
                <div key={folder.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <FolderCard folder={folder} onClick={() => { setCurrentFolder(folder.id); setSearchQuery(''); setViewMode('folder'); }} />
                  {(isSearching || viewMode === 'all') && <span className="notebook-location">📍 {getFolderPath(folder.parentId)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notebooks Section */}
        <div className="dashboard-section">
          {(viewMode !== 'pinned' || isSearching) && <h3 className="dashboard-section-title">📓 Defterler</h3>}
          <div className="grid-container">
            
            {!isSearching && (viewMode === 'folder' || viewMode === 'all') && (
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

            {displayNotebooks.map(notebook => (
              <div key={notebook.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <NotebookCard notebook={notebook} onClick={() => { navigate(`/canvas/${notebook.id}`); setSearchQuery(''); }} />
                {(isSearching || viewMode === 'all' || viewMode === 'tag' || viewMode === 'pinned') && 
                  <span className="notebook-location">📍 {getFolderPath(notebook.folderId)}</span>
                }
                {notebook.tags && notebook.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', paddingLeft: '0.5rem' }}>
                    {notebook.tags.map(tag => (
                      <span key={tag} className="tag-chip-small">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {displayNotebooks.length === 0 && displayFolders.length === 0 && (
              <div style={{ color: 'var(--text-tertiary)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p>Sonuç bulunamadı.</p>
              </div>
            )}
          </div>
        </div>

      </main>
      
      {isModalOpen && <CreateNotebookModal onClose={() => setIsModalOpen(false)} folderId={viewMode === 'folder' ? currentFolderId : null} />}
    </div>
  );
};
