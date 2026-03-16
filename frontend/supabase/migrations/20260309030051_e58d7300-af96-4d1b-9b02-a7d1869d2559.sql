
-- Plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  max_certificates_per_month integer NOT NULL DEFAULT 50,
  max_templates integer NOT NULL DEFAULT 3,
  api_access boolean NOT NULL DEFAULT false,
  bulk_import boolean NOT NULL DEFAULT false,
  webhook_access boolean NOT NULL DEFAULT false,
  team_members integer NOT NULL DEFAULT 1,
  analytics_access boolean NOT NULL DEFAULT false,
  audit_exports boolean NOT NULL DEFAULT false,
  priority_support boolean NOT NULL DEFAULT false,
  price_monthly integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','canceled','past_due')),
  billing_cycle_start date NOT NULL DEFAULT CURRENT_DATE,
  billing_cycle_end date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view own subscription" ON public.subscriptions FOR SELECT USING (organization_id = get_user_org_id(auth.uid()));
CREATE POLICY "System can manage subscriptions" ON public.subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_org_id(auth.uid()));

-- Usage tracking table
CREATE TABLE public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, metric, period_start)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view own usage" ON public.usage_tracking FOR SELECT USING (organization_id = get_user_org_id(auth.uid()));

-- Plan guard function (server-side enforcement)
CREATE OR REPLACE FUNCTION public.check_plan_limit(_org_id uuid, _metric text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan plans%ROWTYPE;
  _current_usage integer;
  _limit integer;
  _sub subscriptions%ROWTYPE;
  _cycle_start date;
  _cycle_end date;
BEGIN
  -- Get active subscription
  SELECT * INTO _sub FROM subscriptions WHERE organization_id = _org_id AND status = 'active' LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'No active subscription', 'usage', 0, 'limit', 0);
  END IF;

  -- Auto-rotate billing cycle if expired
  IF CURRENT_DATE > _sub.billing_cycle_end THEN
    _cycle_start := CURRENT_DATE;
    _cycle_end := (CURRENT_DATE + INTERVAL '1 month')::date;
    UPDATE subscriptions SET billing_cycle_start = _cycle_start, billing_cycle_end = _cycle_end, updated_at = now() WHERE id = _sub.id;
    _sub.billing_cycle_start := _cycle_start;
    _sub.billing_cycle_end := _cycle_end;
  END IF;

  SELECT * INTO _plan FROM plans WHERE id = _sub.plan_id;

  -- Determine limit based on metric
  CASE _metric
    WHEN 'certificates_created' THEN _limit := _plan.max_certificates_per_month;
    WHEN 'templates_created' THEN _limit := _plan.max_templates;
    WHEN 'team_members' THEN _limit := _plan.team_members;
    ELSE _limit := 1000; -- default generous limit for unknown metrics
  END CASE;

  -- Check boolean feature gates
  IF _metric = 'bulk_import' AND NOT _plan.bulk_import THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Bulk import not available on your plan', 'usage', 0, 'limit', 0, 'plan_name', _plan.name);
  END IF;
  IF _metric = 'api_access' AND NOT _plan.api_access THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'API access not available on your plan', 'usage', 0, 'limit', 0, 'plan_name', _plan.name);
  END IF;
  IF _metric = 'webhook_access' AND NOT _plan.webhook_access THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Webhooks not available on your plan', 'usage', 0, 'limit', 0, 'plan_name', _plan.name);
  END IF;

  -- Get current usage for the active billing cycle
  SELECT COALESCE(ut.count, 0) INTO _current_usage
  FROM usage_tracking ut
  WHERE ut.organization_id = _org_id
    AND ut.metric = _metric
    AND ut.period_start = _sub.billing_cycle_start;

  IF _current_usage >= _limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Plan limit reached', 'usage', _current_usage, 'limit', _limit, 'plan_name', _plan.name);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'usage', _current_usage, 'limit', _limit, 'remaining', _limit - _current_usage, 'plan_name', _plan.name);
END;
$$;

-- Increment usage function
CREATE OR REPLACE FUNCTION public.increment_usage(_org_id uuid, _metric text, _amount integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sub subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO _sub FROM subscriptions WHERE organization_id = _org_id AND status = 'active' LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO usage_tracking (organization_id, metric, count, period_start, period_end)
  VALUES (_org_id, _metric, _amount, _sub.billing_cycle_start, _sub.billing_cycle_end)
  ON CONFLICT (organization_id, metric, period_start)
  DO UPDATE SET count = usage_tracking.count + _amount, updated_at = now();
END;
$$;

-- Get all usage for an org in current cycle
CREATE OR REPLACE FUNCTION public.get_org_usage(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sub subscriptions%ROWTYPE;
  _plan plans%ROWTYPE;
  _result jsonb;
BEGIN
  SELECT * INTO _sub FROM subscriptions WHERE organization_id = _org_id AND status = 'active' LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No active subscription');
  END IF;

  SELECT * INTO _plan FROM plans WHERE id = _sub.plan_id;

  SELECT jsonb_build_object(
    'plan_name', _plan.name,
    'plan_id', _plan.id,
    'price_monthly', _plan.price_monthly,
    'billing_cycle_start', _sub.billing_cycle_start,
    'billing_cycle_end', _sub.billing_cycle_end,
    'limits', jsonb_build_object(
      'certificates_created', _plan.max_certificates_per_month,
      'templates_created', _plan.max_templates,
      'team_members', _plan.team_members,
      'bulk_import', _plan.bulk_import,
      'api_access', _plan.api_access,
      'webhook_access', _plan.webhook_access,
      'analytics_access', _plan.analytics_access,
      'audit_exports', _plan.audit_exports,
      'priority_support', _plan.priority_support
    ),
    'usage', COALESCE((
      SELECT jsonb_object_agg(ut.metric, ut.count)
      FROM usage_tracking ut
      WHERE ut.organization_id = _org_id
        AND ut.period_start = _sub.billing_cycle_start
    ), '{}'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$$;
