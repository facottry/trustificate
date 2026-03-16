
-- Update handle_new_user to auto-assign Free plan subscription
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
  _tpl1 UUID;
  _tpl2 UUID;
  _tpl3 UUID;
  _free_plan_id UUID;
BEGIN
  -- Create organization
  INSERT INTO public.organizations (name, slug, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)) || '''s Organization',
    lower(replace(COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), ' ', '-')) || '-' || substr(NEW.id::text, 1, 8),
    NEW.id
  )
  RETURNING id INTO _org_id;

  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    _org_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');

  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (NEW.id, _org_id, 'owner');

  -- Auto-assign Free plan
  SELECT id INTO _free_plan_id FROM public.plans WHERE name = 'Free' LIMIT 1;
  IF _free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (organization_id, plan_id, status)
    VALUES (_org_id, _free_plan_id, 'active');
  END IF;

  -- Seed 3 sample templates
  BEGIN
    INSERT INTO public.certificate_templates (
      title, subtitle, body_text, number_prefix, layout, organization_id, created_by, is_active,
      placeholders, color_theme, signature_config
    ) VALUES (
      'Course Completion',
      'Certificate of Completion',
      'This is to certify that {{recipient_name}} has successfully completed the course "{{course_name}}" on {{completion_date}}.',
      'CC',
      'landscape',
      _org_id,
      NEW.id,
      true,
      '["recipient_name","recipient_email","course_name","completion_date","issuer_name","issuer_title"]'::jsonb,
      '{"primary":"#0f766e","secondary":"#f0fdfa","accent":"#134e4a"}'::jsonb,
      '{"issuer_name":"Training Director","issuer_title":"Head of Learning"}'::jsonb
    ) RETURNING id INTO _tpl1;

    INSERT INTO public.certificate_templates (
      title, subtitle, body_text, number_prefix, layout, organization_id, created_by, is_active,
      placeholders, color_theme, signature_config
    ) VALUES (
      'Professional Development',
      'Certificate of Achievement',
      'This certifies that {{recipient_name}} from {{company_name}} has completed {{training_name}} with a duration of {{duration_text}}.',
      'PD',
      'landscape',
      _org_id,
      NEW.id,
      true,
      '["recipient_name","recipient_email","company_name","training_name","duration_text","issuer_name","issuer_title"]'::jsonb,
      '{"primary":"#1e40af","secondary":"#eff6ff","accent":"#1e3a5f"}'::jsonb,
      '{"issuer_name":"Program Manager","issuer_title":"Professional Development"}'::jsonb
    ) RETURNING id INTO _tpl2;

    INSERT INTO public.certificate_templates (
      title, subtitle, body_text, number_prefix, layout, organization_id, created_by, is_active,
      placeholders, color_theme, signature_config
    ) VALUES (
      'Compliance Training',
      'Certificate of Compliance',
      'This document certifies that {{recipient_name}} has completed the required compliance training "{{course_name}}" and achieved a score of {{score}}.',
      'CT',
      'landscape',
      _org_id,
      NEW.id,
      true,
      '["recipient_name","recipient_email","course_name","score","issuer_name","issuer_title"]'::jsonb,
      '{"primary":"#9333ea","secondary":"#faf5ff","accent":"#581c87"}'::jsonb,
      '{"issuer_name":"Compliance Officer","issuer_title":"Regulatory Affairs"}'::jsonb
    ) RETURNING id INTO _tpl3;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to seed sample templates: %', SQLERRM;
  END;

  -- Seed 3 sample certificates
  BEGIN
    _cert_num := public.generate_certificate_number('CC');
    _slug := lower(replace(_cert_num, ' ', '-'));
    INSERT INTO public.certificates (certificate_number, slug, recipient_name, recipient_email, course_name, issuer_name, issuer_title, issue_date, organization_id, created_by, status, template_id, completion_date)
    VALUES (_cert_num, _slug, 'Jane Smith', 'jane@example.com', 'Introduction to Digital Credentials', 'Training Director', 'Head of Learning', CURRENT_DATE, _org_id, NEW.id, 'issued', _tpl1, CURRENT_DATE);
    INSERT INTO public.certificate_events (certificate_id, event_type, actor_id)
    VALUES ((SELECT id FROM public.certificates WHERE certificate_number = _cert_num AND organization_id = _org_id), 'issued', NEW.id);

    _cert_num := public.generate_certificate_number('PD');
    _slug := lower(replace(_cert_num, ' ', '-'));
    INSERT INTO public.certificates (certificate_number, slug, recipient_name, recipient_email, training_name, company_name, duration_text, issuer_name, issuer_title, issue_date, organization_id, created_by, status, template_id)
    VALUES (_cert_num, _slug, 'John Doe', 'john@example.com', 'Leadership Essentials Workshop', 'Acme Corp', '16 hours', 'Program Manager', 'Professional Development', CURRENT_DATE - INTERVAL '30 days', _org_id, NEW.id, 'issued', _tpl2);
    INSERT INTO public.certificate_events (certificate_id, event_type, actor_id)
    VALUES ((SELECT id FROM public.certificates WHERE certificate_number = _cert_num AND organization_id = _org_id), 'issued', NEW.id);

    _cert_num := public.generate_certificate_number('CT');
    _slug := lower(replace(_cert_num, ' ', '-'));
    INSERT INTO public.certificates (certificate_number, slug, recipient_name, recipient_email, course_name, score, issuer_name, issuer_title, issue_date, organization_id, created_by, status, template_id)
    VALUES (_cert_num, _slug, 'Alex Johnson', 'alex@example.com', 'Data Privacy & GDPR Compliance', '92%', 'Compliance Officer', 'Regulatory Affairs', CURRENT_DATE - INTERVAL '60 days', _org_id, NEW.id, 'issued', _tpl3);
    INSERT INTO public.certificate_events (certificate_id, event_type, actor_id)
    VALUES ((SELECT id FROM public.certificates WHERE certificate_number = _cert_num AND organization_id = _org_id), 'issued', NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to seed sample certificates: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;
