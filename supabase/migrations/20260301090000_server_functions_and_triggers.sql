/*
  Server-side functions and triggers for BiteBack
  - Auto-update user stats when receipts change
  - Auto-award badges based on activity
  - Leaderboard ranking function
  - Updated_at auto-trigger
*/

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Recalculate user stats from receipts (called after receipt insert/update/delete)
CREATE OR REPLACE FUNCTION recalculate_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  scan_count INT;
  best_score DECIMAL;
BEGIN
  -- Determine which user to update
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  -- Aggregate from receipts
  SELECT
    COUNT(*),
    COALESCE(MAX(calories_per_dollar), 0)
  INTO scan_count, best_score
  FROM receipts
  WHERE user_id = target_user_id
    AND total > 0;

  -- Update user row
  UPDATE users
  SET
    total_scans = scan_count,
    best_value_score = best_score
  WHERE id = target_user_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recalculate_stats_on_receipt_change
  AFTER INSERT OR UPDATE OR DELETE ON receipts
  FOR EACH ROW EXECUTE FUNCTION recalculate_user_stats();

-- Badge awarding function (checks all badge conditions for a user)
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  badge_rec RECORD;
  user_scans INT;
  user_best_score DECIMAL;
  user_shares INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  target_user_id := NEW.user_id;

  -- Get current stats
  SELECT total_scans, best_value_score
  INTO user_scans, user_best_score
  FROM users WHERE id = target_user_id;

  -- Get share count
  SELECT COUNT(*) INTO user_shares
  FROM posts WHERE user_id = target_user_id;

  -- Check each badge
  FOR badge_rec IN SELECT * FROM badges LOOP
    -- Skip if already earned
    IF EXISTS (
      SELECT 1 FROM user_badges
      WHERE user_id = target_user_id AND badge_id = badge_rec.id
    ) THEN
      CONTINUE;
    END IF;

    -- Check requirement
    IF (badge_rec.requirement_type = 'scans' AND user_scans >= badge_rec.requirement_value)
    OR (badge_rec.requirement_type = 'value_score' AND user_best_score >= badge_rec.requirement_value)
    OR (badge_rec.requirement_type = 'shares' AND user_shares >= badge_rec.requirement_value)
    THEN
      INSERT INTO user_badges (user_id, badge_id)
      VALUES (target_user_id, badge_rec.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Award badges after receipt changes (stats already updated by previous trigger)
CREATE TRIGGER check_badges_on_receipt
  AFTER INSERT OR UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION check_and_award_badges();

-- Refresh leaderboard ranks (call periodically or after score changes)
CREATE OR REPLACE FUNCTION refresh_leaderboard_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY best_value_score DESC) as rank
    FROM users
    WHERE total_scans > 0
  )
  UPDATE users u
  SET leaderboard_rank = r.rank
  FROM ranked r
  WHERE u.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update item_medians when line items are inserted
CREATE OR REPLACE FUNCTION update_item_medians()
RETURNS TRIGGER AS $$
DECLARE
  receipt_restaurant TEXT;
  receipt_city TEXT;
BEGIN
  -- Get restaurant info from the parent receipt
  SELECT restaurant_name, location_city
  INTO receipt_restaurant, receipt_city
  FROM receipts WHERE id = NEW.receipt_id;

  -- Upsert median data
  INSERT INTO item_medians (item_name, restaurant_name, city, median_price, average_price, median_calories, sample_count)
  VALUES (
    LOWER(TRIM(NEW.item_name)),
    receipt_restaurant,
    receipt_city,
    NEW.price,
    NEW.price,
    COALESCE(NEW.calories, 0),
    1
  )
  ON CONFLICT (item_name, restaurant_name, city)
    DO UPDATE SET
      average_price = (item_medians.average_price * item_medians.sample_count + NEW.price) / (item_medians.sample_count + 1),
      median_calories = CASE
        WHEN NEW.calories IS NOT NULL
        THEN (item_medians.median_calories * item_medians.sample_count + NEW.calories) / (item_medians.sample_count + 1)
        ELSE item_medians.median_calories
      END,
      sample_count = item_medians.sample_count + 1,
      last_updated = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Need a unique constraint for the upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_medians_unique
  ON item_medians (LOWER(TRIM(item_name)), restaurant_name, city);

CREATE TRIGGER update_medians_on_line_item
  AFTER INSERT ON line_items
  FOR EACH ROW EXECUTE FUNCTION update_item_medians();
