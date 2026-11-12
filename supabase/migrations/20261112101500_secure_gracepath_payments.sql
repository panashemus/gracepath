-- GracePath premium entitlement hardening (already applied to the connected Supabase project).
-- Paid access can only be modified by trusted server-side roles, not the browser.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.protect_subscription_entitlements()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon','authenticated') THEN
    IF TG_OP='INSERT' THEN
      NEW.subscription_tier := 'free';
      NEW.is_subscribed := false;
      NEW.premium_expires_at := NULL;
    ELSE
      NEW.subscription_tier := OLD.subscription_tier;
      NEW.is_subscribed := OLD.is_subscribed;
      NEW.premium_expires_at := OLD.premium_expires_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_subscription_entitlements_trigger ON public.profiles;
CREATE TRIGGER protect_subscription_entitlements_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_entitlements();

ALTER FUNCTION public.handle_new_user() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_subscription_entitlements() FROM PUBLIC, anon, authenticated;
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (username, full_name, avatar_url) ON TABLE public.profiles TO authenticated;
REVOKE INSERT ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT INSERT (id, email, full_name, username) ON TABLE public.profiles TO authenticated;

CREATE TABLE IF NOT EXISTS public.paypal_payment_receipts (
  order_id text PRIMARY KEY,
  capture_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('monthly','annual','lifetime')),
  amount_usd numeric(10,2) NOT NULL CHECK(amount_usd > 0),
  verified_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.paypal_payment_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.paypal_payment_receipts FROM PUBLIC, anon, authenticated;
