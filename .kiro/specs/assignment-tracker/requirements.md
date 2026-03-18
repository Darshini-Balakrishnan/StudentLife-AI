# Assignment Tracker — Requirements

## Overview
Students need to track assignment deadlines across multiple Canvas courses. The current workflow requires logging into Canvas separately and manually checking due dates. This feature centralizes deadline tracking inside StudentLife AI with both manual entry and automatic Canvas import.

## Users
GMU students enrolled in 1–6 courses per semester, using Canvas as their LMS.

## Requirements

### REQ-1: Manual Assignment Entry
- User can add an assignment with: title (required), due date/time (required), priority (high/medium/low), estimated hours, course/notes
- Assignment is saved to the `assignments` table scoped to the authenticated user
- Form validates that title and due_date are present before submitting
- On success: toast confirmation, form resets, list refreshes

### REQ-2: Canvas ICS Import
- User pastes their Canvas calendar feed URL (webcal:// or https://)
- Backend fetches the ICS file, parses all VEVENT blocks
- Only future assignments are imported (past due dates are skipped)
- Duplicate detection: skip if same title + due_date already exists for this user
- Response includes `{ imported, skipped, total }` counts
- User sees a clear instruction on where to find the Canvas feed URL

### REQ-3: Assignment List Display
- Default view shows "Upcoming" (non-completed) assignments sorted by due date ASC
- Filter tabs: Upcoming | All | Done
- Each row shows: title, priority badge, due date, days-until indicator, estimated hours
- Overdue items show "⚠️ Overdue by Xd" in red
- Due within 3 days shows orange warning
- Due today shows "🔥 Due today"

### REQ-4: Complete / Delete
- Checkbox toggles status between `pending` and `completed`
- Completed items show strikethrough and reduced opacity
- Delete button removes the assignment permanently
- Both actions update optimistically in the UI

### REQ-5: Burnout Feed
- The `assignments` table is queried by the Wellbeing widget to count upcoming deadlines
- High pending assignment count increases the burnout score
- Assignment data is also injected into AI assistant context (count only, not titles)

## Out of Scope
- Editing an existing assignment (add + delete covers the use case)
- Grade tracking
- Canvas OAuth (ICS feed URL is sufficient without institutional approval)
