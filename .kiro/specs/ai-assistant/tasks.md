# AI Assistant — Tasks

## Implementation Tasks

- [x] 1. Set up Groq client in `backend/src/controllers/ai.controller.ts`
  - Use `openai` SDK with `baseURL: 'https://api.groq.com/openai/v1'`
  - Lazy-initialize via `getAI()` factory — throw descriptive error if `GROQ_API_KEY` missing
  - Model from `process.env.AI_MODEL` (default: `llama-3.1-8b-instant`)

- [x] 2. Implement `getUserContext(userId)` helper
  - Parallel queries for: major, enrolled courses, assignment count, study hours (7d), monthly spending
  - Returns typed object injected into system prompt

- [x] 3. Implement `chat` handler
  - Fetch MCP weather + Mason360 in parallel via `Promise.allSettled`
  - Build system prompt with user context + MCP data
  - Load last 10 chat messages from DB, reverse for chronological order
  - Call Groq, persist both turns, return assistant message

- [x] 4. Implement `getChatHistory` handler
  - Return last 50 messages ASC for initial load

- [x] 5. Create `backend/src/routes/ai.routes.ts`
  - POST `/chat` → `chat` handler
  - GET `/history` → `getChatHistory` handler

- [x] 6. Create `frontend/src/components/dashboard/AIAssistant.tsx`
  - Load history on mount
  - Chat bubble UI (user right, assistant left)
  - Input form with send button + Enter key support
  - Loading spinner while waiting for response
  - Auto-scroll to latest message
  - Accepts `rsvpedEventIds` prop for planner context

- [x] 7. Create `backend/src/routes/planner.routes.ts`
  - POST `/generate` — build prompt from schedule + RSVPs, call Groq, return markdown plan
  - Temperature 0.5, max_tokens 400

- [x] 8. Add `.env` variables
  - `GROQ_API_KEY` — from console.groq.com
  - `AI_MODEL=llama-3.1-8b-instant`
