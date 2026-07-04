import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireHR } from '../auth.js';

const router = Router();
router.use(requireAuth);

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 8);

// POST /api/attendance/check-in — creates/updates today's row for the caller
router.post('/check-in', (req, res) => {
  const date = today();
  const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, date);
  if (existing && existing.check_in)
    return res.status(409).json({ error: 'Already checked in today', attendance: existing });

  db.prepare(
    `INSERT INTO attendance (user_id, date, check_in, status) VALUES (?, ?, ?, 'present')
     ON CONFLICT(user_id, date) DO UPDATE SET check_in = excluded.check_in, status = 'present'`
  ).run(req.user.id, date, nowTime());

  res.json(db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, date));
});

// POST /api/attendance/check-out
router.post('/check-out', (req, res) => {
  const date = today();
  const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, date);
  if (!existing || !existing.check_in) return res.status(400).json({ error: 'Check in first' });
  db.prepare('UPDATE attendance SET check_out = ? WHERE id = ?').run(nowTime(), existing.id);
  res.json(db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id));
});

// GET /api/attendance/me?from=&to=
router.get('/me', (req, res) => {
  res.json(queryAttendance(req.user.id, req.query.from, req.query.to));
});

// GET /api/attendance/user/:id — HR only
router.get('/user/:id', requireHR, (req, res) => {
  res.json(queryAttendance(Number(req.params.id), req.query.from, req.query.to));
});

// GET /api/attendance/today — HR only: everyone's status today
router.get('/today', requireHR, (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.id as user_id, p.full_name, p.employee_id, a.status, a.check_in, a.check_out
       FROM profiles p LEFT JOIN attendance a ON a.user_id = p.id AND a.date = ?
       WHERE p.role = 'employee' ORDER BY p.full_name`
    )
    .all(today());
  res.json(rows);
});

function queryAttendance(userId, from, to) {
  let sql = 'SELECT * FROM attendance WHERE user_id = ?';
  const params = [userId];
  if (from) { sql += ' AND date >= ?'; params.push(from); }
  if (to) { sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date DESC';
  return db.prepare(sql).all(...params);
}

export default router;
