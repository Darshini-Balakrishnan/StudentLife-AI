---
inclusion: always
---

# StudentLife AI — Project Conventions

## Stack
- Backend: Express + TypeScript on port 3001
- Frontend: Next.js 14 (App Router) on port 3000
- Database: PostgreSQL via `pg` pool (`backend/src/db/connection.ts`)
- Cache: Upstash Redis REST (`@upstash/redis`) — NOT standard TCP redis
- AI: Groq API via OpenAI-compatible SDK (`baseURL: https://api.groq.com/openai/v1`, model: `llama-3.1-8b-instant`)
- Auth: JWT stored in localStorage via Zustand (`frontend/src/store/authStore.ts`)

## Backend Conventions

### Route files
- Every protected route must use the `authenticate` middleware from `../middleware/auth`
- Use `AuthRequest` (not `Request`) for typed `req.userId`
- Always return `{ error: string }` on failure — never throw raw errors to the client
- Register new route files in `backend/src/routes/index.ts`

```ts
// correct pattern
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT ...', [req.userId]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch ...' });
  }
});
```

### AI usage
- Never import `openai` directly in route files — always use the `getAI()` factory in `ai.controller.ts`
- Groq is the only AI provider. Do not add OpenAI, Anthropic, or other providers.
- Inject user context (courses, assignments, spending, weather) into every system prompt

### Database
- All queries use parameterized statements — never string-interpolate user input
- `db/init.ts` owns all table creation and seed data — do not create tables elsewhere
- The `cognito_id` column in `users` stores bcrypt password hashes (legacy name, do not rename)

## Frontend Conventions

### User feedback
- Always use `react-hot-toast` for success/error feedback — never `alert()` or `console.log` for user-facing messages
- Import: `import toast from 'react-hot-toast'`
- Success: `toast.success('...')`, Error: `toast.error('...')`

### API calls
- Always use the `api` axios instance from `@/lib/api` — never use `fetch` directly
- The instance automatically attaches the JWT Authorization header

### Weather data flow
- `WeatherWidget` fetches weather and calls `onWeatherLoad(data)` prop
- `dashboard/page.tsx` holds `weather` state and passes it down to widgets that need it
- Do not fetch weather inside individual widgets

### Styling
- Tailwind CSS only — no CSS modules, no inline styles
- Widget cards use `bg-white rounded-xl border border-gray-100` as the base container
- Gradient headers use `bg-gradient-to-r` with the widget's color theme

## Environment Variables
Required in `backend/.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — at least 32 chars
- `GROQ_API_KEY` — from console.groq.com (free)
- `AI_MODEL` — `llama-3.1-8b-instant`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — from upstash.com (free)
