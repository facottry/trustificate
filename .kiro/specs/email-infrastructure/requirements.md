# Requirements Document

## Introduction

This document defines the requirements for a unified email infrastructure for the Trustificate SaaS platform. The system must support two distinct email categories: real-time transactional emails (lifecycle alerts such as welcome, OTP, certificate issued, certificate revoked) and scheduled promotional emails (marketing, feature announcements, plan upsells). Both categories must share a strictly enforced institutional brand identity (deep navy #1F3A5F, neutral grays, clean typography) through a Handlebars-based partial system. The backend is Node.js/Express (CommonJS) using Nodemailer with existing `.hbs` templates in `backend/src/templates/emails/`.

---

## Glossary

- **Email_Service**: The Node.js module (`emailService.js`) responsible for compiling Handlebars templates and dispatching email via Nodemailer.
- **Template_Engine**: The Handlebars compilation layer that registers partials, inlines CSS tokens, and renders final HTML.
- **Partial**: A reusable Handlebars fragment (header, footer, styles) registered once and included by all templates via `{{> partialName}}`.
- **Brand_Tokens**: The canonical set of CSS design values (color palette, typography, spacing) defined in a single shared partial and injected into every email at compile time.
- **Transactional_Email**: An automated, single-recipient email triggered by a user lifecycle event (e.g., welcome, OTP, certificate issued, certificate revoked, password changed, team invite).
- **Promotional_Email**: A bulk or scheduled email sent for marketing purposes (e.g., feature announcements, plan upsells) that requires a mandatory unsubscribe link.
- **Transactional_Footer**: The standard email footer containing copyright notice, physical address, and website link — used exclusively on transactional emails, with no unsubscribe link.
- **Promotional_Footer**: The email footer used exclusively on promotional emails, containing copyright notice, physical address, website link, and a mandatory one-click unsubscribe link.
- **Unsubscribe_Link**: A unique, one-click URL passed as `{{unsubscribeLink}}` that allows a recipient to opt out of promotional emails, required by CAN-SPAM regulations.
- **CSS_Inlining**: The process by which the Template_Engine injects Brand_Token styles directly into HTML element `style` attributes at compile time, ensuring compatibility with Gmail and Outlook.
- **Transactional_Sender**: The Email_Service method optimised for immediate, single-recipient delivery of Transactional_Emails.
- **Promotional_Sender**: The Email_Service method optimised for bulk delivery of Promotional_Emails, with pre-send validation of required variables.

---

## Requirements

### Requirement 1: Shared Brand Partials

**User Story:** As a developer, I want all emails to share a single set of reusable Handlebars partials for the header, footer variants, and CSS tokens, so that brand consistency is enforced at the template level and style changes require editing only one file.

#### Acceptance Criteria

1. THE Template_Engine SHALL register a header partial containing the Trustificate logo text, the deep navy (#1F3A5F) banner background, and a tagline, before any template is compiled.
2. THE Template_Engine SHALL register a Brand_Tokens partial containing all canonical CSS values (font family: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`; primary color: `#1F3A5F`; body background: `#f8f9fa`; card background: `#ffffff`; muted text: `#6c757d`; body text: `#495057`; border color: `#e9ecef`; max width: `600px`).
3. THE Template_Engine SHALL register a Transactional_Footer partial containing the copyright notice, physical address placeholder, and website link, with no unsubscribe link present.
4. THE Template_Engine SHALL register a Promotional_Footer partial containing the copyright notice, physical address placeholder, website link, and a rendered `{{unsubscribeLink}}` anchor element.
5. WHEN the Template_Engine compiles any template, THE Template_Engine SHALL resolve all `{{> partialName}}` includes from the registered partial registry before rendering the final HTML string.
6. IF a required partial is not found in the registry at compile time, THEN THE Template_Engine SHALL throw a descriptive error identifying the missing partial name and SHALL NOT return a compiled HTML string.

---

### Requirement 2: CSS Inlining at Compile Time

**User Story:** As a developer, I want the Brand_Tokens CSS to be injected inline into every compiled email, so that the emails render correctly in email clients such as Gmail and Outlook that strip `<style>` blocks.

#### Acceptance Criteria

1. WHEN the Template_Engine compiles a template, THE Template_Engine SHALL inject Brand_Token values as inline `style` attributes on all structural HTML elements rather than relying on a `<style>` block or external stylesheet.
2. THE Template_Engine SHALL apply the canonical font family to the `<body>` element of every compiled email.
3. THE Template_Engine SHALL apply the primary color (#1F3A5F) to all heading elements (`h1`, `h2`, `h3`) via inline styles sourced from the Brand_Tokens partial.
4. THE Template_Engine SHALL apply the body background color (#f8f9fa) to the outer wrapper table of every compiled email.
5. THE Template_Engine SHALL apply the card background color (#ffffff) and a border-radius of `8px` to the inner content table of every compiled email.
6. THE Brand_Tokens partial SHALL be the single source of truth for all style values; no individual template file SHALL hardcode a color, font, or spacing value that duplicates a value already defined in the Brand_Tokens partial.

---

### Requirement 3: Transactional Email Templates

**User Story:** As a platform user, I want to receive clear, direct transactional emails for every lifecycle event, so that I am informed of account and certificate activity without marketing noise.

#### Acceptance Criteria

1. THE Template_Engine SHALL provide a compiled template for the Welcome event, accepting variables `{{userName}}` and `{{dashboardLink}}`, using the header partial, content wrapper, and Transactional_Footer partial.
2. THE Template_Engine SHALL provide a compiled template for the OTP / Password Reset event, accepting variables `{{userName}}`, `{{otp}}`, and `{{resetLink}}`, using the header partial, content wrapper, and Transactional_Footer partial.
3. THE Template_Engine SHALL provide a compiled template for the Certificate Issued (receiver) event, accepting variables `{{recipientName}}`, `{{issuerName}}`, `{{certificateTitle}}`, and `{{certificateLink}}`, using the header partial, content wrapper, and Transactional_Footer partial.
4. THE Template_Engine SHALL provide a compiled template for the Certificate Issued (issuer confirmation) event, accepting variables `{{issuerName}}`, `{{recipientName}}`, `{{certificateTitle}}`, and `{{issuanceLogLink}}`, using the header partial, content wrapper, and Transactional_Footer partial.
5. THE Template_Engine SHALL provide a compiled template for the Certificate Revoked event, accepting variables `{{recipientName}}`, `{{certificateTitle}}`, and `{{supportLink}}`, using the header partial, content wrapper, and Transactional_Footer partial.
6. THE Template_Engine SHALL provide a compiled template for the Password Changed event, accepting variables `{{userName}}`, `{{timestamp}}`, and `{{supportLink}}`, using the header partial, content wrapper, and Transactional_Footer partial.
7. THE Template_Engine SHALL provide a compiled template for the Team Invite event, accepting variables `{{orgName}}`, `{{inviterName}}`, and `{{joinLink}}`, using the header partial, content wrapper, and Transactional_Footer partial.
8. THE Template_Engine SHALL provide a compiled template for the Email Verification (OTP) event, accepting variables `{{userName}}` and `{{otp}}`, using the header partial, content wrapper, and Transactional_Footer partial.
9. THE Template_Engine SHALL provide a compiled template for the Email Verification (link) event, accepting variables `{{userName}}` and `{{verificationLink}}`, using the header partial, content wrapper, and Transactional_Footer partial.
10. IF a transactional template is compiled, THEN the compiled HTML output SHALL NOT contain any unsubscribe link or Promotional_Footer content.

---

### Requirement 4: Promotional Email Templates

**User Story:** As a marketing operator, I want to send branded promotional emails for feature announcements and plan upsells, so that recipients receive consistent, professional communications that comply with CAN-SPAM regulations.

#### Acceptance Criteria

1. THE Template_Engine SHALL provide a compiled template for the Feature Announcement event, accepting variables `{{recipientName}}`, `{{featureTitle}}`, `{{featureDescription}}`, `{{ctaLink}}`, `{{ctaLabel}}`, and `{{unsubscribeLink}}`, using the header partial, content wrapper, and Promotional_Footer partial.
2. THE Template_Engine SHALL provide a compiled template for the Plan Upsell event, accepting variables `{{recipientName}}`, `{{currentPlan}}`, `{{targetPlan}}`, `{{benefitsList}}`, `{{upgradeLink}}`, and `{{unsubscribeLink}}`, using the header partial, content wrapper, and Promotional_Footer partial.
3. IF a promotional template is compiled, THEN the compiled HTML output SHALL contain exactly one rendered unsubscribe anchor element sourced from the Promotional_Footer partial.
4. THE Template_Engine SHALL apply the same Brand_Token styles (header, typography, card layout, footer structure) to promotional templates as to transactional templates, with no deviation in color palette, font family, or structural dimensions.
5. IF a promotional template is compiled, THEN the compiled HTML output SHALL NOT contain heavy gradients, neon colors, or informal design elements inconsistent with the institutional brand identity.

---

### Requirement 5: Transactional Sender

**User Story:** As a backend developer, I want a dedicated sending method for transactional emails, so that lifecycle alerts are dispatched immediately to a single recipient without bulk-sending overhead.

#### Acceptance Criteria

1. THE Transactional_Sender SHALL accept a recipient email address, a template name, and a data object as parameters.
2. WHEN the Transactional_Sender is called, THE Transactional_Sender SHALL invoke the Template_Engine to compile the named template with the provided data object before dispatching.
3. WHEN the Template_Engine compilation succeeds, THE Transactional_Sender SHALL dispatch the compiled HTML to the single recipient via Nodemailer within the same request lifecycle.
4. IF the Template_Engine throws an error during compilation, THEN THE Transactional_Sender SHALL catch the error, log it via the Winston logger, and re-throw an AppError so the calling controller receives a structured failure response.
5. THE Transactional_Sender SHALL set the `from` address to the value of the `FROM_EMAIL` environment variable, falling back to `noreply@trustificate.com`.

---

### Requirement 6: Promotional Sender

**User Story:** As a backend developer, I want a dedicated sending method for promotional emails, so that bulk marketing dispatches are validated for legal compliance before sending.

#### Acceptance Criteria

1. THE Promotional_Sender SHALL accept a list of recipient email addresses, a template name, and a data object as parameters.
2. BEFORE compiling the template, THE Promotional_Sender SHALL validate that the data object contains a non-empty `unsubscribeLink` string.
3. IF the `unsubscribeLink` field is absent or empty in the data object, THEN THE Promotional_Sender SHALL reject the payload by throwing an AppError with a descriptive message and SHALL NOT invoke the Template_Engine or dispatch any email.
4. WHEN the `unsubscribeLink` validation passes, THE Promotional_Sender SHALL invoke the Template_Engine to compile the named template with the provided data object.
5. WHEN compilation succeeds, THE Promotional_Sender SHALL dispatch the compiled HTML to each recipient address in the provided list via Nodemailer.
6. IF the Template_Engine throws an error during compilation, THEN THE Promotional_Sender SHALL catch the error, log it via the Winston logger, and re-throw an AppError.
7. THE Promotional_Sender SHALL set the `from` address to the value of the `FROM_EMAIL` environment variable, falling back to `noreply@trustificate.com`.

---

### Requirement 7: Partial Registration and Template Compilation Pipeline

**User Story:** As a developer, I want the Template_Engine to register all partials at application startup and expose a single compile function, so that all templates share the same registered partial context and compilation is consistent.

#### Acceptance Criteria

1. THE Template_Engine SHALL register all partials (header, Brand_Tokens, Transactional_Footer, Promotional_Footer) once at module load time before any compile call is made.
2. THE Template_Engine SHALL expose a `compileTemplate(templateName, data)` function that reads the named `.hbs` file from the templates directory, compiles it with the registered Handlebars instance, and returns the rendered HTML string.
3. WHEN `compileTemplate` is called with a template name that does not correspond to an existing `.hbs` file, THE Template_Engine SHALL throw an error identifying the missing template name.
4. THE Template_Engine SHALL use the same Handlebars instance for both partial registration and template compilation, ensuring partials are available in all compile calls.
5. THE Template_Engine SHALL NOT re-register partials on every compile call; partials SHALL be registered once at initialisation.

---

### Requirement 8: Brand Consistency Across Email Categories

**User Story:** As a recipient, I want every email from Trustificate — whether transactional or promotional — to look like it came from the same company, so that I trust the sender and recognise the brand.

#### Acceptance Criteria

1. FOR ALL compiled transactional and promotional email templates, the rendered HTML SHALL contain the Trustificate header with the deep navy (#1F3A5F) background sourced from the header partial.
2. FOR ALL compiled transactional and promotional email templates, the rendered HTML SHALL use the font family `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` on the body element.
3. FOR ALL compiled transactional and promotional email templates, the rendered HTML SHALL contain a footer section with the copyright notice and website link sourced from either the Transactional_Footer or Promotional_Footer partial.
4. FOR ALL compiled transactional and promotional email templates, the content area SHALL use a white card (`#ffffff`) with `8px` border-radius and consistent padding of `40px` on all sides.
5. FOR ALL compiled transactional and promotional email templates, the primary call-to-action button SHALL use the deep navy (#1F3A5F) background color and white text.

---

### Requirement 9: Legal Compliance — Unsubscribe Enforcement

**User Story:** As a compliance officer, I want the system to enforce the presence of an unsubscribe link on all promotional emails and its absence on all transactional emails, so that the platform complies with CAN-SPAM regulations.

#### Acceptance Criteria

1. WHEN a promotional email is dispatched, THE Promotional_Sender SHALL verify that `unsubscribeLink` is present and non-empty in the data payload before compilation.
2. IF `unsubscribeLink` is missing from a promotional email payload, THEN THE Promotional_Sender SHALL abort the send and return an error without dispatching any email.
3. WHEN a transactional email is dispatched, THE Transactional_Sender SHALL use only the Transactional_Footer partial, which contains no unsubscribe link.
4. THE Transactional_Footer partial SHALL NOT contain any unsubscribe link element or `{{unsubscribeLink}}` variable reference.
5. THE Promotional_Footer partial SHALL contain a visible, clickable anchor element that renders the `{{unsubscribeLink}}` variable as its `href` attribute.

---

### Requirement 10: Error Handling and Graceful Degradation

**User Story:** As a developer, I want the email system to fail gracefully with structured errors when templates or partials are missing, so that broken HTML is never sent to recipients and failures are observable in logs.

#### Acceptance Criteria

1. IF the Template_Engine cannot locate a required partial at compile time, THEN THE Template_Engine SHALL throw an error with a message identifying the missing partial name and SHALL NOT return a partial or empty HTML string.
2. IF the Template_Engine cannot locate the requested `.hbs` template file, THEN THE Template_Engine SHALL throw an error with a message identifying the missing template name and SHALL NOT return an empty HTML string.
3. WHEN the Transactional_Sender or Promotional_Sender catches a compilation error, THE Email_Service SHALL log the full error details using the Winston logger before re-throwing.
4. WHEN the Transactional_Sender or Promotional_Sender catches a Nodemailer dispatch error, THE Email_Service SHALL log the full error details using the Winston logger and re-throw an AppError.
5. IF an email send is aborted due to a missing partial or missing template, THEN THE Email_Service SHALL NOT invoke `transporter.sendMail` with incomplete or empty HTML content.
