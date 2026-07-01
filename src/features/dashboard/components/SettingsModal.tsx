import React, { useState } from 'react';
import { X, Sparkles, Database, Key, CheckCircle2, CloudLightning, Copy, Check } from 'lucide-react';
import { AIInsightEngine, type AIProvider } from '../../ai/AIInsightEngine';
import { SupabaseSync } from '../../sync/supabaseClient';
import { useStore } from '../../../store/useStore';
import { useCanvasStore } from '../../../store/useCanvasStore';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'sync'>('ai');
  
  // AI Settings State
  const aiConfig = AIInsightEngine.getConfig();
  const [aiProvider, setAiProvider] = useState<AIProvider>(aiConfig?.provider || 'gemini');
  const [aiApiKey, setAiApiKey] = useState(aiConfig?.apiKey || '');
  const [aiSaved, setAiSaved] = useState(false);

  // Supabase Sync State
  const syncConfig = SupabaseSync.getConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(syncConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(syncConfig.anonKey);
  const [syncSaved, setSyncSaved] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSaveAI = () => {
    if (!aiApiKey.trim()) {
      AIInsightEngine.clearConfig();
    } else {
      AIInsightEngine.configure(aiProvider, aiApiKey.trim());
    }
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

  const handleSaveSync = () => {
    SupabaseSync.saveConfig(supabaseUrl.trim(), supabaseAnonKey.trim());
    setSyncSaved(true);
    setTimeout(() => setSyncSaved(false), 2000);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SupabaseSync.getSQLSchema());
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Push Local -> Cloud
  const handleForcePush = async () => {
    if (!SupabaseSync.isConfigured()) return;
    setIsSyncing(true);
    setSyncMessage('Yerel veriler buluta aktarılıyor...');
    
    try {
      const { notebooks, folders } = useStore.getState();
      
      // Upload Folders and Notebooks
      await SupabaseSync.uploadFolders(folders);
      await SupabaseSync.uploadNotebooks(notebooks);
      
      // Upload all Canvas Strokes
      const { notebookStrokes } = useCanvasStore.getState();
      const uploadPromises = Object.entries(notebookStrokes).map(([id, strokes]) => 
        SupabaseSync.uploadStrokes(id, strokes)
      );
      await Promise.all(uploadPromises);

      setSyncMessage('🚀 Yedekleme tamamlandı! Tüm veriler buluta aktarıldı.');
    } catch (e: any) {
      console.error(e);
      setSyncMessage(`❌ Aktarım hatası: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull Cloud -> Local
  const handleForcePull = async () => {
    if (!SupabaseSync.isConfigured()) return;
    if (!window.confirm('Buluttaki verileri indirmek yerel verilerinizin üzerine yazacaktır. Devam etmek istiyor musunuz?')) return;
    
    setIsSyncing(true);
    setSyncMessage('Buluttaki veriler indiriliyor...');

    try {
      const data = await SupabaseSync.downloadAll();
      if (!data) {
        setSyncMessage('❌ Hata: Buluttan veri indirilemedi. Supabase tablolarınızı kurduğunuzdan emin olun.');
        setIsSyncing(false);
        return;
      }

      // Update Zustand local states directly (which auto saves in IndexedDB/localStorage)
      useStore.setState({ notebooks: data.notebooks, folders: data.folders });
      useCanvasStore.setState({ notebookStrokes: data.strokesMap });

      setSyncMessage('📥 İndirme tamamlandı! Tüm veriler başarıyla yerel hafızaya eşitlendi.');
    } catch (e: any) {
      console.error(e);
      setSyncMessage(`❌ İndirme hatası: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(5px)', zIndex: 10000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div 
        style={{
          width: '560px', maxWidth: '100%', maxHeight: '90vh',
          background: '#fff', borderRadius: '24px', display: 'flex',
          flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚙️ Genel Ayarlar
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', borderRadius: '50%', color: 'var(--text-tertiary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.01)' }}>
          <button 
            onClick={() => setActiveTab('ai')}
            style={{
              flex: 1, padding: '1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'ai' ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'ai' ? '3px solid var(--color-primary)' : '3px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s'
            }}
          >
            <Sparkles size={16} /> Yapay Zeka (AI)
          </button>
          <button 
            onClick={() => setActiveTab('sync')}
            style={{
              flex: 1, padding: '1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'sync' ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'sync' ? '3px solid var(--color-primary)' : '3px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s'
            }}
          >
            <Database size={16} /> Bulut Eşitleme (Supabase)
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  AI API Sağlayıcısı
                </label>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  {(['gemini', 'openai'] as AIProvider[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setAiProvider(p)}
                      style={{
                        flex: 1, padding: '0.8rem', borderRadius: '12px', cursor: 'pointer',
                        border: aiProvider === p ? '2px solid var(--color-primary)' : '2px solid rgba(0,0,0,0.08)',
                        background: aiProvider === p ? 'rgba(139,92,246,0.04)' : '#fff',
                        fontWeight: 700, color: aiProvider === p ? 'var(--color-primary)' : 'var(--text-secondary)',
                        fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                      }}
                    >
                      {p === 'gemini' ? '🌟 Gemini' : '🤖 OpenAI'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  API Anahtarı (API Key)
                </label>
                <input 
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                  style={{
                    width: '100%', padding: '0.8rem 1rem', borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.95rem',
                    background: '#fafafa', outline: 'none'
                  }}
                />
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Anahtarlarınız sadece sizin tarayıcınızda (localStorage) saklanır, harici sunucuya asla gönderilmez.
                </p>
              </div>

              <button
                onClick={handleSaveAI}
                style={{
                  width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: aiSaved ? '#22c55e' : 'linear-gradient(135deg, var(--color-primary), #a855f7)',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                {aiSaved ? <><CheckCircle2 size={18} /> API Ayarları Kaydedildi!</> : <><Key size={18} /> API Anahtarını Kaydet</>}
              </button>
            </div>
          )}

          {activeTab === 'sync' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  Supabase Project URL
                </label>
                <input 
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  style={{
                    width: '100%', padding: '0.8rem 1rem', borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.95rem',
                    background: '#fafafa', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                  Supabase Anon Key
                </label>
                <input 
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  style={{
                    width: '100%', padding: '0.8rem 1rem', borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.95rem',
                    background: '#fafafa', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleSaveSync}
                  style={{
                    flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: syncSaved ? '#22c55e' : 'rgba(0,0,0,0.06)',
                    color: syncSaved ? '#fff' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}
                >
                  {syncSaved ? <><CheckCircle2 size={16} /> Kaydedildi!</> : 'Bağlantıyı Kaydet'}
                </button>

                <button
                  onClick={handleCopySQL}
                  style={{
                    padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)',
                    background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  {sqlCopied ? <><Check size={16} color="#22c55e" /> SQL Kopyalandı</> : <><Copy size={16} /> SQL Şemasını Al</>}
                </button>
              </div>

              {SupabaseSync.isConfigured() && (
                <div style={{
                  background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)',
                  borderRadius: '16px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                    <CloudLightning size={16} />
                    <span>BULUT EŞİTLEME AKSİYONLARI</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <button
                      onClick={handleForcePush}
                      disabled={isSyncing}
                      style={{
                        padding: '0.8rem', borderRadius: '10px', border: 'none', cursor: isSyncing ? 'wait' : 'pointer',
                        background: 'linear-gradient(135deg, var(--color-primary), #a855f7)', color: '#fff',
                        fontWeight: 700, fontSize: '0.85rem'
                      }}
                    >
                      ☁️ Buluta Yedekle (Push)
                    </button>
                    <button
                      onClick={handleForcePull}
                      disabled={isSyncing}
                      style={{
                        padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--color-primary)',
                        cursor: isSyncing ? 'wait' : 'pointer', background: '#fff', color: 'var(--color-primary)',
                        fontWeight: 700, fontSize: '0.85rem'
                      }}
                    >
                      📥 Buluttan Yükle (Pull)
                    </button>
                  </div>

                  {syncMessage && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 500, lineHeight: 1.4 }}>
                      {syncMessage}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
