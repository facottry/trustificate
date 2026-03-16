
-- ============================================
-- TRUSTIFICATE DATABASE SCHEMA
-- ============================================

-- 1. Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.certificate_status AS ENUM ('issued', 'revoked');
CREATE TYPE public.certificate_event_type AS ENUM ('issued', 'revoked', 'viewed', 'downloaded');
CREATE TYPE public.template_layout AS ENUM ('portrait', 'landscape');

-- 2. Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 6. Organization members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 7. Certificate templates table
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  body_text TEXT NOT NULL,
  placeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  background_style JSONB DEFAULT '{}'::jsonb,
  color_theme JSONB DEFAULT '{}'::jsonb,
  layout template_layout NOT NULL DEFAULT 'landscape',
  signature_config JSONB DEFAULT '{}'::jsonb,
  seal_config JSONB DEFAULT '{}'::jsonb,
  logo_url TEXT,
  number_prefix TEXT NOT NULL DEFAULT 'CERT',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON public.certificate_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Certificate number sequence
CREATE SEQUENCE public.certificate_number_seq START WITH 1 INCREMENT BY 1;

-- 9. Certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE RESTRICT,
  certificate_number TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  course_name TEXT,
  training_name TEXT,
  company_name TEXT,
  score TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_date DATE,
  duration_text TEXT,
  issuer_name TEXT NOT NULL DEFAULT 'Trustificate',
  issuer_title TEXT,
  pdf_url TEXT,
  status certificate_status NOT NULL DEFAULT 'issued',
  metadata_json JSONB DEFAULT '{}'::jsonb,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_certificates_certificate_number ON public.certificates(certificate_number);
CREATE INDEX idx_certificates_slug ON public.certificates(slug);
CREATE INDEX idx_certificates_template_id ON public.certificates(template_id);
CREATE INDEX idx_certificates_status ON public.certificates(status);
CREATE INDEX idx_certificates_recipient_name ON public.certificates(recipient_name);

-- 10. Certificate events table
CREATE TABLE public.certificate_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  event_type certificate_event_type NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificate_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_certificate_events_certificate_id ON public.certificate_events(certificate_id);

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Organizations
CREATE POLICY "Org members can view org" ON public.organizations FOR SELECT USING (
  id = public.get_user_org_id(auth.uid())
);
CREATE POLICY "Admins can update org" ON public.organizations FOR UPDATE USING (
  id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')
);

-- Organization members
CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT USING (
  organization_id = public.get_user_org_id(auth.uid())
);

-- Certificate templates
CREATE POLICY "Org members can view templates" ON public.certificate_templates FOR SELECT USING (
  organization_id = public.get_user_org_id(auth.uid())
);
CREATE POLICY "Admins can insert templates" ON public.certificate_templates FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can update templates" ON public.certificate_templates FOR UPDATE USING (
  organization_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can delete templates" ON public.certificate_templates FOR DELETE USING (
  organization_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')
);

-- Certificates
CREATE POLICY "Org members can view certificates" ON public.certificates FOR SELECT USING (
  organization_id = public.get_user_org_id(auth.uid())
);
CREATE POLICY "Public can view issued certificates" ON public.certificates FOR SELECT USING (
  status = 'issued'
);
CREATE POLICY "Admins can insert certificates" ON public.certificates FOR INSERT WITH CHECK (
  organization_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can update certificates" ON public.certificates FOR UPDATE USING (
  organization_id = public.get_user_org_id(auth.uid()) AND public.has_role(auth.uid(), 'admin')
);

-- Certificate events
CREATE POLICY "Org members can view events" ON public.certificate_events FOR SELECT USING (
  certificate_id IN (
    SELECT id FROM public.certificates WHERE organization_id = public.get_user_org_id(auth.uid())
  )
);
CREATE POLICY "Admins can insert events" ON public.certificate_events FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Public can insert view events" ON public.certificate_events FOR INSERT WITH CHECK (
  event_type IN ('viewed', 'downloaded')
);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
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

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CERTIFICATE NUMBER GENERATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_certificate_number(_prefix TEXT DEFAULT 'CERT')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _seq INT;
  _year TEXT;
BEGIN
  _seq := nextval('public.certificate_number_seq');
  _year := extract(year from now())::text;
  RETURN _prefix || '-' || _year || '-' || lpad(_seq::text, 6, '0');
END;
$$;
