export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { words } = req.body;
  if (!words || words.length < 3) {
    return res.status(400).json({ error: 'At least 3 words required.' });
  }

  const wordList = words.map(w => w.word).join(', ');
  const prompt = `Write a short story (150-200 words) that naturally uses these English words/phrases: ${wordList}.
Rules:
- Use each word naturally in context
- Keep the story engaging and easy to follow
- Write for intermediate English learners
- Output only the story text, no title, no explanation`;

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
  res.json({ story: data.content[0].text.trim() });
}
