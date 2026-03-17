# StudentLife AI — Kiro Hackathon Project

> An AI-powered student companion for George Mason University students, built entirely with Kiro.

---

## 1. Project Overview

### Problem Statement & Target Users

College students at GMU juggle an overwhelming number of responsibilities simultaneously — tracking assignment deadlines across multiple Canvas courses, discovering campus events worth attending, managing a tight budget, monitoring their own mental health, and planning study time around an unpredictable schedule. Most students use 4–6 disconnected tools for these tasks (Canvas, a notes app, a budgeting spreadsheet, Google Calendar, and maybe a weather app), with no single place that understands their full context.

The target users are GMU undergraduate and graduate students who want one intelligent dashboard that knows their schedule, their workload, their spending, and the campus around them — and can give personalized advice based on all of it at once.

### Solution Summary

StudentLife AI is a full-stack web application that unifies the student experience into a single AI-aware dashboard. It pulls live campus event data via MCP tools, tracks assignment deadlines (including Canvas ICS import), monitors expenses against a monthly budget, detects burnout risk from study patterns, and generates personalized weekly/monthly plans using an AI assistant that has full context about the student's life.

### Key Features

- **Campus Events** — live GMU RSS feed events with weather-aware filtering, RSVP persistence, and Mason360 integration
- **Assignment Tracker** — manual entry + one-click Canvas ICS calendar import, overdue warnings, burnout feed
- **Expense Tracker** — add/delete expenses, category breakdown, monthly budget bar, real-time WebSocket updates
- **Wellbeing Monitor** — burnout score calculated from study hours + upcoming deadlines, study session logging
- **AI Planner** — class schedule timetable + AI-generated weekly/monthly productivity plans using Groq
- **AI Assistant** — context-aware chat powered by Groq (llama-3.1-8b-instant), knows your courses, spending, RSVPs, and live weather
- **Weather Widget** — live conditions via wttr.in, `is_outdoor_friendly` flag used across events and AI context
- **Real-time** — WebSocket notifications for new events, resources, and expense updates

---

## 2. Design Decisions

### Technology Choices & Alternatives Considered

**AI Provider — Groq over OpenAI**
The original plan used OpenAI's GPT-4o, but the free tier quota ran out mid-development. Groq offers `llama-3.1-8b-instant` at 14,400 requests/day for free, with response times under 500ms — faster than GPT-4o in practice. The switch was seamless because Groq exposes an OpenAI-compatible REST API, so only the `baseURL` and `apiKey` needed to change. Trade-off: Llama 3.1 8B is less capable than GPT-4o for complex reasoning, but for a student assistant giving study tips and event recommendations, it's more than sufficient.

**Weather — wttr.in over OpenWeatherMap**
OpenWeatherMap requires an API key and has a 1,000 call/day free limit. `wttr.in` is a public weather service with a clean JSON API (`?format=j1`) that requires no authentication. The trade-off is that it's a third-party service with no SLA, but for a hackathon project serving a single campus location (Fairfax, VA), reliability was acceptable. The `is_outdoor_friendly` flag is computed server-side from the weather condition code and used across the Events widget and AI context.

**Database — Local PostgreSQL over Supabase/Firebase**
Supabase would have added managed auth, real-time subscriptions, and a hosted DB — but it also adds vendor lock-in and requires internet access during development. Using local PostgreSQL with `pg` kept the stack simple, fully offline-capable, and easy to inspect with pgAdmin. The schema is initialized via `db/init.ts` which creates all tables and seeds sample data on first run.

**Auth — JWT over Sessions**
Stateless JWT tokens stored in `localStorage` (via Zustand) were chosen over server-side sessions to keep the backend horizontally scalable without a shared session store. The `cognito_id` column name is a legacy artifact from an earlier Cognito plan — it now stores bcrypt password hashes. Trade-off: JWTs can't be invalidated server-side without a blocklist, but for a student app with no sensitive financial data, this was an acceptable simplification.

**Real-time — Socket.IO over SSE/polling**
Socket.IO provides bidirectional events for new campus events, resource uploads, and expense notifications. Server-Sent Events would have been simpler for one-way updates, but Socket.IO's room support makes it easy to scope notifications per user. Upstash Redis (REST-based, not TCP) is used as the pub/sub adapter so the WebSocket layer can scale across multiple backend instances without shared memory.

**Canvas Integration — ICS Feed over Canvas API**
The Canvas REST API requires OAuth and institutional approval. The ICS calendar feed is publicly accessible to any student with their personal feed URL (no OAuth needed). The backend fetches and parses the `.ics` file, extracts `VEVENT` blocks with `DUE` or `DTSTART` fields, and upserts assignments by title+due_date to avoid duplicates. Trade-off: the feed only updates when the student re-imports, but it covers 100% of assignment deadlines without any API approval process.

