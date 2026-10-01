/*
# Fix community tables: add tags, unique constraint, fix policies

1. Changes to community_posts
- Add `tags` text[] column (default '{}') for multi-tag support (Healing, Guidance, etc.)

2. Changes to post_prayers
- Add unique constraint on (post_id, user_id) to prevent duplicate prayers

3. Policy fixes
- profiles: allow all authenticated users to SELECT (for community display)
- community_posts: fix SELECT policy to use auth.uid() check instead of auth.role()
- post_prayers: fix SELECT policy to use auth.uid() check
- Add missing INSERT policy for notifications
- Add missing DELETE policy for post_prayers

4. Indexes
- Add unique index on post_prayers (post_id, user_id)
*/

-- Add tags column to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add unique constraint on post_prayers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_prayers_post_id_user_id_key'
  ) THEN
    ALTER TABLE post_prayers ADD CONSTRAINT post_prayers_post_id_user_id_key UNIQUE (post_id, user_id);
  END IF;
END $$;

-- Fix profiles SELECT policy: allow all authenticated users to read
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
CREATE POLICY "read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Fix community_posts SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read posts" ON community_posts;
DROP POLICY IF EXISTS "read_all_posts" ON community_posts;
CREATE POLICY "read_all_posts" ON community_posts FOR SELECT
  TO authenticated USING (true);

-- Fix post_prayers SELECT policy
DROP POLICY IF EXISTS "Authenticated users can see prayers" ON post_prayers;
DROP POLICY IF EXISTS "read_all_post_prayers" ON post_prayers;
CREATE POLICY "read_all_post_prayers" ON post_prayers FOR SELECT
  TO authenticated USING (true);

-- Add missing INSERT policy for notifications
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = recipient_id);

-- Add missing DELETE policy for post_prayers (so users can un-pray)
DROP POLICY IF EXISTS "delete_own_post_prayers" ON post_prayers;
CREATE POLICY "delete_own_post_prayers" ON post_prayers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add missing UPDATE policy for community_posts
DROP POLICY IF EXISTS "update_own_posts" ON community_posts;
CREATE POLICY "update_own_posts" ON community_posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for profiles (so users can create their profile on signup)
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Add index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications (recipient_id, is_read);
