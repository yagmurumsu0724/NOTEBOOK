import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './features/dashboard/Dashboard';
import { Canvas } from './features/canvas/Canvas';
import { useStore } from './store/useStore';
import { Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const { theme, toggleTheme } = useStore();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      {/* Global Theme Toggle Button for testing */}
      <button 
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--bg-glass)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          boxShadow: 'var(--shadow-soft)'
        }}
      >
        {theme === 'light' ? <Moon size={24} color="var(--text-primary)" /> : <Sun size={24} color="var(--text-primary)" />}
      </button>

      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/canvas/:notebookId" element={<Canvas />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
