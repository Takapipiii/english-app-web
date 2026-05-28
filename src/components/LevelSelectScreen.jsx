import { storage } from '../utils/storage';

const LEVEL_LABELS = {
  1: 'Beginner',  2: 'Beginner',  3: 'Beginner',  4: 'Beginner',
  5: 'Intermediate', 6: 'Intermediate', 7: 'Intermediate', 8: 'Intermediate',
  9: 'Advanced', 10: 'Advanced', 11: 'Advanced', 12: 'Advanced',
};

const LEVEL_COLORS = {
  beginner:     { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', bar: '#3b82f6' },
  intermediate: { bg: '#fefce8', border: '#fcd34d', text: '#b45309', bar: '#f59e0b' },
  advanced:     { bg: '#fdf4ff', border: '#d8b4fe', text: '#7e22ce', bar: '#a855f7' },
};

export default function LevelSelectScreen({ onSelectLevel, onNavigate }) {
  const progress = storage.getLevelProgress();
  const stats    = storage.getStats();

  // If no SVL data, skip to regular swipe
  if (progress.length === 0) {
    onSelectLevel(null);
    return null;
  }

  const getColor = (level) => {
    const label = LEVEL_LABELS[level] || 'Beginner';
    return LEVEL_COLORS[label.toLowerCase()] || LEVEL_COLORS.beginner;
  };

  return (
    <div className="screen level-select-screen">
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('home')}>← Home</button>
        <h2>Choose a Level</h2>
      </div>

      <p className="level-select-hint">
        Pick a level to study. Words appear in order within each level.
      </p>

      <div className="level-select-grid">
        {progress.map(({ level, total, known, unknown }) => {
          const remaining  = total - known - unknown;
          const knownPct   = total ? (known / total) * 100 : 0;
          const unknownPct = total ? (unknown / total) * 100 : 0;
          const done       = known === total && total > 0;
          const color      = getColor(level);
          const label      = LEVEL_LABELS[level];

          return (
            <button
              key={level}
              className={`level-card ${done ? 'level-card-done' : ''}`}
              style={{ background: color.bg, borderColor: color.border }}
              onClick={() => onSelectLevel(level)}
            >
              <div className="level-card-top">
                <span className="level-card-num" style={{ color: color.text }}>
                  Lv.{level}
                </span>
                {done && <span className="level-card-badge">✓ Done</span>}
                <span className="level-card-label" style={{ color: color.text }}>
                  {label}
                </span>
              </div>

              <div className="level-card-bar-track">
                <div className="level-card-bar-known"
                  style={{ width: `${knownPct}%`, background: color.bar }} />
                <div className="level-card-bar-unknown"
                  style={{ width: `${unknownPct}%`, left: `${knownPct}%` }} />
              </div>

              <div className="level-card-stats" style={{ color: color.text }}>
                <span>✅ {known}</span>
                <span>❓ {unknown}</span>
                <span style={{ color: '#94a3b8' }}>⏳ {remaining}</span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        className="btn btn-ghost btn-sm level-all-btn"
        onClick={() => onSelectLevel(null)}
      >
        🔀 Shuffle all levels
      </button>
    </div>
  );
}
