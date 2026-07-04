import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button, Field } from '../components/ui';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ employee_id: '', full_name: '', email: '', password: '', role: 'employee' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await signup(f);
      nav('/dashboard');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand to-brand-dark p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-brand">Create your account</h1>
        <p className="text-slate-500 text-sm mb-6">Join Aligned HRMS</p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Employee ID" value={f.employee_id} onChange={set('employee_id')} placeholder="EMP010" required />
          <Field label="Full Name" value={f.full_name} onChange={set('full_name')} required />
          <Field label="Email" type="email" value={f.email} onChange={set('email')} required />
          <Field label="Password" type="password" value={f.password} onChange={set('password')} placeholder="8+ chars, letter + number" required />
          <label className="block">
            <span className="text-sm font-medium text-slate-600">Role</span>
            <select value={f.role} onChange={set('role')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand">
              <option value="employee">Employee</option>
              <option value="hr">HR / Admin</option>
            </select>
          </label>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <Button type="submit" disabled={busy} className="w-full bg-brand text-white hover:bg-brand-dark">
            {busy ? 'Creating…' : 'Sign Up'}
          </Button>
        </form>
        <p className="text-sm text-slate-500 mt-4">
          Have an account? <Link to="/login" className="text-brand font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
