require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const OpenAI = require('openai').default || require('openai');

const key = process.env.GROQ_API_KEY;
console.log('GROQ_API_KEY present:', !!key, key ? `(starts with ${key.slice(0,8)}...)` : '(MISSING — get one at console.groq.com)');
console.log('AI_MODEL:', process.env.AI_MODEL);

if (!key) { console.error('Add GROQ_API_KEY to .env first'); process.exit(1); }

const client = new OpenAI({
  apiKey: key,
  baseURL: 'https://api.groq.com/openai/v1',
});

client.chat.completions.create({
  model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
  messages: [{ role: 'user', content: 'Say hello in one word.' }],
  max_tokens: 20,
}).then(r => {
  console.log('SUCCESS:', r.choices[0].message.content);
}).catch(e => {
  console.error('ERROR:', e.status, e.message);
});
