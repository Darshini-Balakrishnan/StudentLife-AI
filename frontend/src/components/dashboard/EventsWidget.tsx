'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface WeatherData {
  is_outdoor_friendly: boolean;
  condition: string;
  temp: number;
  description: string;
}

interface Props {
  events: any[];
  onRsvp?: (rsvpedIds: Set<string>) => void;
  compact?: boolean;
  weather?: WeatherData | null;
}

type EventTab = 'all' | 'indoor' | 'outdoor' | 'recommended' | 'mason360' | 'going';

const TYPE_COLORS: Record<string, string> = {
  workshop: 'bg-purple-100 text-purple-700',
  academic: 'bg-blue-100 text-blue-700',
  social: 'bg-green-100 text-green-700',
  sports: 'bg-orange-100 text-orange-700',
};

export default function EventsWidget({ events, onRsvp, compact, weather }: Props) {
  const [rsvping, setRsvping] = useState<string | null>(null);
  // Persisted from DB — not just local state
  const [rsvped, setRsvped] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<EventTab>('all');
  const [loadingRsvps, setLoadingRsvps] = useState(true);

  // Load existing RSVPs from DB on mount so state survives page refresh
  useEffect(() => {
    api.get('/events/my-rsvps')
      .then(res => setRsvped(new Set(res.data)))
      .catch(() => {/* non-fatal */})
      .finally(() => setLoadingRsvps(false));
  }, []);

  async function handleRsvp(eventId: string, isMason360: boolean) {
    if (isMason360) {
      toast('Open Mason360 to RSVP for this event', { icon: '🔗' });
      return;
    }
    setRsvping(eventId);
    try {
      if (rsvped.has(eventId)) {
        await api.delete(`/events/${eventId}/rsvp`);
        setRsvped(prev => { const s = new Set(prev); s.delete(eventId); return s; });
        toast.success('RSVP cancelled');
        onRsvp?.(new Set([...rsvped].filter(id => id !== eventId)));
      } else {
        await api.post(`/events/${eventId}/rsvp`, { status: 'attending' });
        const next = new Set(rsvped).add(eventId);
        setRsvped(next);
        toast.success('RSVP confirmed! Added to your planner.');
        onRsvp?.(next);
      }
    } catch {
      toast.error('Failed to RSVP');
    } finally {
      setRsvping(null);
    }
  }

  const goingEvents = events.filter(e => rsvped.has(e.id));

  const filtered = (() => {
    switch (activeTab) {
      case 'indoor': return events.filter(e => !e.is_outdoor);
      case 'outdoor': return events.filter(e => e.is_outdoor);
      case 'going': return goingEvents;
      case 'recommended':
        return weather
          ? events.filter(e => weather.is_outdoor_friendly ? true : !e.is_outdoor)
          : events;
      case 'mason360': return events.filter(e => e.source === 'mason360');
      default: return events;
    }
  })();

  const tabs: { id: EventTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: events.length },
    { id: 'going', label: '✅ Going', count: goingEvents.length },
    { id: 'indoor', label: '🏛 Indoor', count: events.filter(e => !e.is_outdoor).length },
    { id: 'outdoor', label: '🌳 Outdoor', count: events.filter(e => e.is_outdoor).length },
    { id: 'recommended', label: '⭐ For You', count: weather ? events.filter(e => weather.is_outdoor_friendly ? true : !e.is_outdoor).length : events.length },
    { id: 'mason360', label: '🎓 Mason360', count: events.filter(e => e.source === 'mason360').length },
  ];

  const displayEvents = compact ? filtered.slice(0, 3) : filtered;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <h2 className="font-semibold text-gray-900">Campus Events</h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{events.length}</span>
          {goingEvents.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              ✅ {goingEvents.length} going
            </span>
          )}
        </div>
        {weather && !compact && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${weather.is_outdoor_friendly ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {weather.is_outdoor_friendly ? '☀️ Great outdoor weather' : '🌧️ Indoor recommended'}
          </span>
        )}
      </div>

      {!compact && (
        <div className="flex gap-0 border-b border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {!compact && weather && activeTab === 'recommended' && (
        <div className={`px-4 py-2 text-xs ${weather.is_outdoor_friendly ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
          {weather.is_outdoor_friendly
            ? `☀️ ${weather.temp}°F and ${weather.description} — perfect for outdoor events!`
            : `🌧️ ${weather.description} today — showing indoor events for your comfort.`}
        </div>
      )}

      {!compact && activeTab === 'going' && goingEvents.length === 0 && (
        <div className="px-4 py-3 text-xs bg-gray-50 text-gray-500">
          You haven&apos;t RSVP&apos;d to any events yet. Browse and click RSVP to add them here.
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {displayEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>No events in this category</p>
          </div>
        ) : (
          displayEvents.map(event => {
            const isMason360 = event.source === 'mason360';
            const isGoing = rsvped.has(event.id);
            return (
              <div key={event.id} className={`p-4 hover:bg-gray-50 transition-colors ${isGoing ? 'border-l-2 border-green-400' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-gray-900 text-sm">{event.title}</h3>
                      {event.event_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                          {event.event_type}
                        </span>
                      )}
                      {event.is_outdoor && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">🌳 Outdoor</span>
                      )}
                      {isMason360 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Mason360</span>
                      )}
                      {isGoing && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✅ Going</span>
                      )}
                    </div>
                    {!compact && event.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      {event.location && <span>📍 {event.location}</span>}
                      <span>🕐 {format(new Date(event.start_time), 'MMM d, h:mm a')}</span>
                      {event.max_attendees && <span>👥 Max {event.max_attendees}</span>}
                    </div>
                    {!compact && event.tags?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {event.tags.map((tag: string) => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isMason360 ? (
                    <a href={event.url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
                      View ↗
                    </a>
                  ) : (
                    <button
                      onClick={() => handleRsvp(event.id, false)}
                      disabled={rsvping === event.id || loadingRsvps}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        isGoing
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50`}>
                      {rsvping === event.id ? '...' : isGoing ? '✓ Going' : 'RSVP'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
