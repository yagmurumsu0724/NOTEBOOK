import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Key, Brain, ListChecks, Tags, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AIInsightEngine, type AIInsight, type AIProvider } from '../AIInsightEngine';

interface AIInsightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  noteContent: string; // Combined text content from the notebook
  onApplyTags?: (tags: string[]) => void;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ isOpen, onClose, noteContent, onApplyTags }) => {
  const [activeTab, setActiveTab] = useState<'insight' | 'settings'>('insight');
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state
  const config = AIInsightEngine.getConfig();
  const [provider, setProvider] = useState<AIProvider>(config?.provider || 'gemini');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [saved, setSaved] = useState(false);

  const isConfigured = AIInsightEngine.isConfigured();

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await AIInsightEngine.analyze(noteContent);
      setInsight(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    if (!apiKey.trim()) return;
    AIInsightEngine.configure(provider, apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    if (isOpen && isConfigured && !insight && !isLoading && noteContent.length > 10) {
      handleAnalyze();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)', zIndex: 10000
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0, width: '420px', maxWidth: '90vw',
              background: '#fff', zIndex: 10001, display: 'flex', flexDirection: 'column',
              boxShadow: '-5px 0 30px rgba(0,0,0,0.1)'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  borderRadius: '10px', padding: '0.5rem', color: '#fff'
                }}>
                  <Sparkles size={20} />
                </div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>AI Analiz</h2>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem' }}>
                <X size={20} color="var(--text-tertiary)" />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              {[
                { id: 'insight' as const, label: '✨ Analiz', icon: Brain },
                { id: 'settings' as const, label: '⚙️ Ayarlar', icon: Key }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, padding: '0.8rem', border: 'none', cursor: 'pointer',
                    background: activeTab === tab.id ? 'rgba(139,92,246,0.06)' : 'transparent',
                    color: activeTab === tab.id ? '#8b5cf6' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
                    fontSize: '0.9rem', fontFamily: 'inherit'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              
              {activeTab === 'settings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-primary)' }}>
                      AI Sağlayıcı
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(['gemini', 'openai'] as AIProvider[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setProvider(p)}
                          style={{
                            flex: 1, padding: '0.8rem', borderRadius: '12px', cursor: 'pointer',
                            border: provider === p ? '2px solid #8b5cf6' : '2px solid rgba(0,0,0,0.08)',
                            background: provider === p ? 'rgba(139,92,246,0.06)' : '#fff',
                            fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit',
                            color: provider === p ? '#8b5cf6' : 'var(--text-secondary)'
                          }}
                        >
                          {p === 'gemini' ? '🌟 Gemini' : '🤖 OpenAI'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', color: 'var(--text-primary)' }}>
                      API Anahtarı
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={provider === 'gemini' ? 'AIza...' : 'sk-...'}
                      style={{
                        width: '100%', padding: '0.8rem 1rem', borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit',
                        fontSize: '0.95rem', outline: 'none', background: '#fafafa'
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                      Anahtarınız sadece tarayıcınızda (localStorage) saklanır, sunucuya gönderilmez.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={!apiKey.trim()}
                    style={{
                      padding: '0.8rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: saved ? '#22c55e' : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                      color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      opacity: apiKey.trim() ? 1 : 0.5
                    }}
                  >
                    {saved ? <><CheckCircle2 size={18} /> Kaydedildi!</> : <><Key size={18} /> Kaydet</>}
                  </button>
                </div>
              )}

              {activeTab === 'insight' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {!isConfigured && (
                    <div style={{
                      background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '12px', padding: '1rem', display: 'flex', gap: '0.8rem', alignItems: 'flex-start'
                    }}>
                      <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>API Anahtarı Gerekli</p>
                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          AI özelliklerini kullanmak için "Ayarlar" sekmesinden Gemini veya OpenAI API anahtarınızı girin.
                        </p>
                      </div>
                    </div>
                  )}

                  {isConfigured && (
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      style={{
                        padding: '0.8rem', borderRadius: '12px', border: 'none', cursor: isLoading ? 'wait' : 'pointer',
                        background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                        color: '#fff', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                      }}
                    >
                      {isLoading ? <><Loader2 size={18} className="spin" /> Analiz ediliyor...</> : <><Sparkles size={18} /> Notu Analiz Et</>}
                    </button>
                  )}

                  {error && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px', padding: '1rem', color: '#dc2626', fontSize: '0.85rem'
                    }}>
                      ❌ {error}
                    </div>
                  )}

                  {insight && (
                    <>
                      {/* Summary */}
                      <div style={{ background: 'rgba(139,92,246,0.05)', borderRadius: '16px', padding: '1.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                          <Brain size={18} color="#8b5cf6" />
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#8b5cf6' }}>Özet</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                          {insight.summary}
                        </p>
                      </div>

                      {/* Key Points */}
                      {insight.keyPoints.length > 0 && (
                        <div style={{ background: 'rgba(34,197,94,0.05)', borderRadius: '16px', padding: '1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                            <ListChecks size={18} color="#22c55e" />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#22c55e' }}>Önemli Noktalar</h3>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {insight.keyPoints.map((point, i) => (
                              <li key={i} style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items */}
                      {insight.actionItems.length > 0 && (
                        <div style={{ background: 'rgba(251,191,36,0.05)', borderRadius: '16px', padding: '1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                            <ListChecks size={18} color="#f59e0b" />
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>Yapılacaklar</h3>
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {insight.actionItems.map((item, i) => (
                              <li key={i} style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>☐ {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Auto Tags */}
                      {insight.tags.length > 0 && (
                        <div style={{ background: 'rgba(59,130,246,0.05)', borderRadius: '16px', padding: '1.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Tags size={18} color="#3b82f6" />
                              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#3b82f6' }}>Önerilen Etiketler</h3>
                            </div>
                            {onApplyTags && (
                              <button
                                onClick={() => onApplyTags(insight.tags)}
                                style={{
                                  background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px',
                                  padding: '0.3rem 0.8rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                                }}
                              >
                                Uygula
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {insight.tags.map((tag, i) => (
                              <span key={i} style={{
                                background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                                padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600
                              }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
