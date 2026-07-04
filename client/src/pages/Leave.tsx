import { useEffect, useState } from 'react';
import { api, LeaveRequest, Attendance } from '../lib/api';
import { Card, Button, StatusBadge } from '../components/ui';
import Calendar from '../components/Calendar';

export default function Leave() {
  const [reqs, setReqs] = useState<LeaveRequest[]>([]);
  const [att, setAtt] = useState<Attendance[]>([]);
  const [type, setType] = useState<'paid' | 'sick' | 'unpaid'>('paid');
  const [range, setRange] = useState<{ start?: string; end?: string }>({});
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    api<LeaveRequest[]>('/leave/me').then(setReqs).catch(() => {});
    api<Attendance[]>('/attendance/me').then(setAtt).catch(() => {});
  };
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener('leave-changed', h);
    return () => window.removeEventListener('leave-changed', h);
  }, []);

  const markers = Object.fromEntries(att.map((r) => [r.date, r.status]));

  async function submit() {
    setMsg('');
    if (!range.start) { setMsg('Pick dates on the calendar.'); return; }
    try {
      await api('/leave', {
        method: 'POST',
        body: JSON.stringify({ type, start_date: range.start, end_date: range.end || range.start, remarks }),
      });
      setMsg('Leave submitted — status Pending ✔');
      setRange({}); setRemarks('');
      load();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Leave & Time-Off</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-3">Apply — select a date range</h3>
          <Calendar markers={markers} selectable range={range} onRange={setRange} />
          <div className="mt-4 space-y-3">
            <div className="text-sm">Selected: <b>{range.start || '—'}</b> → <b>{range.end || range.start || '—'}</b></div>
            <div className="flex gap-2">
              {(['paid', 'sick', 'unpaid'] as const).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize border ${type === t ? 'bg-brand text-white border-brand' : 'border-slate-300'}`}>
                  {t}
                </button>
              ))}
            </div>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (optional)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand" rows={2} />
            <Button onClick={submit} className="w-full bg-brand text-white hover:bg-brand-dark">Submit request</Button>
            {msg && <p className="text-sm text-brand">{msg}</p>}
            <p className="text-xs text-slate-400">💡 Tip: open ✨ Copilot and type "apply sick leave next Monday to Wednesday".</p>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">My requests</h3>
          <div className="space-y-2">
            {reqs.map((l) => (
              <div key={l.id} className="border rounded-lg p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="capitalize font-medium">{l.type} leave</span>
                  <StatusBadge status={l.status} />
                </div>
                <div className="text-slate-500">{l.start_date} → {l.end_date}</div>
                {l.remarks && <div className="text-slate-400 text-xs mt-1">“{l.remarks}”</div>}
                {l.hr_comment && <div className="text-xs mt-1 text-brand">HR: {l.hr_comment}</div>}
              </div>
            ))}
            {reqs.length === 0 && <p className="text-slate-400 text-sm">No requests yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
