
DROP POLICY IF EXISTS "audit any auth insert" ON public.audit_log;
CREATE POLICY "audit admin insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE EXECUTE ON FUNCTION public.write_audit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
