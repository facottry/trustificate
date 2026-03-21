# Implementation Plan: Newsletter Subscription

## Overview

Implement a public newsletter subscription system with double opt-in confirmation, public archive pages, and updated broadcast logic. Backend uses CommonJS, frontend uses TypeScript with shadcn/ui. Work proceeds bottom-up: data models → backend services → API endpoints → email template → frontend API layer → frontend pages → wiring into existing layouts and routes.

## Tasks

- [x] 1. Create Subscriber schema and extend Newsletter schema
  - [x] 1.1 Create `backend/src/modules/subscriber/subscriber.schema.js` with the Subscriber Mongoose model
    - Define fields: `email` (String, required, unique, lowercase, trim, regex match), `confirmationToken` (String, default null), `confirmationExpiry` (Date, default null), `isConfirmed` (Boolean, default false), `confirmedAt` (Date, default null)
    - Enable `timestamps: true`
    - Do NOT add a separate `.index()` call — `unique: true` handles it
    - Export with `module.exports = mongoose.model('Subscriber', subscriberSchema)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Add `slug` field and pre-save hook to `backend/src/modules/newsletter/newsletter.schema.js`
    - Add `slug: { type: String, unique: true, lowercase: true, trim: true }` to the existing schema
    - Add a `pre('save')` hook that auto-generates slug from `subject` + 6-char UUID suffix when `this.isNew && !this.slug`
    - Do NOT add a separate `.index()` call for slug
    - _Requirements: 1b.1, 1b.2, 1b.3_

  - [ ]* 1.3 Write property test for Subscriber schema defaults
    - **Property 1: Subscriber schema defaults**
    - **Validates: Requirements 1.1, 1.3, 1.4**

  - [ ]* 1.4 Write property test for slug generation format
    - **Property 2: Slug generation format**
    - **Validates: Requirements 1b.1, 1b.2, 1b.3**

- [x] 2. Implement Subscriber service layer
  - [x] 2.1 Create `backend/src/modules/subscriber/subscriber.service.js`
    - Implement `subscribe(email)`: check User + Subscriber collections, create/update Subscriber with crypto token, send confirmation email via `emailService`, return generic response
    - Implement `confirmSubscription(token)`: find by token, check expiry, set `isConfirmed: true`, set `confirmedAt`, clear token fields
    - Implement `unsubscribe(email)`: delete Subscriber if found, set User `newsletterSubscribed: false` if found
    - Implement `cleanup()`: delete all unconfirmed Subscribers with expired `confirmationExpiry`, log count
    - Implement `getPublicNewsletters()`: return newsletters sorted by `sentAt` desc, select public fields only (exclude `sentBy`)
    - Implement `getPublicNewsletterBySlug(slug)`: return single newsletter by slug with public fields, or null
    - Use `require` for all imports (CommonJS)
    - Use `AppError` from error middleware for operational errors
    - Use `compileTemplate` and `sendTransactional` from emailService
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 3.2, 3.4, 3.5, 3.6, 4.2, 4.3, 4.5, 7.1, 7.2, 10.2, 10.3, 10.5, 10.6_

  - [ ]* 2.2 Write property test for subscribe creating unconfirmed subscriber
    - **Property 3: Subscribe creates unconfirmed subscriber with token and expiry**
    - **Validates: Requirements 2.2**

  - [ ]* 2.3 Write property test for confirmation setting isConfirmed
    - **Property 6: Confirmation sets isConfirmed and clears token**
    - **Validates: Requirements 3.2**

  - [ ]* 2.4 Write property test for unsubscribe behavior
    - **Property 7: Unsubscribe removes subscriber or updates user**
    - **Validates: Requirements 4.2, 4.3, 4.5**

  - [ ]* 2.5 Write property test for cleanup logic
    - **Property 11: Cleanup deletes only expired unconfirmed subscribers**
    - **Validates: Requirements 7.1**

- [x] 3. Implement Subscriber controller and routes
  - [x] 3.1 Create `backend/src/modules/subscriber/subscriber.controller.js`
    - Implement `subscribe` handler: validate email format, call service, respond 200 or 400
    - Implement `confirm` handler: call service with `:token` param, redirect to frontend `/newsletter/confirm?status=success` or respond 400
    - Implement `unsubscribe` handler: call service with `:email` param, redirect to frontend `/newsletter/unsubscribed` or respond 200
    - Implement `list` handler: call `getPublicNewsletters()`, respond with `success()` helper
    - Implement `detail` handler: call `getPublicNewsletterBySlug()` with `:slug` param, respond 200 or 404
    - Wrap all handlers in `asyncHandler`
    - Use `success()` and `error()` response helpers from `apiResponse.js`
    - _Requirements: 2.1, 2.7, 2.8, 3.1, 3.3, 3.4, 3.5, 3.6, 4.1, 4.4, 4.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 3.2 Create `backend/src/modules/subscriber/subscriber.route.js`
    - Define Express router with all five routes: POST `/subscribe`, GET `/confirm/:token`, GET `/unsubscribe/:email`, GET `/` (list), GET `/:slug` (detail)
    - No auth middleware on any route
    - _Requirements: 2.1, 3.1, 4.1, 10.1, 10.4_

  - [x] 3.3 Mount subscriber routes in `backend/src/modules/public/public.route.js`
    - Add `router.use('/newsletter', require('../subscriber/subscriber.route'))` to the existing public routes file
    - _Requirements: 2.1, 3.1, 4.1, 10.1, 10.4_

  - [ ]* 3.4 Write property test for invalid email rejection
    - **Property 4: Invalid email rejection**
    - **Validates: Requirements 2.7**

  - [ ]* 3.5 Write property test for consistent 200 response
    - **Property 5: Consistent 200 response for all valid subscribe submissions**
    - **Validates: Requirements 2.8**

- [x] 4. Update newsletter broadcast service for dual-collection query
  - [x] 4.1 Update `sendNewsletter()` in `backend/src/modules/newsletter/newsletter.service.js`
    - Import Subscriber model
    - Query both User (newsletterSubscribed + isActive) and Subscriber (isConfirmed) collections with `Promise.all`
    - Deduplicate by email (lowercase), User takes priority
    - Build per-recipient unsubscribe links: User ID-based for users, email-based for subscribers
    - Batch dispatch with `Promise.allSettled` (keep existing BATCH_SIZE)
    - Persist Newsletter with `recipientCount` equal to deduplicated total (slug auto-generated by pre-save hook)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 4.2 Write property test for broadcast recipient deduplication
    - **Property 8: Broadcast recipient deduplication**
    - **Validates: Requirements 5.1, 5.2, 5.5**

  - [ ]* 4.3 Write property test for broadcast unsubscribe link types
    - **Property 9: Broadcast unsubscribe link type per recipient**
    - **Validates: Requirements 5.3, 5.4**

- [x] 5. Checkpoint — Backend complete

- [x] 6. Create confirmation email template
  - [x] 6.1 Create `backend/src/templates/emails/newsletter-subscription-confirm.hbs`
    - Reuse `{{> email-header}}` and `{{> transactional-footer}}` partials
    - Accept `confirmationLink` and `email` template variables
    - Include a CTA button linking to `confirmationLink`
    - Include text noting the 24-hour expiry
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 6.2 Write property test for confirmation email template CTA
    - **Property 10: Confirmation email template contains CTA with link**
    - **Validates: Requirements 6.4**

- [x] 7. Create frontend API layer and shared types
  - [x] 7.1 Create `frontend/src/lib/publicNewsletter.ts`
    - Define `PublicNewsletter` interface with `_id`, `subject`, `body`, `slug`, `sentAt`, `recipientCount`
    - Implement `subscribeToNewsletter(email)` — POST to `/api/public/newsletter/subscribe`
    - Implement `fetchPublicNewsletters()` — GET `/api/public/newsletter`
    - Implement `fetchPublicNewsletterBySlug(slug)` — GET `/api/public/newsletter/:slug`
    - Use `apiClient` from `@/lib/apiClient`
    - _Requirements: 8.2, 11.2, 12.2_

  - [x] 7.2 Add `newsletterSubscribed?: boolean` to `AuthUser` interface in `frontend/src/hooks/useAuth.tsx`
    - _Requirements: 11.7_

- [x] 8. Create frontend components
  - [x] 8.1 Create `frontend/src/components/SubscribeForm.tsx`
    - Email input + submit button using react-hook-form + zod validation
    - Call `subscribeToNewsletter()` on submit
    - Show success message on 200, toast error on failure (sonner)
    - Loading/disabled state on submit button
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.2 Create `frontend/src/components/NewsletterCTA.tsx`
    - Use `useAuth()` to check user state
    - If user is null (anonymous) → render `<SubscribeForm />`
    - If user is logged in and `newsletterSubscribed === false` → render `<SubscribeForm />`
    - If user is logged in and `newsletterSubscribed === true` → render welcome message
    - _Requirements: 11.7, 12.6_

- [x] 9. Create frontend pages
  - [x] 9.1 Create `frontend/src/pages/NewsletterArchive.tsx`
    - Route: `/newsletter`, uses `PublicLayout`
    - Fetch from `GET /api/public/newsletter` via `useQuery`
    - Render list: subject as link to `/newsletter/:slug`, truncated body preview, formatted date
    - Include `NewsletterCTA` component
    - Loading skeleton, error state with retry
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 9.2 Create `frontend/src/pages/NewsletterDetail.tsx`
    - Route: `/newsletter/:slug`, uses `PublicLayout`
    - Fetch from `GET /api/public/newsletter/:slug` via `useQuery`
    - Display full subject heading, complete body, formatted date
    - Set `document.title` to newsletter subject
    - Link back to `/newsletter`
    - Include `NewsletterCTA` component
    - 404 handling for unknown slugs
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [x] 9.3 Create `frontend/src/pages/NewsletterConfirm.tsx`
    - Route: `/newsletter/confirm`, uses `PublicLayout`
    - Read `token` from query params on mount
    - Call `GET /api/public/newsletter/confirm/:token`
    - Show success or error message based on response
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.4 Create `frontend/src/pages/NewsletterUnsubscribed.tsx`
    - Route: `/newsletter/unsubscribed`, uses `PublicLayout`
    - Static page confirming unsubscription
    - Link back to home page
    - _Requirements: 9.4_

  - [ ]* 9.5 Write property test for archive page rendering
    - **Property 15: Archive page renders newsletter info with links**
    - **Validates: Requirements 11.3, 11.4**

  - [ ]* 9.6 Write property test for detail page rendering
    - **Property 16: Detail page renders full content and sets document title**
    - **Validates: Requirements 12.3, 12.4, 12.8**

- [x] 10. Wire frontend routes and navigation
  - [x] 10.1 Add new routes to `frontend/src/App.tsx`
    - Add `/newsletter` → `NewsletterArchive` wrapped in `OptionalProtectedRoute`
    - Add `/newsletter/confirm` → `NewsletterConfirm` wrapped in `OptionalProtectedRoute`
    - Add `/newsletter/unsubscribed` → `NewsletterUnsubscribed` wrapped in `OptionalProtectedRoute`
    - Add `/newsletter/:slug` → `NewsletterDetail` wrapped in `OptionalProtectedRoute`
    - Place `/newsletter/confirm` and `/newsletter/unsubscribed` BEFORE `/newsletter/:slug` to avoid slug matching
    - _Requirements: 9.1, 9.4, 11.1, 12.1_

  - [x] 10.2 Add "Newsletter" link to `navLinks` in `frontend/src/components/PublicLayout.tsx`
    - Insert `{ label: "Newsletter", href: "/newsletter" }` between "Blog" and "About"
    - _Requirements: 11.8_

  - [x] 10.3 Add `NewsletterCTA` component to `frontend/src/pages/Index.tsx`
    - Place in a dedicated section before the footer
    - _Requirements: 8.6_

- [ ] 11. Checkpoint — Add public archive API tests
  - [ ]* 11.1 Write property test for archive sorted descending
    - **Property 12: Public archive sorted descending by sentAt**
    - **Validates: Requirements 10.2**

  - [ ]* 11.2 Write property test for archive excluding admin info
    - **Property 13: Public archive excludes admin info**
    - **Validates: Requirements 10.3**

  - [ ]* 11.3 Write property test for slug lookup round-trip
    - **Property 14: Slug lookup round-trip**
    - **Validates: Requirements 10.5**

- [x] 12. Final checkpoint — Ensure all tests pass

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Backend uses CommonJS (`require`/`module.exports`) — do not use ES module syntax
- Do NOT add redundant `.index()` calls when `unique: true` is already set on a Mongoose field
- Frontend uses TypeScript, shadcn/ui, react-hook-form + zod, TanStack React Query, sonner for toasts
- Property tests use `fast-check` with Vitest as the test runner
- Checkpoints ensure incremental validation
