# Implementation Plan: Email Infrastructure

## Overview

Refactor `emailService.js` to use a Handlebars partial system with brand-consistent inline styles, add 5 new templates, expose `sendTransactional` and `sendPromotional` senders, update all callers, and cover all 12 correctness properties with property-based and unit tests.

## Tasks

- [x] 1. Install dev dependencies and configure Jest
  - Add `jest` and `fast-check` to `devDependencies` in `backend/package.json`
  - Add `"jest": { "testEnvironment": "node" }` config block to `backend/package.json`
  - Add `"test": "jest"` script to `backend/package.json`
  - _Requirements: 7.1_

- [x] 2. Create the four Handlebars partials
  - Create directory `backend/src/templates/emails/partials/`
  - [x] 2.1 Create `email-header.hbs` — deep navy (#1F3A5F) banner, "Trustificate" logo text, tagline "Secure Document Management", all styles inline
    - _Requirements: 1.1, 2.2, 2.3, 8.1, 8.2_
  - [x] 2.2 Create `brand-tokens.hbs` — comment-only partial documenting canonical token values; no rendered output (tokens are authored inline in structural partials)
    - _Requirements: 1.2, 2.6_
  - [x] 2.3 Create `transactional-footer.hbs` — copyright notice, physical address placeholder, website link; NO unsubscribe element or `{{unsubscribeLink}}` reference
    - _Requirements: 1.3, 3.10, 9.3, 9.4_
  - [x] 2.4 Create `promotional-footer.hbs` — copyright notice, physical address placeholder, website link, plus a visible `<a href="{{unsubscribeLink}}">Unsubscribe</a>` anchor
    - _Requirements: 1.4, 4.3, 9.5_

- [x] 3. Rewrite `emailService.js` with partial registration and new API
  - Register all four partials at module load using `PARTIAL_NAMES.forEach` pattern from design; throw descriptive `Error` if any partial file is missing
  - Implement `compileTemplate(templateName, data)`: `fs.existsSync` check → throw `Error(\`Template "${templateName}" not found\`)` if absent → `fs.readFileSync` → `handlebars.compile` → return rendered string
  - Implement `sendTransactional(to, templateName, data, subject)`: call `compileTemplate`, call `transporter.sendMail`, on any error call `logger.error` and throw `AppError(msg, 500)`; `from` defaults to `process.env.FROM_EMAIL || 'noreply@trustificate.com'`
  - Implement `sendPromotional(recipients, templateName, data, subject)`: validate `data.unsubscribeLink` is a non-empty string first (throw `AppError(msg, 400)` if not), then `compileTemplate`, then `transporter.sendMail` × N; same error handling as transactional
  - Keep legacy named exports (`sendVerificationEmail`, `sendPasswordResetEmail`, etc.) as thin wrappers over `sendTransactional` so existing callers continue to work until they are migrated in task 6
  - Export `compileTemplate`, `sendTransactional`, `sendPromotional` in addition to legacy exports
  - _Requirements: 5.1–5.5, 6.1–6.7, 7.1–7.5, 10.3–10.5_

- [x] 4. Rewrite the six existing transactional templates to use partials
  - Each template must use `{{> email-header}}`, an inner content table with inline brand-token styles (white card #ffffff, border-radius 8px, padding 40px), and `{{> transactional-footer}}`; no hardcoded color/font values outside the partials
  - [x] 4.1 Rewrite `welcome.hbs` — variables: `{{userName}}`, `{{dashboardLink}}`
    - _Requirements: 3.1, 2.1–2.5, 8.4, 8.5_
  - [x] 4.2 Rewrite `forgot-password.hbs` — variables: `{{userName}}`, `{{otp}}`, `{{resetLink}}`
    - _Requirements: 3.2, 2.1–2.5_
  - [x] 4.3 Rewrite `certificate-receiver.hbs` — variables: `{{recipientName}}`, `{{issuerName}}`, `{{certificateTitle}}`, `{{certificateLink}}`
    - _Requirements: 3.3, 2.1–2.5_
  - [x] 4.4 Rewrite `certificate-issuer.hbs` — variables: `{{issuerName}}`, `{{recipientName}}`, `{{certificateTitle}}`, `{{issuanceLogLink}}`
    - _Requirements: 3.4, 2.1–2.5_
  - [x] 4.5 Rewrite `password-changed.hbs` — variables: `{{userName}}`, `{{timestamp}}`, `{{supportLink}}`
    - _Requirements: 3.6, 2.1–2.5_
  - [x] 4.6 Rewrite `team-invite.hbs` — variables: `{{orgName}}`, `{{inviterName}}`, `{{joinLink}}`
    - _Requirements: 3.7, 2.1–2.5_

- [x] 5. Add the five new templates
  - [x] 5.1 Create `certificate-revoked.hbs` — transactional; variables: `{{recipientName}}`, `{{certificateTitle}}`, `{{supportLink}}`; uses `{{> transactional-footer}}`
    - _Requirements: 3.5_
  - [x] 5.2 Create `email-verification-otp.hbs` — transactional; variables: `{{userName}}`, `{{otp}}`; uses `{{> transactional-footer}}`
    - _Requirements: 3.8_
  - [x] 5.3 Create `email-verification-link.hbs` — transactional; variables: `{{userName}}`, `{{verificationLink}}`; uses `{{> transactional-footer}}`
    - _Requirements: 3.9_
  - [x] 5.4 Create `feature-announcement.hbs` — promotional; variables: `{{recipientName}}`, `{{featureTitle}}`, `{{featureDescription}}`, `{{ctaLink}}`, `{{ctaLabel}}`, `{{unsubscribeLink}}`; uses `{{> promotional-footer}}`
    - _Requirements: 4.1, 4.4, 4.5_
  - [x] 5.5 Create `plan-upsell.hbs` — promotional; variables: `{{recipientName}}`, `{{currentPlan}}`, `{{targetPlan}}`, `{{benefitsList}}` (rendered via `{{#each}}`), `{{upgradeLink}}`, `{{unsubscribeLink}}`; uses `{{> promotional-footer}}`
    - _Requirements: 4.2, 4.4, 4.5_

- [x] 6. Migrate all callers to the new `sendTransactional` API
  - Update `backend/src/modules/auth/auth.service.js`: replace `sendVerificationLinkEmail`, `sendVerificationEmail`, `sendPasswordResetEmail` calls with `sendTransactional` using the appropriate new template names (`email-verification-link`, `email-verification-otp`, `forgot-password`) and data shapes from the design
  - Update `backend/src/modules/certificate/certificate.service.js`: replace `sendCertificateReceiverEmail` and `sendCertificateIssuerEmail` with `sendTransactional('certificate-receiver', ...)` and `sendTransactional('certificate-issuer', ...)`
  - Update `backend/src/modules/invite/invite.service.js`: replace `sendTeamInviteEmail` with `sendTransactional('team-invite', ...)`
  - Remove legacy wrapper functions from `emailService.js` exports once all callers are migrated
  - _Requirements: 5.1–5.3_

- [x] 7. Checkpoint — verify the service loads and existing flows work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Write property-based tests (fast-check) in `backend/src/services/__tests__/emailService.test.js`
  - Create the test file; import `compileTemplate`, `sendTransactional`, `sendPromotional` from `emailService`; mock `nodemailer` transporter's `sendMail`
  - [ ]* 8.1 Write property test for Property 1: all 11 templates compile without unresolved partials
    - Use `fc.constantFrom(...allTemplateNames)` with valid data per template; assert output is a non-empty string containing no `{{>` sequences
    - **Property 1: All templates compile without unresolved partials**
    - **Validates: Requirements 1.5, 3.1–3.9, 4.1–4.2, 7.2**
  - [ ]* 8.2 Write property test for Property 2: missing partial → descriptive error, no HTML returned
    - Deregister one partial from the Handlebars instance, attempt `compileTemplate`; assert thrown `Error` message contains the partial name
    - **Property 2: Missing partial throws a descriptive error and no HTML is returned**
    - **Validates: Requirements 1.6, 10.1, 10.5**
  - [ ]* 8.3 Write property test for Property 3: missing template name → descriptive error
    - Use `fc.string()` filtered to exclude all valid template names; assert thrown `Error` message contains the template name
    - **Property 3: Missing template name throws a descriptive error and no HTML is returned**
    - **Validates: Requirements 7.3, 10.2, 10.5**
  - [ ]* 8.4 Write property test for Property 4: brand tokens applied as inline styles in all templates
    - Use `fc.constantFrom(...allTemplateNames)` with valid data; assert output contains no `<style>` block, contains `font-family` on body, `color: #1F3A5F` on headings, `background-color: #f8f9fa` on outer wrapper, `background-color: #ffffff` and `border-radius: 8px` on inner card
    - **Property 4: All compiled templates apply brand tokens as inline styles**
    - **Validates: Requirements 2.1–2.5, 8.1, 8.2, 8.4, 8.5**
  - [ ]* 8.5 Write property test for Property 5: footer present in all compiled templates
    - Use `fc.constantFrom(...allTemplateNames)` with valid data; assert output contains copyright notice and website link
    - **Property 5: All compiled templates contain a footer section**
    - **Validates: Requirements 8.3**
  - [ ]* 8.6 Write property test for Property 6: transactional templates contain no unsubscribe content
    - Use `fc.constantFrom(...transactionalNames)` with valid data; assert output does not contain `unsubscribe` (case-insensitive) or `{{unsubscribeLink}}`
    - **Property 6: Transactional templates contain no unsubscribe link**
    - **Validates: Requirements 3.10, 9.3, 9.4**
  - [ ]* 8.7 Write property test for Property 7: promotional templates contain exactly one unsubscribeLink anchor
    - Use `fc.constantFrom(...promotionalNames)` + `fc.webUrl()` for `unsubscribeLink`; assert exactly one `<a>` whose `href` equals the provided URL
    - **Property 7: Promotional templates contain exactly one unsubscribeLink anchor**
    - **Validates: Requirements 4.3, 9.5**
  - [ ]* 8.8 Write property test for Property 8: promotional sender rejects missing/empty unsubscribeLink before compilation
    - Use `fc.option(fc.string())` filtered to empty/null/undefined values; assert `sendPromotional` throws `AppError` before `compileTemplate` is invoked (spy on `compileTemplate`)
    - **Property 8: Promotional sender rejects missing or empty unsubscribeLink before compilation**
    - **Validates: Requirements 6.2, 6.3, 9.1, 9.2**
  - [ ]* 8.9 Write property test for Property 9: promotional sender calls sendMail N times for N recipients
    - Use `fc.array(fc.emailAddress(), { minLength: 1, maxLength: 20 })` with valid promotional data; assert `sendMail` mock call count equals recipients array length
    - **Property 9: Promotional sender dispatches to every recipient exactly once**
    - **Validates: Requirements 6.5**
  - [ ]* 8.10 Write property test for Property 10: transactional sender calls sendMail exactly once
    - Use `fc.emailAddress()` + `fc.constantFrom(...transactionalNames)` with valid data; assert `sendMail` mock called exactly once with matching `to` field
    - **Property 10: Transactional sender dispatches exactly once per call**
    - **Validates: Requirements 5.3**
  - [ ]* 8.11 Write property test for Property 11: dispatch errors are caught, logged, and re-thrown as AppError
    - Mock `sendMail` to throw; use `fc.constantFrom(...allTemplateNames)` with valid data; assert `logger.error` was called and the re-thrown error is an `AppError` instance
    - **Property 11: Nodemailer dispatch errors are caught, logged, and re-thrown as AppError**
    - **Validates: Requirements 10.4**
  - [ ]* 8.12 Write property test for Property 12: repeated compileTemplate calls succeed without re-registration errors
    - Use `fc.constantFrom(...allTemplateNames)` + `fc.integer({ min: 2, max: 10 })` for repeat count; call `compileTemplate` N times in sequence; assert all calls succeed
    - **Property 12: Repeated compileTemplate calls do not cause partial re-registration errors**
    - **Validates: Requirements 7.5**

- [x] 9. Write unit tests in the same test file
  - [ ]* 9.1 Test partial registration at module load — verify all four partials are registered in the Handlebars instance after `require('./emailService')`
    - _Requirements: 7.1_
  - [ ]* 9.2 Test specific variable rendering — compile `welcome` with `{ userName: 'Alice', dashboardLink: 'https://example.com' }` and assert output contains `Alice`
    - _Requirements: 3.1_
  - [ ]* 9.3 Test `from` address fallback — with `FROM_EMAIL` unset, assert `sendMail` is called with `from: 'noreply@trustificate.com'`
    - _Requirements: 5.5, 6.7_
  - [ ]* 9.4 Test `from` address from env — with `FROM_EMAIL=custom@example.com`, assert `sendMail` is called with that address
    - _Requirements: 5.5, 6.7_
  - [ ]* 9.5 Test transactional footer content — assert `transactional-footer.hbs` source does not contain the string `unsubscribe`
    - _Requirements: 9.4_
  - [ ]* 9.6 Test promotional footer content — assert `promotional-footer.hbs` source contains `{{unsubscribeLink}}`
    - _Requirements: 9.5_
  - [ ]* 9.7 Test `benefitsList` rendering — compile `plan-upsell` with a `benefitsList` array and assert each item appears as an `<li>` in the output
    - _Requirements: 4.2_

- [x] 10. Final checkpoint — ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests run a minimum of 100 iterations each (`{ numRuns: 100 }`)
- Each property test must include the comment `// Feature: email-infrastructure, Property N: <property_text>`
- Run tests from the `backend/` directory: `npx jest --testPathPattern=emailService`
