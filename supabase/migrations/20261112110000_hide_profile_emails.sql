-- Hide profile email addresses from other authenticated users.
-- Community needs public usernames, but not every user's email.
REVOKE SELECT ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, username, avatar_url, subscription_tier, is_subscribed, premium_expires_at) ON TABLE public.profiles TO authenticated;
