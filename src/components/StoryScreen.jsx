import { useState, useEffect, useRef } from 'react';
import { storage } from '../utils/storage';
import { generateStory } from '../utils/ai';

function tokenizeStory(story, unknownWords) {
  // Sort longest phrases first so "get rid of" matches before "get"
  const sorted = [...unknownWords].sort((a, b) => b.word.length - a.word.length);
  const lower = story.toLowerCase();
  const segments = [];
  let i = 0;

  while (i < story.length) {
    let matched = false;
    for (const w of sorted) {
      const wLower = w.word.toLowerCase();
      if (!lower.startsWith(wLower, i)) continue;
      const end = i + wLower.length;
      // Check word boundaries
      const before = i > 0 ? story[i - 1] : ' ';
      const after = end < story.length ? story[end] : ' ';
      if (/[a-z]/i.test(before) || /[a-z]/i.test(after)) continue;
      segments.push({ text: story.slice(i, end), isHighlight: true, wordObj: w });
      i = end;
      matched = true;
      break;
    }
    if (!matched) {
      const last = segments[segments.length - 1];
      if (last && !last.isHighlight) {
        last.text += story[i];
      } else {
        segments.push({ text: story[i], isHighlight: false });
      }
      i++;
    }
  }
  return segments;
}

export default function StoryScreen() {
  const [story, setStory] = useState('');
  const [unknownWords, setUnknownWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const generate = async () => {
    const words = storage.loadUnknownWords().slice(0, 15);
    const apiKey = storage.getApiKey();

    if (!apiKey) { setError('No API key set. Go to Import / Settings.'); return; }
    if (words.length < 3) { setError('Swipe at least 3 words as "unknown" first.'); return; }

    setLoading(true);
    setError('');
    setStory('');
    setSelectedWord(null);

    try {
      const text = await generateStory(words, apiKey);
      setStory(text);
      setUnknownWords(words);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generate(); }, []);

  const speak = () => {
    if (!story) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(story);
    u.lang = 'en-US';
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  const segments = story ? tokenizeStory(story, unknownWords) : [];
  const highlightCount = segments.filter(s => s.isHighlight).length;

  return (
    <div className="screen story-screen">
      <div className="story-header">
        <h2>📖 Story Mode</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {story && (
            <button className={`btn btn-icon ${speaking ? 'btn-speaking' : ''}`} onClick={speak}>
              {speaking ? '⏹' : '🔊'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
            {loading ? '...' : '🔄 New'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-box">
          <div className="spinner" />
          <p>Generating story...</p>
        </div>
      )}

      {error && (
        <div className="error-box">
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={generate}>Retry</button>
        </div>
      )}

      {story && !loading && (
        <>
          <div className="story-word-count">
            <span className="story-highlight-badge">{highlightCount} words highlighted</span>
            <span className="story-tap-hint">Tap a highlighted word to see its meaning</span>
          </div>
          <div className="story-text">
            {segments.map((seg, i) =>
              seg.isHighlight
                ? <span key={i} className="story-word" onClick={() => setSelectedWord(seg.wordObj)}>{seg.text}</span>
                : <span key={i}>{seg.text}</span>
            )}
          </div>
        </>
      )}

      {!story && !loading && !error && (
        <div className="empty-state">Tap "New" to generate a story from your unknown words.</div>
      )}

      {selectedWord && (
        <div className="word-popup-overlay" onClick={() => setSelectedWord(null)}>
          <div className="word-popup" onClick={e => e.stopPropagation()}>
            <div className="word-popup-word">{selectedWord.word}</div>
            {selectedWord.type && <div className="word-popup-type">{selectedWord.type}</div>}
            <div className="word-popup-meaning">{selectedWord.meaning}</div>
            <button className="btn btn-primary btn-sm" onClick={() => setSelectedWord(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
