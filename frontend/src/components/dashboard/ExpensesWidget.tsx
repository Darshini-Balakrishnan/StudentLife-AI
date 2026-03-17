'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
}
interface Summary {
  total: number;
  budget: number;
  by_category: Record<string, number>;
}
interface Props { full?: boolean; }

const CATS = ['food','transport','books','entertainment','health','other'];
const EMOJIS: Record<string,string> = { food:'🍔', transport:'🚌', books:'📚', entertainment:'🎮', health:'💊', other:'📦' };

export default function ExpensesWidget({ full }: Props) {
  const [summary, setSummary] = useState<Summary>({ total: 0, budget: 1000, by_category: {} });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: 'food', description: '', amount: '' });
  const { socket } = useSocket();

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    if (!socket) return;
    socket.on('expense:new', loadAll);
    return () => { socket.off('expense:new', loadAll); };
  }, [socket]);

  async function loadAll() {
    try {
      const [s, e] = await Promise.all([api.get('/expenses/summary'), api.get('/expenses')]);
      setSummary(s.data);
      setExpenses(e.data || []);
    } catch (err) { console.error(err); }
  }

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    try {
      await api.post('/expenses', {
        category: form.category,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        transaction_date: new Date().toISOString().split('T')[0],
      });
      toast.success('Expense added');
      setForm({ category: 'food', description: '', amount: '' });
      setShowForm(false);
      loadAll();
    } catch { toast.error('Failed to add expense'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await api.delete('/expenses/' + id); toast.success('Deleted'); loadAll(); }
    catch { toast.error('Failed to delete'); }
  }

  const pct = summary.budget > 0 ? (summary.total / summary.budget) * 100 : 0;
  const over = pct > 100;
  const list = full ? expenses : expenses.slice(0, 4);
  const fmt = (n: number) => '$' + n.toFixed(2);
  const fmtInt = (n: number) => '$' + Math.abs(n).toFixed(0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h2 className="font-semibold text-gray-900">Expenses</h2>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATS.map(c => <option key={c} value={c}>{EMOJIS[c]} {c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Amount</label>
              <input type="number" step="0.01" min="0.01" placeholder="0.00" required
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <input type="text" placeholder="e.g. Lunch at JC" required
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="p-5">
        <div className="mb-5">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-2xl font-bold text-gray-900">{fmt(summary.total)}</span>
              <span className="text-sm text-gray-400 ml-1">/ {fmt(summary.budget)}</span>
            </div>
            <span className={"text-xs font-medium px-2 py-1 rounded-full " + (over ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>
              {over ? fmtInt(summary.total - summary.budget) + " over" : fmtInt(summary.budget - summary.total) + " left"}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className={"h-2.5 rounded-full " + (over ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-blue-500")}
              style={{ width: Math.min(pct, 100) + "%" }} />
          </div>
        </div>

        {Object.keys(summary.by_category || {}).length > 0 && (
          <div className="mb-5 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">By Category</p>
            {Object.entries(summary.by_category).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{EMOJIS[cat] || '📦'} {cat.charAt(0).toUpperCase()+cat.slice(1)}</span>
                <span className="font-medium text-gray-900">{fmt(amt as number)}</span>
              </div>
            ))}
          </div>
        )}

        {list.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{full ? 'All Transactions' : 'Recent'}</p>
            {list.map(exp => (
              <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{EMOJIS[exp.category] || '📦'}</span>
                  <div>
                    <p className="text-sm text-gray-800">{exp.description}</p>
                    <p className="text-xs text-gray-400">{new Date(exp.transaction_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{fmt(parseFloat(String(exp.amount)))}</span>
                  {full && <button onClick={() => handleDelete(exp.id)} className="text-xs text-red-400 hover:text-red-600 ml-1">✕</button>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <div className="text-3xl mb-2">💸</div>
            <p className="text-sm">No expenses yet. Add your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
