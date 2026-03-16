# Product Requirements Document (PRD): Trustificate

## 1. Product Overview
**Trustificate** is a robust, production-grade SaaS platform designed for the issuance, management, and verification of digital credentials and documents. Positioned as a "Digital Credentials Leader" (akin to DocuSign's authority in signatures), the platform serves as a unified source of truth for both native and external certifications.

### Target Audiences
1. **Issuers:** Organizations, HR teams, and educational institutions creating and distributing credentials.
2. **Recipients:** Individuals earning, storing, and sharing their certifications.
3. **Verifiers:** Employers, auditors, or third parties validating the authenticity of a document.

---

## 2. Design & UX Principles
The platform must project authority, trust, and institutional reliability. Flashy startup aesthetics are strictly avoided.

* **Visual Style:** Calm, professional, and institutional (referencing Stripe Dashboard, Notion Enterprise, GitHub, Udemy).
* **Color Palette:** Deep navy primary (`#1F3A5F` range), neutral grays, teal/gold accents for specific badges. No gradients.
* **Typography:** `Inter` font for clean, highly legible interfaces.
* **UI Components:** Flat components, minimal shadows, clean whitespace, and no unnecessary animations.

---

## 3. Feature Specifications

### 3.1 Public Marketing & SaaS Shell
Trustificate operates as a complete company entity, not just a utility tool.
* **Core Pages:** Landing Page (Hero, Trust Indicators, Certificate Search Bar prominently featured), About Us, Contact, Blog.
* **Legal & Compliance:** Dedicated Terms of Service and Privacy Policy pages.
* **Authentication Flow:** Clean login/signup with auto-confirm, profile setup on first login, and redirection to the dashboard.

### 3.2 Issuer Dashboard & Trust Metrics
* **Metrics:** Total issued, active verified, revoked, and externally registered certificates.
* **Quick Actions:** "New Document", "New Template", "Register External Credential".
* **Recent Activity:** Table of the 10 most recently issued or modified certificates.

### 3.3 Template Engine
* **Pre-loaded Templates:** 10 highly common institutional templates (Course Completion, Training, Achievement Award, Participation, Internship, Workshop, Professional Development, Safety Training, Volunteer Appreciation, Compliance).
* **Management:** Duplicate, edit, activate/deactivate templates with usage counting.
* **Live Preview Editor:** Side-by-side view (form on the left, real-time HTML certificate preview on the right).
* **Customization:** Subtitles, body text with placeholder insertion (`{{variable}}`), color themes, portrait/landscape orientation, signature/seal config, and logo upload.

### 3.4 Multi-Step Issuance & Registry
* **4-Step Issuance Wizard:** 1. Select Template 
    2. Fill Details (auto-derived from placeholders) 
    3. Preview 
    4. Generate (Outputs unique certificate number, shareable link, and QR code).
* **Cross-Reference Registry:** Ability to register and track external certificates (e.g., AWS, GCP, PMP, CISSP, Scrum) by uploading a PDF and linking the original verification URL.
* **Unified Registry Page:** A data table combining both native platform certificates and external credentials, sortable by type, status, and date.

### 3.5 Verification Portal
* **Search Interface:** Public `/verify` endpoint to query certificate numbers.
* **Trust-Focused Certificate Page:**
    * Status badges (Green for Verified, Red for Revoked).
    * "Externally Registered" badges for third-party certs, displaying the original issuer.
    * Verification timestamp and issuer details.
    * QR code linking back to the verification URL.
    * **PDF Export:** High-quality, browser-based A4 PDF download (via `html2canvas` + `jsPDF`).

---

## 4. Technical Architecture 

To ensure the platform scales reliably under high read-volume (verification lookups) and secure write-volume (issuance), the backend requires a strict relational structure.

### 4.1 Core Tech Stack
* **Frontend:** React, Vite, Tailwind CSS, Shadcn UI, TypeScript.
* **Backend & Auth:** Supabase (Lovable Cloud).
* **PDF Generation:** Client-side rendering via HTML to canvas/PDF.

### 4.2 Database Schema Overview

| Table Name | Core Purpose | Key Columns |
| :--- | :--- | :--- |
| `profiles` | User identity & display | `id`, `display_name`, `avatar_url` |
| `organizations` | Tenant management | `id`, `name`, `slug`, `logo_url` |
| `user_roles` | Access control | `user_id`, `org_id`, `role` (admin/user) |
| `certificate_templates`| Visual & data blueprints | `id`, `title`, `placeholders` (jsonb), `is_active`, `layout` |
| `certificates` | Native issued credentials | `id`, `template_id`, `certificate_number`, `status`, `pdf_url` |
| `external_certificates`| Cross-referenced credentials| `id`, `org_id`, `issuer_name`, `original_url`, `pdf_bucket_path` |
| `certificate_events` | Audit logging | `id`, `certificate_id`, `event_type` (issued/revoked/viewed) |

*Note: Strict Row Level Security (RLS) policies must be enforced so Admins have full CRUD access to their own org data, while the public has Read-Only access specifically to `certificates` where `status = 'issued'`.*

---

## 5. SaaS Pricing Model (UI/Structure)

The pricing architecture supports a product-led growth motion, moving from self-serve to enterprise sales.

| Tier | Target User | Key Limitations / Features |
| :--- | :--- | :--- |
| **Free** | Individuals / Hobbyists | Low issuance limit, 2 templates, standard Trustificate branding. |
| **Starter** | Small Businesses | Increased limits, access to all 10 templates, basic external registry. |
| **Pro** | Mid-Market Orgs | High volume, custom branding, full cross-reference registry, API access. |
| **Enterprise**| Large Institutions | Unlimited volume, custom roles/permissions, SLA, dedicated account manager. |