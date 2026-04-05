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
- Super Admin — platform-wide admin with access to all organizations, users, billing, plans, templates, and audit logs

## Authentication
- Email/password with OTP and link-based email verification
- Google Sign-In (OAuth popup + One Tap auto-prompt for unauthenticated visitors)
- GitHub OAuth (redirect flow)
- Account unification: same email across providers maps to a single user profile
- Social login users skip email verification (provider-verified)
- Social-only users (no password) get guided to use their social provider on forgot-password

## Mascot: Rusti
- Animated seal mascot with 6 mood-specific images (idle, working, success, proud, verified, search)
- Sound effects, emoji bursts on click, sparkle particles, thought bubbles on hover
- Tip widget on dashboard with per-tip color gradients and random mascot poses
- Easter egg: click counter badge after 5 clicks

## Key Features
- Template engine with categories (Professional, Academic, Sports, Participation, Achievement, Corporate, Creative, Government), color themes, descriptions, sample PDF/image URLs, and 3D flip card preview
- Single and bulk certificate issuance with template selection UX (Default/Custom tabs, color preview, category badges)
- Certificate registry (internal + external)
- Public certificate verification portal
- AI-assisted certificate generation (OpenAI)
- Email notifications (welcome, certificate issued, password reset)
- Avatar upload (R2) + Google profile picture auto-import
- App version display in footer and sidebar (frontend + backend via X-App-Version header)
- Newsletter system with public archive

## Pricing Tiers
Free, Starter, Pro, Enterprise — stored in MongoDB, editable by super admin via `/super-admin/plans`. Public pricing page fetches from `GET /api/public/plans`. Plan-based feature gating via `usePlanGuard` hook.

## Super Admin Capabilities
- Dashboard with platform-wide stats
- User management (role assignment)
- Organization management (plan changes)
- Template management (edit sample URLs, descriptions, categories for any template including system ones)
- Plan management (edit pricing, limits, features, display text — changes take effect immediately, no deployment needed)
- Certificate management (status changes)
- Billing overview (orders, coupons)
- Audit logs
- Newsletter management

## Testing
- Vitest: 96 unit tests covering lib, hooks, components, and pages
- Playwright: 53 E2E tests covering navigation, auth pages, responsive design, accessibility, and verification flow
- Coverage reporting via `npm run test:coverage`
