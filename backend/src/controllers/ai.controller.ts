import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';
import pool from '../db/connection';
import { getWeather, getMason360Events } from '../mcp';

let client: OpenAI | null = null;

function getAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not set — get a free key at console.groq.com');
    client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return client;
}

const AI_MODEL = () => process.env.AI_MODEL || 'llama-3.1-8b-instant';

export async function chat(req: AuthRequest, res: Response) {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userContext = await getUserContext(req.userId!);

    // Fetch MCP context (weather + Mason360) in parallel, non-blocking
    const [weatherResult, mason360Result] = await Promise.allSettled([
      getWeather('Fairfax,VA,US'),
      getMason360Events(),
    ]);
    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
    const mason360Events = mason360Result.status === 'fulfilled' ? mason360Result.value.slice(0, 5) : [];

    const weatherContext = weather
      ? `\n- Current weather at GMU Fairfax: ${weather.temp}°F, ${weather.description}, ${weather.is_outdoor_friendly ? 'good for outdoor events' : 'better for indoor events'}`
      : '';

    const mason360Context = mason360Events.length > 0
      ? `\n- Upcoming Mason360 events: ${mason360Events.map(e => `"${e.title}" (${e.is_outdoor ? 'outdoor' : 'indoor'}, ${e.location || 'TBD'})`).join('; ')}`
      : '';

    const systemPrompt = `You are StudentLife AI, a helpful assistant for George Mason University students.
You help with event recommendations, study planning, burnout detection, and expense management.
Be concise, friendly, and practical. Keep responses under 200 words unless asked for detail.
When recommending events, consider the current weather — suggest indoor events if it's raining/stormy.

Current user context:
- Major: ${userContext.major || 'Not specified'}
- Enrolled courses: ${userContext.courses.join(', ') || 'None enrolled yet'}
- Upcoming assignments: ${userContext.assignmentCount}
- Study hours (last 7 days): ${userContext.recentStudyHours}h
- Monthly spending so far: $${userContext.monthlySpending.toFixed(2)}${weatherContext}${mason360Context}`;

    const historyResult = await pool.query(
      'SELECT role, content FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.userId]
    );

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...historyResult.rows.reverse().map((r: { role: 'user' | 'assistant'; content: string }) => ({
        role: r.role,
        content: r.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await getAI().chat.completions.create({
      model: AI_MODEL(),
      messages,
      temperature: 0.7,
      max_tokens: 400,
    });

    const assistantMessage = completion.choices[0].message.content ?? 'Sorry, I could not generate a response.';

    // Persist both turns
    await pool.query(
      'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3)',
      [req.userId, 'user', message]
    );
    await pool.query(
      'INSERT INTO chat_messages (user_id, role, content, context_data) VALUES ($1, $2, $3, $4)',
      [req.userId, 'assistant', assistantMessage, JSON.stringify(userContext)]
    );

    res.json({ message: assistantMessage });
  } catch (error: any) {
    console.error('AI chat error:', error?.message || error);

    // Surface a useful message to the client
    const status = error?.status || 500;
    const msg =
      error?.status === 401
        ? 'Groq API key is invalid. Check GROQ_API_KEY in your .env file.'
        : error?.status === 429
        ? 'Groq rate limit hit — wait a moment and try again.'
        : error?.message?.includes('GROQ_API_KEY')
        ? 'Groq API key is missing. Get a free key at console.groq.com'
        : 'AI service error. Check backend logs for details.';

    res.status(status).json({ error: msg });
  }
}

async function getUserContext(userId: string) {
  const [userRes, coursesRes, assignRes, studyRes, expenseRes] = await Promise.all([
    pool.query('SELECT major FROM users WHERE id = $1', [userId]),
    pool.query(
      `SELECT c.course_code FROM enrollments e
       JOIN courses c ON e.course_id = c.id WHERE e.user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT COUNT(*) as count FROM assignments
       WHERE user_id = $1 AND status != 'completed' AND due_date > NOW()`,
      [userId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_sessions
       WHERE user_id = $1 AND start_time > NOW() - INTERVAL '7 days'`,
      [userId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
       WHERE user_id = $1 AND transaction_date >= date_trunc('month', CURRENT_DATE)`,
      [userId]
    ),
  ]);

  return {
    major: userRes.rows[0]?.major ?? null,
    courses: coursesRes.rows.map((r: { course_code: string }) => r.course_code),
    assignmentCount: parseInt(assignRes.rows[0].count),
    recentStudyHours: Math.round(parseInt(studyRes.rows[0].total) / 60),
    monthlySpending: parseFloat(expenseRes.rows[0].total),
  };
}

export async function getChatHistory(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      'SELECT role, content, created_at FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 50',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
}
