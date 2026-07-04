import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireHR } from '../auth.js';

const router = Router();
router.use(requireAuth);

const withNet = (s) => (s ? { ...s, net: s.basic + s.hra + s.allowances - s.deductions } : null);

// GET /api/payroll/me — read-only for the caller
router.get('/me', (req, res) => {
  const s = db.prepare('SELECT * FROM salary_structure WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
  res.json(withNet(s));
});

// GET /api/payroll — HR: everyone
router.get('/', requireHR, (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.id as user_id, p.full_name, p.employee_id, s.basic, s.hra, s.allowances, s.deductions, s.id as salary_id
       FROM profiles p LEFT JOIN salary_structure s ON s.user_id = p.id
       WHERE p.role = 'employee' ORDER BY p.full_name`
    )
    .all();
  res.json(rows.map((r) => ({ ...r, net: (r.basic || 0) + (r.hra || 0) + (r.allowances || 0) - (r.deductions || 0) })));
});

// PATCH /api/payroll/user/:id — HR updates salary structure
router.patch('/user/:id', requireHR, (req, res) => {
  const userId = Number(req.params.id);
  const { basic, hra, allowances, deductions } = req.body || {};
  const existing = db.prepare('SELECT * FROM salary_structure WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
  if (existing) {
    db.prepare('UPDATE salary_structure SET basic=?, hra=?, allowances=?, deductions=? WHERE id=?')
      .run(num(basic, existing.basic), num(hra, existing.hra), num(allowances, existing.allowances), num(deductions, existing.deductions), existing.id);
  } else {
    db.prepare('INSERT INTO salary_structure (user_id, basic, hra, allowances, deductions) VALUES (?, ?, ?, ?, ?)')
      .run(userId, num(basic, 0), num(hra, 0), num(allowances, 0), num(deductions, 0));
  }
  const s = db.prepare('SELECT * FROM salary_structure WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
  res.json(withNet(s));
});

const num = (v, fallback) => (v === undefined || v === null || v === '' || isNaN(Number(v)) ? fallback : Number(v));

export default router;
