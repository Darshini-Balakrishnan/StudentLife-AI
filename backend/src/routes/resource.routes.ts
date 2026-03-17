import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import pool from '../db/connection';
import { getIO } from '../socket/io';
import { emitNewResource } from '../socket/handlers';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, type } = req.query;
    let query = `SELECT r.*, c.course_code FROM resources r
                 LEFT JOIN courses c ON r.course_id = c.id WHERE 1=1`;
    const params: any[] = [];
    let i = 1;

    if (course_id) { query += ` AND r.course_id = $${i++}`; params.push(course_id); }
    if (type) { query += ` AND r.resource_type = $${i++}`; params.push(type); }

    query += ' ORDER BY r.created_at DESC LIMIT 20';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { course_id, title, description, resource_type, file_url, file_size } = req.body;
    const result = await pool.query(
      `INSERT INTO resources (course_id, uploader_id, title, description, resource_type, file_url, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [course_id, req.userId, title, description, resource_type, file_url, file_size]
    );
    const resource = result.rows[0];
    if (course_id) emitNewResource(getIO(), course_id, resource);
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

router.post('/:id/rate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, review } = req.body;
    await pool.query(
      `INSERT INTO resource_ratings (resource_id, user_id, rating, review)
       VALUES ($1, $2, $3, $4) ON CONFLICT (resource_id, user_id) DO UPDATE SET rating=$3, review=$4`,
      [req.params.id, req.userId, rating, review]
    );
    const avg = await pool.query(
      'SELECT AVG(rating) as avg, COUNT(*) as count FROM resource_ratings WHERE resource_id = $1',
      [req.params.id]
    );
    await pool.query(
      'UPDATE resources SET rating_avg=$1, rating_count=$2 WHERE id=$3',
      [avg.rows[0].avg, avg.rows[0].count, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rate resource' });
  }
});

export default router;
