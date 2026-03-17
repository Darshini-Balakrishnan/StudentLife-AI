# StudentLife AI - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  Next.js App (AWS Amplify) + Socket.io Client               │
│  - Event Discovery  - Resource Exchange                      │
│  - Wellbeing Tracker - Expense Optimizer                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTPS/WSS
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│  AWS API Gateway / Application Load Balancer                │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│  REST API      │  │  WebSocket      │
│  (Express)     │  │  (Socket.io)    │
│  EC2/Lambda    │  │  EC2            │
└───────┬────────┘  └──────┬──────────┘
        │                   │
        └─────────┬─────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  - Event Service      - Resource Service                     │
│  - Wellbeing Service  - Expense Service                      │
│  - AI Assistant Service (OpenAI/Claude)                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│  PostgreSQL    │  │  Redis Cache    │
│  (RDS)         │  │  (ElastiCache)  │
└────────────────┘  └─────────────────┘
        │
┌───────▼────────┐
│  Amazon S3     │
│  (File Storage)│
└────────────────┘
```

## Real-Time Data Flow

```
User Action → Backend API → Database Update → 
Socket.io Broadcast → Connected Clients → UI Update
```

## AWS Deployment Architecture

- **Frontend**: AWS Amplify (CDN + Hosting)
- **API**: EC2 (t3.medium) with Auto Scaling
- **WebSocket**: EC2 with sticky sessions
- **Database**: RDS PostgreSQL (Multi-AZ)
- **Cache**: ElastiCache Redis
- **Storage**: S3 for uploaded files
- **Auth**: Cognito User Pools
- **Monitoring**: CloudWatch + X-Ray

## Security

- JWT tokens via Cognito
- API rate limiting
- SQL injection prevention (parameterized queries)
- XSS protection
- CORS configuration
- Encrypted data at rest (RDS encryption)
