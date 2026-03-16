
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org_id UUID;
  _cert_num TEXT;
  _slug TEXT;
  _rand TEXT;
BEGIN
  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)) || '''s Organization',
    lower(replace(COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), ' ', '-')) || '-' || substr(NEW.id::text, 1, 8),
    NEW.id
  )
  RETURNING id INTO _org_id;

  INSERT INTO public.profiles (user_id, display_name, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    _org_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');

  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (NEW.id, _org_id, 'owner');

  -- Seed 3 sample certificates
  BEGIN
    _cert_num := public.generate_certificate_number('SAMPLE');
    _slug := lower(replace(_cert_num, ' ', '-'));
    INSERT INTO public.certificates (certificate_number, slug, recipient_name, recipient_email, course_name, issuer_name, issuer_title, issue_date, organization_id, created_by, status)
    VALUES (_cert_num, _slug, 'Jane Smith', 'jane@example.com', 'Introduction to Digital Credentials', 'Trustificate Platform', 'System', CURRENT_DATE, _org_id, NEW.id, 'issued');

    _cert_num := public.generate_certificate_number('SAMPLE');
    _slug := lower(replace(_cert_num, ' ', '-'));
    INSERT INTO public.certificates (certificate_number, slug, recipient_name, recipient_email, course_name, issuer_name, issuer_title, issue_date, organization_id, created_by, status)
    VALUES (_cert_num, _slug, 'John Doe', 'john@example.com', 'Workplace Safety Certification', 'Trustificate Platform', 'System', CURRENT_DATE - INTERVAL '30 days', _org_id, NEW.id, 'issued');

    _cert_num := public.generate_certificate_number('SAMPLE');
    _slug := lower(replace(_cert_num, ' ', '-'));
    INSERT INTO public.certificates (certificate_number, slug, recipient_name, recipient_email, course_name, issuer_name, issuer_title, issue_date, organization_id, created_by, status)
    VALUES (_cert_num, _slug, 'Alex Johnson', 'alex@example.com', 'Advanced Project Management', 'Trustificate Platform', 'System', CURRENT_DATE - INTERVAL '60 days', _org_id, NEW.id, 'issued');
  EXCEPTION WHEN OTHERS THEN
    -- Don't fail user creation if sample certs fail
    RAISE WARNING 'Failed to seed sample certificates: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
