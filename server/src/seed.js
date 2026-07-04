import 'dotenv/config';
import db from './db.js';
import { hashPassword } from './auth.js';

console.log('Seeding HRMS database...');

// Wipe (dev only).
db.exec('DELETE FROM documents; DELETE FROM leave_requests; DELETE FROM attendance; DELETE FROM salary_structure; DELETE FROM profiles;');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('profiles','attendance','leave_requests','salary_structure','documents');");

const insertUser = db.prepare(
  `INSERT INTO profiles (employee_id, full_name, email, password_hash, role, phone, address, job_title, department, email_verified)
   VALUES (@employee_id, @full_name, @email, @password_hash, @role, @phone, @address, @job_title, @department, 1)`
);
const insertSalary = db.prepare('INSERT INTO salary_structure (user_id, basic, hra, allowances, deductions) VALUES (?, ?, ?, ?, ?)');
const insertAtt = db.prepare("INSERT OR IGNORE INTO attendance (user_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)");
const insertLeave = db.prepare('INSERT INTO leave_requests (user_id, type, start_date, end_date, remarks, status) VALUES (?, ?, ?, ?, ?, ?)');

const pw = hashPassword('password1');

const people = [
  { employee_id: 'HR001', full_name: 'Sreya Datta Gupta', email: 'hr@aligned.com', role: 'hr', phone: '9000000001', address: 'Kolkata', job_title: 'HR Manager', department: 'People Ops' },
  { employee_id: 'EMP001', full_name: 'Rimjhim Barnwal', email: 'rimjhim@aligned.com', role: 'employee', phone: '9000000002', address: 'Kolkata', job_title: 'Software Engineer', department: 'Engineering' },
  { employee_id: 'EMP002', full_name: 'Pubali Digar', email: 'pubali@aligned.com', role: 'employee', phone: '9000000003', address: 'Kolkata', job_title: 'Designer', department: 'Design' },
  { employee_id: 'EMP003', full_name: 'Monmon Ghosh', email: 'monmon@aligned.com', role: 'employee', phone: '9000000004', address: 'Kolkata', job_title: 'Analyst', department: 'Data' },
  { employee_id: 'EMP004', full_name: 'Arjun Mehta', email: 'arjun@aligned.com', role: 'employee', phone: '9000000005', address: 'Delhi', job_title: 'QA Engineer', department: 'Engineering' },
];

const ids = {};
for (const p of people) {
  const info = insertUser.run({ password_hash: pw, ...p });
  ids[p.employee_id] = info.lastInsertRowid;
  insertSalary.run(info.lastInsertRowid, 40000, 16000, 6000, 4000);
}

// Attendance for last 30 weekdays. EMP003 is the "at-risk" one: many absences + low presence.
const iso = (d) => d.toISOString().slice(0, 10);
for (const emp of ['EMP001', 'EMP002', 'EMP003', 'EMP004']) {
  const uid = ids[emp];
  for (let i = 30; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.getDay();
    if (day === 0 || day === 6) continue; // skip weekends
    let status = 'present';
    if (emp === 'EMP003') {
      status = i % 3 === 0 ? 'absent' : i % 5 === 0 ? 'half_day' : 'present';
    } else if (i % 11 === 0) {
      status = 'absent';
    }
    const checkIn = status === 'absent' ? null : (status === 'half_day' ? '09:30:00' : '09:0' + (i % 9) + ':00');
    const checkOut = status === 'absent' ? null : (status === 'half_day' ? '13:00:00' : '18:0' + (i % 5) + ':00');
    insertAtt.run(uid, iso(d), checkIn, checkOut, status);
  }
}

// Leave requests. EMP003 has clustered sick leaves -> high risk. Others normal.
const future = (offset, len = 0) => {
  const s = new Date(); s.setDate(s.getDate() + offset);
  const e = new Date(s); e.setDate(e.getDate() + len);
  return [iso(s), iso(e)];
};
insertLeave.run(ids.EMP001, 'paid', ...future(5, 1), 'Family function', 'pending');
insertLeave.run(ids.EMP002, 'sick', ...future(2), 'Fever', 'pending');
{
  const [s1, e1] = future(-20); insertLeave.run(ids.EMP003, 'sick', s1, e1, 'Not well', 'approved');
  const [s2, e2] = future(-10); insertLeave.run(ids.EMP003, 'sick', s2, e2, 'Not well again', 'approved');
  const [s3, e3] = future(3, 2); insertLeave.run(ids.EMP003, 'sick', s3, e3, 'Recurring', 'pending');
}
insertLeave.run(ids.EMP004, 'unpaid', ...future(7, 3), 'Personal travel', 'pending');

console.log('Seed complete.');
console.log('Login: hr@aligned.com / password1  (HR)');
console.log('       rimjhim@aligned.com / password1  (Employee)');
console.log('       monmon@aligned.com / password1  (Employee - high attrition risk demo)');
