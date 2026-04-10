-- ============================================================
-- KOITALA - Passage en mode ADMIN ONLY (sans comptes clients)
-- A exécuter dans Supabase SQL Editor
-- ============================================================
-- IMPORTANT:
-- 1) Remplacez les emails admin dans les tableaux ci-dessous.
-- 2) Faites une sauvegarde avant exécution.

BEGIN;

-- 0) Liste blanche des emails admin (A ADAPTER)
-- Utilisée pour la promotion admin + blocage des nouvelles créations hors liste.
DO $$
DECLARE
  allowed_admin_emails TEXT[] := ARRAY[
    'digicode242@gmail.com',
    'amzakoita@gmail.com'
  ];
BEGIN
  IF array_length(allowed_admin_emails, 1) IS NULL THEN
    RAISE EXCEPTION 'La liste des emails admin ne peut pas être vide.';
  END IF;
END $$;

-- 1) Promouvoir explicitement les admins conservés
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(TRIM(email)) = ANY (ARRAY[
  'digicode242@gmail.com',
  'amzakoita@gmail.com'
]);

-- 2) Supprimer tous les comptes non-admin (auth + profils)
-- La FK profiles(id) -> auth.users(id) ON DELETE CASCADE supprime les profils associés.
DELETE FROM auth.users
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE COALESCE(p.role, 'user') <> 'admin'
);

-- 3) Verrouiller la colonne role sur admin uniquement
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role = 'admin');
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'admin';

-- 3bis) Forcer la synchronisation de nouveaux profils en role admin
-- et garantir la création du profil même si email_confirmed_at est NULL.
CREATE OR REPLACE FUNCTION public.sync_confirmed_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  normalized_email TEXT;
  initial_full_name TEXT;
  allowed_admin_emails TEXT[] := ARRAY[
    'digicode242@gmail.com',
    'amzakoita@gmail.com'
  ];
BEGIN
  normalized_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  initial_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');

  IF normalized_email = '' THEN
    RETURN NEW;
  END IF;

  -- Ignore silencieusement les emails hors allowlist admin.
  IF NOT (normalized_email = ANY (allowed_admin_emails)) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    normalized_email,
    initial_full_name,
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = 'admin';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3ter) Backfill: créer les profils admin manquants pour les comptes déjà existants
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  LOWER(TRIM(u.email)),
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'full_name', '')), ''),
  'admin'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND LOWER(TRIM(u.email)) = ANY (ARRAY[
    'digicode242@gmail.com',
    'amzakoita@gmail.com'
  ])
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    role = 'admin';

-- 4) Supprimer la table client "favorites" (plus utilisée côté app)
DROP TABLE IF EXISTS public.favorites CASCADE;

-- 5) RLS: passer en logique admin-only pour les données sensibles
-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT WITH CHECK (public.is_admin());

-- visit_requests: insertion publique conservée, lecture/modif admin uniquement
DROP POLICY IF EXISTS "visits_insert_any" ON public.visit_requests;
DROP POLICY IF EXISTS "visits_select_own" ON public.visit_requests;
DROP POLICY IF EXISTS "visits_update_admin" ON public.visit_requests;
DROP POLICY IF EXISTS "visits_select_admin" ON public.visit_requests;
DROP POLICY IF EXISTS "visits_delete_admin" ON public.visit_requests;

CREATE POLICY "visits_insert_any"
  ON public.visit_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "visits_select_admin"
  ON public.visit_requests FOR SELECT USING (public.is_admin());
CREATE POLICY "visits_update_admin"
  ON public.visit_requests FOR UPDATE USING (public.is_admin());
CREATE POLICY "visits_delete_admin"
  ON public.visit_requests FOR DELETE USING (public.is_admin());

-- contacts: insertion publique conservée, lecture/modif admin uniquement
DROP POLICY IF EXISTS "contacts_insert_any" ON public.contacts;
DROP POLICY IF EXISTS "contacts_select_own_or_admin" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update_admin" ON public.contacts;
DROP POLICY IF EXISTS "contacts_select_admin" ON public.contacts;

CREATE POLICY "contacts_insert_any"
  ON public.contacts FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "contacts_select_admin"
  ON public.contacts FOR SELECT USING (public.is_admin());
CREATE POLICY "contacts_update_admin"
  ON public.contacts FOR UPDATE USING (public.is_admin());

-- generated_contracts: lecture/ecriture admin uniquement
DROP POLICY IF EXISTS "generated_contracts_select_admin" ON public.generated_contracts;
DROP POLICY IF EXISTS "generated_contracts_insert_admin" ON public.generated_contracts;
DROP POLICY IF EXISTS "generated_contracts_update_admin" ON public.generated_contracts;
DROP POLICY IF EXISTS "generated_contracts_delete_admin" ON public.generated_contracts;

CREATE POLICY "generated_contracts_select_admin"
  ON public.generated_contracts FOR SELECT USING (public.is_admin());
CREATE POLICY "generated_contracts_insert_admin"
  ON public.generated_contracts FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "generated_contracts_update_admin"
  ON public.generated_contracts FOR UPDATE USING (public.is_admin());
CREATE POLICY "generated_contracts_delete_admin"
  ON public.generated_contracts FOR DELETE USING (public.is_admin());

-- 6) Bloquer la création de comptes hors liste admin
CREATE OR REPLACE FUNCTION public.enforce_admin_allowlist_auth_user_email()
RETURNS TRIGGER AS $$
DECLARE
  normalized_email TEXT;
  allowed_admin_emails TEXT[] := ARRAY[
    'digicode242@gmail.com',
    'amzakoita@gmail.com'
  ];
BEGIN
  normalized_email := LOWER(TRIM(COALESCE(NEW.email, '')));

  IF normalized_email = '' OR NOT (normalized_email = ANY (allowed_admin_emails)) THEN
    RAISE EXCEPTION 'Création de compte refusée: email non autorisé (admin only).'
      USING ERRCODE = '23514';
  END IF;

  NEW.email := normalized_email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_gmail_auth_user_email ON auth.users;
DROP TRIGGER IF EXISTS enforce_admin_allowlist_auth_user_email ON auth.users;

CREATE TRIGGER enforce_admin_allowlist_auth_user_email
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_allowlist_auth_user_email();

COMMIT;

-- ============================================================
-- Vérifications rapides (optionnel)
-- ============================================================
-- SELECT id, email, role FROM public.profiles ORDER BY created_at DESC;
-- SELECT id, email FROM auth.users ORDER BY created_at DESC;
