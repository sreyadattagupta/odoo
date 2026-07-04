// Self-contained natural-language parser for the Aligned Copilot.
// No external LLM / API. Handles intents + relative date resolution locally.

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Resolve a single date phrase to ISO, relative to `base` (today). Returns null if none.
function parseOneDate(text, base) {
  const t = text.trim();

  // ISO: 2026-07-20
  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];

  // DD/MM/YYYY or DD-MM
  m = t.match(/\b(\d{1,2})[\/](\d{1,2})(?:[\/](\d{2,4}))?\b/);
  if (m) {
    const day = +m[1], mon = +m[2] - 1, yr = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : base.getFullYear();
    return iso(new Date(yr, mon, day));
  }

  // "20 july" / "july 20" (optional year)
  const monRe = MONTHS.join('|');
  m = t.match(new RegExp(`\\b(\\d{1,2})\\s+(${monRe})(?:\\s+(\\d{4}))?`, 'i')) ||
      t.match(new RegExp(`\\b(${monRe})\\s+(\\d{1,2})(?:\\w{0,2})?(?:,?\\s+(\\d{4}))?`, 'i'));
  if (m) {
    let day, mon, yr;
    if (/^\d/.test(m[1])) { day = +m[1]; mon = MONTHS.indexOf(m[2].toLowerCase()); yr = m[3] ? +m[3] : base.getFullYear(); }
    else { mon = MONTHS.indexOf(m[1].toLowerCase()); day = +m[2]; yr = m[3] ? +m[3] : base.getFullYear(); }
    const d = new Date(yr, mon, day);
    if (!m[3] && d < base) d.setFullYear(yr + 1); // roll to next year if past
    return iso(d);
  }

  // "today" / "tomorrow" / "day after tomorrow"
  if (/\bday after tomorrow\b/i.test(t)) { const d = new Date(base); d.setDate(d.getDate() + 2); return iso(d); }
  if (/\btomorrow\b/i.test(t)) { const d = new Date(base); d.setDate(d.getDate() + 1); return iso(d); }
  if (/\btoday\b/i.test(t)) return iso(base);

  // "in N days"
  m = t.match(/\bin\s+(\d+)\s+days?\b/i);
  if (m) { const d = new Date(base); d.setDate(d.getDate() + +m[1]); return iso(d); }

  // "next monday" / "monday" / "this friday"
  m = t.match(new RegExp(`\\b(next\\s+|this\\s+)?(${DAYS.join('|')})\\b`, 'i'));
  if (m) {
    const target = DAYS.indexOf(m[2].toLowerCase());
    const d = new Date(base);
    let delta = (target - d.getDay() + 7) % 7;
    if (delta === 0) delta = 7;            // always upcoming
    if (m[1] && /next/i.test(m[1])) delta += (delta <= 7 && (target - base.getDay() + 7) % 7 !== 0 ? 0 : 0);
    d.setDate(d.getDate() + delta);
    return iso(d);
  }

  return null;
}

// Extract a date range. Splits on "to / until / through / -" and parses both sides.
export function parseDateRange(text, base = new Date()) {
  const parts = text.split(/\s+(?:to|until|through|till|-|–|until)\s+/i);
  if (parts.length >= 2) {
    // parse start from the segment before the split that contains a date, end from after
    const start = firstDateIn(parts, base, 'start');
    const end = firstDateIn(parts.slice().reverse(), base, 'end');
    if (start) return { start, end: end || start };
  }
  // single date + "for N days"
  const single = parseOneDate(text, base);
  const dur = text.match(/\bfor\s+(\d+)\s+days?\b/i);
  if (single && dur) {
    const d = new Date(single); d.setDate(d.getDate() + (+dur[1] - 1));
    return { start: single, end: iso(d) };
  }
  if (single) return { start: single, end: single };
  return null;
}

function firstDateIn(parts, base, which) {
  for (const p of parts) {
    const d = parseOneDate(p, base);
    if (d) return d;
  }
  return null;
}

export function detectLeaveType(text) {
  if (/\bsick\b/i.test(text)) return 'sick';
  if (/\bunpaid\b/i.test(text)) return 'unpaid';
  return 'paid'; // paid / casual / vacation / annual default
}

// Top-level intent classification.
export function classifyIntent(text) {
  const t = text.toLowerCase();
  if (/(balance|how many|leaves?\s*(left|remaining)|remaining|days left)/.test(t)) return 'balance';
  if (/(attendance|how many.*present|absent|late|check[- ]?in|summary of)/.test(t) && !/leave/.test(t)) return 'attendance';
  if (/(apply|book|take|request|file|want|need|put in).*(leave|off|vacation|holiday|day off)|^(sick|paid|unpaid)\s+leave|leave\b/.test(t)) return 'apply_leave';
  return 'unknown';
}
