'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Resource {
  id: string;
  title: string;
  description?: string;
  resource_type: string;
  file_url: string;
  ai_summary?: string;
  rating_avg: number;
  rating_count: number;
  download_count: number;
  course_code?: string;
}

interface Props { resources: Resource[]; onUpload?: () => void; compact?: boolean; }

const TYPE_ICONS: Record<string, string> = {
  notes: '📝', guide: '📖', slides: '📊', project: '💻', other: '📄',
};

export default function ResourcesWidget({ resources, onUpload, compact }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    title: '', description: '', resource_type: 'notes', file_url: '', course_id: '',
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.file_url) return toast.error('Title and URL are required');
    setSubmitting(true);
    try {
      await api.post('/resources', form);
      toast.success('Resource uploaded!');
      setForm({ title: '', description: '', resource_type: 'notes', file_url: '', course_id: '' });
      setShowForm(false);
      onUpload?.();
    } catch {
      toast.error('Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRate(resourceId: string, stars: number) {
    try {
      await api.post(`/resources/${resourceId}/rate`, { rating: stars });
      setRating(prev => ({ ...prev, [resourceId]: stars }));
      toast.success('Rating saved!');
    } catch {
      toast.error('Failed to rate');
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <h2 className="font-semibold text-gray-900">Academic Resources</h2>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{resources.length}</span>
        </div>
        {!compact && (
          <button onClick={() => setShowForm(!showForm)}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
            {showForm ? 'Cancel' : '+ Upload'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="p-4 bg-blue-50 border-b border-blue-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Resource title *" required
              className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={form.file_url} onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))}
              placeholder="File URL (Google Drive, etc.) *" required
              className="col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.resource_type} onChange={e => setForm(p => ({ ...p, resource_type: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="notes">Notes</option>
              <option value="guide">Study Guide</option>
              <option value="slides">Slides</option>
              <option value="project">Project</option>
              <option value="other">Other</option>
            </select>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)"
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Uploading...' : 'Upload Resource'}
          </button>
        </form>
      )}

      <div className="divide-y divide-gray-50">
        {resources.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>No resources yet</p>
            {!compact && <p className="text-xs mt-1">Upload the first one!</p>}
          </div>
        ) : (
          resources.map(r => (
            <div key={r.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{TYPE_ICONS[r.resource_type] || '📄'}</span>
                    <h3 className="font-medium text-gray-900 text-sm truncate">{r.title}</h3>
                    {r.course_code && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">{r.course_code}</span>
                    )}
                  </div>
                  {!compact && r.ai_summary && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 bg-yellow-50 p-2 rounded border-l-2 border-yellow-300">
                      🤖 {r.ai_summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="capitalize">{r.resource_type}</span>
                    {r.rating_avg > 0 && <span>⭐ {Number(r.rating_avg).toFixed(1)} ({r.rating_count})</span>}
                    {r.download_count > 0 && <span>⬇ {r.download_count}</span>}
                  </div>
                  {!compact && (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => handleRate(r.id, s)}
                          className={`text-sm transition-colors ${(rating[r.id] || 0) >= s ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}>
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Open ↗
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
