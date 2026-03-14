-- ============================================================
-- KOITALA – Schéma SQL complet
-- À exécuter dans le SQL Editor de votre projet Supabase
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 2. PROPERTIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  property_type   TEXT NOT NULL CHECK (property_type IN ('appartement','maison','terrain','bureau','local_commercial','villa','duplex')),
  listing_type    TEXT NOT NULL CHECK (listing_type IN ('vente','location')),
  status          TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon','publie','vendu','loue','archive')),
  price           NUMERIC(15,2) NOT NULL,
  area            NUMERIC(10,2),
  bedrooms        INTEGER,
  bathrooms       INTEGER,
  address         TEXT,
  neighborhood    TEXT,
  city            TEXT NOT NULL,
  postal_code     TEXT,
  country         TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_furnished    BOOLEAN NOT NULL DEFAULT FALSE,
  rental_category TEXT CHECK (rental_category IN ('chambre_meublee','studio','appartement','mini_studio','colocation')),
  rent_payment_period TEXT CHECK (rent_payment_period IN ('jour','mois')),
  main_image_url  TEXT,
  video_url       TEXT,
  views_count     INTEGER NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS properties_status_idx      ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_city_idx        ON public.properties(city);
CREATE INDEX IF NOT EXISTS properties_listing_type_idx ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS properties_rental_category_idx ON public.properties(rental_category);
CREATE INDEX IF NOT EXISTS properties_slug_idx        ON public.properties(slug);
CREATE INDEX IF NOT EXISTS properties_is_featured_idx ON public.properties(is_featured);

-- Compatibilité base existante (ajout des colonnes si absentes)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rental_category TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rent_payment_period TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'properties_rental_category_check'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_rental_category_check
      CHECK (rental_category IN ('chambre_meublee','studio','appartement','mini_studio','colocation') OR rental_category IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'properties_rent_payment_period_check'
  ) THEN
    ALTER TABLE public.properties
      ADD CONSTRAINT properties_rent_payment_period_check
      CHECK (rent_payment_period IN ('jour','mois') OR rent_payment_period IS NULL);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 3. PROPERTY IMAGES (max 5 par annonce)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_images (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  alt          TEXT,
  is_main      BOOLEAN NOT NULL DEFAULT FALSE,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS property_images_property_id_idx ON public.property_images(property_id);

-- ─────────────────────────────────────────────
-- 4. PROPERTY FEATURES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_features (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  value        TEXT,
  icon         TEXT
);

CREATE INDEX IF NOT EXISTS property_features_property_id_idx ON public.property_features(property_id);

-- ─────────────────────────────────────────────
-- 5. FAVORITES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id  UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);

-- ─────────────────────────────────────────────
-- 6. VISIT REQUESTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visit_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  message         TEXT,
  preferred_date  DATE,
  status          TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente','confirme','annule','realise')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visit_requests_property_id_idx ON public.visit_requests(property_id);
CREATE INDEX IF NOT EXISTS visit_requests_status_idx      ON public.visit_requests(status);

-- ─────────────────────────────────────────────
-- 7. CONTACTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id  UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  subject      TEXT,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau','lu','traite','archive')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contacts_status_idx ON public.contacts(status);

-- ─────────────────────────────────────────────
-- 8. BLOG POSTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  excerpt          TEXT,
  content          TEXT NOT NULL,
  cover_image_url  TEXT,
  category         TEXT,
  tags             TEXT[],
  status           TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon','publie','archive')),
  author_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS blog_posts_status_idx ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx   ON public.blog_posts(slug);

-- ─────────────────────────────────────────────
-- 9. UPDATED_AT TRIGGERS
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','properties','visit_requests','contacts','blog_posts'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
       CREATE TRIGGER set_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- GRANTS (permissions SQL)
-- ============================================================
-- Sans ces GRANT, vous pouvez avoir:
-- "permission denied for table properties"

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts       ENABLE ROW LEVEL SECURITY;

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES ──
CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert_own"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ── PROPERTIES ──
CREATE POLICY "properties_select_public" ON public.properties FOR SELECT
  USING (status = 'publie' OR public.is_admin() OR auth.uid() = created_by);
CREATE POLICY "properties_insert_admin"  ON public.properties FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "properties_update_admin"  ON public.properties FOR UPDATE USING (public.is_admin());
CREATE POLICY "properties_delete_admin"  ON public.properties FOR DELETE USING (public.is_admin());

-- ── PROPERTY IMAGES ──
CREATE POLICY "property_images_select" ON public.property_images FOR SELECT USING (TRUE);
CREATE POLICY "property_images_insert" ON public.property_images FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "property_images_delete" ON public.property_images FOR DELETE USING (public.is_admin());

-- ── PROPERTY FEATURES ──
CREATE POLICY "property_features_select" ON public.property_features FOR SELECT USING (TRUE);
CREATE POLICY "property_features_insert" ON public.property_features FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "property_features_delete" ON public.property_features FOR DELETE USING (public.is_admin());

-- ── FAVORITES ──
CREATE POLICY "favorites_select_own"  ON public.favorites FOR SELECT  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "favorites_insert_own"  ON public.favorites FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own"  ON public.favorites FOR DELETE  USING (auth.uid() = user_id OR public.is_admin());

-- ── VISIT REQUESTS ──
CREATE POLICY "visits_insert_any"    ON public.visit_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "visits_select_own"    ON public.visit_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "visits_update_admin"  ON public.visit_requests FOR UPDATE USING (public.is_admin());

-- ── CONTACTS ──
CREATE POLICY "contacts_insert_any"   ON public.contacts FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "contacts_select_own_or_admin" ON public.contacts FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR public.is_admin());
CREATE POLICY "contacts_update_admin" ON public.contacts FOR UPDATE USING (public.is_admin());

-- ── BLOG POSTS ──
CREATE POLICY "blog_select_public" ON public.blog_posts FOR SELECT
  USING (status = 'publie' OR public.is_admin());
CREATE POLICY "blog_insert_admin"  ON public.blog_posts FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "blog_update_admin"  ON public.blog_posts FOR UPDATE USING (public.is_admin());
CREATE POLICY "blog_delete_admin"  ON public.blog_posts FOR DELETE USING (public.is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these in Supabase Dashboard > Storage or via the API:
-- 1. Create bucket: property-images (public)
-- 2. Create bucket: blog-images (public)

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "storage_property_images_public_read"
ON storage.objects FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "storage_property_images_admin_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images' AND public.is_admin());

CREATE POLICY "storage_blog_images_public_read"
ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "storage_blog_images_admin_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND public.is_admin());

CREATE POLICY "storage_property_videos_public_read"
ON storage.objects FOR SELECT USING (bucket_id = 'property-videos');

CREATE POLICY "storage_property_videos_admin_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-videos' AND public.is_admin());

-- ============================================================
-- SAMPLE DATA (optionnel – à supprimer en production)
-- ============================================================
-- Pour tester, créez d'abord un compte admin via Supabase Auth,
-- puis mettez à jour son rôle :
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'votre@email.com';
