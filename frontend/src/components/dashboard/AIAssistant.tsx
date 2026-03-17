'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

const SUGGESTIONS = [
  'How can I reduce my monthly spending?',
  'Give me a study schedule for finals week',
  'What events should I attend this week?',
  'I feel burned out — what should I do?',
];

interface Props {
  rsvpedEventIds?: Set<string>;
}

export default function AIAssistant({ rsvpedEventIds }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function loadHistory() {
    try {
      const res = await api.get('/ai/history');
      if (res.data.length > 0) {
        setMessages(res.data.map((m: any) => ({ role: m.role, content: m.content })));
      }
    } catch {
      // history load failure is non-critical
    } finally {
      setHistoryLoaded(true);
    }
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: msg });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Failed to get a response. Check backend logs.';
      setMessages(prev => [...prev, { role: 'error', content: errMsg }]);
      toast.error(errMsg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
          🤖
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">AI Assistant</h2>
          <p className="text-xs text-gray-400">Powered by Groq · Knows your context</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!historyLoaded ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-5xl">💬</div>
            <div>
              <p className="font-medium text-gray-700">Ask me anything about student life</p>
              <p className="text-sm text-gray-400 mt-1">I know your courses, spending, and study habits</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm mt-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-left text-xs px-3 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs mr-2 mt-1 shrink-0">
                    {msg.role === 'error' ? '⚠' : '🤖'}
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : msg.role === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs mr-2 mt-1 shrink-0">
                  🤖
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about events, study tips, expenses..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors text-sm font-medium">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
