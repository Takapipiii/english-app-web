export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'word is required.' });

  const prompt = `Generate 3 natural English example sentences using the word/phrase "${word}".
For each sentence:
1. Use it in a realistic, everyday context
2. Keep sentences at intermediate level
3. After each sentence, add a Japanese translation in parentheses

Format your response exactly like this:
1. [English sentence] （[Japanese translation]）
2. [English sentence] （[Japanese translation]）
3. [English sentence] （[Japanese translation]）

Only output the 3 numbered sentences, nothing else.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return res.status(response.status).json({ error: err?.error?.message || 'API error' });
  }

  const data = await response.json();
  const text = data.content[0].text.trim();
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+\./.test(l))
    .map(l => l.replace(/^\d+\.\s*/, ''));

  res.json({ sentences: lines });
}
