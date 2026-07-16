
-- Allow public read of course-images bucket via signed/public listing; we'll use signed URLs from admin to display, and public read for site
CREATE POLICY "course-images public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'course-images');

CREATE POLICY "course-images admin write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "course-images admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'course-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "course-images admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'course-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
