# API Endpoints

## Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user profile

## Events
- `GET /api/events` - List events (with filters)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (organizers only)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/rsvp` - RSVP to event
- `DELETE /api/events/:id/rsvp` - Cancel RSVP
- `GET /api/events/recommendations` - Get personalized recommendations

## Resources
- `GET /api/resources` - List resources (filter by course)
- `GET /api/resources/:id` - Get resource details
- `POST /api/resources` - Upload new resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `POST /api/resources/:id/rate` - Rate resource
- `GET /api/resources/:id/download` - Download resource

## Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/enrollments` - Enroll in course
- `GET /api/enrollments/my` - Get user's enrollments

## Wellbeing
- `POST /api/study-sessions` - Log study session
- `GET /api/study-sessions` - Get study history
- `POST /api/assignments` - Create assignment
- `GET /api/assignments` - List assignments
- `PUT /api/assignments/:id` - Update assignment
- `GET /api/wellbeing/analysis` - Get burnout analysis

## Expenses
- `POST /api/expenses` - Log expense
- `GET /api/expenses` - List expenses (with date range)
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get spending summary
- `POST /api/budgets` - Create/update budget
- `GET /api/budgets` - Get budget plans
- `GET /api/expenses/predictions` - Get spending predictions

## AI Assistant
- `POST /api/ai/chat` - Send message to AI assistant
- `GET /api/ai/history` - Get chat history

## Notifications
- `GET /api/notifications` - List notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## WebSocket Events

### Client → Server
- `authenticate` - Authenticate WebSocket connection
- `join_room` - Join specific room (course, event)
- `leave_room` - Leave room

### Server → Client
- `event:new` - New event created
- `event:updated` - Event updated
- `resource:new` - New resource uploaded
- `expense:new` - New expense logged
- `wellbeing:update` - Burnout indicator updated
- `notification:new` - New notification
- `ai:response` - AI assistant response chunk (streaming)
