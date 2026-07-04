import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Copilot from './Copilot';

const empNav = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/profile', label: 'My Profile', icon: '👤' },
  { to: '/attendance', label: 'Attendance', icon: '📅' },
  { to: '/leave', label: 'Leave', icon: '🌴' },
  { to: '/payroll', label: 'Payroll', icon: '💰' },
];
const hrNav = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/approvals', label: 'Leave Approvals', icon: '✅' },
  { to: '/hr-payroll', label: 'Payroll', icon: '💰' },
  { to: '/profile', label: 'My Profile', icon: '👤' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const links = user?.role === 'hr' ? hrNav : empNav;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-brand text-white flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/15">
          <div className="text-lg font-bold">Aligned HRMS</div>
          <div className="text-xs text-white/70">Every workday, perfectly aligned</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`
              }
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/15">
          <div className="text-sm font-medium">{user?.full_name}</div>
          <div className="text-xs text-white/70 mb-2 capitalize">{user?.role} · {user?.employee_id}</div>
          <button onClick={() => { logout(); nav('/login'); }} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-white/10">
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>

      {user?.role === 'employee' && <Copilot onAction={() => window.dispatchEvent(new Event('leave-changed'))} />}
    </div>
  );
}
