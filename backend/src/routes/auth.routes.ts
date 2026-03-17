import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../db/connection';

const router = Router();

const JWT_OPTIONS: SignOptions = { expiresIn: '7d' };

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, major, year } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, cognito_id, full_name, major, year)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, major, year`,
      [email, hashedPassword, full_name, major, year]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, JWT_OPTIONS);

    res.status(201).json({ user, token });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.cognito_id);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, JWT_OPTIONS);

    const { cognito_id, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, major, year, interests, profile_image_url FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
