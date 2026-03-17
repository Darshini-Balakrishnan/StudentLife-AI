import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response } from 'express';
import pool from '../db/connection';
import https from 'https';
import http from 'http';

const router = Router();

// GET all assignments for user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM assignments WHERE user_id = $1 ORDER BY due_date ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST create assignment manually
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, due_date, priority, estimated_hours } = req.body;
    if (!title || !due_date) return res.status(400).json({ error: 'title and due_date are required' });
    const result = await pool.query(
      `INSERT INTO assignments (user_id, title, description, due_date, priority, estimated_hours, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING *`,
      [req.userId, title, description || null, due_date, priority || 'medium', estimated_hours || null]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PATCH mark complete / update status
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      `UPDATE assignments SET status=$1, completed_at=$2, updated_at=NOW()
       WHERE id=$3 AND user_id=$4 RETURNING *`,
      [status, status === 'completed' ? new Date() : null, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE assignment
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM assignments WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// POST /assignments/import-ics — import from Canvas ICS feed URL
router.post('/import-ics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { ics_url } = req.body;
    if (!ics_url) return res.status(400).json({ error: 'ics_url is required' });

    // Fetch the ICS file
    const icsText = await fetchUrl(ics_url);
    const events = parseICS(icsText);

    if (events.length === 0) return res.status(400).json({ error: 'No assignments found in the calendar feed. Make sure you copied the full Canvas calendar URL.' });

    // Upsert each event — skip duplicates by title+due_date
    let imported = 0;
    let skipped = 0;
    for (const ev of events) {
      const existing = await pool.query(
        'SELECT id FROM assignments WHERE user_id=$1 AND title=$2 AND due_date=$3',
        [req.userId, ev.title, ev.due_date]
      );
      if (existing.rows.length > 0) { skipped++; continue; }
      await pool.query(
        `INSERT INTO assignments (user_id, title, description, due_date, priority, status)
         VALUES ($1,$2,$3,$4,'medium','pending')`,
        [req.userId, ev.title, ev.description || null, ev.due_date]
      );
      imported++;
    }

    res.json({ imported, skipped, total: events.length });
  } catch (err: any) {
    console.error('ICS import error:', err.message);
    res.status(500).json({ error: 'Failed to import calendar. Check the URL and try again.' });
  }
});

// ── helpers ──────────────────────────────────────────────────────────────────

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (r) => {
      if (r.statusCode && r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        return fetchUrl(r.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      r.on('data', c => data += c);
      r.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseICS(ics: string): { title: string; due_date: Date; description: string }[] {
  const results: { title: string; due_date: Date; description: string }[] = [];
  const blocks = ics.split('BEGIN:VEVENT');

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key: string) => {
      const match = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return match ? match[1].trim() : '';
    };

    const summary = get('SUMMARY').replace(/\\,/g, ',').replace(/\\n/g, ' ').replace(/\\\\/g, '\\');
    const dtdue = get('DUE') || get('DTSTART');
    const desc = get('DESCRIPTION').replace(/\\n/g, ' ').replace(/\\,/g, ',').slice(0, 500);

    if (!summary || !dtdue) continue;

    // Parse ICS date: 20260315T235900Z or 20260315
    const due = parseICSDate(dtdue);
    if (!due) continue;

    // Only include future assignments
    if (due < new Date()) continue;

    results.push({ title: summary, due_date: due, description: desc });
  }

  return results;
}

function parseICSDate(str: string): Date | null {
  try {
    // Remove timezone ID prefix like TZID=America/New_York:
    const clean = str.includes(':') ? str.split(':').pop()! : str;
    if (clean.length === 8) {
      // Date only: 20260315
      return new Date(`${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}T23:59:00`);
    }
    // DateTime: 20260315T235900Z
    return new Date(
      `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}T${clean.slice(9,11)}:${clean.slice(11,13)}:${clean.slice(13,15)}Z`
    );
  } catch { return null; }
}

export default router;
