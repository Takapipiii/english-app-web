export const generateStory = async (words) => {
  const res = await fetch('/api/story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `API error: ${res.status}`);
  }
  const data = await res.json();
  return data.story;
};

export const generateSentence = async (words) => {
  const res = await fetch('/api/sentence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ words }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `API error: ${res.status}`);
  }
  const data = await res.json();
  return { sentence: data.sentence, translation: data.translation };
};
