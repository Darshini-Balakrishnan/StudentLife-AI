# Expense Tracker — Requirements

## Overview
Students on tight budgets need a simple way to log spending, see where money is going by category, and know when they're approaching their monthly limit — all without leaving the StudentLife dashboard.

## Users
GMU students managing personal finances, typically on a fixed monthly budget (scholarships, part-time work, parental support).

## Requirements

### REQ-1: Add Expense
- Form fields: amount (required, positive number), category (required, dropdown), description (optional), date (defaults to today)
- Categories: Food, Transport, Books, Entertainment, Health, Housing, Other
- On submit: save to DB, refresh list and category breakdown, show toast
- Amount must be a positive number — reject zero or negative values

### REQ-2: Expense List
- Show all expenses for current month, newest first
- Each row: date, category badge, description, amount
- Delete button per row with confirmation via toast

### REQ-3: Category Breakdown
- Pie/bar breakdown of spending by category for current month
- Returned from `GET /api/expenses/by_category` as `{ [category]: total }` object
- Display as colored progress bars with percentage and dollar amount

### REQ-4: Monthly Budget Bar
- User has a `monthly_budget` field on their profile (default $500)
- Budget bar shows: spent / budget, color shifts red when over 80%
- Remaining amount shown below the bar

### REQ-5: Real-time Updates
- Socket.IO `expense:new` event broadcast to user's room on every new expense
- Frontend listens and refreshes the list without a full page reload

### REQ-6: AI Context
- Monthly spending total is injected into every AI system prompt
- AI can comment on spending patterns when asked ("you've spent $340 this month")

## Out of Scope
- Recurring expenses / subscriptions
- Bank account linking
- Multi-currency support
- Expense editing (delete + re-add covers the use case)
