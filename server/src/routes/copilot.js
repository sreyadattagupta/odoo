import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';
import { createLeave } from './leave.js';
import { classifyIntent, parseDateRange, detectLeaveType } from '../nlp.js';

const router = Router();
router.use(requireAuth);

// ---- Actions. All run under the caller's id — cannot touch other users. ----
const actions = {
  apply_leave: (userId, { type, start_date, end_date, remarks }) => {
    const r = createLeave(userId, { type, start_date, end_date, remarks });
    return r.error ? { ok: false, error: r.error } : { ok: true, request: r.row };
  },
  get_leave_balance: (userId) => {
    const ALLOT = { paid: 18, sick: 12 };
    const rows = db
      .prepare("SELECT * FROM leave_requests WHERE user_id = ? AND status = 'approved' AND start_date >= date('now','start of year')")
      .all(userId);
    const used = { paid: 0, sick: 0, unpaid: 0 };
    for (const r of rows) {
      const days = Math.round((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1;
      used[r.type] += days;
    }
    return { paid: { used: used.paid, remaining: ALLOT.paid - used.paid }, sick: { used: used.sick, remaining: ALLOT.sick - used.sick } };
  },
  get_attendance_summary: (userId) => {
    const rows = db.prepare("SELECT status, COUNT(*) c FROM attendance WHERE user_id = ? AND date >= date('now','-30 day') GROUP BY status").all(userId);
    const s = {};
    for (const r of rows) s[r.status] = r.c;
    return { last_30_days: s };
  },
};

// POST /api/copilot/chat  { messages: [{role, content}] }
router.post('/chat', (req, res) => {
  const userId = req.user.id;
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (messages.length === 0) return res.status(400).json({ error: 'messages required' });

  const text = String(messages[messages.length - 1]?.content || '');
  const intent = classifyIntent(text);
  const done = [];

  if (intent === 'balance') {
    const bal = actions.get_leave_balance(userId);
    return res.json({ reply: `You have ${bal.paid.remaining} paid and ${bal.sick.remaining} sick leaves remaining this year.`, actions: done, intent });
  }

  if (intent === 'attendance') {
    const s = actions.get_attendance_summary(userId).last_30_days;
    const parts = Object.entries(s).map(([k, v]) => `${v} ${k.replace('_', ' ')}`);
    return res.json({ reply: parts.length ? `Last 30 days — ${parts.join(', ')}.` : 'No attendance recorded in the last 30 days.', actions: done, intent });
  }

  if (intent === 'apply_leave') {
    const type = detectLeaveType(text);
    const range = parseDateRange(text);
    if (!range) {
      return res.json({
        reply: `I can file a ${type} leave for you — tell me the dates, e.g. "apply ${type} leave from next Monday to Wednesday" or "on 2026-07-20".`,
        actions: done, intent,
      });
    }
    const out = actions.apply_leave(userId, { type, start_date: range.start, end_date: range.end, remarks: 'via copilot' });
    done.push({ tool: 'apply_leave', input: { type, ...range }, output: out });
    return res.json({
      reply: out.ok
        ? `Done ✅ Submitted a ${type} leave from ${range.start} to ${range.end} — status Pending. HR will review it.`
        : `Couldn't submit: ${out.error}`,
      actions: done, intent,
    });
  }

  return res.json({
    reply: "I'm your Aligned Copilot. I can:\n• apply for leave — \"apply sick leave from 2026-07-20 to 2026-07-22\"\n• check your balance — \"how many leaves do I have left?\"\n• summarize attendance — \"how's my attendance this month?\"",
    actions: done, intent,
  });
});

export default router;
