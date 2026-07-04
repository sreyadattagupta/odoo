import { useEffect, useState } from 'react';
import { api, Attendance as Att } from '../lib/api';
import { Card, Button, StatusBadge } from '../components/ui';
import Calendar from '../components/Calendar';

export default function Attendance() {
  const [rows, setRows] = useState<Att[]>([]);
  const [msg, setMsg] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const load = () => api<Att[]>('/attendance/me').then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);

  const todayRow = rows.find((r) => r.date === today);
  const markers = Object.fromEntries(rows.map((r) => [r.date, r.status]));

  async function act(kind: 'check-in' | 'check-out') {
    setMsg('');
    try {
      await api(`/attendance/${kind}`, { method: 'POST' });
      setMsg(kind === 'check-in' ? 'Checked in ✔' : 'Checked out ✔');
      load();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Attendance</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-3">Today · {today}</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-sm text-slate-500">Check-in: <b>{todayRow?.check_in || '—'}</b></div>
            <div className="text-sm text-slate-500">Check-out: <b>{todayRow?.check_out || '—'}</b></div>
            {todayRow && <StatusBadge status={todayRow.status} />}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => act('check-in')} disabled={!!todayRow?.check_in}>Check In</Button>
            <Button onClick={() => act('check-out')} disabled={!todayRow?.check_in || !!todayRow?.check_out}
              className="bg-slate-700 text-white hover:bg-slate-800">Check Out</Button>
          </div>
          {msg && <p className="text-sm text-brand mt-3">{msg}</p>}
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Monthly view</h3>
          <Calendar markers={markers} />
        </Card>
      </div>
      <Card className="mt-6">
        <h3 className="font-semibold mb-3">History</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr><th className="py-1">Date</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.date}</td><td>{r.check_in || '—'}</td><td>{r.check_out || '—'}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
