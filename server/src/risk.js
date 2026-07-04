// Deterministic attrition / burnout risk score for a leave request.
// Pure function over the employee's recent attendance + leave history.
// Returns { score: 0-100, level, factors: [] }. No AI needed — reliable for demo.

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function isWeekendAdjacent(dateStr) {
  const d = new Date(dateStr).getDay(); // 0 Sun .. 6 Sat
  return d === 1 || d === 5; // Monday or Friday
}

/**
 * @param {object} req         the leave_request being evaluated
 * @param {object[]} allLeaves employee's leave history (incl. this one)
 * @param {object[]} attendance employee's recent attendance rows
 */
export function computeRisk(req, allLeaves, attendance) {
  const factors = [];
  let score = 0;

  const now = req.start_date;
  const last30 = allLeaves.filter((l) => daysBetween(l.start_date, now) <= 30 && daysBetween(l.start_date, now) >= 0);

  // 1. Leave frequency in last 30 days
  if (last30.length >= 3) {
    score += 30;
    factors.push(`${last30.length} leave requests in the last 30 days`);
  } else if (last30.length === 2) {
    score += 15;
    factors.push('2 leave requests in the last 30 days');
  }

  // 2. Sick-leave clustering
  const sick = last30.filter((l) => l.type === 'sick');
  if (sick.length >= 2) {
    score += 20;
    factors.push(`${sick.length} sick leaves this month`);
  }

  // 3. Weekend-adjacent pattern (long-weekend hunting)
  if (isWeekendAdjacent(req.start_date)) {
    score += 15;
    factors.push('Leave starts on a Monday/Friday (long-weekend pattern)');
  }

  // 4. Recent absenteeism
  const absent = attendance.filter((a) => a.status === 'absent').length;
  if (absent >= 3) {
    score += 20;
    factors.push(`${absent} unplanned absences recently`);
  } else if (absent > 0) {
    score += 8;
    factors.push(`${absent} recent absence(s)`);
  }

  // 5. Declining check-ins (fewer present days lately)
  const present = attendance.filter((a) => a.status === 'present').length;
  if (attendance.length >= 10 && present / attendance.length < 0.6) {
    score += 15;
    factors.push('Attendance rate below 60% recently');
  }

  score = Math.min(100, score);
  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  const recommendation = level === 'high' ? 'review' : 'approve';

  return { score, level, recommendation, factors };
}
