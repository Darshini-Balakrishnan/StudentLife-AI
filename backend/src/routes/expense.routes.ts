import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import pool from '../db/connection';
import { getIO } from '../socket/io';
import { emitExpenseUpdate } from '../socket/handlers';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY transaction_date DESC LIMIT 50',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, category, description, transaction_date, payment_method } = req.body;
    const result = await pool.query(
      `INSERT INTO expenses (user_id, amount, category, description, transaction_date, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, amount, category, description, transaction_date || new Date(), payment_method]
    );
    const expense = result.rows[0];
    emitExpenseUpdate(getIO(), req.userId!, expense);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const totalRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
       WHERE user_id = $1 AND transaction_date >= date_trunc('month', CURRENT_DATE)`,
      [req.userId]
    );
    const categoryRes = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) as total FROM expenses
       WHERE user_id = $1 AND transaction_date >= date_trunc('month', CURRENT_DATE)
       GROUP BY category`,
      [req.userId]
    );
    const budgetRes = await pool.query(
      `SELECT COALESCE(SUM(planned_amount), 1000) as budget FROM budgets
       WHERE user_id = $1 AND month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [req.userId]
    );

    res.json({
      total: parseFloat(totalRes.rows[0].total),
      budget: parseFloat(budgetRes.rows[0].budget),
      by_category: Object.fromEntries(categoryRes.rows.map((r: any) => [r.category, parseFloat(r.total)])),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