### Security Considerations
- All routes except `/auth/*` require a valid JWT via the `authenticate` middleware
- Passwords are hashed with bcrypt (10 rounds) before storage
- Rate limiter set to 500 req/15min per IP to prevent abuse during demos
- Environment variables (API keys, DB credentials) are never committed — `.env.example` documents required keys

### Scalability Considerations
- Upstash Redis REST client works in serverless/edge environments without persistent TCP connections
- DB queries use parameterized statements throughout — no raw string interpolation
- The MCP tool layer is decoupled from the AI controller, so tools can be swapped or extended independently

---

## 3. Kiro Usage

### Vibe Coding — Iterative Widget Development
The entire dashboard was built through conversational iteration with Kiro. Each widget started as a rough description ("I want a widget that shows my expenses with a category breakdown and a budget bar") and Kiro generated the full component — TypeScript interfaces, API calls, form state, error handling, and Tailwind styling — in one shot. The most productive pattern was describing the *behavior* rather than the implementation: "when the user adds an expense, optimistically update the list and show a toast, then reload from the server." Kiro consistently produced working code on the first attempt for UI components, with the main iteration cycles happening around backend route edge cases.

The best code generation moment was the Canvas ICS import feature. A single prompt — "parse a Canvas `.ics` feed URL, extract assignment titles and due dates, upsert to the DB skipping duplicates, handle webcal:// redirects" — produced the complete `import-ics` route including the ICS parser, redirect-following HTTP client, and duplicate detection logic. What would have taken 2–3 hours of reading RFC 5545 took about 10 minutes.

### Agent Hooks — Automated Workflows
Hooks were used to automate repetitive validation steps during development:
- A `fileEdited` hook on `*.ts` and `*.tsx` files triggered `npm run lint` automatically, catching TypeScript errors before manual testing
- A `postTaskExecution` hook ran the backend health check (`curl localhost:3001/api/health`) after each spec task completed, confirming the server was still running
- A `userTriggered` hook provided a one-click "restart backend" command during active development sessions

The lint hook alone saved significant back-and-forth — instead of discovering type errors at runtime, they surfaced immediately after saving a file.

### Spec-Driven Development — Structure for Complex Features
The Assignment Tracker and Expense Tracker were built spec-first. Writing the requirements doc forced clarity on edge cases upfront: what happens when a Canvas ICS URL returns a redirect? What if the same assignment is imported twice? How does the burnout score consume assignment data?

Compared to pure vibe coding, spec-driven development was slower to start but produced cleaner implementations with fewer regressions. The design doc's data model section (table schema, foreign keys, indexes) translated almost directly into the `db/init.ts` migration. The tasks list made it easy to hand off mid-feature and resume without losing context.

### Steering Docs — Consistent Patterns Across the Codebase
A steering doc was created early defining the project's conventions:
- All API routes use `authenticate` middleware and return `{ error: string }` on failure
- All frontend components use `react-hot-toast` for user feedback
- Weather data flows from `WeatherWidget` → `dashboard/page.tsx` state → child components via props
- Groq is the AI provider; never import `openai` directly, always use the `getAI()` factory

This meant that when asking Kiro to add a new widget or route, it automatically followed the established patterns without needing to re-explain them in every prompt. The most impactful steering rule was the error handling convention — every route returns a consistent `{ error }` shape, which the frontend `api.ts` interceptor handles uniformly.

### MCP — Extending Kiro with Live Data
Two MCP tools were built to give the AI assistant real-world context it couldn't have from training data alone:

`weather.tool.ts` — fetches live conditions from wttr.in for Fairfax, VA and returns a structured object including `is_outdoor_friendly`. This flag is injected into every AI chat system prompt, so the assistant can say "it's raining today, you might want to skip the outdoor event" without the user having to mention the weather.

`mason360.tool.ts` — fetches GMU's public RSS event feed and returns structured event objects. The AI assistant receives the top 5 upcoming events as context, enabling recommendations like "there's a career fair in Johnson Center tomorrow that fits your CS major."

Without MCP, the AI would have been a generic chatbot with no awareness of the student's actual campus environment. With it, responses are grounded in real-time local data — which is the core value proposition of the app.

---

## 4. Learning Journey & Forward Thinking

### Biggest Challenges

