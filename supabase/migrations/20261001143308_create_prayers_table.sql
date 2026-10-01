/*
# Create prayers table for user-scoped prayer journal

1. New Tables
- `prayers`
  - `id` (uuid, primary key, defaults to gen_random_uuid)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with ON DELETE CASCADE)
  - `name` (text, the person the prayer is for)
  - `categories` (text[], prayer category tags)
  - `request` (text, the user's prayer request)
  - `tone` (text, the tone of the prayer)
  - `translation` (text, Bible translation preference)
  - `prayer` (text, the generated prayer text)
  - `scriptures` (jsonb, array of scripture verse objects)
  - `reflection` (text, the reflection prompt)
  - `voice` (text, preferred voice id)
  - `duration` (text, reflection duration)
  - `answered` (boolean, default false, whether the prayer was answered)
  - `created_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on `prayers`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- SELECT, INSERT, UPDATE, DELETE policies all scoped to `auth.uid() = user_id`.
- The `user_id` column defaults to `auth.uid()` so inserts that omit it still succeed.
*/

CREATE TABLE IF NOT EXISTS prayers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  categories text[] DEFAULT '{}',
  request text,
  tone text,
  translation text,
  prayer text,
  scriptures jsonb DEFAULT '[]',
  reflection text,
  voice text,
  duration text,
  answered boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_prayers" ON prayers;
CREATE POLICY "select_own_prayers" ON prayers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_prayers" ON prayers;
CREATE POLICY "insert_own_prayers" ON prayers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_prayers" ON prayers;
CREATE POLICY "update_own_prayers" ON prayers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_prayers" ON prayers;
CREATE POLICY "delete_own_prayers" ON prayers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
