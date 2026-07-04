import { Router } from 'express';
import db from '../db.js';
import { hashPassword, verifyPassword, signToken, validatePassword, requireAuth } from '../auth.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { employee_id, full_name, email, password, role } = req.body || {};
  if (!employee_id || !full_name || !email || !password || !role)
    return res.status(400).json({ error: 'All fields are required' });
  if (!['employee', 'hr'].includes(role))
    return res.status(400).json({ error: 'Role must be employee or hr' });
  if (!validatePassword(password))
    return res.status(400).json({ error: 'Password must be 8+ chars with a letter and a number' });

  const exists = db.prepare('SELECT id FROM profiles WHERE email = ? OR employee_id = ?').get(email, employee_id);
  if (exists) return res.status(409).json({ error: 'Email or Employee ID already registered' });

  const info = db
    .prepare(
      `INSERT INTO profiles (employee_id, full_name, email, password_hash, role, email_verified)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
    .run(employee_id, full_name, email, hashPassword(password), role);

  // Every employee gets a starter salary structure row so payroll is never empty.
  db.prepare('INSERT INTO salary_structure (user_id, basic, hra, allowances, deductions) VALUES (?, ?, ?, ?, ?)')
    .run(info.lastInsertRowid, 30000, 12000, 5000, 3000);

  const user = db.prepare('SELECT * FROM profiles WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
  if (!user || !verifyPassword(password || '', user.password_hash))
    return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user: publicUser(user) });
});

export function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

export default router;
