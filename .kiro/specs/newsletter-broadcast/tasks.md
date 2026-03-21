# Implementation Plan: Newsletter Broadcast

## Overview

Incrementally build the newsletter broadcast feature across backend and frontend. Backend first (schema → service → controller → route → template → wiring), then frontend (API helpers → page → route registration). Property-based tests use Vitest + fast-check.

## Tasks

- [x] 1. Add `newsletterSubscribed` field to User schema and create Newsletter schema
  - [x] 1.1 Add `newsletterSubscribed` boolean field to User schema
    - Add `newsletterSubscribed: { type: Boolean, default: true }` to `backend/src/modules/user/user.schema.js`
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create Newsletter Mongoose schema
    - Create `backend/src/modules/newsletter/newsletter.schema.js`
    - Define fields: `subject` (String, required, trim), `body` (String, required), `sentBy` (ObjectId ref User, required), `sentAt` (Date, default Date.now), `recipientCount` (Number, required)
    - Enable `timestamps: true`
    - _Requirements: 2.1, 2.3_

  - [ ]* 1.3 Write property test: Default subscription opt-in (P1)
    - **Property 1: Default subscription opt-in**
    - Generate random user data without `newsletterSubscribed`; assert it defaults to `true`
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.4 Write property test: Newsletter schema rejects invalid documents (P3)
    - **Property 3: Newsletter schema rejects invalid documents**
    - Generate random strings (including empty) for subject/body; assert schema validation matches expected pass/fail
    - **Validates: Requirements 2.1, 2.3**

- [x] 2. Implement newsletter service layer
  - [x] 2.1 Create newsletter service with `polishDraft`, `sendNewsletter`, and `getHistory`
    - Create `backend/src/modules/newsletter/newsletter.service.js`
    - `polishDraft(draft)`: calls `openaiService.polishNewsletter(draft)`, returns polished text
    - `sendNewsletter(subject, body, adminId)`: queries users where `newsletterSubscribed: true` and `isActive: true`, compiles `newsletter-broadcast` template via `emailService.compileTemplate` per recipient (with per-recipient `unsubscribeLink`), dispatches with `Promise.allSettled`, persists Newsletter document with `recipientCount`
    - `getHistory()`: returns all Newsletter docs sorted by `sentAt` desc, populates `sentBy` with `displayName email`
    - _Requirements: 1.3, 2.2, 3.2, 4.2, 4.3, 4.4, 4.5, 4.7, 4.8, 5.2, 5.3_

  - [ ]* 2.2 Write property test: Recipient filtering (P2)
    - **Property 2: Recipient filtering excludes unsubscribed and inactive users**
    - Generate random arrays of users with varying subscription/active states; assert filtering returns only subscribed+active
    - **Validates: Requirements 1.3, 4.2**

  - [ ]* 2.3 Write property test: Batch dispatch resilience (P8)
    - **Property 8: Batch dispatch resilience**
    - Generate random arrays of settled promise results (fulfilled/rejected); assert all recipients are attempted
    - **Validates: Requirements 4.4**

  - [ ]* 2.4 Write property test: History returns descending order (P10)
    - **Property 10: History returns newsletters in descending chronological order**
    - Generate random arrays of dates; create Newsletter docs; assert getHistory returns descending order
    - **Validates: Requirements 5.2**

- [x] 3. Add `polishNewsletter` method to OpenAI service
  - Add `polishNewsletter(draft)` method to `backend/src/services/openaiService.js`
  - System prompt: "You are a professional copywriter for Trustificate. Rewrite the following draft in a calm, institutional, and trustworthy tone. Return only the rewritten text, no commentary."
  - Model: `gpt-3.5-turbo`, temperature: 0.7, max_tokens: 1024
  - Returns `choices[0].message.content`
  - Throws appropriate errors if API key missing or API call fails
  - _Requirements: 3.2, 3.3, 3.5_

- [x] 4. Create newsletter controller
  - Create `backend/src/modules/newsletter/newsletter.controller.js`
  - `polish` handler: validates `draft` is non-empty (Joi), calls `service.polishDraft`, returns 200 with `{ polishedText }`. On OpenAI error, returns 502 with "AI assistance is temporarily unavailable"
  - `send` handler: validates `subject` and `body` are non-empty (Joi), responds 202 immediately, then calls `service.sendNewsletter` asynchronously
  - `history` handler: calls `service.getHistory`, returns 200 with data array
  - All handlers use `asyncHandler` and `success()`/`error()` response helpers
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1, 4.3, 4.6, 5.1_

