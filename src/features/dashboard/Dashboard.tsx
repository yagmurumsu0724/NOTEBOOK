import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Folder as FolderIcon, Star, Home, Brain, Loader2, Calendar, ListTodo, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { FolderCard } from './components/FolderCard';
import { NotebookCard } from './components/NotebookCard';
import { Breadcrumb } from './components/Breadcrumb';
import { CreateNotebookModal } from './components/CreateNotebookModal';
import { GlassCard } from '../../components/ui/GlassCard';
import { SemanticSearchEngine, type SearchResult } from '../ai/SemanticSearch';
import { TasksDashboard } from './components/TasksDashboard';
import { TimelineView } from './components/TimelineView';
import './Dashboard.css';

type ViewMode = 'all' | 'pinned' | 'folder' | 'tag' | 'daily' | 'tasks' | 'timeline';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { folders, notebooks, currentFolderId, searchQuery, setSearchQuery, setCurrentFolder, addFolder, createDailyNote } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('folder');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [semanticResults, setSemanticResults] = useState<SearchResult[]>([]);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticEnabled, setSemanticEnabled] = useState(false);

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
    
    // Also add semantic search results
    if (semanticResults.length > 0) {
      const semanticIds = semanticResults.map(r => r.notebookId);
      const semanticNotebooks = notebooks.filter(n => semanticIds.includes(n.id) && !displayNotebooks.some(dn => dn.id === n.id));
      displayNotebooks = [...displayNotebooks, ...semanticNotebooks];
    }
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
    } else if (viewMode === 'daily') {
      displayFolders = [];
      displayNotebooks = notebooks.filter(n => n.isDailyNote);
    } else {
      // folder view (default)
      displayFolders = folders.filter(f => f.parentId === currentFolderId);
      displayNotebooks = notebooks.filter(n => n.folderId === currentFolderId);
    }
  }

  // Count active pending tasks
  const pendingTasksCount = notebooks.flatMap(n => n.actionItems || []).filter(t => !t.completed).length;

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
          <NavItem 
            icon={Calendar} label="Günlükler (Journal)" badge={notebooks.filter(n => n.isDailyNote).length}
            isActive={viewMode === 'daily' && !isSearching} 
            onClick={() => { setViewMode('daily'); setSearchQuery(''); }} 
          />
          <NavItem 
            icon={ListTodo} label="Görevler (Tasks)" badge={pendingTasksCount}
            isActive={viewMode === 'tasks' && !isSearching} 
            onClick={() => { setViewMode('tasks'); setSearchQuery(''); }} 
          />
          <NavItem 
            icon={Clock} label="Zaman Tüneli"
            isActive={viewMode === 'timeline' && !isSearching} 
            onClick={() => { setViewMode('timeline'); setSearchQuery(''); }} 
          />
          
          {/* Quick daily note button */}
          <button
            onClick={() => {
              const dailyId = createDailyNote();
              navigate(`/canvas/${dailyId}`);
            }}
            className="sidebar-quick-btn"
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.75rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary), #a855f7)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Plus size={16} /> Günlük Not Ekle
          </button>
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
               viewMode === 'daily' ? '📅 Günlük Notlar' :
               viewMode === 'tasks' ? '☑️ Görevlerim (Action Items)' :
               viewMode === 'timeline' ? '⏳ Zaman Tüneli (Timeline)' :
               currentFolderId ? getFolderPath(currentFolderId) : '📁 Ana Dizin'}
            </h2>
            <p className="dashboard-view-subtitle">
              {viewMode === 'timeline' ? `${notebooks.length} defter kronolojisi` : 
               viewMode === 'tasks' ? `${pendingTasksCount} bekleyen görev` :
               `${displayNotebooks.length} defter${displayFolders.length > 0 ? `, ${displayFolders.length} klasör` : ''}`}
            </p>
          </div>

          <div className="dashboard-search-wrapper">
            <Search size={18} className="dashboard-search-icon" />
            <input 
              type="text" 
              placeholder="Defter, klasör veya etiket ara..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Trigger semantic search after debounce
                if (e.target.value.trim().length > 2 && semanticEnabled) {
                  setIsSemanticSearching(true);
                  SemanticSearchEngine.search(e.target.value.trim()).then(results => {
                    setSemanticResults(results);
                    setIsSemanticSearching(false);
                  }).catch(() => setIsSemanticSearching(false));
                } else {
                  setSemanticResults([]);
                }
              }}
              className="dashboard-search-input"
            />
            <button
              onClick={async () => {
                if (!semanticEnabled) {
                  setSemanticEnabled(true);
                  try {
                    await SemanticSearchEngine.loadModel();
                  } catch { /* ignore */ }
                } else {
                  setSemanticEnabled(false);
                  setSemanticResults([]);
                }
              }}
              title={semanticEnabled ? 'Akıllı Arama Aktif' : 'Akıllı Aramayı Aç (AI)'}
              style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                background: semanticEnabled ? 'linear-gradient(135deg, #8b5cf6, #a855f7)' : 'rgba(0,0,0,0.05)',
                border: 'none', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                color: semanticEnabled ? '#fff' : 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600
              }}
            >
              {isSemanticSearching ? <Loader2 size={14} className="spin" /> : <Brain size={14} />}
              {semanticEnabled ? 'AI' : ''}
            </button>
          </div>
        </div>

        {/* Semantic Search Info Banner */}
        {isSearching && semanticResults.length > 0 && (
          <div style={{
            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#8b5cf6'
          }}>
            <Brain size={16} />
            <span>🧠 AI anlam bazlı arama ile <strong>{semanticResults.length}</strong> ek sonuç bulundu</span>
          </div>
        )}

        {viewMode === 'tasks' && !isSearching ? (
          <TasksDashboard />
        ) : viewMode === 'timeline' && !isSearching ? (
          <TimelineView />
        ) : (
          <>
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
        </>
        )}
      </main>
      
      {isModalOpen && <CreateNotebookModal onClose={() => setIsModalOpen(false)} folderId={viewMode === 'folder' ? currentFolderId : null} />}
    </div>
  );
};
