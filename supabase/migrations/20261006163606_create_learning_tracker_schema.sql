/*
# Personal Learning Tracker - Core Schema

## Summary
Creates the full database schema for a single-user Personal Learning Tracker app.
No authentication is required — a default seeded user scopes all data so auth can
be added later. All tables use UUID primary keys with gen_random_uuid() defaults.

## New Tables
1. **users** — the single default user (id, name, email, timestamps)
2. **courses** — learning courses owned by a user (title, description, color, icon, status, target_hours)
3. **topics** — topics within a course (title, description, status, confidence_level 1-5, next_review_date)
4. **study_sessions** — logged study time per topic (session_date, duration_minutes, summary, confidence before/after)
5. **notes** — notes attached to a topic and optionally a session (title, content)
6. **quiz_scores** — quiz results per topic (score, total_questions, quiz_date, notes)

## Security (RLS)
- RLS enabled on every table.
- This is a single-tenant app with no sign-in screen, so all policies use
  `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
  the data is intentionally shared/public for the single user.
- A `user_id` column is kept on `courses` (and courses cascade to all children)
  so row-level ownership can be enforced later when auth is added.

## Indexes
- courses(user_id)
- topics(course_id), topics(status), topics(next_review_date)
- study_sessions(topic_id), study_sessions(session_date)
- notes(topic_id), notes(session_id)
- quiz_scores(topic_id), quiz_scores(quiz_date)

## Notes
- Cascading deletes: deleting a course removes its topics, which removes
  sessions, notes, and quiz scores for those topics.
- Confidence levels are CHECK-constrained to 1-5.
- Course status is CHECK-constrained to Active, Paused, Completed.
- Topic status is CHECK-constrained to NotStarted, Learning, Reviewing, Mastered.
*/

-- ============================================================
-- users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_users" ON users;
CREATE POLICY "anon_read_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- courses
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  color text NOT NULL DEFAULT 'blue',
  icon text NOT NULL DEFAULT 'BookOpen',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Paused','Completed')),
  target_hours integer NOT NULL DEFAULT 0 CHECK (target_hours >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_courses" ON courses;
CREATE POLICY "anon_read_courses" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);

-- ============================================================
-- topics
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'NotStarted' CHECK (status IN ('NotStarted','Learning','Reviewing','Mastered')),
  confidence_level integer NOT NULL DEFAULT 1 CHECK (confidence_level >= 1 AND confidence_level <= 5),
  next_review_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_topics" ON topics;
CREATE POLICY "anon_read_topics" ON topics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_topics" ON topics;
CREATE POLICY "anon_insert_topics" ON topics FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_topics" ON topics;
CREATE POLICY "anon_update_topics" ON topics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_topics" ON topics;
CREATE POLICY "anon_delete_topics" ON topics FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_next_review ON topics(next_review_date);

-- ============================================================
-- study_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  summary text DEFAULT '',
  confidence_before integer DEFAULT 1 CHECK (confidence_before >= 1 AND confidence_before <= 5),
  confidence_after integer DEFAULT 1 CHECK (confidence_after >= 1 AND confidence_after <= 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_sessions" ON study_sessions;
CREATE POLICY "anon_read_sessions" ON study_sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sessions" ON study_sessions;
CREATE POLICY "anon_insert_sessions" ON study_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sessions" ON study_sessions;
CREATE POLICY "anon_update_sessions" ON study_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sessions" ON study_sessions;
CREATE POLICY "anon_delete_sessions" ON study_sessions FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_sessions_topic_id ON study_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(session_date);

-- ============================================================
-- notes
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  session_id uuid REFERENCES study_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_notes" ON notes;
CREATE POLICY "anon_read_notes" ON notes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notes" ON notes;
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notes" ON notes;
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notes" ON notes;
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_notes_topic_id ON notes(topic_id);
CREATE INDEX IF NOT EXISTS idx_notes_session_id ON notes(session_id);

-- ============================================================
-- quiz_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  total_questions integer NOT NULL DEFAULT 1 CHECK (total_questions >= 1),
  quiz_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_quizzes" ON quiz_scores;
CREATE POLICY "anon_read_quizzes" ON quiz_scores FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_quizzes" ON quiz_scores;
CREATE POLICY "anon_insert_quizzes" ON quiz_scores FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_quizzes" ON quiz_scores;
CREATE POLICY "anon_update_quizzes" ON quiz_scores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_quizzes" ON quiz_scores;
CREATE POLICY "anon_delete_quizzes" ON quiz_scores FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic_id ON quiz_scores(topic_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_date ON quiz_scores(quiz_date);

-- ============================================================
-- updated_at trigger function (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_topics_updated_at ON topics;
CREATE TRIGGER trg_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notes_updated_at ON notes;
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
