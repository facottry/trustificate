
CREATE OR REPLACE FUNCTION public.generate_certificate_number(_prefix text DEFAULT 'CERT'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _rand_hex TEXT;
  _year TEXT;
  _check TEXT;
BEGIN
  _rand_hex := upper(encode(gen_random_bytes(4), 'hex'));
  _year := extract(year from now())::text;
  _check := upper(substr(encode(gen_random_bytes(2), 'hex'), 1, 4));
  RETURN _prefix || '-' || _year || '-' || _rand_hex || '-' || _check;
END;
$function$;
