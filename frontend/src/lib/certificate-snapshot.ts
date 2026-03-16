import type { Json } from "@/integrations/supabase/types";

/**
 * Build an immutable template snapshot to store in certificate metadata_json.
 * This ensures public certificate rendering is identical regardless of auth state,
 * since anon users cannot read certificate_templates via RLS.
 */
export interface TemplateSnapshot {
  title: string;
  subtitle: string | null;
  body_text: string;
  layout: "portrait" | "landscape";
  color_theme: Record<string, string> | null;
  background_style: Record<string, string> | null;
  signature_config: Record<string, unknown> | null;
  seal_config: Record<string, unknown> | null;
}

export function buildTemplateSnapshot(template: any): Json {
  return {
    title: template.title ?? "",
    subtitle: template.subtitle ?? null,
    body_text: template.body_text ?? "",
    layout: template.layout ?? "landscape",
    color_theme: template.color_theme ?? null,
    background_style: template.background_style ?? null,
    signature_config: template.signature_config ?? null,
    seal_config: template.seal_config ?? null,
  } as Json;
}

/**
 * Extract template-like data from a certificate's metadata_json snapshot,
 * falling back to the joined template if the snapshot doesn't exist.
 */
export function getTemplateFromCertificate(cert: any): TemplateSnapshot | null {
  // Prefer the immutable snapshot stored at issue time
  const meta = cert.metadata_json;
  if (meta?.template_snapshot) {
    return meta.template_snapshot as TemplateSnapshot;
  }

  // Fallback to joined template (only works for authenticated org members)
  if (cert.certificate_templates) {
    return {
      title: cert.certificate_templates.title,
      subtitle: cert.certificate_templates.subtitle,
      body_text: cert.certificate_templates.body_text,
      layout: cert.certificate_templates.layout,
      color_theme: cert.certificate_templates.color_theme as any,
      background_style: cert.certificate_templates.background_style as any,
      signature_config: cert.certificate_templates.signature_config as any,
      seal_config: cert.certificate_templates.seal_config as any,
    };
  }

  return null;
}
