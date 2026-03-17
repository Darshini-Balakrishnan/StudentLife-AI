import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import pool from '../db/connection';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

export default router;
