
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'credentials_issued', (SELECT count(*) FROM public.certificates WHERE status = 'issued'),
    'organizations', (SELECT count(*) FROM public.organizations),
    'verifications', (SELECT count(*) FROM public.certificate_events WHERE event_type = 'viewed'),
    'templates', (SELECT count(*) FROM public.certificate_templates WHERE is_active = true)
  )
$$;
