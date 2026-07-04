import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui';

interface Salary { basic: number; hra: number; allowances: number; deductions: number; net: number }

export default function Payroll() {
  const [s, setS] = useState<Salary | null>(null);
  useEffect(() => { api<Salary>('/payroll/me').then(setS).catch(() => {}); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Payroll</h1>
      <p className="text-slate-500 mb-6">Read-only salary breakdown.</p>
      {!s ? <p className="text-slate-400">No payroll data.</p> : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-brand text-white">
            <div className="text-sm text-white/70">Net monthly salary</div>
            <div className="text-4xl font-bold mt-1">₹{s.net.toLocaleString()}</div>
          </Card>
          <Card className="lg:col-span-2">
            <h3 className="font-semibold mb-3">Breakdown</h3>
            <Row label="Basic" v={s.basic} />
            <Row label="HRA" v={s.hra} />
            <Row label="Allowances" v={s.allowances} />
            <Row label="Deductions" v={-s.deductions} />
            <div className="flex justify-between pt-3 mt-2 border-t font-bold">
              <span>Net</span><span>₹{s.net.toLocaleString()}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={v < 0 ? 'text-red-600' : ''}>₹{v.toLocaleString()}</span>
    </div>
  );
}
