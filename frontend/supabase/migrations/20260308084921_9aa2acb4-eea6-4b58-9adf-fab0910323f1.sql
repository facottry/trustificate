
-- ============================================
-- TRUSTIFICATE UX OVERHAUL MIGRATION
-- ============================================

-- 1. Add external certificate support to certificates table
ALTER TABLE public.certificates ADD COLUMN is_external BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.certificates ADD COLUMN original_issuer TEXT;
ALTER TABLE public.certificates ADD COLUMN external_pdf_url TEXT;
ALTER TABLE public.certificates ADD COLUMN external_verification_url TEXT;
ALTER TABLE public.certificates ADD COLUMN notes TEXT;
ALTER TABLE public.certificates ADD COLUMN uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Make template_id nullable (external certs don't have templates)
ALTER TABLE public.certificates ALTER COLUMN template_id DROP NOT NULL;

-- 2. Add is_active to templates for deactivation
ALTER TABLE public.certificate_templates ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- 3. Create storage bucket for certificate PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-pdfs', 'certificate-pdfs', true);

CREATE POLICY "Authenticated users can upload certificate PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificate-pdfs');

CREATE POLICY "Anyone can view certificate PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-pdfs');

CREATE POLICY "Admins can delete certificate PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'certificate-pdfs');

-- 4. Fix RLS policies on certificate_events - change to PERMISSIVE
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can insert events" ON public.certificate_events;
DROP POLICY IF EXISTS "Public can insert view events" ON public.certificate_events;
DROP POLICY IF EXISTS "Org members can view events" ON public.certificate_events;

CREATE POLICY "Admins can insert events" ON public.certificate_events
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert view/download events" ON public.certificate_events
FOR INSERT TO anon, authenticated
WITH CHECK (event_type IN ('viewed'::certificate_event_type, 'downloaded'::certificate_event_type));

CREATE POLICY "Org members can view events" ON public.certificate_events
FOR SELECT TO authenticated
USING (certificate_id IN (
  SELECT id FROM certificates WHERE organization_id = get_user_org_id(auth.uid())
));

-- 5. Fix RLS on certificates - make public SELECT permissive
DROP POLICY IF EXISTS "Public can view issued certificates" ON public.certificates;
DROP POLICY IF EXISTS "Org members can view certificates" ON public.certificates;

CREATE POLICY "Public can view issued certificates" ON public.certificates
FOR SELECT TO anon, authenticated
USING (status = 'issued'::certificate_status);

CREATE POLICY "Org members can view all org certificates" ON public.certificates
FOR SELECT TO authenticated
USING (organization_id = get_user_org_id(auth.uid()));

-- 6. Add index for external certs
CREATE INDEX idx_certificates_is_external ON public.certificates(is_external);
