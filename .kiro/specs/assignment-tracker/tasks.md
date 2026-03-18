# Assignment Tracker — Tasks

## Implementation Tasks

- [x] 1. Add `assignments` table to `backend/src/db/init.ts`
  - UUID primary key, user_id FK, title, description, due_date, priority, status, estimated_hours, completed_at
  - Add index on `(user_id, due_date)`

- [x] 2. Create `backend/src/routes/assignments.routes.ts`
  - GET `/` — fetch all assignments for authenticated user
  - POST `/` — create assignment with validation (title + due_date required)
  - PATCH `/:id` — update status, set completed_at when status = 'completed'
  - DELETE `/:id` — delete by id scoped to user
  - POST `/import-ics` — fetch ICS URL, parse VEVENT blocks, upsert with duplicate check

- [x] 3. Register assignments routes in `backend/src/routes/index.ts`
  - `router.use('/assignments', assignmentRoutes)`

- [x] 4. Create `frontend/src/components/dashboard/AssignmentsWidget.tsx`
  - Manual add form (title, due_date, priority, estimated_hours, description)
  - Canvas ICS import panel with URL input and instructions
  - Assignment list with filter tabs (Upcoming / All / Done)
  - Per-row: checkbox toggle, priority badge, days-until indicator, delete button
  - Overdue / due-soon / due-today visual states

- [x] 5. Add Assignments tab to `frontend/src/app/dashboard/page.tsx`
  - Import `AssignmentsWidget`
  - Add `{ id: 'assignments', label: 'Assignments', icon: '📝' }` to tabs array
  - Render `<AssignmentsWidget />` for `activeTab === 'assignments'`

- [x] 6. Wire assignment count into AI context
  - `ai.controller.ts` already queries `assignments` table for `assignmentCount`
  - Verify it appears in the system prompt context block
