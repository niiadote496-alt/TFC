/*
  # Family App Database Schema

  ## Overview
  This migration creates the complete database schema for The Faithful City family app.

  ## New Tables
  - families: Family groups
  - users: User profiles with quiz scores
  - posts: Family posts and announcements
  - post_likes: Post likes tracking
  - comments: Post comments
  - media: Photos and audio files
  - notifications: Family notifications
  - quiz_questions: Bible quiz questions
  - quiz_attempts: User quiz attempts tracking

  ## Security
  - RLS enabled on all tables
  - Users can only access their family's data
  - Admins have additional permissions
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  quiz_score integer DEFAULT 0,
  quiz_streak integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'discussion' CHECK (type IN ('announcement', 'discussion', 'prayer-request')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create media table
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('photo', 'audio')),
  title text NOT NULL,
  description text,
  url text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('announcement', 'media', 'general', 'quiz')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  question text NOT NULL,
  correct_answer text NOT NULL,
  options jsonb NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  bible_reference text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_answer text NOT NULL,
  is_correct boolean NOT NULL,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for families
CREATE POLICY "Anyone authenticated can view families"
  ON families FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for users
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view family members"
  ON users FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS Policies for posts
CREATE POLICY "Users can view family posts"
  ON posts FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create posts in their family"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    ) AND author_id = auth.uid()
  );

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for post_likes
CREATE POLICY "Users can view likes on family posts"
  ON post_likes FOR SELECT
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM posts WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can like family posts"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    post_id IN (
      SELECT id FROM posts WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for comments
CREATE POLICY "Users can view comments on family posts"
  ON comments FOR SELECT
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM posts WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on family posts"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    post_id IN (
      SELECT id FROM posts WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for media
CREATE POLICY "Users can view family media"
  ON media FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can upload media"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND family_id = media.family_id
    )
  );

CREATE POLICY "Admins can delete media"
  ON media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND family_id = media.family_id
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their family notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    ) AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND family_id = notifications.family_id
    )
  );

CREATE POLICY "Users can mark notifications as read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- RLS Policies for quiz_questions
CREATE POLICY "All authenticated users can view quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view family leaderboard"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create quiz attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_posts_family_id ON posts(family_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_media_family_id ON media(family_id);
CREATE INDEX IF NOT EXISTS idx_notifications_family_id ON notifications(family_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_family_id ON quiz_attempts(family_id);

-- Insert sample families
INSERT INTO families (name, description, member_count) VALUES
  ('Johnson Family', 'United in faith and love', 0),
  ('Smith Family', 'Growing together in Christ', 0),
  ('Williams Family', 'Faith, hope, and love', 0)
ON CONFLICT DO NOTHING;

-- Insert sample Bible quiz questions
INSERT INTO quiz_questions (question, correct_answer, options, difficulty, bible_reference) VALUES
  ('Who was the first man created by God?', 'Adam', '["Adam", "Moses", "Abraham", "Noah"]', 'easy', 'Genesis 2:7'),
  ('How many days did God take to create the world?', 'Six days', '["Five days", "Six days", "Seven days", "Eight days"]', 'easy', 'Genesis 1:31'),
  ('What is the first book of the Bible?', 'Genesis', '["Exodus", "Genesis", "Leviticus", "Numbers"]', 'easy', 'Genesis 1:1'),
  ('Who built the ark?', 'Noah', '["Moses", "Abraham", "Noah", "David"]', 'easy', 'Genesis 6:14'),
  ('How many apostles did Jesus have?', 'Twelve', '["Ten", "Eleven", "Twelve", "Thirteen"]', 'medium', 'Matthew 10:2-4'),
  ('What is the shortest verse in the Bible?', 'Jesus wept', '["God is love", "Jesus wept", "Rejoice always", "Pray continually"]', 'medium', 'John 11:35'),
  ('Who was swallowed by a great fish?', 'Jonah', '["Jonah", "Daniel", "Elijah", "Moses"]', 'medium', 'Jonah 1:17'),
  ('What is the last book of the Bible?', 'Revelation', '["Jude", "Revelation", "Acts", "Romans"]', 'easy', 'Revelation 1:1'),
  ('Who led the Israelites out of Egypt?', 'Moses', '["Moses", "Aaron", "Joshua", "Samuel"]', 'easy', 'Exodus 3:10'),
  ('How many plagues did God send on Egypt?', 'Ten', '["Seven", "Eight", "Nine", "Ten"]', 'medium', 'Exodus 7-12')
ON CONFLICT DO NOTHING;
