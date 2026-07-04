import { useEffect, useState } from 'react';
import { api, LeaveRequest } from '../lib/api';
import { Card, Button, StatusBadge, RiskBadge } from '../components/ui';

export default function Approvals() {
  const [reqs, setReqs] = useState<LeaveRequest[]>([]);
  const [comments, setComments] = useState<Record<number, string>>({});

  const load = () => api<LeaveRequest[]>('/leave').then(setReqs).catch(() => {});
  useEffect(() => { load(); }, []);

  async function decide(id: number, status: 'approved' | 'rejected') {
    await api(`/leave/${id}`, { method: 'PATCH', body: JSON.stringify({ status, hr_comment: comments[id] || '' }) });
    load();
  }

  const pending = reqs.filter((r) => r.status === 'pending');
  const done = reqs.filter((r) => r.status !== 'pending');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Leave Approvals</h1>
      <p className="text-slate-500 mb-6">Each request is scored for attrition/burnout risk automatically.</p>

      <h3 className="font-semibold mb-3">Pending ({pending.length})</h3>
      <div className="space-y-4">
        {pending.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <div className="font-semibold">{r.full_name} <span className="text-slate-400 text-sm">· {r.employee_id}</span></div>
                <div className="text-sm text-slate-500 capitalize">{r.type} leave · {r.start_date} → {r.end_date}</div>
                {r.remarks && <div className="text-xs text-slate-400 mt-1">“{r.remarks}”</div>}
              </div>
              {r.risk && (
                <div className="text-right">
                  <RiskBadge score={r.risk.score} level={r.risk.level} />
                  <div className={`text-xs mt-1 font-medium ${r.risk.recommendation === 'review' ? 'text-red-600' : 'text-green-600'}`}>
                    Suggested: {r.risk.recommendation === 'review' ? '⚠ Review' : '✔ Approve'}
                  </div>
                </div>
              )}
            </div>
            {r.risk && r.risk.factors.length > 0 && (
              <div className="mt-3 bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
                <span className="font-semibold">AI insight: </span>
                {r.risk.factors.join(' · ')}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4 items-center">
              <input
                placeholder="Comment (optional)"
                value={comments[r.id] || ''}
                onChange={(e) => setComments({ ...comments, [r.id]: e.target.value })}
                className="flex-1 min-w-[12rem] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <Button onClick={() => decide(r.id, 'approved')} className="bg-green-600 text-white hover:bg-green-700">Approve</Button>
              <Button onClick={() => decide(r.id, 'rejected')} className="bg-red-600 text-white hover:bg-red-700">Reject</Button>
            </div>
          </Card>
        ))}
        {pending.length === 0 && <Card><p className="text-slate-400 text-sm">No pending requests 🎉</p></Card>}
      </div>

      <h3 className="font-semibold mt-8 mb-3">Reviewed</h3>
      <Card>
        {done.map((r) => (
          <div key={r.id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
            <span>{r.full_name} · <span className="capitalize">{r.type}</span> · {r.start_date}→{r.end_date}</span>
            <StatusBadge status={r.status} />
          </div>
        ))}
        {done.length === 0 && <p className="text-slate-400 text-sm">Nothing yet.</p>}
      </Card>
    </div>
  );
}
