import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { speech } from '../utils/speech';

const SWIPE_THRESHOLD = 90; // px needed to trigger a swipe

export default function SwipeScreen({ onNavigate }) {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  // Drag state
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const cardRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const all = storage.loadWords();
    const knownIds = storage.loadKnownIds();
    const remaining = all.filter(w => !knownIds.includes(w.id));
    setWords(remaining);
    if (remaining.length === 0) setDone(true);
  }, []);

  const current = words[index];

  // ── Pointer capture: works for mouse AND touch ──
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };

  const onPointerMove = (e) => {
    if (!drag.active) return;
    setDrag({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
      active: true,
    });
  };

  const onPointerUp = (e) => {
    if (!drag.active) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    // Was this a tap (no real drag)?
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      setFlipped(f => !f);
      setDrag({ x: 0, y: 0, active: false });
      return;
    }

    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      triggerSwipe(dx < 0 ? 'left' : 'right');
    } else {
      // Snap back
      setDrag({ x: 0, y: 0, active: false });
    }
  };

  const triggerSwipe = (dir) => {
    const flyX = dir === 'left' ? -600 : 600;
    // Animate fly-out
    setDrag({ x: flyX, y: drag.y, active: false, flying: true });

    if (dir === 'left') {
      storage.markUnknown(current);
    } else {
      storage.markKnown(current.id);
    }

    setTimeout(() => {
      setDrag({ x: 0, y: 0, active: false });
      setFlipped(false);
      if (index + 1 >= words.length) {
        setDone(true);
      } else {
        setIndex(i => i + 1);
      }
    }, 380);
  };

  // Visual helpers
  const rotation = drag.x * 0.10;
  const opacity = drag.flying ? 0 : 1;
  const transition = drag.active
    ? 'none'
    : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s';

  const cardStyle = {
    transform: `translateX(${drag.x}px) translateY(${drag.y * 0.3}px) rotate(${rotation}deg)`,
    transition,
    opacity,
    cursor: drag.active ? 'grabbing' : 'grab',
  };

  // Hint overlay
  const hintOpacity = Math.min(Math.abs(drag.x) / SWIPE_THRESHOLD, 1);
  const showUnknown = drag.x < -20;
  const showKnown = drag.x > 20;

  if (done) {
    return (
      <div className="screen center">
        <div className="done-box">
          <p className="done-emoji">🎉</p>
          <h2>All done!</h2>
          <p>You've gone through all remaining words.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('review')}>
            Review Unknown Words
          </button>
          <button className="btn btn-ghost" onClick={() => onNavigate('home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!current) return <div className="screen center"><p>Loading…</p></div>;

  return (
    <div className="screen swipe-screen">
      <div className="swipe-header">
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('home')}>← Home</button>
        <span className="swipe-progress">{index + 1} / {words.length}</span>
      </div>

      {/* Progress bar */}
      <div className="swipe-progress-bar">
        <div
          className="swipe-progress-fill"
          style={{ width: `${((index) / words.length) * 100}%` }}
        />
      </div>

      <div className="swipe-area">
        <div
          ref={cardRef}
          className={`word-card ${flipped ? 'flipped' : ''}`}
          style={cardStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDrag({ x: 0, y: 0, active: false })}
        >
          {/* Hint overlays */}
          {showUnknown && (
            <div className="swipe-hint swipe-hint-unknown" style={{ opacity: hintOpacity }}>
              ✗ Unknown
            </div>
          )}
          {showKnown && (
            <div className="swipe-hint swipe-hint-known" style={{ opacity: hintOpacity }}>
              ✓ Known
            </div>
          )}

          <div className="card-front">
            <span className="word-type">{current.type}</span>
            <h2 className="word-text">{current.word}</h2>
            <span className={`level-badge level-${current.level}`}>{current.level}</span>
            <p className="card-tap-hint">Tap to reveal · Swipe to sort</p>
          </div>

          <div className="card-back">
            <span className="word-type">{current.type}</span>
            <h2 className="word-text">{current.word}</h2>
            <p className="word-meaning">{current.meaning}</p>
            <button
              className="btn btn-icon"
              onPointerDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); speech.speak(current.word); }}
            >
              🔊 Listen
            </button>
          </div>
        </div>

        {/* Next card peeking behind */}
        {words[index + 1] && (
          <div className="word-card word-card-next">
            <div className="card-front">
              <span className="word-type">{words[index + 1].type}</span>
              <h2 className="word-text">{words[index + 1].word}</h2>
            </div>
          </div>
        )}
      </div>

      <div className="swipe-buttons">
        <button className="btn btn-unknown" onClick={() => triggerSwipe('left')}>
          ✗
        </button>
        <button
          className="btn btn-icon btn-listen-center"
          onClick={() => speech.speak(current.word)}
        >
          🔊
        </button>
        <button className="btn btn-known" onClick={() => triggerSwipe('right')}>
          ✓
        </button>
      </div>

      <p className="swipe-drag-hint">← Unknown &nbsp;·&nbsp; Known →</p>
    </div>
  );
}
