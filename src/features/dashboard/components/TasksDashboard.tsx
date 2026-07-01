import React from 'react';
import { useStore } from '../../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../../components/ui/GlassCard';
import { CheckSquare, Square, Trash2, ArrowRight, ListTodo, ClipboardList } from 'lucide-react';

export const TasksDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { notebooks, toggleTask, deleteTask } = useStore();

  // Extract all tasks from all notebooks
  const allTasks = notebooks.flatMap(n => 
    (n.actionItems || []).map(task => ({
      ...task,
      notebookId: n.id,
      notebookTitle: n.title,
      notebookIcon: n.icon
    }))
  );

  const completedTasks = allTasks.filter(t => t.completed);
  const pendingTasks = allTasks.filter(t => !t.completed);

  const handleToggle = (notebookId: string, taskId: string) => {
    toggleTask(notebookId, taskId);
  };

  const handleDelete = (notebookId: string, taskId: string) => {
    if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      deleteTask(notebookId, taskId);
    }
  };

  const TaskItem = ({ task }: { task: typeof allTasks[0] }) => (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
        marginBottom: '0.8rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
        <button
          onClick={() => handleToggle(task.notebookId, task.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            color: task.completed ? 'var(--color-primary)' : 'var(--text-tertiary)',
            transition: 'color 0.2s'
          }}
        >
          {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span 
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
              textDecoration: task.completed ? 'line-through' : 'none',
              lineHeight: 1.4
            }}
          >
            {task.text}
          </span>
          <span 
            onClick={() => navigate(`/canvas/${task.notebookId}`)}
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 600
            }}
          >
            {task.notebookIcon} {task.notebookTitle} <ArrowRight size={12} />
          </span>
        </div>
      </div>

      <button
        onClick={() => handleDelete(task.notebookId, task.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          color: 'rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.9)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.4)'}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <GlassCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ background: 'rgba(139,92,246,0.1)', padding: '1rem', borderRadius: '14px', color: 'var(--color-primary)' }}>
            <ClipboardList size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{pendingTasks.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Bekleyen Görevler</div>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ background: 'rgba(34,197,94,0.1)', padding: '1rem', borderRadius: '14px', color: '#22c55e' }}>
            <ListTodo size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>{completedTasks.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tamamlananlar</div>
          </div>
        </GlassCard>
      </div>

      {/* Task Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Pending Tasks */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⏳ Yapılacaklar ({pendingTasks.length})
          </h3>
          {pendingTasks.length > 0 ? (
            pendingTasks.map(t => <TaskItem key={t.id} task={t} />)
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '16px',
              padding: '3rem 1rem',
              textAlign: 'center',
              border: '1px dashed rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: 500 }}>
                Harika! Bekleyen hiçbir göreviniz yok.
              </p>
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              ✓ Tamamlananlar ({completedTasks.length})
            </h3>
            {completedTasks.map(t => <TaskItem key={t.id} task={t} />)}
          </div>
        )}

      </div>
    </div>
  );
};
