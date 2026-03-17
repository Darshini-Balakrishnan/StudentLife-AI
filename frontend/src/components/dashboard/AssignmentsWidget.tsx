'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  estimated_hours?: number;
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AssignmentsWidget() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [icsUrl, setIcsUrl] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', priority: 'medium', estimated_hours: '',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data);
    } catch { console.error('Failed to load assignments'); }
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.due_date) return;
    setSaving(true);
    try {
      await api.post('/assignments', {
        title: form.title,
        description: form.description || undefined,
        due_date: form.due_date,
        priority: form.priority,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : undefined,
      });
      toast.success('Assignment added');
      setForm({ title: '', description: '', due_date: '', priority: 'medium', estimated_hours: '' });
      setShowForm(false);
      load();
    } catch { toast.error('Failed to add assignment'); }
    finally { setSaving(false); }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!icsUrl.trim()) return;
    setImporting(true);
    try {
      const res = await api.post('/assignments/import-ics', { ics_url: icsUrl.trim() });
      toast.success(`Imported ${res.data.imported} assignments! (${res.data.skipped} already existed)`);
      setIcsUrl('');
      setShowImport(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Import failed');
    } finally { setImporting(false); }
  }

  async function toggleStatus(a: Assignment) {
    const next = a.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/assignments/${a.id}`, { status: next });
      setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, status: next } : x));
      if (next === 'completed') toast.success('Marked complete ✓');
    } catch { toast.error('Failed to update'); }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  }

  const filtered = assignments.filter(a =>
    filter === 'all' ? true : filter === 'pending' ? a.status !== 'completed' : a.status === 'completed'
  );
  const pending = assignments.filter(a => a.status !== 'completed');
  const overdue = pending.filter(a => daysUntil(a.due_date) < 0);
  const dueSoon = pending.filter(a => daysUntil(a.due_date) >= 0 && daysUntil(a.due_date) <= 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">📝 Assignment Tracker</h2>
            <p className="text-violet-100 text-sm">Track deadlines manually or import from Canvas</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowImport(v => !v); setShowForm(false); }}
              className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors">
              📅 Canvas Import
            </button>
            <button onClick={() => { setShowForm(v => !v); setShowImport(false); }}
              className="text-xs px-3 py-1.5 bg-white text-violet-700 hover:bg-violet-50 rounded-lg font-medium transition-colors">
              + Add
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-xl font-bold">{pending.length}</div>
            <div className="text-xs text-violet-200">Pending</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-red-300">{overdue.length}</div>
            <div className="text-xs text-violet-200">Overdue</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <div className="text-xl font-bold text-yellow-300">{dueSoon.length}</div>
            <div className="text-xs text-violet-200">Due in 3 days</div>
          </div>
        </div>
      </div>

      {/* Canvas ICS Import */}
      {showImport && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-1">Import from Canvas</h3>
          <p className="text-xs text-blue-700 mb-3">
            In Canvas: <strong>Calendar → Calendar Feed</strong> (bottom left) → copy the URL → paste below.
            This imports all your assignment due dates automatically.
          </p>
          <form onSubmit={handleImport} className="flex gap-2">
            <input
              type="url"
              value={icsUrl}
              onChange={e => setIcsUrl(e.target.value)}
              placeholder="https://canvas.gmu.edu/feeds/calendars/user_..."
              required
              className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={importing}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
              {importing ? 'Importing...' : 'Import'}
            </button>
          </form>
          <p className="text-xs text-blue-500 mt-2">
            The feed URL looks like: <code>webcal://canvas.gmu.edu/feeds/calendars/user_XXXX.ics</code> — change webcal:// to https://
          </p>
        </div>
      )}

      {/* Manual Add Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-violet-50 border border-violet-100 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">Add Assignment</h3>
          <input
            type="text" placeholder="Assignment title *" required
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Due Date *</label>
              <input type="datetime-local" required
                value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.5" min="0.5" placeholder="Est. hours (optional)"
              value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input type="text" placeholder="Course / notes (optional)"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Assignment'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['pending', 'all', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {f === 'pending' ? `Upcoming (${pending.length})` : f === 'completed' ? 'Done' : 'All'}
          </button>
        ))}
      </div>

      {/* Assignment list */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">{filter === 'pending' ? 'No upcoming assignments' : 'Nothing here'}</p>
            <p className="text-xs mt-1">Add manually or import from Canvas</p>
          </div>
        ) : (
          filtered.map(a => {
            const days = daysUntil(a.due_date);
            const isOverdue = days < 0;
            const isDueSoon = days >= 0 && days <= 3;
            return (
              <div key={a.id} className={`p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${a.status === 'completed' ? 'opacity-60' : ''}`}>
                {/* Checkbox */}
                <button onClick={() => toggleStatus(a)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    a.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-violet-500'
                  }`}>
                  {a.status === 'completed' && <span className="text-xs">✓</span>}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${a.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {a.title}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[a.priority]}`}>
                      {a.priority}
                    </span>
                  </div>
                  {a.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{a.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                      {isOverdue
                        ? `⚠️ Overdue by ${Math.abs(days)}d`
                        : days === 0 ? '🔥 Due today'
                        : days === 1 ? '⏰ Due tomorrow'
                        : `📅 Due in ${days}d`}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {a.estimated_hours && (
                      <span className="text-xs text-gray-400">~{a.estimated_hours}h</span>
                    )}
                  </div>
                </div>

                <button onClick={() => handleDelete(a.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors text-sm shrink-0">✕</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
