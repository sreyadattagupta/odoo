import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, Button } from '../components/ui';

interface Row { user_id: number; full_name: string; employee_id: string; basic: number; hra: number; allowances: number; deductions: number; net: number }

export default function HrPayroll() {
  const [rows, setRows] = useState<Row[]>([]);
  const [edit, setEdit] = useState<Row | null>(null);
  const [msg, setMsg] = useState('');

  const load = () => api<Row[]>('/payroll').then(setRows).catch(() => {});
  useEffect(() => { load(); }, []);

  async function save() {
    if (!edit) return;
    setMsg('');
    try {
      await api(`/payroll/user/${edit.user_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ basic: edit.basic, hra: edit.hra, allowances: edit.allowances, deductions: edit.deductions }),
      });
      setMsg(`Updated ${edit.full_name} ✔`);
      setEdit(null);
      load();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payroll Management</h1>
      {msg && <p className="text-brand text-sm mb-3">{msg}</p>}
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr><th className="py-2">Employee</th><th>Basic</th><th>HRA</th><th>Allow.</th><th>Deduct.</th><th>Net</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t">
                <td className="py-2 font-medium">{r.full_name}<div className="text-xs text-slate-400">{r.employee_id}</div></td>
                <td>₹{(r.basic || 0).toLocaleString()}</td>
                <td>₹{(r.hra || 0).toLocaleString()}</td>
                <td>₹{(r.allowances || 0).toLocaleString()}</td>
                <td>₹{(r.deductions || 0).toLocaleString()}</td>
                <td className="font-semibold">₹{(r.net || 0).toLocaleString()}</td>
                <td><button onClick={() => setEdit(r)} className="text-brand font-medium">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {edit && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50" onClick={() => setEdit(null)}>
          <Card className="w-full max-w-md" >
            <div onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold mb-4">Edit salary · {edit.full_name}</h3>
              {(['basic', 'hra', 'allowances', 'deductions'] as const).map((k) => (
                <label key={k} className="block mb-3">
                  <span className="text-sm capitalize text-slate-600">{k}</span>
                  <input type="number" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand" />
                </label>
              ))}
              <div className="flex gap-2 mt-4">
                <Button onClick={save} className="bg-brand text-white hover:bg-brand-dark">Save</Button>
                <Button onClick={() => setEdit(null)} className="bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
