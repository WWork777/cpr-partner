
-- 1. Extend course_schedules: add is_default flag for distant template
ALTER TABLE public.course_schedules
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- 2. Teachers
CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  position text,
  bio text,
  credentials text,
  photo_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers public read" ON public.teachers FOR SELECT USING (is_published = true);
CREATE POLICY "teachers admin all" ON public.teachers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Organization documents (licenses, gratitudes, etc.)
CREATE TABLE IF NOT EXISTS public.org_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'license', -- license | thanks | charter | other
  file_url text NOT NULL,
  preview_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.org_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_documents TO authenticated;
GRANT ALL ON public.org_documents TO service_role;
ALTER TABLE public.org_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_documents public read" ON public.org_documents FOR SELECT USING (is_published = true);
CREATE POLICY "org_documents admin all" ON public.org_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_org_documents_updated BEFORE UPDATE ON public.org_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Gallery
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt text,
  section text NOT NULL DEFAULT 'home', -- home | page
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery public read" ON public.gallery_images FOR SELECT USING (is_published = true);
CREATE POLICY "gallery admin all" ON public.gallery_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_gallery_updated BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Courses: document_type (svidetelstvo | udostoverenie | diplom) + teacher binding
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS document_type text;

-- Course<->Teacher many-to-many
CREATE TABLE IF NOT EXISTS public.course_teachers (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, teacher_id)
);
GRANT SELECT ON public.course_teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_teachers TO authenticated;
GRANT ALL ON public.course_teachers TO service_role;
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "course_teachers public read" ON public.course_teachers FOR SELECT USING (true);
CREATE POLICY "course_teachers admin all" ON public.course_teachers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
