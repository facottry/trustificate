# Product: Trustificate

Trustificate is a SaaS platform for digital credential issuance, management, and verification.

## Core Concepts
- Issuers create organizations, design certificate templates, and issue certificates to recipients
- Recipients receive verifiable digital certificates with unique slugs and QR codes
- Verifiers can validate certificate authenticity via a public verification portal
- External certificates from other platforms can be registered in the system

## User Roles
- Regular users (issuers) — manage templates, issue certificates within their organization
- Admin — organization-level admin with full control over org settings and members
- Super Admin — platform-wide admin with access to all organizations, users, billing, and audit logs

## Key Features
- Template engine for designing certificate layouts
- Single and bulk certificate issuance
- Certificate registry (internal + external)
- Public certificate verification portal
- AI-assisted certificate generation (OpenAI)
- Email notifications (welcome, certificate issued, password reset)
- OTP and link-based email verification
- Marketing pages (blog, docs, testimonials, pricing, careers)

## Pricing Tiers
Free, Starter, Pro, Enterprise — with plan-based feature gating via `usePlanGuard` hook.
