import { storage } from '../utils/storage';

export default function ProgressScreen() {
  const stats    = storage.getStats();
  const progress = storage.getLevelProgress();

  const overallPct = stats.total ? Math.round((stats.known / stats.total) * 100) : 0;

  return (
    <div className="screen progress-screen">
      <div className="home-header">
        <h1>📊 Progress</h1>
        <p className="home-subtitle">
          {stats.known.toLocaleString()} / {stats.total.toLocaleString()} words known ({overallPct}%)
        </p>
      </div>

      {/* Overall bar */}
      {stats.total > 0 && (
        <div className="overall-bar-wrap">
          <div className="overall-bar-track">
            <div className="overall-bar-fill" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      )}

      {progress.length === 0 ? (
        <div className="empty-state">
          <p>Load your SVL words first from <strong>Data</strong> tab to see progress.</p>
        </div>
      ) : (
        <div className="level-progress-section" style={{ border: 'none', padding: 0 }}>
          <div className="level-progress-list">
            {progress.map(({ level, total, known, unknown }) => {
              const knownPct   = total ? (known   / total) * 100 : 0;
              const unknownPct = total ? (unknown / total) * 100 : 0;
              const remaining  = total - known - unknown;
              const done       = known === total && total > 0;

              const groupLabel =
                level <= 4 ? 'Beginner' :
                level <= 8 ? 'Intermediate' : 'Advanced';

              return (
                <div key={level} className={`level-row ${done ? 'level-row-done' : ''}`}>
                  <div className="level-row-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="level-num">Lv.{level}</span>
                      <span className="level-group-tag">{groupLabel}</span>
                    </div>
                    <span className="level-stats">
                      <span className="lv-known">{known.toLocaleString()}</span>
                      <span className="lv-sep"> / {total.toLocaleString()}</span>
                      {done && <span className="lv-done-badge">✓</span>}
                    </span>
                  </div>
                  <div className="level-bar-track">
                    <div className="level-bar-known"  style={{ width: `${knownPct}%` }} />
                    <div className="level-bar-unknown" style={{ width: `${unknownPct}%`, left: `${knownPct}%` }} />
                  </div>
                  <div className="level-row-counts">
                    <span className="lc-known">✅ {known}</span>
                    <span className="lc-unknown">❓ {unknown}</span>
                    <span className="lc-remaining">⏳ {remaining}</span>
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
    </div>
  );
}
