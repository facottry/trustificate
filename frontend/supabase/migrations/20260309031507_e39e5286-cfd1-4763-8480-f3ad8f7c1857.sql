
-- Orders/transactions table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.plans(id) NOT NULL,
  plan_name text NOT NULL,
  original_price integer NOT NULL DEFAULT 0,
  discount_percent integer NOT NULL DEFAULT 0,
  discounted_price integer NOT NULL DEFAULT 0,
  coupon_code text,
  coupon_discount_percent integer NOT NULL DEFAULT 0,
  final_amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'completed',
  payment_method text DEFAULT 'coupon',
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Orders: users can view own org orders
CREATE POLICY "Org members can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id(auth.uid()));

-- Orders: authenticated users can insert orders for their org
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id(auth.uid()) AND user_id = auth.uid());

-- Coupons: anyone authenticated can read active coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Insert the FREE_100 coupon
INSERT INTO public.coupons (code, discount_percent, is_active, max_uses)
VALUES ('FREE_100', 100, true, null);

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.apply_coupon(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coupon record;
BEGIN
  SELECT * INTO _coupon FROM public.coupons
  WHERE code = upper(_code) AND is_active = true;
  
  IF _coupon IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon');
  END IF;
  
  IF _coupon.max_uses IS NOT NULL AND _coupon.current_uses >= _coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit reached');
  END IF;
  
  IF _coupon.valid_until IS NOT NULL AND now() > _coupon.valid_until THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon has expired');
  END IF;
  
  -- Increment usage
  UPDATE public.coupons SET current_uses = current_uses + 1 WHERE id = _coupon.id;
  
  RETURN jsonb_build_object(
    'valid', true,
    'discount_percent', _coupon.discount_percent,
    'code', _coupon.code
  );
END;
$$;
