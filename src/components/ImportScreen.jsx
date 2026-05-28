import { useState } from 'react';
import * as XLSX from 'xlsx';
import { storage } from '../utils/storage';
import { sampleWords } from '../data/sampleWords';

// ── SVL Excel column mapping ──────────────────────────────
const POS_MAP = {
  '【冠】': 'article',
  '【形】': 'adjective',
  '【前】': 'preposition',
  '【副】': 'adverb',
  '【動】': 'verb',
  '【名】': 'noun',
  '【代】': 'pronoun',
  '【接】': 'conjunction',
  '【間】': 'interjection',
  '【助】': 'auxiliary',
};

const svlLevel = (n) => {
  if (n <= 4)  return 'beginner';
  if (n <= 8)  return 'intermediate';
  return 'advanced';
};

const parseSVL = (rows) => {
  // rows[0] is the header: ["英単語","新レベル","品詞・語義"]
  return rows.slice(1).map((r, i) => {
    const word    = String(r[0] || '').trim();
    const level   = svlLevel(Number(r[1]) || 1);
    const posLine = String(r[2] || '').trim();

    // Extract primary POS from first 【...】 tag
    const posTag  = posLine.match(/【[^】]+】/)?.[0] || '';
    const type    = POS_MAP[posTag] || 'word';

    return {
      id: `svl_${i}`,
      word,
      meaning: posLine,   // keep full "【形】できる、有能な" string
      type,
      level,
    };
  }).filter(w => w.word);
};
// ──────────────────────────────────────────────────────────

export default function ImportScreen({ onNavigate, onRefresh }) {
  const [apiKey, setApiKey]     = useState(storage.getApiKey());
  const [apiSaved, setApiSaved] = useState(false);
  const [csvText, setCsvText]   = useState('');
  const [importMsg, setImportMsg]     = useState('');
  const [importError, setImportError] = useState('');
  const [loading, setLoading]         = useState(false);

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

  // ── Excel (.xlsx) upload ──
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

        // Auto-detect SVL format: header has "英単語"
        const header = rows[0] || [];
        const isSVL  = header.includes('英単語');

        let words;
        if (isSVL) {
          words = parseSVL(rows);
        } else {
          // Generic: word, meaning, type, level
          words = rows.slice(1).map((r, i) => ({
            id:      `xlsx_${Date.now()}_${i}`,
            word:    String(r[0] || '').trim(),
            meaning: String(r[1] || '').trim(),
            type:    String(r[2] || 'word').trim(),
            level:   String(r[3] || 'intermediate').trim(),
          })).filter(w => w.word);
        }

        storage.saveWords(words);
        onRefresh();
        setImportMsg(
          `✅ Imported ${words.length.toLocaleString()} words from ${isSVL ? 'SVL Excel' : 'Excel'}!`
        );
      } catch (err) {
        setImportError('Failed to read Excel file: ' + err.message);
      } finally {
        setLoading(false);
        e.target.value = '';   // reset input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── CSV (paste or file) ──
  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    const words = [];
    const errors = [];
    lines.forEach((line, i) => {
      if (i === 0 && line.toLowerCase().includes('word')) return;
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) { errors.push(`Line ${i + 1}: not enough columns`); return; }
      words.push({
        id:      `csv_${Date.now()}_${i}`,
        word:    cols[0],
        meaning: cols[1],
        type:    cols[2] || 'word',
        level:   cols[3] || 'intermediate',
      });
    });
    return { words, errors };
  };

  const importCSV = () => {
    setImportMsg('');
    setImportError('');
    if (!csvText.trim()) { setImportError('Please paste CSV text first.'); return; }
    const { words, errors } = parseCSV(csvText);
    if (words.length === 0) { setImportError('No valid words found. Check the format.'); return; }
    const merged = [...storage.loadWords(), ...words];
    storage.saveWords(merged);
    onRefresh();
    setImportMsg(`Imported ${words.length} words!${errors.length ? ` (${errors.length} rows skipped)` : ''}`);
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

      {/* SVL Excel Import — the main one */}
      <section className="settings-section svl-section">
        <h3>📊 Import SVL Excel (12,000 words)</h3>
        <p className="settings-hint">
          Select <code>新SVL_品詞・語義つき.xlsx</code>.<br />
          All 12,000 words will be imported automatically.
        </p>
        <label className={`file-upload-label file-upload-excel ${loading ? 'loading' : ''}`}>
          {loading ? '⏳ Importing…' : '📂 Choose .xlsx file'}
          <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} hidden disabled={loading} />
        </label>
      </section>

      {/* Sample Data */}
      <section className="settings-section">
        <h3>📖 Sample Words (10)</h3>
        <p className="settings-hint">Load a small set to try the app first.</p>
        <button className="btn btn-secondary" onClick={loadSampleData}>
          Load Sample Data
        </button>
      </section>

      {/* CSV Import */}
      <section className="settings-section">
        <h3>📄 Import from CSV</h3>
        <p className="settings-hint">
          Format: <code>word, meaning, type, level</code>
        </p>
        <label className="file-upload-label">
          📁 Choose CSV file
          <input type="file" accept=".csv,.txt" onChange={handleCSVFile} hidden />
        </label>
        <textarea
          className="csv-textarea"
          placeholder={'word,meaning,type,level\neloquent,雄弁な,adjective,advanced'}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          rows={4}
        />
        <button className="btn btn-primary" onClick={importCSV}>Import CSV</button>
      </section>

      {importMsg  && <div className="success-msg">{importMsg}</div>}
      {importError && <div className="error-msg">⚠️ {importError}</div>}

      {/* Danger Zone */}
      <section className="settings-section danger-zone">
        <h3>⚠️ Danger Zone</h3>
        <button className="btn btn-danger" onClick={clearAll}>Clear All Data</button>
      </section>
    </div>
  );
}
