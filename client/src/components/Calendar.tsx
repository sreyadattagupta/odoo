import { useState } from 'react';

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const statusColor: Record<string, string> = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  half_day: 'bg-amber-500',
  leave: 'bg-blue-500',
};

interface Props {
  markers?: Record<string, string>; // date -> status
  selectable?: boolean;
  range?: { start?: string; end?: string };
  onRange?: (r: { start?: string; end?: string }) => void;
}

export default function Calendar({ markers = {}, selectable, range, onRange }: Props) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function clickDay(dateStr: string) {
    if (!selectable || !onRange) return;
    if (!range?.start || (range.start && range.end)) {
      onRange({ start: dateStr, end: undefined });
    } else {
      if (dateStr < range.start) onRange({ start: dateStr, end: range.start });
      else onRange({ start: range.start, end: dateStr });
    }
  }

  const inRange = (s: string) => range?.start && range?.end && s >= range.start && s <= range.end;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="px-2 py-1 rounded hover:bg-slate-100">‹</button>
        <span className="font-semibold">{cursor.toLocaleString('default', { month: 'long' })} {year}</span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="px-2 py-1 rounded hover:bg-slate-100">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-1">
        {DOW.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const s = iso(d);
          const status = markers[s];
          const selected = range?.start === s || range?.end === s;
          return (
            <button
              key={i}
              onClick={() => clickDay(s)}
              disabled={!selectable}
              className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center relative
                ${selectable ? 'hover:bg-brand/10 cursor-pointer' : 'cursor-default'}
                ${selected ? 'bg-brand text-white' : inRange(s) ? 'bg-brand/20' : ''}`}
            >
              <span>{d.getDate()}</span>
              {status && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${statusColor[status]}`} />}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 mt-3 text-xs text-slate-500 flex-wrap">
        {Object.entries(statusColor).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${c}`} /> {k.replace('_', ' ')}</span>
        ))}
      </div>
    </div>
  );
}
