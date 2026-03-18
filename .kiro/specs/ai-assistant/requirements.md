# AI Assistant — Requirements

## Overview
A context-aware chat assistant that knows the student's full situation — courses, assignments, spending, study hours, live weather, and upcoming campus events — and can give personalized, actionable advice without the student needing to explain their context every time.

## Users
GMU students who want quick answers to questions like:
- "What should I focus on studying this week?"
- "Are there any good events on campus today?"
- "Am I spending too much this month?"
- "I feel burnt out — what should I do?"

## Requirements

### REQ-1: Context-Aware Chat
- Every message includes a system prompt with: major, enrolled courses, assignment count, study hours (7d), monthly spending, live weather, top 5 Mason360 events
- AI provider: Groq (`llama-3.1-8b-instant`) via OpenAI-compatible SDK
- Responses capped at 200 words for conversational messages

### REQ-2: Chat History
- Last 10 messages loaded from `chat_messages` table on mount
- Both user and assistant turns persisted after every exchange
- History displayed in a scrollable chat bubble UI

### REQ-3: MCP Context Injection
- `getWeather('Fairfax,VA,US')` called on every message (non-blocking via `Promise.allSettled`)
- `getMason360Events()` called on every message, top 5 injected into system prompt
- If either MCP call fails, chat continues without that context (graceful degradation)

### REQ-4: Error Handling
- 401 from Groq → "API key is invalid" message to user
- 429 from Groq → "Rate limit hit, wait a moment" message
- Missing API key → "Get a free key at console.groq.com" message

### REQ-5: Planner Generation (separate from chat)
- `POST /api/planner/generate` accepts: schedule timetable, RSVPed event IDs, plan type (weekly/monthly)
- Returns structured markdown with time blocks
- Rendered in `PlannerWidget` with a copy button

## Out of Scope
- Voice input
- Image uploads to AI
- Streaming responses (full response returned at once)
- Fine-tuning or custom model training
