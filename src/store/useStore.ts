import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PageSettings {
  pattern: 'blank' | 'lined' | 'grid' | 'dots' | 'music' | 'cornell' | 'hexagon' | 'isometric' | 'planner' | 'journal' | 'graph' | 'calligraphy' | 'engineering' | 'storyboard' | 'checklist' | 'kanban' | 'calendar' | 'tracker' | 'recipe' | 'fitness';
  opacity: number;
  thickness: number;
  density: number;
  color: string;
}

export interface Notebook {
  id: string;
  title: string;
  folderId: string | null;
  coverType: 'color' | 'image';
  coverColor: string;
  coverImage?: string;
  pageStyle: string; // Deprecated, kept for backward compatibility
  pageSettings?: PageSettings; // New advanced settings
  pageCount?: number; // Total pages in the notebook
  fontFamily: string;
  icon: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  title: string;
  parentId: string | null;
  color: string;
}

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  notebooks: Notebook[];
  folders: Folder[];
  currentFolderId: string | null;
  setCurrentFolder: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  addNotebook: (notebook: Omit<Notebook, 'id' | 'updatedAt'>) => void;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;
  
  addFolder: (folder: Omit<Folder, 'id'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
}

const MOCK_FOLDERS: Folder[] = [
  { id: 'f1', title: 'Üniversite', parentId: null, color: 'var(--color-sky)' },
  { id: 'f2', title: 'Kişisel', parentId: null, color: 'var(--color-sakura)' },
  { id: 'f3', title: 'Matematik 101', parentId: 'f1', color: 'var(--color-lemon)' },
];

const MOCK_NOTEBOOKS: Notebook[] = [
  { id: 'n1', title: 'Fizik Notları', folderId: 'f1', coverType: 'color', coverColor: 'var(--color-lavender)', pageStyle: 'grid', fontFamily: 'var(--font-family-base)', icon: '⚛️', updatedAt: '2026-06-29', pageCount: 30 },
  { id: 'n2', title: 'Günlük', folderId: 'f2', coverType: 'color', coverColor: 'var(--color-mint)', pageStyle: 'lined', fontFamily: 'var(--font-family-base)', icon: '📖', updatedAt: '2026-06-28', pageCount: 30 },
  { id: 'n3', title: 'Kalkülüs', folderId: 'f3', coverType: 'color', coverColor: 'var(--color-sky-dark)', pageStyle: 'blank', fontFamily: 'var(--font-family-base)', icon: '📐', updatedAt: '2026-06-27', pageCount: 30 },
  { id: 'n4', title: 'Hızlı Taslaklar', folderId: null, coverType: 'color', coverColor: 'var(--color-peach)', pageStyle: 'dots', fontFamily: 'var(--font-family-base)', icon: '✏️', updatedAt: '2026-06-29', pageCount: 30 },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        return { theme: newTheme };
      }),
      
      notebooks: MOCK_NOTEBOOKS,
      folders: MOCK_FOLDERS,
      currentFolderId: null,
      setCurrentFolder: (id) => set({ currentFolderId: id }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      addNotebook: (notebook) => set((state) => ({
        notebooks: [...state.notebooks, { ...notebook, id: Date.now().toString(), updatedAt: new Date().toISOString().split('T')[0], pageCount: notebook.pageCount ?? 30 }]
      })),
      updateNotebook: (id, updates) => set((state) => ({
        notebooks: state.notebooks.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : n)
      })),
      deleteNotebook: (id) => set((state) => ({
        notebooks: state.notebooks.filter(n => n.id !== id)
      })),
      
      addFolder: (folder) => set((state) => ({
        folders: [...state.folders, { ...folder, id: Date.now().toString() }]
      })),
      updateFolder: (id, updates) => set((state) => ({
        folders: state.folders.map(f => f.id === id ? { ...f, ...updates } : f)
      })),
      deleteFolder: (id) => set((state) => ({
        folders: state.folders.filter(f => f.id !== id)
      })),
    }),
    {
      name: 'kawaiinote-app-storage',
    }
  )
);
