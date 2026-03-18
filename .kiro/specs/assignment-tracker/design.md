# Assignment Tracker — Design

## Database Schema

Uses the existing `assignments` table created in `backend/src/db/init.ts`:

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  estimated_hours DECIMAL(4,1),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/assignments` | List user's assignments, ordered by due_date ASC |
| POST | `/api/assignments` | Create assignment manually |
| PATCH | `/api/assignments/:id` | Update status (pending/completed) |
| DELETE | `/api/assignments/:id` | Delete assignment |
| POST | `/api/assignments/import-ics` | Fetch + parse Canvas ICS feed URL |

## ICS Parser Design

The `import-ics` endpoint:
1. Fetches the URL using Node's `https`/`http` module (follows redirects for `webcal://`)
2. Splits the ICS text on `BEGIN:VEVENT`
3. For each block, extracts `SUMMARY`, `DUE` (or `DTSTART`), `DESCRIPTION`
4. Parses ICS date format: `20260315T235900Z` or `20260315` (date-only)
5. Strips `TZID=...` prefix from datetime fields
6. Skips events with `due_date < now()` (past assignments)
7. Upserts with duplicate check on `(user_id, title, due_date)`

## Frontend Component

`AssignmentsWidget.tsx` manages all state locally:
- `assignments[]` — full list from API
- `filter` — 'pending' | 'all' | 'completed'
- `showForm` / `showImport` — toggle add form vs ICS import panel
- `saving` / `importing` — loading states for buttons

Derived values computed inline (no extra state):
- `pending` — assignments where status !== 'completed'
- `overdue` — pending where daysUntil < 0
- `dueSoon` — pending where daysUntil in [0, 3]

## Burnout Integration

`WellbeingWidget` calls `GET /api/wellbeing/burnout` which queries:
```sql
SELECT COUNT(*) FROM assignments
WHERE user_id = $1 AND status != 'completed' AND due_date > NOW()
```
Each pending assignment adds to the burnout score. The AI assistant receives `assignmentCount` in its system prompt context.
