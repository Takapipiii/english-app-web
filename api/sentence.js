export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { words } = req.body;
  if (!words || !Array.isArray(words) || words.length < 2) {
    return res.status(400).json({ error: 'words array (2-3 items) is required.' });
  }

  const wordList = words.join(', ');
  const prompt = `Create ONE short, natural English sentence that uses ALL of these words: ${wordList}.

Rules:
- Use every word naturally in a single sentence
- Keep it short and memorable (under 20 words)
- Intermediate level English
- Then provide a Japanese translation

Format your response exactly like this:
ENGLISH: [the sentence]
JAPANESE: [Japanese translation]

Only output those two lines, nothing else.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return res.status(response.status).json({ error: err?.error?.message || 'API error' });
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  const englishMatch = text.match(/ENGLISH:\s*(.+)/i);
  const japaneseMatch = text.match(/JAPANESE:\s*(.+)/i);

  if (!englishMatch) {
    return res.status(500).json({ error: 'Unexpected response format from AI.' });
  }

  res.json({
    sentence: englishMatch[1].trim(),
    translation: japaneseMatch ? japaneseMatch[1].trim() : '',
  });
}
