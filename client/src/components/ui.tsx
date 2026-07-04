import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${className}`}>{children}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    half_day: 'bg-amber-100 text-amber-700',
    leave: 'bg-blue-100 text-blue-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  const label = status.replace('_', ' ');
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-slate-100 text-slate-600'}`}>{label}</span>;
}

export function RiskBadge({ score, level }: { score: number; level: string }) {
  const map: Record<string, string> = {
    low: 'bg-green-100 text-green-700 border-green-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    high: 'bg-red-100 text-red-700 border-red-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${map[level]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" /> {score} · {level}
    </span>
  );
}

export function Button({ children, className = '', ...props }: any) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 ${className || 'bg-brand text-white hover:bg-brand-dark'}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, ...props }: any) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
      />
    </label>
  );
}

export function Spinner() {
  return <div className="animate-spin h-6 w-6 border-2 border-brand border-t-transparent rounded-full" />;
}
