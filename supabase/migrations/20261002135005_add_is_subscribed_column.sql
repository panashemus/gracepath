/*
# Add is_subscribed column to profiles table

1. Changes to profiles
- Add `is_subscribed` boolean column (default false) to track PayPal payment status
- The webhook will set this to true when a successful payment is verified

2. Security
- No policy changes needed — existing SELECT policy allows authenticated users to read their own profile
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_subscribed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_subscribed ON profiles (is_subscribed);
