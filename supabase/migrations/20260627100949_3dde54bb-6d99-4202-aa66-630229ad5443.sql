ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'home';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS ends_at timestamptz;