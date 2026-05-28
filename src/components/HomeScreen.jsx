import { storage } from '../utils/storage';

export default function HomeScreen({ onNavigate }) {
  const stats         = storage.getStats();
  const levelProgress = storage.getLevelProgress();

  const summaryCards = [
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

      {/* ── Summary stats ── */}
      <div className="stats-grid">
        {summaryCards.map(c => (
          <div key={c.label} className="stat-card" style={{ borderTop: `4px solid ${c.color}` }}>
            <span className="stat-icon">{c.icon}</span>
            <span className="stat-value" style={{ color: c.color }}>{c.value.toLocaleString()}</span>
            <span className="stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* ── Level progress ── */}
      {levelProgress.length > 0 && (
        <div className="level-progress-section">
          <h3 className="level-progress-title">Progress by Level</h3>
          <div className="level-progress-list">
            {levelProgress.map(({ level, total, known, unknown }) => {
              const knownPct   = total ? (known   / total) * 100 : 0;
              const unknownPct = total ? (unknown / total) * 100 : 0;
              const remaining  = total - known - unknown;
              const done       = known === total;

              return (
                <div key={level} className={`level-row ${done ? 'level-row-done' : ''}`}>
                  <div className="level-row-header">
                    <span className="level-num">Lv.{level}</span>
                    <span className="level-stats">
                      <span className="lv-known">{known}</span>
                      <span className="lv-sep"> / {total}</span>
                      {done && <span className="lv-done-badge">✓</span>}
                    </span>
                  </div>
                  <div className="level-bar-track">
                    <div
                      className="level-bar-known"
                      style={{ width: `${knownPct}%` }}
                    />
                    <div
                      className="level-bar-unknown"
                      style={{ width: `${unknownPct}%`, left: `${knownPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="level-legend">
            <span className="legend-known">■ Known</span>
            <span className="legend-unknown">■ Unknown</span>
            <span className="legend-remaining">■ Not seen</span>
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="home-actions">
        <button className="btn btn-primary btn-lg" onClick={() => onNavigate('swipe')}>
          🃏 Start Swiping
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('review')}>
          📚 Review Unknown Words
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
