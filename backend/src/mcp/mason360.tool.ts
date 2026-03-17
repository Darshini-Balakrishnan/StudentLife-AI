import axios from 'axios';
import * as xml2js from 'xml2js';
import { cacheGet, cacheSet } from '../cache/redis';

export interface Mason360Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  event_type: string;
  tags: string[];
  source: 'mason360';
  url: string;
  is_outdoor: boolean;
}

const CACHE_KEY = 'mason360:events';
const CACHE_TTL = 900; // 15 minutes

// GMU public RSS feeds (Mason360 is a JS SPA — not scrapeable without a browser)
const GMU_RSS_FEEDS = [
  'https://www2.gmu.edu/events-activities/rss.xml',
  'https://www.gmu.edu/events/rss',
  'https://calendar.gmu.edu/rss',
];

const OUTDOOR_KEYWORDS = [
  'outdoor', 'outside', 'lawn', 'quad', 'field', 'park', 'amphitheater',
  'amphitheatre', 'garden', 'plaza', 'courtyard', 'patio', 'stadium',
  'track', 'trail', 'campus walk', 'freedom aquatic', 'rec fields',
];

function isOutdoorEvent(title: string, location: string, description: string): boolean {
  const text = `${title} ${location} ${description}`.toLowerCase();
  return OUTDOOR_KEYWORDS.some(kw => text.includes(kw));
}

function inferEventType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('workshop') || text.includes('training') || text.includes('seminar')) return 'workshop';
  if (text.includes('career') || text.includes('academic') || text.includes('lecture') || text.includes('study') || text.includes('class')) return 'academic';
  if (text.includes('sport') || text.includes('game') || text.includes('fitness') || text.includes('run') || text.includes('rec')) return 'sports';
  return 'social';
}

async function parseRssFeed(url: string): Promise<Mason360Event[]> {
  const res = await axios.get(url, {
    timeout: 8000,
    headers: { 'User-Agent': 'StudentLifeAI/1.0 (GMU Student App)', 'Accept': 'application/rss+xml, application/xml, text/xml' },
  });

  const parsed = await xml2js.parseStringPromise(res.data, { explicitArray: false, ignoreAttrs: false });
  const channel = parsed?.rss?.channel || parsed?.feed;
  if (!channel) return [];

  const items: any[] = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  if (items.length === 0) return [];

  return items.slice(0, 20).map((item: any, idx: number) => {
    const title = item.title || 'GMU Event';
    const description = (item.description || item.summary || '').replace(/<[^>]*>/g, '').slice(0, 300);
    const link = item.link || item.guid || 'https://www.gmu.edu/events';
    const pubDate = item.pubDate || item.updated || item['dc:date'];
    const location = item['ev:location'] || item.location || 'George Mason University';

    // Try to parse date; fall back to upcoming days
    let start_time: string;
    try {
      start_time = pubDate ? new Date(pubDate).toISOString() : new Date(Date.now() + idx * 86400000).toISOString();
    } catch {
      start_time = new Date(Date.now() + idx * 86400000).toISOString();
    }

    return {
      id: `gmu-rss-${Buffer.from(title + idx).toString('base64').slice(0, 16)}`,
      title,
      description,
      location,
      start_time,
      end_time: new Date(new Date(start_time).getTime() + 7200000).toISOString(), // +2h
      event_type: inferEventType(title, description),
      tags: [],
      source: 'mason360' as const,
      url: typeof link === 'object' ? (link._ || 'https://www.gmu.edu/events') : link,
      is_outdoor: isOutdoorEvent(title, location, description),
    };
  });
}

export async function getMason360Events(): Promise<Mason360Event[]> {
  // Try cache first
  const cached = await cacheGet(CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }

  // Try each GMU RSS feed in order
  for (const feedUrl of GMU_RSS_FEEDS) {
    try {
      const events = await parseRssFeed(feedUrl);
      if (events.length > 0) {
        await cacheSet(CACHE_KEY, JSON.stringify(events), CACHE_TTL);
        return events;
      }
    } catch {
      // try next feed
    }
  }

  // All feeds failed — return empty (app still works with local DB seeded events)
  return [];
}
