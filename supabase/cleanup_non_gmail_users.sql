-- KOITALA - Cleanup existing non-Gmail auth accounts
-- Run this manually in Supabase SQL Editor only if you want to remove
-- already-created accounts whose email is not @gmail.com.

-- ============================================================
-- 1. REVIEW BEFORE DELETE
-- ============================================================
-- Inspect the rows that would be deleted.
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE LOWER(TRIM(COALESCE(email, ''))) !~ '^[a-z0-9._%+-]+@gmail\.com$'
ORDER BY created_at DESC;

-- ============================================================
-- 2. DELETE NON-GMAIL ACCOUNTS
-- ============================================================
-- Effects:
-- - auth.users rows are deleted
-- - public.profiles rows are deleted automatically (ON DELETE CASCADE)
-- - favorites linked to those profiles are deleted automatically
-- - visit_requests.user_id becomes NULL
-- - properties.created_by becomes NULL
--
-- Uncomment and run only after reviewing the SELECT above.

/*
BEGIN;

DELETE FROM auth.users
WHERE LOWER(TRIM(COALESCE(email, ''))) !~ '^[a-z0-9._%+-]+@gmail\.com$';

COMMIT;
*/

-- ============================================================
-- 3. OPTIONAL: DELETE ONLY UNCONFIRMED NON-GMAIL ACCOUNTS
-- ============================================================
-- Safer variant if you only want to delete non-Gmail accounts that never
-- confirmed their email address.

/*
BEGIN;

DELETE FROM auth.users
WHERE LOWER(TRIM(COALESCE(email, ''))) !~ '^[a-z0-9._%+-]+@gmail\.com$'
  AND email_confirmed_at IS NULL;

COMMIT;
*/
