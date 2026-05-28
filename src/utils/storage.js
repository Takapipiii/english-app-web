const KEYS = {
  WORDS: 'words_all',
  UNKNOWN: 'words_unknown',
  KNOWN: 'words_known',
  SENTENCES: 'sentences_cache',
  API_KEY: 'anthropic_api_key',
  SELECTED_LEVELS: 'selected_levels',
};

export const storage = {
  saveWords: (words) => localStorage.setItem(KEYS.WORDS, JSON.stringify(words)),
  loadWords: () => JSON.parse(localStorage.getItem(KEYS.WORDS) || '[]'),

  markUnknown: (word) => {
    const list = JSON.parse(localStorage.getItem(KEYS.UNKNOWN) || '[]');
    if (!list.find(w => w.id === word.id)) {
      list.push(word);
      localStorage.setItem(KEYS.UNKNOWN, JSON.stringify(list));
    }
  },

  markKnown: (wordId) => {
    const unknown = JSON.parse(localStorage.getItem(KEYS.UNKNOWN) || '[]');
    localStorage.setItem(KEYS.UNKNOWN, JSON.stringify(unknown.filter(w => w.id !== wordId)));
    const known = JSON.parse(localStorage.getItem(KEYS.KNOWN) || '[]');
    if (!known.includes(wordId)) {
      known.push(wordId);
      localStorage.setItem(KEYS.KNOWN, JSON.stringify(known));
    }
  },

  loadUnknownWords: () => JSON.parse(localStorage.getItem(KEYS.UNKNOWN) || '[]'),
  loadKnownIds: () => JSON.parse(localStorage.getItem(KEYS.KNOWN) || '[]'),

  cacheSentence: (wordId, data) => {
    const cache = JSON.parse(localStorage.getItem(KEYS.SENTENCES) || '{}');
    cache[wordId] = data;
    localStorage.setItem(KEYS.SENTENCES, JSON.stringify(cache));
  },

  getCachedSentence: (wordId) => {
    const cache = JSON.parse(localStorage.getItem(KEYS.SENTENCES) || '{}');
    return cache[wordId] || null;
  },

  getApiKey: () => localStorage.getItem(KEYS.API_KEY) || '',
  saveApiKey: (key) => localStorage.setItem(KEYS.API_KEY, key),

  getSelectedLevels: () => JSON.parse(localStorage.getItem(KEYS.SELECTED_LEVELS) || '[]'),
  saveSelectedLevels: (levels) => localStorage.setItem(KEYS.SELECTED_LEVELS, JSON.stringify(levels)),

  clearAll: () => Object.values(KEYS).forEach(k => localStorage.removeItem(k)),

  getStats: () => {
    const all = JSON.parse(localStorage.getItem(KEYS.WORDS) || '[]');
    const unknown = JSON.parse(localStorage.getItem(KEYS.UNKNOWN) || '[]');
    const known = JSON.parse(localStorage.getItem(KEYS.KNOWN) || '[]');
    return {
      total: all.length,
      unknown: unknown.length,
      known: known.length,
      remaining: Math.max(0, all.length - known.length - unknown.length),
    };
  },

  getLevelProgress: () => {
    const all     = JSON.parse(localStorage.getItem(KEYS.WORDS)   || '[]');
    const knownIds = new Set(JSON.parse(localStorage.getItem(KEYS.KNOWN) || '[]'));
    const unknownIds = new Set(
      JSON.parse(localStorage.getItem(KEYS.UNKNOWN) || '[]').map(w => w.id)
    );

    // Group by svlLevel (1-12). Words without svlLevel are skipped.
    const levels = {};
    all.forEach(w => {
      const lv = w.svlLevel;
      if (!lv) return;
      if (!levels[lv]) levels[lv] = { total: 0, known: 0, unknown: 0 };
      levels[lv].total++;
      if (knownIds.has(w.id))   levels[lv].known++;
      else if (unknownIds.has(w.id)) levels[lv].unknown++;
    });

    // Return sorted array
    return Object.entries(levels)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([lv, data]) => ({ level: Number(lv), ...data }));
  },
};
