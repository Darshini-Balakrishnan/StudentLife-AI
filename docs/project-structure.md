# Project Structure

```
studentlife-ai/
├── backend/                      # Node.js + Express backend
│   ├── src/
│   │   ├── server.ts            # Main server entry point
│   │   ├── db/
│   │   │   └── connection.ts    # PostgreSQL connection
│   │   ├── cache/
│   │   │   └── redis.ts         # Redis client
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   ├── rateLimiter.ts   # Rate limiting
│   │   │   └── errorHandler.ts  # Error handling
│   │   ├── socket/
│   │   │   └── handlers.ts      # WebSocket handlers
│   │   ├── controllers/
│   │   │   ├── event.controller.ts
│   │   │   └── ai.controller.ts
│   │   └── routes/
│   │       ├── index.ts
│   │       ├── auth.routes.ts
│   │       ├── event.routes.ts
│   │       ├── resource.routes.ts
│   │       ├── wellbeing.routes.ts
│   │       ├── expense.routes.ts
│   │       ├── ai.routes.ts
│   │       └── notification.routes.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Next.js 14 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout
│   │   │   ├── page.tsx         # Home page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # Main dashboard
│   │   │   ├── login/
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   └── dashboard/
│   │   │       ├── EventsWidget.tsx
│   │   │       ├── ResourcesWidget.tsx
│   │   │       ├── WellbeingWidget.tsx
│   │   │       ├── ExpensesWidget.tsx
│   │   │       └── AIAssistant.tsx
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios instance
│   │   │   └── socket.tsx       # Socket.io client
│   │   └── store/
│   │       └── authStore.ts     # Zustand auth store
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── docs/
│   ├── architecture.md          # System architecture
│   ├── database-schema.sql      # Database schema
│   ├── api-endpoints.md         # API documentation
│   ├── aws-deployment.md        # AWS deployment guide
│   └── project-structure.md     # This file
│
├── .env.example                 # Environment variables template
├── package.json                 # Root package.json
└── README.md                    # Project overview
```

## Key Technologies

### Backend
- **Express**: Web framework
- **Socket.io**: Real-time WebSocket communication
- **PostgreSQL**: Primary database
- **Redis**: Caching and session management
- **JWT**: Authentication
- **OpenAI**: AI assistant
- **AWS SDK**: S3 file uploads, Cognito integration

### Frontend
- **Next.js 14**: React framework with App Router
- **TailwindCSS**: Styling
- **Socket.io Client**: Real-time updates
- **Zustand**: State management
- **Axios**: HTTP client
- **React Hot Toast**: Notifications
- **date-fns**: Date formatting

### Infrastructure
- **AWS Amplify**: Frontend hosting
- **EC2**: Backend servers
- **RDS**: PostgreSQL database
- **ElastiCache**: Redis cache
- **S3**: File storage
- **Cognito**: User authentication
- **ALB**: Load balancing
- **CloudWatch**: Monitoring

## Real-Time Data Flow

1. User performs action (e.g., creates event)
2. Frontend sends HTTP POST to backend API
3. Backend saves to PostgreSQL
4. Backend emits Socket.io event to relevant rooms
5. Connected clients receive event instantly
6. Frontend updates UI without refresh

## Module Responsibilities

### Campus Event Discovery
- Event CRUD operations
- RSVP management
- Personalized recommendations
- Real-time event notifications

### Academic Resource Exchange
- Resource upload/download
- Course-based organization
- Rating system
- AI-generated summaries
- Real-time resource notifications

### Burnout Detection
- Study session tracking
- Assignment deadline monitoring
- Workload analysis
- AI-powered recommendations
- Real-time burnout indicators

### Expense Optimizer
- Expense logging
- Budget planning
- Category-based tracking
- Spending predictions
- Real-time expense updates
