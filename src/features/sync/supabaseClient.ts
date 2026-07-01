import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL_KEY = 'kawaiinote-supabase-url';
const ANON_KEY = 'kawaiinote-supabase-anon';

let supabaseInstance: SupabaseClient | null = null;

export const SupabaseSync = {
  getConfig() {
    return {
      url: localStorage.getItem(URL_KEY) || '',
      anonKey: localStorage.getItem(ANON_KEY) || ''
    };
  },

  saveConfig(url: string, anonKey: string) {
    if (!url.trim() || !anonKey.trim()) {
      localStorage.removeItem(URL_KEY);
      localStorage.removeItem(ANON_KEY);
      supabaseInstance = null;
      return;
    }
    localStorage.setItem(URL_KEY, url.trim());
    localStorage.setItem(ANON_KEY, anonKey.trim());
    
    try {
      supabaseInstance = createClient(url.trim(), anonKey.trim(), {
        auth: { persistSession: false }
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      supabaseInstance = null;
    }
  },

  getClient(): SupabaseClient | null {
    if (supabaseInstance) return supabaseInstance;
    
    const { url, anonKey } = this.getConfig();
    if (url && anonKey) {
      try {
        supabaseInstance = createClient(url, anonKey, {
          auth: { persistSession: false }
        });
        return supabaseInstance;
      } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
        return null;
      }
    }
    return null;
  },

  isConfigured(): boolean {
    const { url, anonKey } = this.getConfig();
    return !!url && !!anonKey;
  },

  // SQL Schema to show in the UI for the user to copy-paste
  getSQLSchema(): string {
    return `
-- 1. FOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "parentId" TEXT,
    color TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. NOTEBOOKS TABLE
CREATE TABLE IF NOT EXISTS public.notebooks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    "folderId" TEXT,
    "coverType" TEXT NOT NULL,
    "coverColor" TEXT NOT NULL,
    "coverImage" TEXT,
    "fontFamily" TEXT NOT NULL,
    icon TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    "isPinned" BOOLEAN DEFAULT false,
    "isDailyNote" BOOLEAN DEFAULT false,
    "dailyDate" TEXT,
    "actionItems" JSONB DEFAULT '[]'::jsonb,
    "aiSummary" TEXT,
    "pageStyle" TEXT DEFAULT 'dots',
    "pageSettings" JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CANVAS STROKES TABLE
CREATE TABLE IF NOT EXISTS public.canvas_strokes (
    notebook_id TEXT PRIMARY KEY,
    strokes JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) or disable/bypass for simple anon access
-- For anonymous quick setup, enable Read/Write policies for anyone:
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_strokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON public.folders FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.folders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.folders FOR DELETE USING (true);

CREATE POLICY "Allow public select" ON public.notebooks FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.notebooks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.notebooks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.notebooks FOR DELETE USING (true);

CREATE POLICY "Allow public select" ON public.canvas_strokes FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.canvas_strokes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.canvas_strokes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.canvas_strokes FOR DELETE USING (true);
    `.trim();
  },

  // Sync out: Local -> Cloud
  async uploadFolders(folders: any[]) {
    const client = this.getClient();
    if (!client || folders.length === 0) return;
    
    const formatted = folders.map(f => ({
      id: f.id,
      title: f.title,
      parentId: f.parentId,
      color: f.color
    }));

    const { error } = await client.from('folders').upsert(formatted);
    if (error) console.error('Error uploading folders to Supabase:', error);
  },

  async uploadNotebooks(notebooks: any[]) {
    const client = this.getClient();
    if (!client || notebooks.length === 0) return;

    const formatted = notebooks.map(n => ({
      id: n.id,
      title: n.title,
      folderId: n.folderId,
      coverType: n.coverType,
      coverColor: n.coverColor,
      coverImage: n.coverImage,
      fontFamily: n.fontFamily,
      icon: n.icon,
      updatedAt: n.updatedAt,
      tags: n.tags || [],
      isPinned: !!n.isPinned,
      dailyDate: n.dailyDate,
      actionItems: n.actionItems || [],
      aiSummary: n.aiSummary,
      pageStyle: n.pageStyle || 'dots',
      pageSettings: n.pageSettings || {}
    }));

    const { error } = await client.from('notebooks').upsert(formatted);
    if (error) console.error('Error uploading notebooks to Supabase:', error);
  },

  async uploadStrokes(notebookId: string, strokes: any[]) {
    const client = this.getClient();
    if (!client) return;

    const { error } = await client.from('canvas_strokes').upsert({
      notebook_id: notebookId,
      strokes: strokes
    });
    if (error) console.error('Error uploading strokes to Supabase:', error);
  },

  async deleteNotebook(id: string) {
    const client = this.getClient();
    if (!client) return;
    await client.from('notebooks').delete().eq('id', id);
    await client.from('canvas_strokes').delete().eq('notebook_id', id);
  },

  async deleteFolder(id: string) {
    const client = this.getClient();
    if (!client) return;
    await client.from('folders').delete().eq('id', id);
  },

  // Sync in: Cloud -> Local
  async downloadAll() {
    const client = this.getClient();
    if (!client) return null;

    const [foldersRes, notebooksRes, strokesRes] = await Promise.all([
      client.from('folders').select('*'),
      client.from('notebooks').select('*'),
      client.from('canvas_strokes').select('*')
    ]);

    if (foldersRes.error || notebooksRes.error || strokesRes.error) {
      console.error('Error downloading data from Supabase:', {
        folders: foldersRes.error,
        notebooks: notebooksRes.error,
        strokes: strokesRes.error
      });
      return null;
    }

    // Format folders
    const localFolders = (foldersRes.data || []).map(f => ({
      id: f.id,
      title: f.title,
      parentId: f.parentId,
      color: f.color
    }));

    // Format notebooks
    const localNotebooks = (notebooksRes.data || []).map(n => ({
      id: n.id,
      title: n.title,
      folderId: n.folderId,
      coverType: n.coverType,
      coverColor: n.coverColor,
      coverImage: n.coverImage,
      fontFamily: n.fontFamily,
      icon: n.icon,
      updatedAt: n.updatedAt,
      tags: n.tags || [],
      isPinned: !!n.isPinned,
      dailyDate: n.dailyDate,
      actionItems: n.actionItems || [],
      aiSummary: n.aiSummary,
      pageStyle: n.pageStyle || 'dots',
      pageSettings: n.pageSettings || {}
    }));

    // Format strokes map
    const localStrokesMap: { [key: string]: any[] } = {};
    (strokesRes.data || []).forEach(cs => {
      localStrokesMap[cs.notebook_id] = cs.strokes || [];
    });

    return {
      folders: localFolders,
      notebooks: localNotebooks,
      strokesMap: localStrokesMap
    };
  }
};
