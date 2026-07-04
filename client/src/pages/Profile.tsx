import { useState } from 'react';
import { api, User } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Card, Button, Field } from '../components/ui';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [msg, setMsg] = useState('');
  if (!user) return null;

  async function save() {
    setMsg('');
    try {
      await api<User>(`/profiles/${user!.id}`, { method: 'PATCH', body: JSON.stringify({ phone, address }) });
      await refresh();
      setMsg('Saved ✔');
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 text-center">
          <div className="w-24 h-24 rounded-full bg-brand text-white text-3xl grid place-items-center mx-auto mb-3">
            {user.full_name.charAt(0)}
          </div>
          <div className="font-bold text-lg">{user.full_name}</div>
          <div className="text-slate-500 text-sm">{user.job_title || '—'}</div>
          <div className="text-slate-400 text-xs mt-1 capitalize">{user.role} · {user.employee_id}</div>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-4">Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Info label="Email" value={user.email} />
            <Info label="Department" value={user.department || '—'} />
            <Info label="Date joined" value={user.date_joined || '—'} />
            <Info label="Job title" value={user.job_title || '—'} />
          </div>
          <hr className="my-4" />
          <h3 className="font-semibold mb-3">Editable</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
            <Field label="Address" value={address} onChange={(e: any) => setAddress(e.target.value)} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={save} className="bg-brand text-white hover:bg-brand-dark">Save changes</Button>
            {msg && <span className="text-sm text-brand">{msg}</span>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