- [x] 5. Checkpoint - Ensure backend module compiles
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create newsletter route and email template, wire into app
  - [x] 6.1 Create newsletter route file
    - Create `backend/src/modules/newsletter/newsletter.route.js`
    - `POST /polish` → `protect`, `restrictTo('admin', 'super_admin')`, `controller.polish`
    - `POST /send` → `protect`, `restrictTo('admin', 'super_admin')`, `controller.send`
    - `GET /history` → `protect`, `restrictTo('admin', 'super_admin')`, `controller.history`
    - _Requirements: 3.1, 4.1, 5.1_

  - [x] 6.2 Create `newsletter-broadcast.hbs` email template
    - Create `backend/src/templates/emails/newsletter-broadcast.hbs`
    - Reuse `{{> email-header}}` and `{{> promotional-footer}}` partials
    - Accept `subject` (rendered as `<h1>`), `body` (rendered as paragraph text inside branded white card), `unsubscribeLink` (passed to footer partial)
    - Use Handlebars double-curly escaping for `body` to prevent raw HTML injection
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 6.3 Mount newsletter routes in `backend/src/app.js`
    - Import `newsletterRoutes` from `./modules/newsletter/newsletter.route`
    - Mount at `/api/newsletter` with `requireEmailVerified` middleware
    - _Requirements: 3.1, 4.1, 5.1_

  - [ ]* 6.4 Write property test: Compiled email contains branding and unsubscribe link (P9)
    - **Property 9: Compiled newsletter email contains branding and unsubscribe link**
    - Generate random body text + recipient email; compile template; assert output contains header, footer, unsubscribe link
    - **Validates: Requirements 4.8, 9.1, 9.2, 9.3**

  - [ ]* 6.5 Write property test: Admin-authored HTML is escaped (P14)
    - **Property 14: Admin-authored HTML is escaped in compiled email**
    - Generate random strings containing HTML tags; compile template; assert tags are escaped in output
    - **Validates: Requirements 9.4**

  - [ ]* 6.6 Write property test: Input validation rejects empty fields (P7)
    - **Property 7: Input validation rejects empty fields**
    - Generate random empty/whitespace strings for draft/subject/body; assert 400 response from controller
    - **Validates: Requirements 3.4, 4.6**

- [x] 7. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Build frontend Newsletter page with Compose form and History table
  - [x] 8.1 Create newsletter API helper functions
    - Create `frontend/src/lib/newsletter.ts`
    - Export `polishDraft(draft: string)` → calls `POST /api/newsletter/polish`
    - Export `sendNewsletter(subject: string, body: string)` → calls `POST /api/newsletter/send`
    - Export `fetchNewsletterHistory()` → calls `GET /api/newsletter/history`
    - Define `Newsletter` TypeScript interface: `{ _id, subject, body, sentBy: { _id, displayName, email }, sentAt, recipientCount }`
    - _Requirements: 6.2, 7.2, 8.2_

  - [x] 8.2 Create `Newsletter.tsx` super-admin page
    - Create `frontend/src/pages/super-admin/Newsletter.tsx`
    - Wrap in `SuperAdminLayout` with title "Newsletter"
    - **Compose section**: `react-hook-form` with zod schema `{ subject: z.string().min(1), body: z.string().min(1) }`, subject input, body textarea, "AI Polish" button, "Send Newsletter" button
    - "AI Polish" calls `polishDraft`, replaces body on success, shows toast on error, preserves content on error
    - "Send Newsletter" calls `sendNewsletter`, shows success toast on 202, resets form, invalidates `["newsletter-history"]` query cache
    - Loading/disabled states on both buttons during in-flight requests
    - **History section**: `useQuery({ queryKey: ["newsletter-history"] })` fetching from `fetchNewsletterHistory`
    - Table columns: Subject, Body Preview (truncated ~80 chars), Sender (displayName), Date (formatted), Recipients
    - Loading skeleton while fetching, error state with retry button
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.3 Write property test: Client-side validation prevents empty form submission (P11)
    - **Property 11: Client-side validation prevents empty form submission**
    - Generate random combinations of empty/whitespace subject+body; assert zod schema rejects
    - **Validates: Requirements 6.3**

- [x] 9. Register frontend route and add sidebar navigation
  - [x] 9.1 Add route in `frontend/src/App.tsx`
    - Import `SuperAdminNewsletter` from `./pages/super-admin/Newsletter`
    - Add route: `<Route path="/super-admin/newsletter" element={<ProtectedRoute><SuperAdminGuard><SuperAdminNewsletter /></SuperAdminGuard></ProtectedRoute>} />`
    - _Requirements: 6.1_

  - [x] 9.2 Add "Newsletter" nav item to `SuperAdminLayout.tsx` sidebar
    - Add `{ title: "Newsletter", url: "/super-admin/newsletter", icon: Mail }` to the "Management" group in `navGroups`
    - Import `Mail` from `lucide-react`
    - _Requirements: 6.1_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using Vitest + fast-check
- Unit tests validate specific examples and edge cases
- Backend uses CommonJS (`require`/`module.exports`), frontend uses TypeScript with ES modules
