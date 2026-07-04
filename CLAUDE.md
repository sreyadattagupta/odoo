# Project Brief — HRMS ("Every workday, perfectly aligned")

> Human Resource Management System · Odoo x Adamas University Hackathon '26
> Team lead: Sreya Datta Gupta · Members: Rimjhim Barnwal, Pubali Digar, monmon ghosh

This file is the source of truth for the project. Read it before writing code.

---

## 1. The Idea

A web-based HRMS that digitizes core HR operations into one clean dashboard.
Two roles, one system:

- **Admin / HR Officer** — manages employees, approves leave & attendance, controls payroll.
- **Employee** — views own profile/attendance/salary, checks in/out, applies for leave.

Tagline: *Every workday, perfectly aligned.*

The differentiator we lean on: a **calendar-first attendance + leave view** — one monthly
calendar shows Present/Absent/Half-day markers AND lets employees select a date range to
request leave directly on it. HR sees the same calendar per employee for approvals.

---

## 2. Scope (from the problem statement)

| # | Module | Employee | Admin/HR |
|---|--------|----------|----------|
| 1 | Auth & RBAC | Sign up (Employee ID, email, password, role), sign in, email verify | same, role=HR |
| 2 | Dashboard | Quick-access cards + recent activity/alerts | Employee list, attendance records, leave approvals, switch employee |
| 3 | Profile | View all; edit address/phone/photo only | View + edit all fields for anyone |
| 4 | Attendance | Check-in/out, view own (daily/weekly) | View all; statuses: Present/Absent/Half-day/Leave |
| 5 | Leave | Apply (Paid/Sick/Unpaid), pick range on calendar, remarks, see status | View all requests, approve/reject, comment — reflects immediately |
| 6 | Payroll | Read-only salary view | View all, update salary structure |

Reference wireframe (Excalidraw): https://link.excalidraw.com/l/65VNwvy7c4X/58RLEJ4oOwh

---

## 3. Tech Stack

Chosen for hackathon speed (auth + DB + RBAC mostly out-of-the-box):

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, React Router, TanStack Query.
- **Calendar:** `react-day-picker` (range select) or FullCalendar for the attendance grid.
- **Backend + DB + Auth:** Supabase (Postgres + Row Level Security + Auth with email verify).
  - RLS enforces "employee sees only own rows, HR sees all" at the database — no manual guards.
- **Deploy:** Vercel (frontend) + Supabase cloud (backend). One `git push` = live demo.
- **Copilot layer (the differentiator):** a self-contained natural-language engine running server-side
  (no external AI service, no API keys) — powers the Aligned Copilot (see §8).

> Fallback if Supabase not allowed: Node/Express + Postgres + JWT. Same schema, RLS becomes
> middleware role checks. Keep the data model identical so a swap is cheap.

---

## 4. Data Model (Postgres)

```
profiles          id (uuid, = auth.users.id) · employee_id · full_name · role('employee'|'hr')
                  email · phone · address · photo_url · job_title · department · date_joined
salary_structure  id · employee_id(fk) · basic · hra · allowances · deductions · net · effective_from
attendance        id · employee_id(fk) · date · check_in · check_out
                  status('present'|'absent'|'half_day'|'leave')
leave_requests    id · employee_id(fk) · type('paid'|'sick'|'unpaid') · start_date · end_date
                  remarks · status('pending'|'approved'|'rejected') · hr_comment · reviewed_by
documents         id · employee_id(fk) · name · file_url · uploaded_at
```

**RLS rule of thumb:** every table has `employee_id`. Policy = `role = 'hr' OR employee_id = auth.uid()`
for SELECT; writes to payroll/approvals gated to `role = 'hr'`.

---

## 5. Folder Structure

```
/src
  /components      Card, Calendar, Table, Modal, StatusBadge, RoleGate
  /pages           Login, Signup, Dashboard, Profile, Attendance, Leave, Payroll, AdminEmployees
  /features
    /auth          useAuth hook, session, role context
    /attendance    check-in/out, calendar markers
    /leave         apply form, approval queue
    /payroll       salary view/edit
  /lib             supabase client, api wrappers, rls-aware queries
  /types           shared TS types mirroring the schema
```

---

## 6. Build Order (time-boxed)

