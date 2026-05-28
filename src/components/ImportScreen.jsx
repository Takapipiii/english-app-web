import { useState } from 'react';
import { storage } from '../utils/storage';
import { sampleWords } from '../data/sampleWords';

export default function ImportScreen({ onNavigate, onRefresh }) {
  const [apiKey, setApiKey] = useState(storage.getApiKey());
  const [apiSaved, setApiSaved] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');

  const saveApiKey = () => {
    storage.saveApiKey(apiKey.trim());
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 2000);
  };

  const loadSampleData = () => {
    storage.saveWords(sampleWords);
    onRefresh();
    setImportMsg(`Loaded ${sampleWords.length} sample words!`);
    setImportError('');
  };

  const parseCSV = (text) => {
    // Expected format: word,meaning,type,level
    // or word,meaning  (type and level optional)
    const lines = text.trim().split('\n').filter(l => l.trim());
    const words = [];
    const errors = [];

    lines.forEach((line, i) => {
      // Skip header row
      if (i === 0 && line.toLowerCase().includes('word')) return;

      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) {
        errors.push(`Line ${i + 1}: not enough columns`);
        return;
      }
      words.push({
        id: `csv_${Date.now()}_${i}`,
        word: cols[0],
        meaning: cols[1],
        type: cols[2] || 'word',
        level: cols[3] || 'intermediate',
      });
    });

    return { words, errors };
  };

  const importCSV = () => {
    setImportMsg('');
    setImportError('');
    if (!csvText.trim()) {
      setImportError('Please paste CSV text first.');
      return;
    }
    const { words, errors } = parseCSV(csvText);
    if (words.length === 0) {
      setImportError('No valid words found. Check the format.');
      return;
    }
    const existing = storage.loadWords();
    const merged = [...existing, ...words];
    storage.saveWords(merged);
    onRefresh();
    setImportMsg(`Imported ${words.length} words! ${errors.length > 0 ? `(${errors.length} rows skipped)` : ''}`);
    setCsvText('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result);
    reader.readAsText(file, 'UTF-8');
  };

  const clearAll = () => {
    if (window.confirm('Clear ALL words and progress? This cannot be undone.')) {
      storage.clearAll();
      onRefresh();
      setImportMsg('All data cleared.');
    }
  };

  return (
    <div className="screen import-screen">
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('home')}>← Home</button>
        <h2>Import / Settings</h2>
      </div>

      {/* API Key */}
      <section className="settings-section">
        <h3>🔑 Anthropic API Key</h3>
        <p className="settings-hint">Required for AI-generated example sentences (claude-haiku-4-5).</p>
        <div className="api-key-row">
          <input
            type="password"
            className="input-field"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={saveApiKey}>
            {apiSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </section>

      {/* Sample Data */}
      <section className="settings-section">
        <h3>📖 Sample Words</h3>
        <p className="settings-hint">Load 10 sample words to try the app right away.</p>
        <button className="btn btn-secondary" onClick={loadSampleData}>
          Load Sample Data (10 words)
        </button>
      </section>

      {/* CSV Import */}
      <section className="settings-section">
        <h3>📄 Import from CSV</h3>
        <p className="settings-hint">
          CSV format: <code>word, meaning, type, level</code><br />
          Type: noun / verb / adjective / phrasal verb / etc.<br />
          Level: beginner / intermediate / advanced
        </p>
        <label className="file-upload-label">
          📁 Choose CSV file
          <input type="file" accept=".csv,.txt" onChange={handleFileUpload} hidden />
        </label>
        <textarea
          className="csv-textarea"
          placeholder={'word,meaning,type,level\nget rid of,〜を取り除く,phrasal verb,intermediate\neloquent,雄弁な,adjective,advanced'}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          rows={6}
        />
        <button className="btn btn-primary" onClick={importCSV}>
          Import Words
        </button>
      </section>

      {importMsg && <div className="success-msg">✅ {importMsg}</div>}
      {importError && <div className="error-msg">⚠️ {importError}</div>}

      {/* Danger Zone */}
      <section className="settings-section danger-zone">
        <h3>⚠️ Danger Zone</h3>
        <button className="btn btn-danger" onClick={clearAll}>
          Clear All Data
        </button>
      </section>
    </div>
  );
}
