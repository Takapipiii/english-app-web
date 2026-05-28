const API_URL = 'https://api.anthropic.com/v1/messages';

export const generateSentences = async (word, apiKey) => {
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

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+\./.test(l))
    .map(l => l.replace(/^\d+\.\s*/, ''));

  return lines;
};
