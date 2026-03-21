// Template snapshot utilities for certificate metadata

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
  show_qr_code?: boolean;
  backdrop_image_url?: string | null;
  logo_config?: Record<string, unknown> | null;
}

export function buildTemplateSnapshot(template: any): any {
  // Support both direct snake_case fields (from snapshot) and nested configuration (from Mongoose)
  const config = template.configuration || {};
  return {
    title: template.title ?? "",
    subtitle: template.subtitle ?? config.subtitle ?? null,
    body_text: template.body_text ?? config.body_text ?? "",
    layout: template.layout ?? "landscape",
    color_theme: template.color_theme ?? config.color_theme ?? null,
    background_style: template.background_style ?? config.background_style ?? null,
    signature_config: template.signature_config ?? config.signature_config ?? null,
    seal_config: template.seal_config ?? config.seal_config ?? null,
    show_qr_code: template.show_qr_code ?? config.show_qr_code ?? false,
    backdrop_image_url: template.backdrop_image_url ?? config.backdrop_image_url ?? null,
    logo_config: template.logo_config ?? config.logo_config ?? null,
  };
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
  // Support both old Supabase-style (certificate_templates) and Mongoose populated (templateId)
  const joined = cert.certificate_templates || cert.templateId;
  if (joined && typeof joined === 'object') {
    const config = joined.configuration || {};
    return {
      title: joined.title ?? config.title ?? "",
      subtitle: joined.subtitle ?? config.subtitle ?? null,
      body_text: joined.body_text ?? config.body_text ?? "",
      layout: joined.layout ?? "landscape",
      color_theme: (joined.color_theme ?? config.color_theme ?? null) as any,
      background_style: (joined.background_style ?? config.background_style ?? null) as any,
      signature_config: (joined.signature_config ?? config.signature_config ?? null) as any,
      seal_config: (joined.seal_config ?? config.seal_config ?? null) as any,
      show_qr_code: joined.show_qr_code ?? config.show_qr_code ?? false,
      backdrop_image_url: joined.backdrop_image_url ?? config.backdrop_image_url ?? null,
      logo_config: (joined.logo_config ?? config.logo_config ?? null) as any,
    };
  }

  return null;
}
