import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWeather } from '../mcp/weather.tool';
import { getMason360Events } from '../mcp/mason360.tool';
import { cacheGet, cacheSet } from '../cache/redis';

const router = Router();

// GET /api/mcp/weather — current weather for GMU Fairfax campus
router.get('/weather', async (_req, res) => {
  try {
    const cacheKey = 'mcp:weather';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      try { return res.json(JSON.parse(cached)); } catch { /* bad cache, refetch */ }
    }

    const weather = await getWeather('Fairfax,VA,US');
    await cacheSet(cacheKey, JSON.stringify(weather), 600); // 10 min cache
    res.json(weather);
  } catch (error: any) {
    console.error('Weather MCP error:', error.message);
    // Always return something — never let weather break the app
    res.json({
      city: 'Fairfax, VA', temp: 72, feels_like: 70,
      description: 'Weather temporarily unavailable',
      icon: '01d', humidity: 50, wind_speed: 5,
      is_outdoor_friendly: true, condition: 'clear',
    });
  }
});

// GET /api/mcp/mason-events — live events from Mason360
router.get('/mason-events', authenticate, async (_req, res) => {
  try {
    const events = await getMason360Events();
    res.json(events);
  } catch (error: any) {
    console.error('Mason360 MCP error:', error.message);
    res.status(500).json({ error: 'Failed to fetch Mason360 events' });
  }
});

// GET /api/mcp/context — combined context for AI (weather + mason events summary)
router.get('/context', authenticate, async (_req, res) => {
  try {
    const [weather, mason360Events] = await Promise.allSettled([
      getWeather('Fairfax,VA,US'),
      getMason360Events(),
    ]);

    res.json({
      weather: weather.status === 'fulfilled' ? weather.value : null,
      mason360Events: mason360Events.status === 'fulfilled' ? mason360Events.value.slice(0, 10) : [],
    });
  } catch (error: any) {
    console.error('MCP context error:', error.message);
    res.status(500).json({ error: 'Failed to fetch MCP context' });
  }
});

export default router;
