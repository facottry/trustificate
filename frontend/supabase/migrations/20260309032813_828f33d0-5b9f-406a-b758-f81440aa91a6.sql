
-- Admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins full access audit logs" ON public.admin_audit_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Super admin RLS policies
CREATE POLICY "sa_profiles_select" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "sa_profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_orgs_select" ON public.organizations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "sa_orgs_update" ON public.organizations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "sa_orgs_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "sa_orgs_delete" ON public.organizations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_subs_all" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_certs_select" ON public.certificates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "sa_certs_update" ON public.certificates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "sa_certs_delete" ON public.certificates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_templates_select" ON public.certificate_templates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "sa_templates_all" ON public.certificate_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_events_select" ON public.certificate_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_usage_all" ON public.usage_tracking FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_orders_all" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_plans_all" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_members_all" ON public.organization_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_roles_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_coupons_all" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "sa_contact_all" ON public.contact_submissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Admin stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  RETURN jsonb_build_object(
    'total_users', (SELECT count(*) FROM profiles),
    'total_organizations', (SELECT count(*) FROM organizations),
    'total_certificates', (SELECT count(*) FROM certificates),
    'active_certificates', (SELECT count(*) FROM certificates WHERE status = 'issued'),
    'revoked_certificates', (SELECT count(*) FROM certificates WHERE status = 'revoked'),
    'total_templates', (SELECT count(*) FROM certificate_templates),
    'active_subscriptions', (SELECT count(*) FROM subscriptions WHERE status = 'active'),
    'total_verifications', (SELECT count(*) FROM certificate_events WHERE event_type = 'viewed'),
    'total_orders', (SELECT count(*) FROM orders),
    'total_revenue', COALESCE((SELECT sum(final_amount) FROM orders WHERE status = 'completed'), 0),
    'mrr', COALESCE((SELECT sum(p.price_monthly) FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.status = 'active' AND p.price_monthly > 0), 0),
    'certs_this_month', (SELECT count(*) FROM certificates WHERE created_at >= date_trunc('month', now())),
    'verifications_this_month', (SELECT count(*) FROM certificate_events WHERE event_type = 'viewed' AND created_at >= date_trunc('month', now())),
    'templates_this_month', (SELECT count(*) FROM certificate_templates WHERE created_at >= date_trunc('month', now())),
    'free_orgs', (SELECT count(*) FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.status = 'active' AND p.name = 'Free'),
    'paid_orgs', (SELECT count(*) FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.status = 'active' AND p.name != 'Free')
  );
END;
$$;

-- Admin users function (accesses auth.users for email)
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'super_admin') THEN
    RETURN '[]'::jsonb;
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC)
    FROM (
      SELECT
        p.id, p.user_id, p.display_name, p.avatar_url, p.organization_id,
        o.name as org_name, u.email, u.last_sign_in_at, u.email_confirmed_at, u.created_at,
        (SELECT array_agg(ur.role::text) FROM user_roles ur WHERE ur.user_id = p.user_id) as roles
      FROM profiles p
      LEFT JOIN organizations o ON p.organization_id = o.id
      LEFT JOIN auth.users u ON p.user_id = u.id
    ) t
  ), '[]'::jsonb);
END;
$$;

-- Log admin action function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _target_type text DEFAULT NULL,
  _target_id text DEFAULT NULL,
  _details text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _log_id uuid;
BEGIN
  INSERT INTO admin_audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), _action, _target_type, _target_id, _details)
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$;
