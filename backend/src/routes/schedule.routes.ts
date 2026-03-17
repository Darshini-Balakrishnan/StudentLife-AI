import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import pool from '../db/connection';

const router = Router();

// GET all class schedule entries for the user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM class_schedules WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// POST add a class to schedule
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { course_name, course_code, days, start_time, end_time, location, instructor, semester } = req.body;
    if (!course_name || !days?.length || !start_time || !end_time) {
      return res.status(400).json({ error: 'course_name, days, start_time, end_time are required' });
    }
    const result = await pool.query(
      `INSERT INTO class_schedules (user_id, course_name, course_code, days, start_time, end_time, location, instructor, semester)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.userId, course_name, course_code, days, start_time, end_time, location, instructor, semester]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to add class' });
  }
});

// DELETE a class from schedule
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM class_schedules WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

export default router;
