import { useState } from 'react';
import * as XLSX from 'xlsx';
import { storage } from '../utils/storage';
import { sampleWords } from '../data/sampleWords';

// ── SVL Excel column mapping ──────────────────────────────
const POS_MAP = {
  '【冠】': 'article',   '【形】': 'adjective', '【前】': 'preposition',
  '【副】': 'adverb',    '【動】': 'verb',       '【名】': 'noun',
  '【代】': 'pronoun',   '【接】': 'conjunction','【間】': 'interjection',
  '【助】': 'auxiliary',
};

const svlLevel = (n) => {
  if (n <= 4)  return 'beginner';
  if (n <= 8)  return 'intermediate';
  return 'advanced';
};

const parseSVL = (rows) => {
  return rows.slice(1).map((r, i) => {
    const word    = String(r[0] || '').trim();
    const lv      = Number(r[1]) || 1;
    const posLine = String(r[2] || '').trim();
    const posTag  = posLine.match(/【[^】]+】/)?.[0] || '';
    return {
      id: `svl_${i}`,
      word,
      meaning:  posLine,
      type:     POS_MAP[posTag] || 'word',
      level:    svlLevel(lv),
      svlLevel: lv,
    };
  }).filter(w => w.word);
};
// ──────────────────────────────────────────────────────────

export default function ImportScreen({ onNavigate, onRefresh }) {
  const [apiKey, setApiKey]           = useState(storage.getApiKey());
  const [apiSaved, setApiSaved]       = useState(false);
  const [csvText, setCsvText]         = useState('');
  const [importMsg, setImportMsg]     = useState('');
  const [importError, setImportError] = useState('');
  const [loading, setLoading]         = useState(false);

  const saveApiKey = () => {
    storage.saveApiKey(apiKey.trim());
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 2000);
  };

  // ── Load bundled SVL JSON (most reliable — no file upload) ──
  const loadSVLWords = async () => {
    setLoading(true);
    setImportMsg('');
    setImportError('');
    try {
      // Works both on localhost and GitHub Pages
      const base = import.meta.env.BASE_URL || '/';
      const res  = await fetch(`${base}svl_words.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const words = await res.json();
      storage.saveWords(words);
      onRefresh();
      setImportMsg(`✅ Loaded ${words.length.toLocaleString()} SVL words!`);
    } catch (e) {
      setImportError('Failed to load: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Excel file upload (advanced) ──
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setImportMsg('');
    setImportError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const header = rows[0] || [];
        const isSVL  = header.includes('英単語');
        const words  = isSVL
          ? parseSVL(rows)
          : rows.slice(1).map((r, i) => ({
              id:      `xlsx_${Date.now()}_${i}`,
              word:    String(r[0] || '').trim(),
              meaning: String(r[1] || '').trim(),
              type:    String(r[2] || 'word').trim(),
              level:   String(r[3] || 'intermediate').trim(),
            })).filter(w => w.word);

        storage.saveWords(words);
        onRefresh();
        setImportMsg(`✅ Imported ${words.length.toLocaleString()} words!`);
      } catch (err) {
        setImportError('Failed to read file: ' + err.message);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.onerror = () => {
      setImportError('File read error. Try the "Load SVL Words" button instead.');
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // ── CSV import ──
  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    const words = [], errors = [];
    lines.forEach((line, i) => {
      if (i === 0 && line.toLowerCase().includes('word')) return;
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) { errors.push(`Line ${i + 1}: not enough columns`); return; }
      words.push({ id: `csv_${Date.now()}_${i}`, word: cols[0], meaning: cols[1], type: cols[2] || 'word', level: cols[3] || 'intermediate' });
    });
    return { words, errors };
  };

  const importCSV = () => {
    setImportMsg(''); setImportError('');
    if (!csvText.trim()) { setImportError('Please paste CSV text first.'); return; }
    const { words, errors } = parseCSV(csvText);
    if (words.length === 0) { setImportError('No valid words found.'); return; }
    storage.saveWords([...storage.loadWords(), ...words]);
    onRefresh();
    setImportMsg(`Imported ${words.length} words!${errors.length ? ` (${errors.length} skipped)` : ''}`);
    setCsvText('');
  };

  const handleCSVFile = (e) => {
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
        <p className="settings-hint">Required for AI-generated example sentences.</p>
        <div className="api-key-row">
          <input type="password" className="input-field" placeholder="sk-ant-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={saveApiKey}>{apiSaved ? '✓ Saved' : 'Save'}</button>
        </div>
      </section>

      {/* SVL — one-click load */}
      <section className="settings-section svl-section">
        <h3>📊 SVL 12,000 Words</h3>
        <p className="settings-hint">
          Tap the button below — no file needed.<br />
          All 12,000 words load instantly.
        </p>
        <button
          className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
          onClick={loadSVLWords}
          disabled={loading}
        >
          {loading ? '⏳ Loading…' : '🚀 Load All 12,000 SVL Words'}
        </button>
      </section>

      {/* Excel upload (fallback) */}
      <section className="settings-section">
        <h3>📂 Upload Excel (optional)</h3>
        <p className="settings-hint">
          Use this if you have a custom Excel file.<br />
          SVL format is auto-detected.
        </p>
        <label className={`file-upload-label ${loading ? 'loading' : ''}`}>
          📁 Choose .xlsx file
          <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} hidden disabled={loading} />
        </label>
      </section>

      {/* Sample Data */}
      <section className="settings-section">
        <h3>📖 Sample Words (10)</h3>
        <p className="settings-hint">Just want to try the app quickly?</p>
        <button className="btn btn-secondary" onClick={() => { storage.saveWords(sampleWords); onRefresh(); setImportMsg('Loaded 10 sample words!'); }}>
          Load Sample Data
        </button>
      </section>

      {/* CSV */}
      <section className="settings-section">
        <h3>📄 CSV Import</h3>
        <p className="settings-hint">Format: <code>word, meaning, type, level</code></p>
        <label className="file-upload-label">
          📁 Choose CSV
          <input type="file" accept=".csv,.txt" onChange={handleCSVFile} hidden />
        </label>
        <textarea className="csv-textarea" placeholder={'word,meaning,type,level\neloquent,雄弁な,adjective,advanced'} value={csvText} onChange={e => setCsvText(e.target.value)} rows={4} />
        <button className="btn btn-primary" onClick={importCSV}>Import CSV</button>
      </section>

      {importMsg   && <div className="success-msg">{importMsg}</div>}
      {importError && <div className="error-msg">⚠️ {importError}</div>}

      <section className="settings-section danger-zone">
        <h3>⚠️ Danger Zone</h3>
        <button className="btn btn-danger" onClick={clearAll}>Clear All Data</button>
      </section>
    </div>
  );
}
