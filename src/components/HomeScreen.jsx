import { storage } from '../utils/storage';

export default function HomeScreen({ onNavigate }) {
  const stats = storage.getStats();

  const cards = [
    { label: 'Total',     value: stats.total,     color: '#6366f1', icon: '📖' },
    { label: 'Unknown',   value: stats.unknown,   color: '#ef4444', icon: '❓' },
    { label: 'Known',     value: stats.known,     color: '#22c55e', icon: '✅' },
    { label: 'Remaining', value: stats.remaining, color: '#f59e0b', icon: '⏳' },
  ];

  return (
    <div className="screen home-screen">
      <div className="home-header">
        <h1>📚 English Words</h1>
        <p className="home-subtitle">Swipe to master your vocabulary</p>
      </div>

      <div className="stats-grid">
        {cards.map(c => (
          <div key={c.label} className="stat-card" style={{ borderTop: `4px solid ${c.color}` }}>
            <span className="stat-icon">{c.icon}</span>
            <span className="stat-value" style={{ color: c.color }}>{c.value.toLocaleString()}</span>
            <span className="stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="home-actions">
        <button className="btn btn-primary btn-lg" onClick={() => onNavigate('level-select')}>
          🃏 Start Swiping
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('review')}>
          📚 Review Unknown Words
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('story')}>
          📖 Story Mode
        </button>
        <button className="btn btn-ghost btn-lg" onClick={() => onNavigate('import')}>
          📂 Import / Settings
        </button>
      </div>

      {stats.total === 0 && (
        <div className="empty-hint">
          <p>No words loaded yet.</p>
          <p>Go to <strong>Import / Settings</strong> to load your SVL Excel file.</p>
        </div>
      )}
    </div>
  );
}
