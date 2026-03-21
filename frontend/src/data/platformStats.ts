/**
 * Platform-wide display stats — single source of truth.
 * Update these values as the platform grows.
 * Used by: landing page, testimonials page, fallback stats hook.
 */
export const PLATFORM_STATS = {
  CERTIFICATES_ISSUED: 250,
  CERTIFICATES_ISSUED_LABEL: "250+",
  ORGANIZATIONS: 10,
  ORGANIZATIONS_LABEL: "10+",
  VERIFICATION_RATE: "99.9%",
  UPTIME_SLA: "99.9%",
  COUNTRIES_SERVED: 3,
  COUNTRIES_SERVED_LABEL: "3+",
  VERIFICATIONS: 750,
  VERIFICATIONS_LABEL: "750+",
  TEMPLATES: 30,
} as const;
