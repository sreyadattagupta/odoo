import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireHR } from '../auth.js';
import { publicUser } from './auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/profiles  — HR only: list all employees
router.get('/', requireHR, (req, res) => {
  const rows = db.prepare('SELECT * FROM profiles ORDER BY full_name').all();
  res.json(rows.map(publicUser));
});

// GET /api/profiles/:id — self or HR
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role !== 'hr' && req.user.id !== id)
    return res.status(403).json({ error: 'Forbidden' });
  const user = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(publicUser(user));
});

// PATCH /api/profiles/:id — employee edits limited fields on self; HR edits anything
const EMPLOYEE_FIELDS = ['phone', 'address', 'photo_url'];
const HR_FIELDS = [...EMPLOYEE_FIELDS, 'full_name', 'email', 'job_title', 'department', 'employee_id'];

router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  const isSelf = req.user.id === id;
  const isHR = req.user.role === 'hr';
  if (!isSelf && !isHR) return res.status(403).json({ error: 'Forbidden' });

  const allowed = isHR ? HR_FIELDS : EMPLOYEE_FIELDS;
  const updates = Object.entries(req.body || {}).filter(([k]) => allowed.includes(k));
  if (updates.length === 0) return res.status(400).json({ error: 'No editable fields provided' });

  const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
  const values = updates.map(([, v]) => v);
  db.prepare(`UPDATE profiles SET ${setClause} WHERE id = ?`).run(...values, id);

  const user = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
  res.json(publicUser(user));
});

export default router;
