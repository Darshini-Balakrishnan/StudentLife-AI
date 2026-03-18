---
inclusion: always
---

# AI Prompting Guidelines

## System Prompt Structure
Every AI call must inject this user context block:
- Major / enrolled courses (from `enrollments` + `courses` tables)
- Upcoming assignment count (non-completed, future due dates)
- Study hours in last 7 days (from `study_sessions`)
- Monthly spending so far (from `expenses`)
- Live weather (from MCP `getWeather`)
- Top 5 Mason360 events (from MCP `getMason360Events`)

## Response Constraints
- Keep responses under 200 words unless the user explicitly asks for detail
- For planner generation, 400 tokens max
- Temperature: 0.7 for chat, 0.5 for structured plan generation
- Model: always use `process.env.AI_MODEL` — never hardcode the model string

## Chat History
- Load last 10 messages from `chat_messages` table (DESC), reverse before sending
- Persist both user and assistant turns after every exchange
- Store `context_data` JSON on assistant messages for debugging

## Planner Prompts
When generating weekly/monthly plans:
- Include the student's class schedule timetable if uploaded
- Reference RSVPed events by name so the plan works around them
- Output structured markdown with time blocks, not prose paragraphs
- Distinguish between "study blocks" and "event slots" visually
