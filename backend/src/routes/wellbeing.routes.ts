import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import pool from '../db/connection';

const router = Router();

router.get('/analysis', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const studyRes = await pool.query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_sessions
       WHERE user_id = $1 AND start_time > NOW() - INTERVAL '7 days'`,
      [req.userId]
    );
    const assignmentRes = await pool.query(
      `SELECT COUNT(*) as count FROM assignments
       WHERE user_id = $1 AND status != 'completed' AND due_date > NOW() AND due_date < NOW() + INTERVAL '7 days'`,
      [req.userId]
    );

    const studyHours = Math.round(parseInt(studyRes.rows[0].total) / 60);
    const deadlines = parseInt(assignmentRes.rows[0].count);

    // Simple burnout score: high study hours + many deadlines = higher score
    const burnoutScore = Math.min(100, Math.round((studyHours / 40) * 50 + (deadlines / 5) * 50));

    res.json({
      burnoutScore,
      studyHours,
      upcomingDeadlines: deadlines,
      recommendation: burnoutScore > 60
        ? 'Take a break! You have been working hard.'
        : burnoutScore > 30
        ? 'Moderate workload. Keep a healthy balance.'
        : 'Great balance! Keep it up.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wellbeing data' });
  }
});

router.post('/study-sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, start_time, end_time, duration_minutes, intensity, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO study_sessions (user_id, course_id, start_time, end_time, duration_minutes, intensity, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.userId, course_id, start_time, end_time, duration_minutes, intensity, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log study session' });
  }
});

router.get('/study-sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY start_time DESC LIMIT 20',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch study sessions' });
  }
});

export default router;
