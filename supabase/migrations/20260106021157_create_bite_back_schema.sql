/*
  # Bite Back - Complete Database Schema

  1. Core Tables
    - users: Profile data, stats, preferences
    - receipts: Scanned receipts with nutritional metrics
    - line_items: Individual items from receipts
    - item_medians: Crowdsourced price aggregation by restaurant/city
    
  2. Social & Gamification
    - posts: Shared receipts on social feed
    - user_badges: User achievement tracking
    - badges: Badge definitions
    - item_tags: Crowdsourced ingredient/quality tags
    
  3. Security
    - Enable RLS on all tables
    - Policies for user data privacy
    - Public read access for leaderboards and maps
    - User-only write access for personal data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  dietary_preferences JSONB DEFAULT '{"vegan": false, "vegetarian": false, "keto": false, "allergies": []}'::JSONB,
  total_scans INT DEFAULT 0,
  best_value_score DECIMAL(10, 2) DEFAULT 0,
  leaderboard_rank INT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can read public user profiles"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  location_city TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  total_calories INT DEFAULT 0,
  calories_per_dollar DECIMAL(10, 2),
  value_score INT DEFAULT 0,
  image_url TEXT,
  raw_ocr_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read receipts for leaderboards"
  ON receipts FOR SELECT
  TO anon
  USING (true);

-- Create line_items table
CREATE TABLE IF NOT EXISTS line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT DEFAULT 1,
  calories INT,
  protein_g DECIMAL(10, 2),
  carbs_g DECIMAL(10, 2),
  fat_g DECIMAL(10, 2),
  nutrition_api_id TEXT,
  matched_confidence DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read line items of own receipts"
  ON line_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = line_items.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read line items"
  ON line_items FOR SELECT
  TO anon
  USING (true);

-- Create item_medians table (aggregated crowd data)
CREATE TABLE IF NOT EXISTS item_medians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  restaurant_name TEXT,
  restaurant_chain TEXT,
  city TEXT,
  median_price DECIMAL(10, 2),
  average_price DECIMAL(10, 2),
  median_calories INT,
  sample_count INT DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE item_medians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read item medians"
  ON item_medians FOR SELECT
  USING (true);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT,
  requirement_type TEXT,
  requirement_value INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges"
  ON badges FOR SELECT
  USING (true);

-- Create user_badges table (earned achievements)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read public badges"
  ON user_badges FOR SELECT
  TO anon
  USING (true);

-- Create posts table (social sharing)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
  caption TEXT,
  image_url TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own posts"
  ON posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read public posts"
  ON posts FOR SELECT
  TO anon
  USING (true);

-- Create item_tags table (crowdsourced quality tags)
CREATE TABLE IF NOT EXISTS item_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_item_id UUID NOT NULL REFERENCES line_items(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  up_votes INT DEFAULT 0,
  down_votes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tags"
  ON item_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON item_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_calories_per_dollar ON receipts(calories_per_dollar DESC);
CREATE INDEX IF NOT EXISTS idx_line_items_receipt_id ON line_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_item_medians_restaurant_city ON item_medians(restaurant_name, city);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Insert default badges
INSERT INTO badges (name, description, icon_url, category, requirement_type, requirement_value) VALUES
  ('First Bite', 'Complete your first scan', null, 'milestone', 'scans', 1),
  ('Value Wolf', 'Complete 10 scans', null, 'milestone', 'scans', 10),
  ('Deal Hunter', 'Find a meal with 150+ cals per dollar', null, 'achievement', 'value_score', 150),
  ('Consistency King', 'Scan 7 days in a row', null, 'achievement', 'consecutive_days', 7),
  ('Social Butterfly', 'Share 5 receipts', null, 'social', 'shares', 5),
  ('Leaderboard Legend', 'Reach top 100 in city leaderboard', null, 'competitive', 'rank', 100)
ON CONFLICT (name) DO NOTHING;