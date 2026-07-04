import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button, Field } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('hr@aligned.com');
  const [password, setPassword] = useState('password1');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login(email, password);
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
        <h1 className="text-2xl font-bold text-brand">Aligned HRMS</h1>
        <p className="text-slate-500 text-sm mb-6">Every workday, perfectly aligned.</p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
          <Field label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <Button type="submit" disabled={busy} className="w-full bg-brand text-white hover:bg-brand-dark">
            {busy ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
        <p className="text-sm text-slate-500 mt-4">
          No account? <Link to="/signup" className="text-brand font-medium">Sign up</Link>
        </p>
        <div className="mt-4 text-xs text-slate-400 border-t pt-3">
          Demo: hr@aligned.com / password1 (HR) · monmon@aligned.com / password1 (Employee)
        </div>
      </div>
    </div>
  );
}
