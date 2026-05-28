import { useState } from 'react';
import { storage } from '../utils/storage';

const LEVEL_LABELS = {
  1:'Beginner', 2:'Beginner', 3:'Beginner', 4:'Beginner',
  5:'Intermediate', 6:'Intermediate', 7:'Intermediate', 8:'Intermediate',
  9:'Advanced', 10:'Advanced', 11:'Advanced', 12:'Advanced',
};

const LEVEL_COLORS = {
  beginner:     { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', bar: '#3b82f6', selected: '#1d4ed8' },
  intermediate: { bg: '#fefce8', border: '#fcd34d', text: '#b45309', bar: '#f59e0b', selected: '#b45309' },
  advanced:     { bg: '#fdf4ff', border: '#d8b4fe', text: '#7e22ce', bar: '#a855f7', selected: '#7e22ce' },
};

export default function LevelSelectScreen({ onSelectLevels, onNavigate }) {
  const progress = storage.getLevelProgress();
  const saved    = storage.getSelectedLevels();   // array of numbers, e.g. [1, 2]

  const [selected, setSelected] = useState(
    new Set(saved.length > 0 ? saved : [])
  );

  // If no SVL data, go directly to swipe all
  if (progress.length === 0) {
    onSelectLevels([]);
    return null;
  }

  const toggle = (level) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const handleStart = () => {
    const levels = [...selected].sort((a, b) => a - b);
    storage.saveSelectedLevels(levels);
    onSelectLevels(levels);
  };

  const getColor = (level) => {
    const label = LEVEL_LABELS[level] || 'Beginner';
    return LEVEL_COLORS[label.toLowerCase()] || LEVEL_COLORS.beginner;
  };

  const selectedCount = selected.size;

  return (
    <div className="screen level-select-screen">
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('home')}>← Home</button>
        <h2>Choose Levels</h2>
      </div>

      <p className="level-select-hint">
        Tap levels to select. Words appear in level order when swiping.
      </p>

      {/* ── Level grid ── */}
      <div className="level-select-grid">
        {progress.map(({ level, total, known, unknown }) => {
          const remaining  = total - known - unknown;
          const knownPct   = total ? (known / total) * 100 : 0;
          const unknownPct = total ? (unknown / total) * 100 : 0;
          const done       = known === total && total > 0;
          const color      = getColor(level);
          const isSelected = selected.has(level);

          return (
            <button
              key={level}
              className={`level-card ${done ? 'level-card-done' : ''} ${isSelected ? 'level-card-selected' : ''}`}
              style={{
                background:   isSelected ? color.selected : color.bg,
                borderColor:  isSelected ? color.selected : color.border,
              }}
              onClick={() => toggle(level)}
            >
              {/* Checkmark when selected */}
              {isSelected && (
                <div className="level-card-check">✓</div>
              )}

              <div className="level-card-top">
                <span
                  className="level-card-num"
                  style={{ color: isSelected ? '#fff' : color.text }}
                >
                  Lv.{level}
                </span>
                <span
                  className="level-card-label"
                  style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : color.text }}
                >
                  {LEVEL_LABELS[level]}
                </span>
              </div>

              <div className="level-card-bar-track">
                <div className="level-card-bar-known"
                  style={{ width: `${knownPct}%`, background: isSelected ? 'rgba(255,255,255,0.6)' : color.bar }} />
                <div className="level-card-bar-unknown"
                  style={{ width: `${unknownPct}%`, left: `${knownPct}%`,
                    background: isSelected ? 'rgba(255,200,200,0.7)' : '#fca5a5' }} />
              </div>

              <div className="level-card-stats"
                style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : color.text }}
              >
                <span>✅ {known}</span>
                <span>❓ {unknown}</span>
                <span style={{ opacity: 0.7 }}>⏳ {remaining}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Quick select helpers ── */}
      <div className="level-quick-select">
        <button className="btn btn-ghost btn-sm"
          onClick={() => setSelected(new Set(progress.filter(p => p.level <= 4).map(p => p.level)))}>
          Beginner
        </button>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setSelected(new Set(progress.filter(p => p.level >= 5 && p.level <= 8).map(p => p.level)))}>
          Intermediate
        </button>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setSelected(new Set(progress.filter(p => p.level >= 9).map(p => p.level)))}>
          Advanced
        </button>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setSelected(new Set())}>
          Clear
        </button>
      </div>

      {/* ── Start button ── */}
      <div className="level-start-wrap">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleStart}
          disabled={selectedCount === 0}
        >
          {selectedCount === 0
            ? 'Select at least one level'
            : `▶ Start  —  ${selectedCount} level${selectedCount > 1 ? 's' : ''} selected`}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => { storage.saveSelectedLevels([]); onSelectLevels([]); }}>
          🔀 Shuffle all levels
        </button>
      </div>
    </div>
  );
}
