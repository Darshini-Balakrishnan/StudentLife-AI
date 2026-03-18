---
inclusion: always
---

# MCP Tools — Weather & Mason360

## Available Tools

### `getWeather(city: string)`
- Source: `backend/src/mcp/weather.tool.ts`
- Fetches live conditions from wttr.in (no API key required)
- Returns: `{ city, temp, feels_like, description, humidity, wind_speed, is_outdoor_friendly, condition }`
- `is_outdoor_friendly` is `true` when condition code < 200 (clear/partly cloudy)
- Always call with `'Fairfax,VA,US'` for GMU campus context

### `getMason360Events()`
- Source: `backend/src/mcp/mason360.tool.ts`
- Fetches GMU public RSS event feed — no auth required
- Returns array of `{ title, description, location, date, is_outdoor, link }`
- Slice to top 5 before injecting into AI prompts to stay within token limits

## Usage in AI Context
Both tools are called in parallel inside `ai.controller.ts` using `Promise.allSettled` — failures are non-blocking. Results are injected into the system prompt so the AI assistant has real-time campus awareness without the user needing to provide that context manually.

```ts
const [weatherResult, mason360Result] = await Promise.allSettled([
  getWeather('Fairfax,VA,US'),
  getMason360Events(),
]);
```

## Adding New MCP Tools
1. Create `backend/src/mcp/yourtool.tool.ts` exporting an async function
2. Re-export from `backend/src/mcp/index.ts`
3. Call via `Promise.allSettled` in the AI controller
4. Add a `/api/mcp/yourtool` REST endpoint in `mcp.routes.ts` for direct frontend access
