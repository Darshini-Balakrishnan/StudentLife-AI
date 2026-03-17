'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface WellbeingData {
  burnoutScore: number;
  studyHours: number;
  upcomingDeadlines: number;
  recommendation: string;
}

interface Props { full?: boolean; }

export default function WellbeingWidget({ full }: Props) {
  const [data, setData] = useState<WellbeingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    duration_minutes: '', intensity: 'medium', notes: '', start_time: '', end_time: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get('/wellbeing/analysis');
      setData(res.data);
    } catch {
      console.error('Failed to load wellbeing data');
    } finally {
      setLoading(false);
    }
  }

  async function logSession(e: React.FormEvent) {
    e.preventDefault();
    if (!form.duration_minutes) return toast.error('Duration is required');
    setSubmitting(true);
    try {
      const now = new Date();
      const start = form.start_time || new Date(now.getTime() - parseInt(form.duration_minutes) * 60000).toISOString();
      const end = form.end_time || now.toISOString();
      await api.post('/wellbeing/study-sessions', {
        start_time: start,
        end_time: end,
        duration_minutes: parseInt(form.duration_minutes),
        intensity: form.intensity,
        notes: form.notes,
      });
      toast.success('Study session logged!');
      setForm({ duration_minutes: '', intensity: 'medium', notes: '', start_time: '', end_time: '' });
      setShowForm(false);
      loadData();
    } catch {
      toast.error('Failed to log session');
    } finally {
      setSubmitting(false);
    }
  }

  const score = data?.burnoutScore ?? 0;
  const color = score < 30 ? 'text-green-600' : score < 60 ? 'text-yellow-600' : 'text-red-600';
  const barColor = score < 30 ? 'bg-green-500' : score < 60 ? 'bg-yellow-500' : 'bg-red-500';
  const label = score < 30 ? 'Healthy' : score < 60 ? 'Moderate Stress' : 'High Burnout Risk';
  const emoji = score < 30 ? '😊' : score < 60 ? '😐' : '😰';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <h2 className="font-semibold text-gray-900">Wellbeing</h2>
        </div>
        {full && (
          <button onClick={() => setShowForm(!showForm)}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
            {showForm ? 'Cancel' : '+ Log Session'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={logSession} className="p-4 bg-green-50 border-b border-green-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={form.duration_minutes}
              onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))}
              placeholder="Duration (minutes) *" required min="1"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
            <select value={form.intensity} onChange={e => setForm(p => ({ ...p, intensity: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="intense">Intense</option>
            </select>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notes (optional)"
              className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Log Study Session'}
          </button>
        </form>
      )}

      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{emoji}</div>
              <div>
                <div className={`text-3xl font-bold ${color}`}>{score}%</div>
                <div className="text-sm text-gray-600">{label}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Burnout Risk</span>
                <span>{score}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${score}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">{data?.studyHours ?? 0}h</div>
                <div className="text-xs text-blue-600">Study (7 days)</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-700">{data?.upcomingDeadlines ?? 0}</div>
                <div className="text-xs text-orange-600">Deadlines (7 days)</div>
              </div>
            </div>

            {data?.recommendation && (
              <div className={`p-3 rounded-lg text-sm ${score > 60 ? 'bg-red-50 text-red-700' : score > 30 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                💡 {data.recommendation}
              </div>
            )}

            {full && (
              <button onClick={() => setShowForm(true)}
                className="mt-4 w-full py-2 border border-blue-600 text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors">
                Log a Study Session
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
