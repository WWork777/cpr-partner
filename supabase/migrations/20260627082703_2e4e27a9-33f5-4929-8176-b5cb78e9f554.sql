
-- SEO + meta on courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text;

-- UTM tracking on applications
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS referrer text;

-- Certificate verification
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  course_title text NOT NULL,
  issued_at date NOT NULL,
  valid_until date,
  registry_no text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certificates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certificates public read" ON public.certificates FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "Admins manage certificates" ON public.certificates FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER certificates_set_updated_at BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX certificates_number_idx ON public.certificates (lower(number));
