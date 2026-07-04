import { useState } from 'react';
import { api } from '../lib/api';

interface Msg { role: 'user' | 'assistant'; content: string }

export default function Copilot({ onAction }: { onAction?: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm your Aligned Copilot. Try: \"apply sick leave from 2026-07-10 to 2026-07-11\" or \"how many leaves do I have left?\"" },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await api<{ reply: string; actions: any[]; mode: string }>('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: next }),
      });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      if (res.actions?.some((a) => a.tool === 'apply_leave')) onAction?.();
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error: ' + e.message }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-brand text-white rounded-full shadow-lg px-5 py-3 font-medium hover:bg-brand-dark z-50"
      >
        ✨ Copilot
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[92vw] h-[30rem] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-brand text-white rounded-t-2xl">
        <span className="font-semibold">✨ Aligned Copilot</span>
        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-800'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div className="text-xs text-slate-400 px-2">Copilot is thinking…</div>}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask or apply for leave…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button onClick={send} disabled={busy} className="bg-brand text-white px-3 rounded-lg disabled:opacity-50">➤</button>
      </div>
    </div>
  );
}
