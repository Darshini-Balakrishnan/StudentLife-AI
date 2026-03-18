---
inclusion: manual
---

# Database Schema Reference

All tables are created in `backend/src/db/init.ts` using `CREATE TABLE IF NOT EXISTS`.
To add columns to existing tables, use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` after the CREATE block.

## Core Tables

### users
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
email VARCHAR(255) UNIQUE NOT NULL
cognito_id VARCHAR(255)          -- stores bcrypt password hash (legacy name, do not rename)
full_name VARCHAR(255)
major VARCHAR(255)
year_of_study INTEGER
monthly_budget DECIMAL(10,2) DEFAULT 500
created_at TIMESTAMPTZ DEFAULT NOW()
```

### courses
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
course_code VARCHAR(20) NOT NULL   -- e.g. CS 471
course_name VARCHAR(255) NOT NULL
instructor VARCHAR(255)
credits INTEGER DEFAULT 3
semester VARCHAR(20)
```

### enrollments
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
course_id UUID REFERENCES courses(id) ON DELETE CASCADE
enrolled_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, course_id)
```

## Feature Tables

### assignments
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
title VARCHAR(500) NOT NULL
description TEXT
due_date TIMESTAMPTZ NOT NULL
priority VARCHAR(10) DEFAULT 'medium'   -- low | medium | high
status VARCHAR(20) DEFAULT 'pending'    -- pending | in_progress | completed
estimated_hours DECIMAL(4,1)
completed_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### expenses
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
amount DECIMAL(10,2) NOT NULL
category VARCHAR(50) NOT NULL    -- Food | Transport | Books | Entertainment | Health | Housing | Other
description VARCHAR(500)
transaction_date DATE DEFAULT CURRENT_DATE
created_at TIMESTAMPTZ DEFAULT NOW()
```

### study_sessions
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
duration_minutes INTEGER NOT NULL
subject VARCHAR(255)
notes TEXT
start_time TIMESTAMPTZ DEFAULT NOW()
```

### events
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
title VARCHAR(255) NOT NULL
description TEXT
location VARCHAR(255)
event_date TIMESTAMPTZ
category VARCHAR(100)
is_outdoor BOOLEAN DEFAULT false
source VARCHAR(50) DEFAULT 'manual'
created_at TIMESTAMPTZ DEFAULT NOW()
```

### event_rsvps
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
event_id UUID REFERENCES events(id) ON DELETE CASCADE
status VARCHAR(20) DEFAULT 'going'
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, event_id)
```

### resources
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
title VARCHAR(255) NOT NULL
description TEXT
url VARCHAR(1000)
category VARCHAR(100)
course_id UUID REFERENCES courses(id)
created_at TIMESTAMPTZ DEFAULT NOW()
```

### chat_messages
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
role VARCHAR(20) NOT NULL    -- user | assistant
content TEXT NOT NULL
context_data JSONB           -- stores user context snapshot for debugging
created_at TIMESTAMPTZ DEFAULT NOW()
```

### notifications
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
message TEXT NOT NULL
type VARCHAR(50)
read BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT NOW()
```

### class_schedules
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES users(id) ON DELETE CASCADE
schedule_text TEXT            -- raw timetable pasted by user
parsed_data JSONB             -- structured schedule extracted by AI
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
```
