import { useEffect, useState } from 'react';
import { api, User } from '../lib/api';
import { Card, StatusBadge } from '../components/ui';

interface TodayRow { user_id: number; full_name: string; employee_id: string; status: string | null; check_in: string | null }

export default function Employees() {
  const [emps, setEmps] = useState<User[]>([]);
  const [today, setToday] = useState<TodayRow[]>([]);

  useEffect(() => {
    api<User[]>('/profiles').then((e) => setEmps(e.filter((x) => x.role === 'employee'))).catch(() => {});
    api<TodayRow[]>('/attendance/today').then(setToday).catch(() => {});
  }, []);

  const statusOf = (id: number) => today.find((t) => t.user_id === id)?.status;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Employees</h1>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr><th className="py-2">Name</th><th>Emp ID</th><th>Department</th><th>Job title</th><th>Email</th><th>Today</th></tr>
          </thead>
          <tbody>
            {emps.map((e) => {
              const st = statusOf(e.id);
              return (
                <tr key={e.id} className="border-t">
                  <td className="py-2 font-medium">{e.full_name}</td>
                  <td>{e.employee_id}</td>
                  <td>{e.department || '—'}</td>
                  <td>{e.job_title || '—'}</td>
                  <td className="text-slate-500">{e.email}</td>
                  <td>{st ? <StatusBadge status={st} /> : <span className="text-slate-400">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
