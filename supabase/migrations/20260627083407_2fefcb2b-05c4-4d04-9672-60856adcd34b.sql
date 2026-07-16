
-- ============ BANNERS ============
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  cta_label text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners read active for all" ON public.banners FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "banners admin write" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PROMOCODES ============
CREATE TABLE public.promocodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent int,
  discount_amount numeric(10,2),
  valid_until timestamptz,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promocodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promocodes TO authenticated;
GRANT ALL ON public.promocodes TO service_role;
ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promocodes read active" ON public.promocodes FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "promocodes admin write" ON public.promocodes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER promocodes_updated_at BEFORE UPDATE ON public.promocodes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COURSE SCHEDULES ============
CREATE TABLE public.course_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  format text,
  city text,
  seats_total int,
  seats_left int,
  price numeric(10,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX course_schedules_course_id_idx ON public.course_schedules(course_id);
CREATE INDEX course_schedules_start_idx ON public.course_schedules(start_date);
GRANT SELECT ON public.course_schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_schedules TO authenticated;
GRANT ALL ON public.course_schedules TO service_role;
ALTER TABLE public.course_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules read active" ON public.course_schedules FOR SELECT USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "schedules admin write" ON public.course_schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER course_schedules_updated_at BEFORE UPDATE ON public.course_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COURSE REVIEWS ============
CREATE TABLE public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_company text,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX course_reviews_course_id_idx ON public.course_reviews(course_id);
GRANT SELECT ON public.course_reviews TO anon;
GRANT INSERT ON public.course_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_reviews TO authenticated;
GRANT ALL ON public.course_reviews TO service_role;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews read approved" ON public.course_reviews FOR SELECT USING (is_approved OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reviews public insert" ON public.course_reviews FOR INSERT TO anon, authenticated WITH CHECK (is_approved = false);
CREATE POLICY "reviews admin write" ON public.course_reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reviews admin delete" ON public.course_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER course_reviews_updated_at BEFORE UPDATE ON public.course_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  user_id uuid,
  user_email text,
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx ON public.audit_log(entity, entity_id);
CREATE INDEX audit_log_created_idx ON public.audit_log(created_at DESC);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "audit any auth insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============ AUDIT TRIGGERS for courses, applications ============
CREATE OR REPLACE FUNCTION public.write_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
  diff jsonb;
BEGIN
  BEGIN
    SELECT email INTO uemail FROM auth.users WHERE id = uid;
  EXCEPTION WHEN OTHERS THEN uemail := NULL; END;

  IF TG_OP = 'DELETE' THEN
    diff := to_jsonb(OLD);
    INSERT INTO public.audit_log(entity, entity_id, action, user_id, user_email, diff)
      VALUES (TG_TABLE_NAME, OLD.id, 'delete', uid, uemail, diff);
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log(entity, entity_id, action, user_id, user_email, diff)
      VALUES (TG_TABLE_NAME, NEW.id, 'insert', uid, uemail, to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO public.audit_log(entity, entity_id, action, user_id, user_email, diff)
      VALUES (TG_TABLE_NAME, NEW.id, 'update', uid, uemail,
              jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
    RETURN NEW;
  END IF;
END $$;

CREATE TRIGGER courses_audit AFTER INSERT OR UPDATE OR DELETE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER applications_audit AFTER UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER banners_audit AFTER INSERT OR UPDATE OR DELETE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER promocodes_audit AFTER INSERT OR UPDATE OR DELETE ON public.promocodes
  FOR EACH ROW EXECUTE FUNCTION public.write_audit();

-- ============ APPLICATIONS: city + promocode columns ============
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS promocode text;
