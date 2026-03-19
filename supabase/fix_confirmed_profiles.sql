-- KOITALA - Fix profile creation timing
-- Run this once in Supabase SQL Editor on the existing database.

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_gmail_auth_user_email()
RETURNS TRIGGER AS $$
DECLARE
  normalized_email TEXT;
BEGIN
  normalized_email := LOWER(TRIM(COALESCE(NEW.email, '')));

  IF normalized_email = '' OR normalized_email !~ '^[a-z0-9._%+-]+@gmail\.com$' THEN
    RAISE EXCEPTION 'Seules les adresses Gmail sont autorisées pour créer un compte.'
      USING ERRCODE = '23514';
  END IF;

  NEW.email := normalized_email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_gmail_auth_user_email ON auth.users;
CREATE TRIGGER enforce_gmail_auth_user_email
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_gmail_auth_user_email();

CREATE OR REPLACE FUNCTION public.sync_confirmed_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  normalized_email TEXT;
  initial_full_name TEXT;
BEGIN
  normalized_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  initial_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');

  IF normalized_email = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    normalized_email,
    initial_full_name
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_confirmed_user_profile();

CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
    OR OLD.email IS DISTINCT FROM NEW.email
  )
  EXECUTE FUNCTION public.sync_confirmed_user_profile();

COMMIT;

-- Optional review query:
-- SELECT id, email, created_at, email_confirmed_at
-- FROM auth.users
-- WHERE email_confirmed_at IS NULL
-- ORDER BY created_at DESC;

-- Optional cleanup for stale unconfirmed accounts:
-- DELETE FROM auth.users
-- WHERE email_confirmed_at IS NULL
--   AND created_at < NOW() - INTERVAL '7 days';
