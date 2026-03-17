import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function run() {
  const client = await pool.connect();
  console.log('✅ Connected to database');

  try {
    await client.query('BEGIN');

    // ── Schema ──────────────────────────────────────────────────────────────
    console.log('📝 Creating tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cognito_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        major VARCHAR(100),
        year INTEGER CHECK (year BETWEEN 1 AND 4),
        interests TEXT[],
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_code VARCHAR(20) UNIQUE NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        credits INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        semester VARCHAR(20),
        year INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id, semester, year)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50),
        location VARCHAR(255),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        organizer_id UUID REFERENCES users(id),
        max_attendees INTEGER,
        tags TEXT[],
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rsvps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'attending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        uploader_id UUID REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        resource_type VARCHAR(50),
        file_url TEXT NOT NULL,
        file_size BIGINT,
        ai_summary TEXT,
        rating_avg DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS resource_ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        review TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resource_id, user_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_minutes INTEGER,
        intensity VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP NOT NULL,
        estimated_hours DECIMAL(4,1),
        priority VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(50),
        description TEXT,
        transaction_date TIMESTAMP NOT NULL,
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        month INTEGER CHECK (month BETWEEN 1 AND 12),
        year INTEGER,
        category VARCHAR(50),
        planned_amount DECIMAL(10,2) NOT NULL,
        spent_amount DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, month, year, category)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20),
        content TEXT NOT NULL,
        context_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS class_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_name VARCHAR(255) NOT NULL,
        course_code VARCHAR(50),
        days TEXT[],
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        location VARCHAR(255),
        instructor VARCHAR(255),
        semester VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS planner_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan_type VARCHAR(20) DEFAULT 'weekly',
        content TEXT NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── Indexes ──────────────────────────────────────────────────────────────
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, transaction_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);`);

    // ── updated_at trigger ───────────────────────────────────────────────────
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END;
      $$ language 'plpgsql';
    `);

    for (const tbl of ['users', 'events', 'resources', 'assignments', 'budgets']) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${tbl}_updated_at ON ${tbl};
        CREATE TRIGGER update_${tbl}_updated_at
          BEFORE UPDATE ON ${tbl}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    console.log('✅ Tables created');

    // ── Seed courses ─────────────────────────────────────────────────────────
    console.log('🌱 Seeding courses...');
    await client.query(`
      INSERT INTO courses (course_code, course_name, department, credits) VALUES
        ('CS101', 'Introduction to Computer Science', 'Computer Science', 3),
        ('CS201', 'Data Structures & Algorithms', 'Computer Science', 3),
        ('MATH101', 'Calculus I', 'Mathematics', 4),
        ('ENG101', 'English Composition', 'English', 3),
        ('BUS101', 'Introduction to Business', 'Business', 3)
      ON CONFLICT (course_code) DO NOTHING;
    `);

    // ── Seed events ──────────────────────────────────────────────────────────
    console.log('🌱 Seeding events...');
    await client.query(`
      INSERT INTO events (title, description, event_type, location, start_time, end_time, max_attendees, tags) VALUES
        (
          'AI & Machine Learning Workshop',
          'Hands-on workshop covering the basics of machine learning with Python. Perfect for beginners!',
          'workshop',
          'Tech Building, Room 201',
          NOW() + INTERVAL '2 days',
          NOW() + INTERVAL '2 days' + INTERVAL '3 hours',
          50,
          ARRAY['AI', 'machine learning', 'python', 'tech']
        ),
        (
          'Campus Career Fair 2026',
          'Meet top employers from tech, finance, and healthcare. Bring your resume!',
          'academic',
          'Student Union Hall',
          NOW() + INTERVAL '5 days',
          NOW() + INTERVAL '5 days' + INTERVAL '6 hours',
          500,
          ARRAY['career', 'jobs', 'networking', 'internship']
        ),
        (
          'Study Group: Data Structures',
          'Weekly study group for CS201. We cover trees, graphs, and dynamic programming.',
          'academic',
          'Library, Study Room 3',
          NOW() + INTERVAL '1 day',
          NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
          15,
          ARRAY['CS201', 'study', 'algorithms']
        ),
        (
          'Campus Music Festival',
          'Annual outdoor music festival featuring student bands and local artists.',
          'social',
          'Campus Amphitheater',
          NOW() + INTERVAL '7 days',
          NOW() + INTERVAL '7 days' + INTERVAL '5 hours',
          300,
          ARRAY['music', 'social', 'fun', 'outdoor']
        ),
        (
          'Hackathon 2026',
          '24-hour hackathon. Build something amazing! Prizes worth $5000. Food provided.',
          'workshop',
          'Engineering Building',
          NOW() + INTERVAL '10 days',
          NOW() + INTERVAL '11 days',
          100,
          ARRAY['hackathon', 'coding', 'prizes', 'tech']
        ),
        (
          'Mental Health & Wellness Seminar',
          'Learn strategies to manage stress, avoid burnout, and maintain work-life balance.',
          'workshop',
          'Health Center Auditorium',
          NOW() + INTERVAL '3 days',
          NOW() + INTERVAL '3 days' + INTERVAL '2 hours',
          80,
          ARRAY['wellness', 'mental health', 'stress', 'burnout']
        )
      ON CONFLICT DO NOTHING;
    `);

    // ── Seed resources ───────────────────────────────────────────────────────
    console.log('🌱 Seeding resources...');
    await client.query(`
      INSERT INTO resources (course_id, title, description, resource_type, file_url, ai_summary)
      SELECT
        c.id,
        r.title,
        r.description,
        r.resource_type,
        r.file_url,
        r.ai_summary
      FROM (VALUES
        ('CS101', 'Intro to CS - Week 1 Notes', 'Covers variables, data types, and basic I/O', 'notes', 'https://example.com/cs101-week1.pdf', 'Introduction to programming concepts including variables, data types, and basic input/output operations in Python.'),
        ('CS201', 'Data Structures Cheat Sheet', 'Quick reference for arrays, linked lists, trees', 'guide', 'https://example.com/ds-cheatsheet.pdf', 'Comprehensive cheat sheet covering time complexity and implementation of major data structures.'),
        ('MATH101', 'Calculus I - Derivatives Guide', 'All derivative rules with examples', 'notes', 'https://example.com/calc-derivatives.pdf', 'Complete guide to differentiation rules including chain rule, product rule, and quotient rule with worked examples.'),
        ('CS101', 'Python Project - Todo App', 'Sample project demonstrating OOP concepts', 'project', 'https://example.com/todo-app.zip', 'A todo application built with Python demonstrating object-oriented programming, file I/O, and basic CLI design.'),
        ('BUS101', 'Business Models Slides', 'Lecture slides on business model canvas', 'slides', 'https://example.com/business-models.pdf', 'Overview of business model canvas framework with real-world examples from successful startups.')
      ) AS r(course_code, title, description, resource_type, file_url, ai_summary)
      JOIN courses c ON c.course_code = r.course_code
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Seed data inserted');
    console.log('🎉 Database setup complete! You can now register and use the app.');

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Setup failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
