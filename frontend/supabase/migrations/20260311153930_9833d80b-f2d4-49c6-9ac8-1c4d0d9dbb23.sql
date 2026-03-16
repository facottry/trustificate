
CREATE OR REPLACE FUNCTION public.backfill_template_snapshots()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer := 0;
  _cert record;
  _tpl record;
  _snapshot jsonb;
BEGIN
  FOR _cert IN
    SELECT c.id, c.template_id, c.metadata_json
    FROM certificates c
    WHERE c.template_id IS NOT NULL
      AND (c.metadata_json IS NULL OR c.metadata_json->>'template_snapshot' IS NULL)
  LOOP
    SELECT title, subtitle, body_text, layout, color_theme, background_style, signature_config, seal_config
    INTO _tpl
    FROM certificate_templates
    WHERE id = _cert.template_id;

    IF _tpl IS NOT NULL THEN
      _snapshot := jsonb_build_object(
        'title', _tpl.title,
        'subtitle', _tpl.subtitle,
        'body_text', _tpl.body_text,
        'layout', _tpl.layout,
        'color_theme', _tpl.color_theme,
        'background_style', _tpl.background_style,
        'signature_config', _tpl.signature_config,
        'seal_config', _tpl.seal_config
      );

      UPDATE certificates
      SET metadata_json = COALESCE(metadata_json, '{}'::jsonb) || jsonb_build_object('template_snapshot', _snapshot)
      WHERE id = _cert.id;

      _count := _count + 1;
    END IF;
  END LOOP;

  RETURN _count;
END;
$$;

-- Run the backfill immediately
SELECT public.backfill_template_snapshots();