1. **Setup** — Vite app, Tailwind, Supabase project, schema + RLS policies, seed 1 HR + 3 employees.
2. **Auth** — signup with role, email verify, login, session, `RoleGate` component, protected routes.
3. **Dashboard** — role-branched: employee cards vs HR employee-list + counters.
4. **Profile** — view all fields; edit gated by role (employee: 3 fields, HR: all).
5. **Attendance** — check-in/out button (writes today's row), monthly calendar with status markers.
6. **Leave** — range-select on calendar → request; HR approval queue (approve/reject/comment) that
   flips status live via Supabase realtime.
7. **Payroll** — employee read-only card; HR editable salary form.
8. **Polish + demo** — seed realistic data, record video walkthrough (due today 05:30 PM).

Ship vertically: get one role's full path working before adding the other.

---

## 7. Conventions

- TypeScript strict. Types in `/types` mirror DB columns exactly.
- All data access through `/lib` wrappers — never call Supabase from components directly.
- Role checks are UI convenience only; **RLS is the real security boundary.** Never trust the client.
- Status values are lowercase enums (see schema) — render labels via a map, store the enum.
- Dates: store ISO `date`/`timestamptz`; format at the view layer.
- Commit small and often; branch per module (`feat/attendance`).

---

## 8. ⭐ Aligned Copilot — the standout feature

The thing that separates us from every other forms-and-tables HRMS. A copilot layer that is both
**agentic** (turns plain language into real actions) and **predictive** (surfaces insight HR can't
eyeball). Runs entirely server-side with a built-in engine — no external service, no API keys.

### 8.1 Employee side — conversational HR assistant
A chat box on the dashboard. The user types natural language; the server parses intent + dates and calls our own API:

- *"Apply sick leave next Mon–Wed"* → parses dates + type → drafts a `leave_requests` row → shows a
  confirm card → submits on approve. No form.
- *"How many paid leaves do I have left?"* → reads `leave_requests` + policy → answers.
- *"Was I late this week?"* → summarizes `attendance` rows in plain English.

Implemented with a local **intent + date parser** (`nlp.js`) that maps requests to actions —
`apply_leave`, `get_leave_balance`, `get_attendance_summary`. All handlers run server-side under the
caller's identity, so the assistant physically cannot touch another employee's data.

### 8.2 HR side — smart approval panel
Every pending leave request is enriched before HR looks at it:

- **Attrition / burnout risk score (0–100)** — computed from attendance + leave patterns
  (leave frequency, clustering around weekends, declining check-ins, consecutive absences).
  Deterministic scoring for a reliable, reproducible result.
- **One-line insight summary** — *"3rd sick leave this month, all Mondays — pattern worth a check-in."*
- **One-click recommendation** — Approve / Review, with reasoning HR can override.

### 8.3 Why it wins
- Judges see language → action, not another CRUD form.
- Predictive risk score = real HR value, not a toggle.
- Security story is strong: copilot runs server-side, bounded to the caller's identity.
- Self-contained: no external API, no keys, no data leaves the server — works fully offline.

### 8.4 Build notes (scope-guarded)
- Ship the **employee chat with `apply_leave` + `get_leave_balance`** first — highest wow, lowest risk.
- Risk score: deterministic pure function over attendance + leave history.
- Parser covers relative dates ("next Monday"), explicit ISO dates, ranges, and "for N days".

---

## 10. Non-Functional Requirements

- Secure auth: password rules + email verification (Supabase handles).
- Least privilege: employees never read others' rows (enforced by RLS, not just UI).
- Copilot safety: runs server-side only; action handlers bound to caller's identity; no external calls.
- Responsive: dashboard usable on laptop + phone.
- Fast: TanStack Query caching; realtime only on the leave-approval flow.

---

## 11. Demo Checklist (submission)

- [ ] Employee signs up → verifies email → logs in → sees dashboard.
- [ ] Employee checks in, applies for leave on calendar, sees "Pending".
- [ ] **Copilot:** employee types "apply sick leave next Mon–Wed" → request auto-created as Pending.
- [ ] **Copilot:** employee asks "how many paid leaves left?" → correct answer from their data.
- [ ] HR logs in, sees the request with **risk score + AI summary**, approves → status flips live.
- [ ] HR edits an employee's salary; employee sees updated read-only payroll.
- [ ] GitHub repo link submitted + evaluator added as collaborator + video link submitted.
