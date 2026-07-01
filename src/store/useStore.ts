import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SupabaseSync } from '../features/sync/supabaseClient';

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
  tags?: string[];
  isPinned?: boolean;
  isDailyNote?: boolean;
  dailyDate?: string;
  actionItems?: { id: string; text: string; completed: boolean }[];
  aiSummary?: string;
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
  
  createDailyNote: () => string;
  toggleTask: (notebookId: string, taskId: string) => void;
  deleteTask: (notebookId: string, taskId: string) => void;
}

const MOCK_FOLDERS: Folder[] = [
  { id: 'f1', title: 'Üniversite', parentId: null, color: 'var(--color-sky)' },
  { id: 'f2', title: 'Kişisel', parentId: null, color: 'var(--color-sakura)' },
  { id: 'f3', title: 'Matematik 101', parentId: 'f1', color: 'var(--color-lemon)' },
];

const MOCK_NOTEBOOKS: Notebook[] = [
  { id: 'n1', title: 'Fizik Notları', folderId: 'f1', coverType: 'color', coverColor: 'var(--color-lavender)', pageStyle: 'grid', fontFamily: 'var(--font-family-base)', icon: '⚛️', updatedAt: '2026-06-29', pageCount: 30, tags: ['bilim', 'sınav'], isPinned: true },
  { id: 'n2', title: 'Günlük', folderId: 'f2', coverType: 'color', coverColor: 'var(--color-mint)', pageStyle: 'lined', fontFamily: 'var(--font-family-base)', icon: '📖', updatedAt: '2026-06-28', pageCount: 30, tags: ['kişisel'] },
  { id: 'n3', title: 'Kalkülüs', folderId: 'f3', coverType: 'color', coverColor: 'var(--color-sky-dark)', pageStyle: 'blank', fontFamily: 'var(--font-family-base)', icon: '📐', updatedAt: '2026-06-27', pageCount: 30 },
  { id: 'n4', title: 'Hızlı Taslaklar', folderId: null, coverType: 'color', coverColor: 'var(--color-peach)', pageStyle: 'dots', fontFamily: 'var(--font-family-base)', icon: '✏️', updatedAt: '2026-06-29', pageCount: 30, isPinned: true },
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
      
      addNotebook: (notebook) => set((state) => {
        const newN = { ...notebook, id: Date.now().toString(), updatedAt: new Date().toISOString().split('T')[0], pageCount: notebook.pageCount ?? 30 };
        SupabaseSync.uploadNotebooks([newN]);
        return { notebooks: [...state.notebooks, newN] };
      }),
      updateNotebook: (id, updates) => set((state) => {
        const updated = state.notebooks.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : n);
        const match = updated.find(n => n.id === id);
        if (match) SupabaseSync.uploadNotebooks([match]);
        return { notebooks: updated };
      }),
      deleteNotebook: (id) => set((state) => {
        SupabaseSync.deleteNotebook(id);
        return { notebooks: state.notebooks.filter(n => n.id !== id) };
      }),
      
      addFolder: (folder) => set((state) => {
        const newF = { ...folder, id: Date.now().toString() };
        SupabaseSync.uploadFolders([newF]);
        return { folders: [...state.folders, newF] };
      }),
      updateFolder: (id, updates) => set((state) => {
        const updated = state.folders.map(f => f.id === id ? { ...f, ...updates } : f);
        const match = updated.find(f => f.id === id);
        if (match) SupabaseSync.uploadFolders([match]);
        return { folders: updated };
      }),
      deleteFolder: (id) => set((state) => {
        SupabaseSync.deleteFolder(id);
        return { folders: state.folders.filter(f => f.id !== id) };
      }),
      
      createDailyNote: () => {
        let dailyNoteId = '';
        set((state) => {
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
          
          // Check if a daily note already exists for today
          const existing = state.notebooks.find(n => n.isDailyNote && n.dailyDate === dateStr);
          if (existing) {
            dailyNoteId = existing.id;
            return {};
          }
          
          const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
          const friendlyDate = today.toLocaleDateString('tr-TR', options); // e.g., "1 Temmuz 2026"
          
          const newId = Date.now().toString();
          const newNotebook: Notebook = {
            id: newId,
            title: `Günlük: ${friendlyDate}`,
            folderId: null,
            coverType: 'color',
            coverColor: 'var(--color-sakura)',
            pageStyle: 'dots',
            pageSettings: {
              pattern: 'journal',
              opacity: 0.4,
              thickness: 1,
              density: 1,
              color: 'var(--text-tertiary)'
            },
            fontFamily: 'var(--font-family-base)',
            icon: '📅',
            updatedAt: dateStr,
            isDailyNote: true,
            dailyDate: dateStr,
            tags: ['günlük'],
            actionItems: []
          };
          
          SupabaseSync.uploadNotebooks([newNotebook]);
          dailyNoteId = newId;
          return { notebooks: [...state.notebooks, newNotebook] };
        });
        return dailyNoteId;
      },
      
      toggleTask: (notebookId, taskId) => set((state) => {
        const nextN = state.notebooks.map(n => {
          if (n.id !== notebookId) return n;
          const updatedN = {
            ...n,
            actionItems: (n.actionItems || []).map(t => 
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          };
          SupabaseSync.uploadNotebooks([updatedN]);
          return updatedN;
        });
        return { notebooks: nextN };
      }),
      
      deleteTask: (notebookId, taskId) => set((state) => {
        const nextN = state.notebooks.map(n => {
          if (n.id !== notebookId) return n;
          const updatedN = {
            ...n,
            actionItems: (n.actionItems || []).filter(t => t.id !== taskId)
          };
          SupabaseSync.uploadNotebooks([updatedN]);
          return updatedN;
        });
        return { notebooks: nextN };
      }),
    }),
    {
      name: 'kawaiinote-app-storage',
    }
  )
);
