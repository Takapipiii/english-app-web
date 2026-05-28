import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { speech } from '../utils/speech';

export default function ReviewScreen({ onNavigate, onOpenSentence }) {
  const [words, setWords] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setWords(storage.loadUnknownWords());
  }, []);

  const filtered = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning.includes(search)
  );

  const handleMarkKnown = (word) => {
    storage.markKnown(word.id);
    setWords(prev => prev.filter(w => w.id !== word.id));
  };

  return (
    <div className="screen review-screen">
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('home')}>← Home</button>
        <h2>Unknown Words ({words.length})</h2>
      </div>

      <input
        className="search-box"
        placeholder="Search words…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="empty-state">
          {words.length === 0
            ? <p>No unknown words yet! Keep swiping.</p>
            : <p>No results for "{search}"</p>}
        </div>
      ) : (
        <div className="word-list">
          {filtered.map(w => (
            <div key={w.id} className="word-row">
              <div className="word-row-info">
                <span className="word-row-word">{w.word}</span>
                <span className="word-row-meaning">{w.meaning}</span>
                <span className={`level-badge level-${w.level}`}>{w.level}</span>
              </div>
              <div className="word-row-actions">
                <button
                  className="btn btn-icon"
                  title="Listen"
                  onClick={() => speech.speak(w.word)}
                >🔊</button>
                <button
                  className="btn btn-icon"
                  title="Example sentences"
                  onClick={() => onOpenSentence(w)}
                >📝</button>
                <button
                  className="btn btn-icon btn-known-small"
                  title="Mark as known"
                  onClick={() => handleMarkKnown(w)}
                >✓</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
