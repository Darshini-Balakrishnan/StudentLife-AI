import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import pool from '../db/connection';
import OpenAI from 'openai';
import { getWeather, getMason360Events } from '../mcp';

const router = Router();

let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
  return openai;
}

// GET last saved plan
router.get('/plan', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const type = (req.query.type as string) || 'weekly';
    const result = await pool.query(
      'SELECT * FROM planner_plans WHERE user_id=$1 AND plan_type=$2 ORDER BY generated_at DESC LIMIT 1',
      [req.userId, type]
    );
    res.json(result.rows[0] || null);
  } catch {
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

// POST generate a new plan
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'weekly' } = req.body; // 'weekly' | 'monthly'

    // Gather all user context in parallel
    const [scheduleRes, userRes, eventsRes, studyRes, assignRes, expenseRes] = await Promise.all([
      pool.query('SELECT * FROM class_schedules WHERE user_id=$1 ORDER BY created_at ASC', [req.userId]),
      pool.query('SELECT full_name, major, year, interests FROM users WHERE id=$1', [req.userId]),
      pool.query(
        `SELECT title, event_type, location, start_time, tags FROM events
         WHERE start_time > NOW() AND start_time < NOW() + INTERVAL '30 days'
         ORDER BY start_time ASC LIMIT 10`,
        []
      ),
      pool.query(
        `SELECT COALESCE(SUM(duration_minutes),0) as total FROM study_sessions
         WHERE user_id=$1 AND start_time > NOW() - INTERVAL '7 days'`,
        [req.userId]
      ),
      pool.query(
        `SELECT title, due_date, priority FROM assignments
         WHERE user_id=$1 AND status!='completed' AND due_date > NOW()
         ORDER BY due_date ASC LIMIT 10`,
        [req.userId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount),0) as total FROM expenses
         WHERE user_id=$1 AND transaction_date >= date_trunc('month', CURRENT_DATE)`,
        [req.userId]
      ),
    ]);

    const [weatherResult, mason360Result] = await Promise.allSettled([
      getWeather('Fairfax,VA,US'),
      getMason360Events(),
    ]);

    const user = userRes.rows[0];
    const schedule = scheduleRes.rows;
    const upcomingEvents = eventsRes.rows;
    const assignments = assignRes.rows;
    const studyHours = Math.round(parseInt(studyRes.rows[0].total) / 60);
    const monthlySpend = parseFloat(expenseRes.rows[0].total);
    const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
    const mason360 = mason360Result.status === 'fulfilled' ? mason360Result.value.slice(0, 5) : [];

    // Build schedule text
    const scheduleText = schedule.length > 0
      ? schedule.map(c =>
          `${c.course_name}${c.course_code ? ` (${c.course_code})` : ''}: ${(c.days || []).join('/')} ${c.start_time}–${c.end_time}${c.location ? ` @ ${c.location}` : ''}`
        ).join('\n')
      : 'No class schedule uploaded yet';

    const assignmentsText = assignments.length > 0
      ? assignments.map(a => `- ${a.title} (due ${new Date(a.due_date).toLocaleDateString()}, priority: ${a.priority || 'normal'})`).join('\n')
      : 'No upcoming assignments';

    const eventsText = [...upcomingEvents, ...mason360.map(e => ({
      title: e.title, event_type: e.event_type, location: e.location,
      start_time: e.start_time, tags: e.tags,
    }))].slice(0, 8).map(e =>
      `- ${e.title} (${e.event_type || 'event'}) on ${new Date(e.start_time).toLocaleDateString()}${e.location ? ` @ ${e.location}` : ''}`
    ).join('\n') || 'No upcoming events';

    const weatherText = weather
      ? `Current weather: ${weather.temp}°F, ${weather.description}. ${weather.is_outdoor_friendly ? 'Good for outdoor activities.' : 'Better to stay indoors.'}`
      : '';

    const prompt = type === 'weekly'
      ? `Create a detailed, realistic WEEKLY productivity plan for a GMU student.

Student Profile:
- Name: ${user?.full_name || 'Student'}
- Major: ${user?.major || 'Undeclared'}
- Year: ${user?.year ? `Year ${user.year}` : 'Not specified'}
- Interests: ${(user?.interests || []).join(', ') || 'Not specified'}
- Study hours last 7 days: ${studyHours}h
- Monthly spending: $${monthlySpend.toFixed(2)}
${weatherText}

Class Schedule:
${scheduleText}

Upcoming Assignments:
${assignmentsText}

Upcoming Campus Events:
${eventsText}

Generate a Monday–Sunday plan that:
1. Blocks class times exactly as scheduled
2. Adds focused study blocks (2–3h) for each course, prioritizing assignments by due date
3. Recommends 2–3 campus events to attend based on interests and weather
4. Includes breaks, meals, exercise, and social time
5. Suggests a budget tip based on their spending
6. Ends with a motivational note

Format as a clean day-by-day schedule. Use emojis for readability. Be specific with times.`
      : `Create a MONTHLY productivity plan for a GMU student for the next 4 weeks.

Student Profile:
- Name: ${user?.full_name || 'Student'}
- Major: ${user?.major || 'Undeclared'}
- Year: ${user?.year ? `Year ${user.year}` : 'Not specified'}
- Interests: ${(user?.interests || []).join(', ') || 'Not specified'}
- Study hours last 7 days: ${studyHours}h
- Monthly spending: $${monthlySpend.toFixed(2)}

Class Schedule:
${scheduleText}

Upcoming Assignments & Deadlines:
${assignmentsText}

Upcoming Campus Events:
${eventsText}

Generate a 4-week plan that:
1. Shows weekly themes (e.g., "Week 1: Foundation & Catch-up")
2. Maps out assignment deadlines and when to start working on them
3. Recommends campus events to attend each week
4. Includes study hour targets per week per course
5. Suggests monthly budget breakdown based on current spending
6. Includes self-care and social activities
7. Ends with a monthly goal summary

Format with clear week headers. Use emojis. Be actionable and specific.`;

    const completion = await getOpenAI().chat.completions.create({
      model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a student productivity coach at George Mason University. Create detailed, realistic, and motivating plans.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1800,
    });

    const content = completion.choices[0].message.content ?? 'Could not generate plan.';

    // Save plan
    await pool.query(
      'INSERT INTO planner_plans (user_id, plan_type, content) VALUES ($1,$2,$3)',
      [req.userId, type, content]
    );

    res.json({ content, type, generated_at: new Date().toISOString() });
  } catch (error: any) {
    console.error('Planner error:', error?.message);
    const msg = error?.status === 429
      ? 'Groq rate limit hit — wait a moment and try again.'
      : error?.status === 401
      ? 'Invalid Groq API key. Check GROQ_API_KEY in .env'
      : 'Failed to generate plan. Check backend logs.';
    res.status(500).json({ error: msg });
  }
});

export default router;
