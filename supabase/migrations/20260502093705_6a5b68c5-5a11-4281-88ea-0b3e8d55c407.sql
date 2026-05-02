-- 1. Add photos column to order_incidents
ALTER TABLE public.order_incidents
ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

-- 2. Create private storage bucket for incident photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies on storage.objects for incident-photos
CREATE POLICY "Users can upload own incident photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'incident-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own incident photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own incident photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'incident-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all incident photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'incident-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);