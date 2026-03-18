# Expense Tracker — Tasks

## Implementation Tasks

- [x] 1. Verify `expenses` table exists in `backend/src/db/init.ts`
  - Columns: id, user_id, amount (DECIMAL), category, description, transaction_date, created_at

- [x] 2. Create `backend/src/routes/expense.routes.ts`
  - GET `/` — list expenses for current month, newest first
  - GET `/by_category` — return `{ [category]: total }` for current month
  - POST `/` — add expense, broadcast `expense:new` via Socket.IO
  - DELETE `/:id` — delete expense scoped to user

- [x] 3. Create `frontend/src/components/dashboard/ExpensesWidget.tsx`
  - Add expense form: amount, category select, description, date
  - Expense list with delete per row
  - Category breakdown as colored progress bars
  - Monthly budget bar (spent / $500 default)
  - `full` prop for full-page vs compact overview mode

- [x] 4. Add Expenses tab to dashboard
  - `{ id: 'expenses', label: 'Expenses', icon: '💰' }` in tabs
  - `<ExpensesWidget full />` for full tab, `<ExpensesWidget />` in overview grid

- [x] 5. Wire monthly spending into AI context
  - Query in `ai.controller.ts` `getUserContext()`:
    ```sql
    SELECT COALESCE(SUM(amount), 0) FROM expenses
    WHERE user_id = $1 AND transaction_date >= date_trunc('month', CURRENT_DATE)
    ```
