'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ClassEntry {
  id: string;
  course_name: string;
  course_code?: string;
  days: string[];
  start_time: string;
  end_time: string;
  location?: string;
  instructor?: string;
  semester?: string;
}

interface Plan {
  content: string;
  type: string;
  generated_at: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

const emptyClass = (): Omit<ClassEntry, 'id'> => ({
  course_name: '', course_code: '', days: [], start_time: '09:00',
  end_time: '10:15', location: '', instructor: '', semester: 'Spring 2026',
});

interface Props {
  rsvpedEventIds?: Set<string>;
}

export default function PlannerWidget({ rsvpedEventIds }: Props) {
  const [schedule, setSchedule] = useState<ClassEntry[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planType, setPlanType] = useState<'weekly' | 'monthly'>('weekly');
  const [generating, setGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeView, setActiveView] = useState<'schedule' | 'plan'>('schedule');
  const [form, setForm] = useState(emptyClass());
  const [submitting, setSubmitting] = useState(false);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSchedule();
    loadLastPlan();
  }, []);

  async function loadSchedule() {
    try {
      const res = await api.get('/schedule');
      setSchedule(res.data);
    } catch { /* non-fatal */ }
  }

  async function loadLastPlan() {
    try {
      const res = await api.get(`/planner/plan?type=${planType}`);
      if (res.data) setPlan(res.data);
    } catch { /* non-fatal */ }
  }

  async function addClass(e: React.FormEvent) {
    e.preventDefault();
    if (!form.course_name || form.days.length === 0) return toast.error('Course name and at least one day are required');
    setSubmitting(true);
    try {
      await api.post('/schedule', form);
      toast.success('Class added!');
      setForm(emptyClass());
      setShowAddForm(false);
      loadSchedule();
    } catch {
      toast.error('Failed to add class');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteClass(id: string) {
    try {
      await api.delete(`/schedule/${id}`);
      setSchedule(p => p.filter(c => c.id !== id));
      toast.success('Class removed');
    } catch {
      toast.error('Failed to remove class');
    }
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const res = await api.post('/planner/generate', { type: planType });
      setPlan(res.data);
      setActiveView('plan');
      setTimeout(() => planRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      toast.success(`${planType === 'weekly' ? 'Weekly' : 'Monthly'} plan generated!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  }

  function toggleDay(day: string) {
    setForm(p => ({
      ...p,
      days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day],
    }));
  }

  // Group schedule by day for the visual timetable
  const byDay: Record<string, ClassEntry[]> = {};
  DAYS.forEach(d => { byDay[d] = []; });
  schedule.forEach(c => {
    (c.days || []).forEach(d => {
      if (byDay[d]) byDay[d].push(c);
    });
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">📋 Smart Planner</h2>
            <p className="text-indigo-100 text-sm">
              Upload your class schedule and get an AI-generated productivity plan that balances classes, study time, campus events, and personal life.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
              <button
                onClick={() => setPlanType('weekly')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${planType === 'weekly' ? 'bg-white text-indigo-700' : 'bg-indigo-500/50 text-white hover:bg-indigo-500'}`}>
                Weekly
              </button>
              <button
                onClick={() => setPlanType('monthly')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${planType === 'monthly' ? 'bg-white text-indigo-700' : 'bg-indigo-500/50 text-white hover:bg-indigo-500'}`}>
                Monthly
              </button>
            </div>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 disabled:opacity-60 transition-colors">
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>✨ Generate {planType === 'weekly' ? 'Week' : 'Month'} Plan</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('schedule')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'schedule' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          📅 My Schedule ({schedule.length} classes)
        </button>
        <button
          onClick={() => setActiveView('plan')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'plan' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          🗓 AI Plan {plan ? `(${new Date(plan.generated_at).toLocaleDateString()})` : ''}
        </button>
      </div>

      {/* Schedule view */}
      {activeView === 'schedule' && (
        <div className="space-y-4">
          {/* Add class button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {schedule.length === 0
                ? 'Add your classes to get a personalized plan'
                : `${schedule.length} class${schedule.length !== 1 ? 'es' : ''} in your schedule`}
            </p>
            <button
              onClick={() => setShowAddForm(v => !v)}
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              {showAddForm ? 'Cancel' : '+ Add Class'}
            </button>
          </div>

          {/* Add class form */}
          {showAddForm && (
            <form onSubmit={addClass} className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Add a Class</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.course_name}
                  onChange={e => setForm(p => ({ ...p, course_name: e.target.value }))}
                  placeholder="Course name * (e.g. Data Structures)" required
                  className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  value={form.course_code}
                  onChange={e => setForm(p => ({ ...p, course_code: e.target.value }))}
                  placeholder="Course code (e.g. CS201)"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  value={form.instructor}
                  onChange={e => setForm(p => ({ ...p, instructor: e.target.value }))}
                  placeholder="Instructor name"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="Room / Building"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  value={form.semester}
                  onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                  placeholder="Semester (e.g. Spring 2026)"
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Days *</p>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS.map(d => (
                      <button
                        key={d} type="button"
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${form.days.includes(d) ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Start time *</p>
                  <input
                    type="time" value={form.start_time}
                    onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">End time *</p>
                  <input
                    type="time" value={form.end_time}
                    onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={submitting}
                className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Adding...' : 'Add to Schedule'}
              </button>
            </form>
          )}

          {/* Weekly timetable */}
          {schedule.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-100">
                {DAYS.map(d => (
                  <div key={d} className="p-3 text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase">{d}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">{DAY_FULL[d].slice(0, 3)}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[200px] divide-x divide-gray-50">
                {DAYS.map(d => (
                  <div key={d} className="p-2 space-y-1.5">
                    {byDay[d].length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-gray-200">—</span>
                      </div>
                    ) : (
                      byDay[d].map(c => (
                        <div key={c.id} className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 group relative">
                          <p className="text-xs font-semibold text-indigo-800 leading-tight truncate">{c.course_code || c.course_name}</p>
                          <p className="text-xs text-indigo-600">{c.start_time}–{c.end_time}</p>
                          {c.location && <p className="text-xs text-gray-400 truncate">{c.location}</p>}
                          <button
                            onClick={() => deleteClass(c.id)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity">
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <div className="text-5xl mb-3">📚</div>
              <p className="font-medium text-gray-700">No classes added yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your class schedule to get a personalized AI plan</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                Add First Class
              </button>
            </div>
          )}
        </div>
      )}

      {/* Plan view */}
      {activeView === 'plan' && (
        <div ref={planRef}>
          {plan ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {plan.type === 'weekly' ? '📅 Weekly Plan' : '🗓 Monthly Plan'}
                  </h3>
                  <p className="text-xs text-gray-500">Generated {new Date(plan.generated_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={generatePlan}
                  disabled={generating}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {generating ? 'Regenerating...' : '↻ Regenerate'}
                </button>
              </div>
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  {plan.content.split('\n').map((line, i) => {
                    if (!line.trim()) return <div key={i} className="h-2" />;
                    // Day headers (e.g. "Monday", "**Monday**", "## Monday")
                    if (/^(#{1,3}\s|(\*\*[A-Z])|[A-Z][A-Z]+\s*:|\bWeek\s+\d|\bDay\s+\d)/i.test(line.trim())) {
                      return (
                        <div key={i} className="mt-5 mb-2 pb-1 border-b border-indigo-100">
                          <p className="font-bold text-indigo-800 text-base">
                            {line.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
                          </p>
                        </div>
                      );
                    }
                    // Bullet points
                    if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                      return (
                        <div key={i} className="flex gap-2 py-0.5">
                          <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                          <p className="text-sm text-gray-700">{line.replace(/^[-•]\s*/, '')}</p>
                        </div>
                      );
                    }
                    // Time blocks (e.g. "9:00 AM - 10:15 AM:")
                    if (/^\d{1,2}:\d{2}/.test(line.trim())) {
                      return (
                        <div key={i} className="flex gap-3 py-1 items-start">
                          <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shrink-0 mt-0.5">
                            {line.match(/^\d{1,2}:\d{2}[^\s]*/)?.[0] || ''}
                          </span>
                          <p className="text-sm text-gray-700">{line.replace(/^\d{1,2}:\d{2}[^\s]*\s*[-–]?\s*\d{0,2}:?\d{0,2}[^\s]*\s*[-–]?\s*/, '')}</p>
                        </div>
                      );
                    }
                    return <p key={i} className="text-sm text-gray-700 py-0.5">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
              <div className="text-5xl mb-3">✨</div>
              <p className="font-medium text-gray-700">No plan generated yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {schedule.length === 0
                  ? 'Add your class schedule first, then generate a plan'
                  : 'Click "Generate Plan" to get your personalized schedule'}
              </p>
              <button
                onClick={generatePlan}
                disabled={generating}
                className="mt-4 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {generating ? 'Generating...' : `✨ Generate ${planType === 'weekly' ? 'Weekly' : 'Monthly'} Plan`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
