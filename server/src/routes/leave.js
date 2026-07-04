import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireHR } from '../auth.js';
import { computeRisk } from '../risk.js';

const router = Router();
router.use(requireAuth);

// POST /api/leave — employee applies. Also used by the copilot tool handler.
router.post('/', (req, res) => {
  const created = createLeave(req.user.id, req.body || {});
  if (created.error) return res.status(400).json({ error: created.error });
  res.status(201).json(created.row);
});

// GET /api/leave/me — caller's own requests
router.get('/me', (req, res) => {
  res.json(db.prepare('SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
});

// GET /api/leave — HR: all requests, enriched with risk score + names
router.get('/', requireHR, (req, res) => {
  const rows = db
    .prepare(
      `SELECT lr.*, p.full_name, p.employee_id
       FROM leave_requests lr JOIN profiles p ON p.id = lr.user_id
       ORDER BY CASE lr.status WHEN 'pending' THEN 0 ELSE 1 END, lr.created_at DESC`
    )
    .all();
  const enriched = rows.map((r) => ({ ...r, risk: riskFor(r) }));
  res.json(enriched);
});

// PATCH /api/leave/:id — HR approve/reject
router.patch('/:id', requireHR, (req, res) => {
  const { status, hr_comment } = req.body || {};
  if (!['approved', 'rejected'].includes(status))
    return res.status(400).json({ error: 'status must be approved or rejected' });
  const lr = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(Number(req.params.id));
  if (!lr) return res.status(404).json({ error: 'Not found' });

  db.prepare('UPDATE leave_requests SET status = ?, hr_comment = ?, reviewed_by = ? WHERE id = ?')
    .run(status, hr_comment || null, req.user.id, lr.id);

  // Approved leave marks those attendance days as 'leave'.
  if (status === 'approved') markLeaveDays(lr);

  res.json(db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(lr.id));
});

// Shared: create a leave request for a user. Returns { row } or { error }.
export function createLeave(userId, { type, start_date, end_date, remarks }) {
  if (!['paid', 'sick', 'unpaid'].includes(type)) return { error: 'Invalid leave type' };
  if (!start_date || !end_date) return { error: 'start_date and end_date required' };
  if (end_date < start_date) return { error: 'end_date must be on/after start_date' };
  const info = db
    .prepare('INSERT INTO leave_requests (user_id, type, start_date, end_date, remarks) VALUES (?, ?, ?, ?, ?)')
    .run(userId, type, start_date, end_date, remarks || null);
  return { row: db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(info.lastInsertRowid) };
}

function riskFor(lr) {
  const allLeaves = db.prepare('SELECT * FROM leave_requests WHERE user_id = ?').all(lr.user_id);
  const attendance = db
    .prepare("SELECT * FROM attendance WHERE user_id = ? AND date >= date('now','-30 day')")
    .all(lr.user_id);
  return computeRisk(lr, allLeaves, attendance);
}

function markLeaveDays(lr) {
  const stmt = db.prepare(
    `INSERT INTO attendance (user_id, date, status) VALUES (?, ?, 'leave')
     ON CONFLICT(user_id, date) DO UPDATE SET status = 'leave'`
  );
  let d = new Date(lr.start_date);
  const end = new Date(lr.end_date);
  while (d <= end) {
    stmt.run(lr.user_id, d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
}

export default router;
