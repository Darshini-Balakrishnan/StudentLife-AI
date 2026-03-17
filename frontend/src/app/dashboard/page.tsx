'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/lib/socket';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import EventsWidget from '@/components/dashboard/EventsWidget';
import ResourcesWidget from '@/components/dashboard/ResourcesWidget';
import WellbeingWidget from '@/components/dashboard/WellbeingWidget';
import ExpensesWidget from '@/components/dashboard/ExpensesWidget';
import AIAssistant from '@/components/dashboard/AIAssistant';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import PlannerWidget from '@/components/dashboard/PlannerWidget';
import AssignmentsWidget from '@/components/dashboard/AssignmentsWidget';

type Tab = 'overview' | 'events' | 'resources' | 'expenses' | 'wellbeing' | 'planner' | 'assignments' | 'ai';

interface WeatherData {
  city: string;
  temp: number;
  feels_like: number;
  description: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  is_outdoor_friendly: boolean;
  condition: string;
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { isConnected, socket } = useSocket();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadData();
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    socket.on('event:new', (e: any) => { toast.success('New event posted!'); setEvents(p => [e, ...p]); });
    socket.on('resource:new', (r: any) => { toast.success('New resource uploaded!'); setResources(p => [r, ...p]); });
    socket.on('notification:new', (n: any) => toast(n.message));
    return () => { socket.off('event:new'); socket.off('resource:new'); socket.off('notification:new'); };
  }, [socket]);

  async function loadData() {
    try {
      const [evRes, resRes] = await Promise.all([api.get('/events'), api.get('/resources')]);
      setEvents(evRes.data);
      setResources(resRes.data);
    } catch (e) { console.error(e); }
  }

  if (!user) return null;

  const goingCount = rsvpedIds.size;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',   label: 'Overview',     icon: '🏠' },
    { id: 'events',     label: 'Events',       icon: '📅' },
    { id: 'resources',  label: 'Resources',    icon: '📚' },
    { id: 'expenses',   label: 'Expenses',     icon: '💰' },
    { id: 'wellbeing',  label: 'Wellbeing',    icon: '🧠' },
    { id: 'planner',     label: 'Planner',      icon: '📋' },
    { id: 'assignments', label: 'Assignments',   icon: '📝' },
    { id: 'ai',          label: 'AI Assistant',  icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
            <span className="font-bold text-gray-900 text-lg">StudentLife AI</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isConnected ? '● Live' : '○ Offline'}
            </span>
            {goingCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                ✅ {goingCount} event{goingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {weather && (
              <span className="text-sm text-gray-600 hidden md:flex items-center gap-1">
                {weather.temp}°F · {weather.city}
              </span>
            )}
            <span className="text-sm text-gray-600 hidden sm:block">👋 {user.full_name}</span>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="text-sm text-red-500 hover:text-red-700 font-medium">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <WeatherWidget onWeatherLoad={setWeather} />
            {goingCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-800">You&apos;re going to {goingCount} event{goingCount !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-green-600">Check the Events tab to see your schedule, or the Planner for your full week.</p>
                </div>
                <button onClick={() => setActiveTab('events')}
                  className="ml-auto text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  View Events
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EventsWidget events={events.slice(0, 3)} onRsvp={setRsvpedIds} compact weather={weather} />
              <ResourcesWidget resources={resources.slice(0, 3)} compact />
              <WellbeingWidget />
              <ExpensesWidget />
            </div>
          </div>
        )}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <WeatherWidget onWeatherLoad={setWeather} />
            <EventsWidget events={events} onRsvp={setRsvpedIds} weather={weather} />
          </div>
        )}
        {activeTab === 'resources' && <ResourcesWidget resources={resources} onUpload={loadData} />}
        {activeTab === 'expenses'  && <ExpensesWidget full />}
        {activeTab === 'wellbeing' && <WellbeingWidget full />}
        {activeTab === 'planner'     && <PlannerWidget rsvpedEventIds={rsvpedIds} />}
        {activeTab === 'assignments' && <AssignmentsWidget />}
        {activeTab === 'ai'          && <AIAssistant rsvpedEventIds={rsvpedIds} />}
      </main>
    </div>
  );
}