**AI Provider Switching Mid-Build**
The most disruptive challenge was OpenAI's free tier quota running out halfway through development. Every AI-dependent feature (chat, planner, wellbeing analysis) broke simultaneously. The fix — switching to Groq's OpenAI-compatible API — took about 20 minutes once the decision was made, but it highlighted the importance of abstracting the AI client behind a factory function (`getAI()`) rather than importing the SDK directly everywhere. That abstraction made the swap a two-line change.

**PowerShell String Escaping**
Writing multi-line TypeScript files via PowerShell commands caused repeated corruption of the `ExpensesWidget` — dollar signs in JSX (`$`) were being interpreted as PowerShell variables and stripped. The fix was writing file content via a Node.js script (`node -e "require('fs').writeFileSync(...)"`) which bypassed the shell entirely. Lesson: for any file with special characters, avoid shell-level string interpolation.

**Rate Limiting During Development**
The rate limiter (initially 100 req/15min) was blocking rapid API calls during widget testing — especially the dashboard overview which fires 6+ parallel requests on mount. Raising it to 500 req/15min for development resolved this. In production, per-user rate limiting with Redis would be the right approach.

**Canvas ICS Parsing**
The ICS format has several edge cases: `webcal://` URLs (not `https://`), timezone-prefixed date fields (`TZID=America/New_York:20260315T235900`), multi-line folded values, and backslash-escaped commas in summaries. The parser handles all of these, but getting there required reading several real Canvas ICS exports to understand the actual format vs. the RFC spec.

### What I'd Do Differently
- Start with a steering doc on day one — the patterns that emerged organically (toast notifications, error shapes, auth middleware) should have been documented before the first widget was built
- Use spec-driven development for every feature, not just the complex ones — even simple widgets benefit from a 5-minute requirements doc that clarifies the happy path and error states
- Abstract the AI provider from the start — the `getAI()` factory pattern should have been the first thing written, not a refactor forced by a quota issue
- Use environment-specific rate limits — a `NODE_ENV=development` check to skip rate limiting locally would have saved several debugging sessions

### Skills Gained
- Practical experience with ICS/iCalendar parsing (RFC 5545)
- Groq API integration and prompt engineering for student context
- Socket.IO with Redis pub/sub for multi-instance real-time events
- Upstash Redis REST client (vs. standard TCP redis — important for serverless environments)
- MCP tool development for injecting live external data into AI context

### Future Enhancements
- **Real Canvas API integration** — OAuth flow to pull assignments, grades, and announcements directly, eliminating the manual ICS import step
- **Mobile app** — React Native wrapper around the same backend; the API is already mobile-ready
- **Multi-university support** — parameterize the Mason360 MCP tool to support any university's public event RSS feed
- **Peer study groups** — match students with similar course loads and burnout scores for collaborative study sessions
- **Smart notifications** — push notifications for assignments due in 24h, budget threshold alerts, and weather-based event reminders
- **Grade tracking** — integrate with Canvas grades API to correlate study hours with academic performance in the Wellbeing widget

---

## Technical Reference

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local, with database `studentlife`)
- Upstash Redis account (free tier)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Environment Setup

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/studentlife
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-groq-key
AI_MODEL=llama-3.1-8b-instant
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Running Locally

```bash
# Install all dependencies
npm install

# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 3000)
cd frontend && npm run dev
```

The backend auto-creates all tables and seeds sample data on first run via `db/init.ts`.

### API Overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/events` | List campus events |
| POST | `/api/events/:id/rsvp` | Toggle RSVP |
| GET | `/api/assignments` | List assignments |
| POST | `/api/assignments` | Add assignment manually |
| POST | `/api/assignments/import-ics` | Import from Canvas ICS URL |
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Add expense |
| GET | `/api/wellbeing/burnout` | Get burnout score |
| POST | `/api/wellbeing/study-session` | Log study session |
| POST | `/api/ai/chat` | AI assistant chat |
| POST | `/api/planner/generate` | Generate AI weekly/monthly plan |
| GET | `/api/mcp/weather` | Live weather (wttr.in) |
| GET | `/api/mcp/mason360` | GMU campus events (RSS) |

### Project Structure

```
studentlife-ai/
├── backend/src/
│   ├── controllers/     # ai, event controllers
│   ├── routes/          # one file per feature
│   ├── middleware/       # auth, rate limiter, error handler
│   ├── mcp/             # weather + mason360 tools
│   ├── db/              # connection + init/migrations
│   ├── socket/          # Socket.IO handlers
│   └── cache/           # Upstash Redis client
├── frontend/src/
│   ├── app/             # Next.js 14 app router pages
│   ├── components/dashboard/  # 8 feature widgets
│   ├── lib/             # api client, socket context
│   └── store/           # Zustand auth store
└── shared/              # TypeScript types shared across packages
```
