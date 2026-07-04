import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'hrms.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Schema. profiles.id is the internal PK; employee_id is the business code (EMP001).
// Child tables reference profiles.id via user_id — this is the RLS boundary key.
db.exec(`
CREATE TABLE IF NOT EXISTS profiles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id   TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('employee','hr')),
  phone         TEXT,
  address       TEXT,
  photo_url     TEXT,
  job_title     TEXT,
  department    TEXT,
  date_joined   TEXT DEFAULT (date('now')),
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salary_structure (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  basic          REAL NOT NULL DEFAULT 0,
  hra            REAL NOT NULL DEFAULT 0,
  allowances     REAL NOT NULL DEFAULT 0,
  deductions     REAL NOT NULL DEFAULT 0,
  effective_from TEXT DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date      TEXT NOT NULL,
  check_in  TEXT,
  check_out TEXT,
  status    TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','half_day','leave')),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('paid','sick','unpaid')),
  start_date  TEXT NOT NULL,
  end_date    TEXT NOT NULL,
  remarks     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  hr_comment  TEXT,
  reviewed_by INTEGER REFERENCES profiles(id),
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  uploaded_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
`);

export default db;
