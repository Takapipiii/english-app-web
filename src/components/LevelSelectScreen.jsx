import { storage } from '../utils/storage';

const LEVEL_LABELS = {
  1:'Beginner', 2:'Beginner', 3:'Beginner', 4:'Beginner',
  5:'Intermediate', 6:'Intermediate', 7:'Intermediate', 8:'Intermediate',
  9:'Advanced', 10:'Advanced', 11:'Advanced', 12:'Advanced',
};

const LEVEL_COLORS = {
  beginner:     { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', bar: '#3b82f6' },
  intermediate: { bg: '#fefce8', border: '#fcd34d', text: '#b45309', bar: '#f59e0b' },
  advanced:     { bg: '#fdf4ff', border: '#d8b4fe', text: '#7e22ce', bar: '#a855f7' },
};

export default function LevelSelectScreen({ onSelectLevel, onNavigate }) {
  const progress  = storage.getLevelProgress();
  const lastLevel = storage.getLastLevel();

  // If no SVL data, skip straight to swipe (all words)
  if (progress.length === 0) {
    onSelectLevel(null);
    return null;
  }

  const getColor = (level) => {
    const label = LEVEL_LABELS[level] || 'Beginner';
    return LEVEL_COLORS[label.toLowerCase()] || LEVEL_COLORS.beginner;
  };

  const handleSelect = (level) => {
    storage.saveLastLevel(level);
    onSelectLevel(level);
  };

  const lastLevelData = lastLevel != null
    ? progress.find(p => p.level === lastLevel)
    : null;

  return (
    <div className="screen level-select-screen">
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('home')}>← Home</button>
        <h2>Choose a Level</h2>
      </div>

      {/* ── Continue from last time ── */}
      {lastLevelData && (
        <div className="last-level-banner">
          <div className="last-level-info">
            <span className="last-level-label">Last studied</span>
            <span className="last-level-name">
              Level {lastLevel} · {LEVEL_LABELS[lastLevel]}
            </span>
            <span className="last-level-stats">
              ✅ {lastLevelData.known} / {lastLevelData.total}
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleSelect(lastLevel)}
          >
            Continue →
          </button>
        </div>
      )}

      <p className="level-select-hint">
        {lastLevel != null ? 'Or pick a different level:' : 'Pick a level to study. Words appear in order.'}
      </p>

      {/* ── Level grid ── */}
      <div className="level-select-grid">
        {progress.map(({ level, total, known, unknown }) => {
          const remaining  = total - known - unknown;
          const knownPct   = total ? (known / total) * 100 : 0;
          const unknownPct = total ? (unknown / total) * 100 : 0;
          const done       = known === total && total > 0;
          const color      = getColor(level);
          const isLast     = level === lastLevel;

          return (
            <button
              key={level}
              className={`level-card ${done ? 'level-card-done' : ''} ${isLast ? 'level-card-active' : ''}`}
              style={{ background: color.bg, borderColor: isLast ? color.text : color.border }}
              onClick={() => handleSelect(level)}
            >
              <div className="level-card-top">
                <span className="level-card-num" style={{ color: color.text }}>Lv.{level}</span>
                {done
                  ? <span className="level-card-badge">✓</span>
                  : isLast
                    ? <span className="level-card-badge level-card-badge-last">▶</span>
                    : null
                }
                <span className="level-card-label" style={{ color: color.text }}>
                  {LEVEL_LABELS[level]}
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

      <button className="btn btn-ghost btn-sm level-all-btn" onClick={() => handleSelect(null)}>
        🔀 Shuffle all levels
      </button>
    </div>
  );
}
