import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { speech } from '../utils/speech';
import { generateSentences } from '../utils/ai';

export default function SentenceScreen({ word, onBack }) {
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(null);

  useEffect(() => {
    if (!word) return;
    const cached = storage.getCachedSentence(word.id);
    if (cached) {
      setSentences(cached);
    } else {
      fetchSentences();
    }
  }, [word]);

  const fetchSentences = async () => {
    const apiKey = storage.getApiKey();
    if (!apiKey) {
      setError('No API key set. Please add your Anthropic API key in Import / Settings.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await generateSentences(word.word, apiKey);
      setSentences(result);
      storage.cacheSentence(word.id, result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const speakSentence = (text, idx) => {
    // Extract English part only (before Japanese in parentheses)
    const englishOnly = text.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').trim();
    speech.speak(englishOnly);
    setSpeaking(idx);
    setTimeout(() => setSpeaking(null), 3000);
  };

  if (!word) return null;

  return (
    <div className="screen sentence-screen">
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <h2>Example Sentences</h2>
      </div>

      <div className="sentence-word-card">
        <div className="sentence-word-header">
          <h3>{word.word}</h3>
          <button className="btn btn-icon" onClick={() => speech.speak(word.word)}>🔊</button>
        </div>
        <p className="sentence-word-meaning">{word.meaning}</p>
        <div className="sentence-word-meta">
          <span className="word-type">{word.type}</span>
          <span className={`level-badge level-${word.level}`}>{word.level}</span>
        </div>
      </div>

      {loading && (
        <div className="loading-box">
          <div className="spinner" />
          <p>Generating sentences with AI…</p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <p>⚠️ {error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchSentences}>Retry</button>
        </div>
      )}

      {!loading && !error && sentences.length > 0 && (
        <div className="sentences-list">
          {sentences.map((s, i) => (
            <div key={i} className="sentence-item">
              <div className="sentence-number">{i + 1}</div>
              <p className="sentence-text">{s}</p>
              <button
                className={`btn btn-icon ${speaking === i ? 'btn-speaking' : ''}`}
                onClick={() => speakSentence(s, i)}
              >
                {speaking === i ? '🔊' : '▶'}
              </button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm refresh-btn" onClick={fetchSentences}>
            🔄 Generate new sentences
          </button>
        </div>
      )}

      {!loading && !error && sentences.length === 0 && !storage.getApiKey() && (
        <div className="empty-state">
          <p>Set your Anthropic API key in <strong>Import / Settings</strong> to generate AI sentences.</p>
        </div>
      )}
    </div>
  );
}
