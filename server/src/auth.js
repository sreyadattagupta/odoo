import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret';

export function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw, hash) {
  return bcrypt.compareSync(pw, hash);
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, employee_id: user.employee_id },
    SECRET,
    { expiresIn: '12h' }
  );
}

// Attaches req.user from the Bearer token. 401 if missing/invalid.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Gate a route to HR only. This is the real authorization boundary, not the UI.
export function requireHR(req, res, next) {
  if (req.user?.role !== 'hr') return res.status(403).json({ error: 'HR access required' });
  next();
}

// Password policy: min 8 chars, at least one letter and one number.
export function validatePassword(pw) {
  return typeof pw === 'string' && pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}
