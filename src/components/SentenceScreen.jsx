import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { speech } from '../utils/speech';
import { generateSentence } from '../utils/ai';

export default function SentenceScreen({ onBack }) {
  const [unknownWords, setUnknownWords]   = useState([]);
  const [selected, setSelected]           = useState([]);
  const [result, setResult]               = useState(null);   // { sentence, translation }
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [showJP, setShowJP]               = useState(false);
  const [defaultShowJP, setDefaultShowJP] = useState(false);
  const [savedList, setSavedList]         = useState([]);
  const [revealedIds, setRevealedIds]     = useState(new Set());

  useEffect(() => {
    setUnknownWords(storage.loadUnknownWords());
    setSavedList(storage.loadSavedSentences());
    const pref = storage.getShowJapanese();
    setDefaultShowJP(pref);
    setShowJP(pref);
  }, []);

  const toggleWord = (word) => {
    setSelected(prev => {
      if (prev.find(w => w.id === word.id)) return prev.filter(w => w.id !== word.id);
      if (prev.length >= 3) return prev;
      return [...prev, word];
    });
    setResult(null);
    setError('');
  };

  const handleGenerate = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    setError('');
    setResult(null);
    setShowJP(defaultShowJP);
    try {
      const res = await generateSentence(selected.map(w => w.word));
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    storage.saveSentence({ words: selected.map(w => w.word), sentence: result.sentence, translation: result.translation });
    setSavedList(storage.loadSavedSentences());
    setResult(null);
    setSelected([]);
  };

  const handleDelete = (id) => {
    storage.deleteSavedSentence(id);
    setSavedList(storage.loadSavedSentences());
  };

  const toggleReveal = (id) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleDefaultJP = () => {
    const next = !defaultShowJP;
    setDefaultShowJP(next);
    storage.saveShowJapanese(next);
  };

  const highlightWords = (sentence, words) => {
    if (!words || words.length === 0) return sentence;
    const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return sentence.split(pattern).map((part, i) =>
      pattern.test(part) ? <strong key={i} className="highlighted-word">{part}</strong> : part
    );
  };

  return (
    <div className="screen sentence-screen">
      <div className="screen-header">
        {onBack && <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>}
        <h2>Make a Sentence</h2>
        <button
          className={`btn btn-sm ${defaultShowJP ? 'btn-primary' : 'btn-ghost'}`}
          onClick={handleToggleDefaultJP}
          title="Toggle default Japanese display"
        >
          🇯🇵
        </button>
      </div>

      {/* Word selector */}
      <div className="sentence-section">
        <p className="section-label">Select 2–3 words</p>
        {unknownWords.length === 0 ? (
          <p className="empty-note">No unknown words yet. Go swipe some cards first!</p>
        ) : (
          <div className="word-chip-grid">
            {unknownWords.map(w => {
              const isSelected = selected.find(s => s.id === w.id);
              const isDisabled = !isSelected && selected.length >= 3;
              return (
                <button
                  key={w.id}
                  className={`word-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && toggleWord(w)}
                >
                  {w.word}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate button */}
      {selected.length >= 2 && (
        <div className="sentence-generate-area">
          <div className="selected-words-preview">
            {selected.map(w => <span key={w.id} className="selected-tag">{w.word}</span>)}
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating…' : '✨ Generate'}
          </button>
        </div>
      )}

      {error && (
        <div className="error-box">
          <p>⚠️ {error}</p>
          <button className="btn btn-sm btn-ghost" onClick={handleGenerate}>Retry</button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="sentence-result">
          <p className="result-english">
            {highlightWords(result.sentence, selected.map(w => w.word))}
          </p>
          <button
            className="btn btn-icon speak-btn"
            onClick={() => speech.speak(result.sentence)}
          >🔊</button>
          <div className="result-japanese-area">
            {showJP ? (
              <p className="result-japanese" onClick={() => setShowJP(false)}>{result.translation}</p>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowJP(true)}>Tap to show Japanese</button>
            )}
          </div>
          <button className="btn btn-primary btn-sm save-btn" onClick={handleSave}>
            💾 Save
          </button>
        </div>
      )}

      {/* Saved sentences */}
      {savedList.length > 0 && (
        <div className="saved-sentences-section">
          <p className="section-label">Saved Sentences</p>
          {savedList.map(item => (
            <div key={item.id} className="saved-sentence-item">
              <div className="saved-words-tags">
                {item.words.map((w, i) => <span key={i} className="saved-word-tag">{w}</span>)}
              </div>
              <p className="saved-english">
                {highlightWords(item.sentence, item.words)}
              </p>
              <div className="saved-jp-row">
                {revealedIds.has(item.id) ? (
                  <p className="saved-japanese" onClick={() => toggleReveal(item.id)}>{item.translation}</p>
                ) : (
                  <button className="btn btn-ghost btn-xs" onClick={() => toggleReveal(item.id)}>Show Japanese</button>
                )}
                <button className="btn btn-icon btn-sm speak-btn" onClick={() => speech.speak(item.sentence)}>🔊</button>
                <button className="btn btn-icon btn-sm delete-btn" onClick={() => handleDelete(item.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
