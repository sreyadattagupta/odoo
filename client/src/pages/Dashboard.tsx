import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Attendance, LeaveRequest, User } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Card, StatusBadge, RiskBadge } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'hr' ? <HrDash /> : <EmpDash />;
}

function EmpDash() {
  const { user } = useAuth();
  const [att, setAtt] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    api<Attendance[]>('/attendance/me').then(setAtt).catch(() => {});
    api<LeaveRequest[]>('/leave/me').then(setLeaves).catch(() => {});
  }, []);

  const present = att.filter((a) => a.status === 'present').length;
  const pending = leaves.filter((l) => l.status === 'pending').length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {user?.full_name.split(' ')[0]} 👋</h1>
      <p className="text-slate-500 mb-6">Here's your workday at a glance.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Present days (30d)" value={present} />
        <Stat label="Pending leaves" value={pending} />
        <Stat label="Total requests" value={leaves.length} />
        <Stat label="Employee ID" value={user?.employee_id || '—'} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <QuickCard to="/profile" icon="👤" title="My Profile" desc="View & edit your details" />
        <QuickCard to="/attendance" icon="📅" title="Attendance" desc="Check in / out & history" />
        <QuickCard to="/leave" icon="🌴" title="Leave" desc="Apply & track requests" />
      </div>
      <Card className="mt-6">
        <h3 className="font-semibold mb-3">Recent leave activity</h3>
        {leaves.slice(0, 5).map((l) => (
          <div key={l.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
            <span className="capitalize">{l.type} · {l.start_date} → {l.end_date}</span>
            <StatusBadge status={l.status} />
          </div>
        ))}
        {leaves.length === 0 && <p className="text-slate-400 text-sm">No requests yet. Try the ✨ Copilot!</p>}
      </Card>
    </div>
  );
}

function HrDash() {
  const [emps, setEmps] = useState<User[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  useEffect(() => {
    api<User[]>('/profiles').then((e) => setEmps(e.filter((x) => x.role === 'employee'))).catch(() => {});
    api<LeaveRequest[]>('/leave').then(setLeaves).catch(() => {});
  }, []);
  const pending = leaves.filter((l) => l.status === 'pending');
  const highRisk = pending.filter((l) => l.risk?.level === 'high');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">HR Dashboard</h1>
      <p className="text-slate-500 mb-6">Manage your team, approvals, and payroll.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Employees" value={emps.length} />
        <Stat label="Pending approvals" value={pending.length} />
        <Stat label="High attrition risk" value={highRisk.length} tone="red" />
        <Stat label="Total requests" value={leaves.length} />
      </div>
      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Requests needing attention</h3>
          <Link to="/approvals" className="text-brand text-sm font-medium">View all →</Link>
        </div>
        {pending.slice(0, 6).map((l) => (
          <div key={l.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
            <span>{l.full_name} · <span className="capitalize">{l.type}</span> · {l.start_date}→{l.end_date}</span>
            {l.risk && <RiskBadge score={l.risk.score} level={l.risk.level} />}
          </div>
        ))}
        {pending.length === 0 && <p className="text-slate-400 text-sm">All caught up 🎉</p>}
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: any; tone?: string }) {
  return (
    <Card>
      <div className={`text-3xl font-bold ${tone === 'red' ? 'text-red-600' : 'text-brand'}`}>{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </Card>
  );
}

function QuickCard({ to, icon, title, desc }: any) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition cursor-pointer">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-slate-500">{desc}</div>
      </Card>
    </Link>
  );
}
