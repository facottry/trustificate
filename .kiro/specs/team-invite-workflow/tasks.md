# Implementation Plan: Team Invite Workflow

## Overview

Implement the team invite workflow end-to-end: extend the Organization schema, add `team_members` plan limits, build the Invite module (schema → service → controller → routes), add the invite email template, update the frontend Settings page with enterprise gating and invite management, create the AcceptInvite page, and wire everything together.

## Tasks

- [x] 1. Extend Organization schema and planConfig
  - [x] 1.1 Add optional fields to `backend/src/modules/organization/organization.schema.js`
    - Add `website` (String, URL validator), `industry` (String), `description` (String, maxlength 500), `contactEmail` (String, email validator) — all optional with `default: null`
    - _Requirements: 1.1_

  - [ ]* 1.2 Write property test for Organization additional fields round-trip
    - **Property 1: Organization additional fields round-trip**
    - **Validates: Requirements 1.1, 1.2**
    - Use `fc.record({ website: fc.oneof(fc.constant(null), fc.webUrl()), industry: fc.oneof(fc.constant(null), fc.string()), description: fc.oneof(fc.constant(null), fc.string({ maxLength: 500 })), contactEmail: fc.oneof(fc.constant(null), fc.emailAddress()) })` to generate valid field combinations
    - Assert that saving and re-fetching returns identical values
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

  - [ ]* 1.3 Write property test for invalid Organization field rejection
    - **Property 2: Invalid organization field values are rejected**
    - **Validates: Requirements 1.4, 1.5**
    - Generate strings that do NOT match `^https?://.+` for website and strings that do NOT match `\S+@\S+\.\S+` for contactEmail; assert Mongoose validation throws
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

  - [x] 1.4 Add `team_members` limit to all plans in `backend/src/utils/planConfig.js`
    - `free: 1`, `starter: 3`, `pro: 10`, `enterprise: -1`
    - _Requirements: 8.4, 8.5_

  - [x] 1.5 Add slug uniqueness validation to `updateOrganization` in `backend/src/modules/organization/organization.service.js`
    - When `data.slug` is present and differs from the current slug, query for an existing org with that slug and throw `AppError('Organization slug already in use', 409)` if found
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 1.6 Write property test for slug validation rules
    - **Property 3: Slug validation rules**
    - **Validates: Requirements 2.2**
    - Generate arbitrary strings; assert the slug is accepted iff it matches `/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/` (3–60 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphen)
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

- [x] 2. Create Invite schema
  - [x] 2.1 Create `backend/src/modules/invite/invite.schema.js`
    - Fields: `email`, `organizationId` (ref Organization), `invitedBy` (ref User), `role` (enum admin/user, default user), `token` (unique), `status` (enum pending/accepted/expired/revoked, default pending), `expiresAt`
    - Partial unique index on `{ email, organizationId }` where `status: 'pending'` to prevent duplicate pending invites
    - _Requirements: 3.1, 3.4_

- [x] 3. Implement Invite service
  - [x] 3.1 Create `backend/src/modules/invite/invite.service.js` with all five methods
    - `createInvite(email, organizationId, invitedBy, role)`: check enterprise plan, check team_members limit via `enforcePlanLimit` logic, check duplicate pending invite (409), check user already a member (409), generate `crypto.randomBytes(32).toString('hex')` token, set `expiresAt = now + 7 days`, create Invite doc, call `sendTeamInviteEmail`
    - `acceptInvite(token, userId)`: find invite by token (404 if missing), check status pending (handle expired → update status + 410, revoked → 400), check user not in another org (409), create Role record, update `User.organizationId`, set status `accepted`, increment `team_members` usage via `usageService.incrementUsage`
    - `getInviteByToken(token)`: find and populate `organizationId` and `invitedBy`
    - `listInvitesForOrg(organizationId)`: return all invites sorted by `createdAt` descending
    - `revokeInvite(inviteId, organizationId)`: find invite belonging to org, set status `revoked`
    - _Requirements: 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.6, 6.1, 6.2, 8.3_

  - [ ]* 3.2 Write property test for invite creation invariants
    - **Property 4: Invite creation invariants**
    - **Validates: Requirements 3.2, 3.3, 4.1**
    - For any valid invite creation, assert token is hex string ≥ 64 chars, `expiresAt` is within ±1 second of `now + 7 days`, and `status === 'pending'`
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

  - [ ]* 3.3 Write property test for enterprise plan gating
    - **Property 6: Enterprise plan gating**
    - **Validates: Requirements 4.5, 6.4**
    - For any org with plan not equal to `'enterprise'`, assert all invite endpoints return 403 with message "Team invites are available on the Enterprise plan only"
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

  - [ ]* 3.4 Write property test for team members limit enforcement
    - **Property 7: Team members limit enforcement**
    - **Validates: Requirements 4.6, 8.4**
    - For any org at its `team_members` limit, assert `createInvite` throws a 403 plan-limit error
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

  - [ ]* 3.5 Write property test for invite acceptance round-trip
    - **Property 8: Invite acceptance round-trip**
    - **Validates: Requirements 5.1, 5.4**
    - For any valid pending non-expired invite and a user with no org, assert `acceptInvite` creates a Role record, sets `user.organizationId`, and sets invite status to `'accepted'`
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

  - [ ]* 3.6 Write property test for revoke then accept fails
    - **Property 9: Revoke then accept fails**
    - **Validates: Requirements 6.2**
    - For any pending invite, assert that revoking sets status to `'revoked'` and subsequent `acceptInvite` call fails with an error
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

  - [ ]* 3.7 Write property test for invite list sorted descending
    - **Property 10: Invite list sorted descending by creation date**
    - **Validates: Requirements 6.1**
    - For any org with N ≥ 2 invites, assert `listInvitesForOrg` returns them with `createdAt` values in non-increasing order
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

  - [ ]* 3.8 Write property test for non-admin access denied
    - **Property 11: Non-admin access denied for invite management**
    - **Validates: Requirements 6.3**
    - For any user with role `'user'`, assert list/send/revoke invite endpoints return 403
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

- [x] 4. Add invite email template and emailService function
  - [x] 4.1 Create `backend/src/templates/emails/team-invite.hbs`
    - Include inviter display name, organization name, and a prominent CTA button linking to `{{joinLink}}`
    - Match the styling of existing templates (gradient header, white body, footer)
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 4.2 Add `sendTeamInviteEmail(email, orgName, inviterName, joinLink)` to `backend/src/services/emailService.js`
    - Subject: `"You've been invited to join {orgName} on Trustificate"`
    - Use `compileTemplate('team-invite', { orgName, inviterName, joinLink })`
    - Export the new function
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 4.3 Write property test for invite email content
    - **Property 5: Invite email contains required information**
    - **Validates: Requirements 10.2, 10.3, 10.4**
    - For any `(inviterName, orgName, token)` triple, assert the compiled template HTML contains `inviterName`, `orgName`, the join link `{FRONTEND_URL}/accept-invite?token={token}`, and the subject contains `orgName`
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

- [x] 5. Implement Invite controller and routes
  - [x] 5.1 Create `backend/src/modules/invite/invite.controller.js`
    - `sendInvite`: extract `email`, `role` from body and `orgId` from `req.params.orgId`; call `inviteService.createInvite`; respond `success(res, invite, 'Invite sent', 201)`
    - `listInvites`: call `inviteService.listInvitesForOrg(req.params.orgId)`; respond with invite array
    - `revokeInvite`: call `inviteService.revokeInvite(req.params.inviteId, req.params.orgId)`; respond with updated invite
    - `getInviteInfo`: call `inviteService.getInviteByToken(req.params.token)`; respond with invite (org name, inviter name)
    - `acceptInvite`: call `inviteService.acceptInvite(req.body.token, req.user.id)`; respond with success message
    - Wrap all handlers in `asyncHandler`
    - _Requirements: 4.1, 4.5, 5.1, 6.1, 6.2_

  - [x] 5.2 Create `backend/src/modules/invite/invite.route.js`
    - Org-scoped routes (mount at `/api/organizations/:orgId/invites`):
      - `POST /` — `protect, restrictTo('admin'), enforcePlanLimit('team_members'), sendInvite`
      - `GET /` — `protect, restrictTo('admin'), listInvites`
      - `PATCH /:inviteId/revoke` — `protect, restrictTo('admin'), revokeInvite`
    - Public/auth invite routes (mount at `/api/invites`):
      - `GET /:token` — `getInviteInfo` (no auth required)
      - `POST /accept` — `protect, acceptInvite`
    - _Requirements: 4.5, 5.1, 6.2, 6.3_

  - [x] 5.3 Register invite routes in `backend/src/app.js`
    - Import `inviteRoutes` from `./modules/invite/invite.route`
    - Add `app.use('/api/organizations', requireEmailVerified, inviteRoutes.orgRouter)` (or nest under existing org routes)
    - Add `app.use('/api/invites', inviteRoutes.publicRouter)` — `getInviteInfo` is public, `acceptInvite` uses `protect` internally
    - _Requirements: 4.1, 5.1_

- [x] 6. Add getTeamMembers to organization service and expose via route
  - [x] 6.1 Add `getTeamMembers(orgId)` to `backend/src/modules/organization/organization.service.js`
    - Query `Role.find({ organizationId: orgId }).populate('userId', 'displayName email')`
    - Return array of `{ userId, displayName, email, role, createdAt }`
    - _Requirements: 9.1, 9.3_

  - [x] 6.2 Add `getTeamMembers` controller handler and `GET /:id/members` route to the organization module
    - Controller: `asyncHandler` wrapping `organizationService.getTeamMembers(req.params.id)`
    - Route: `router.get('/:id/members', protect, getTeamMembers)` in `organization.route.js`
    - _Requirements: 9.1, 9.3_

  - [ ]* 6.3 Write property test for members list returns populated user data
    - **Property 14: Members list returns populated user data**
    - **Validates: Requirements 9.3**
    - For any org with N ≥ 1 Role records, assert every item in the result has non-null `displayName`, `email`, `role`, and `createdAt`
    - _File: `backend/src/modules/invite/__tests__/invite.service.test.js`_

- [ ] 7. Checkpoint — backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update Settings.tsx — Organization card
  - [x] 8.1 Add state variables and load new org fields (`website`, `industry`, `description`, `contactEmail`, `slug`) when fetching org details in the `useEffect`
    - _Requirements: 1.3, 2.1_

  - [x] 8.2 Add form inputs for `slug` (editable), `website`, `industry`, `description`, `contactEmail` to the Organization card in `frontend/src/pages/Settings.tsx`
    - Use `react-hook-form` + `zod` for the org form; validate slug format client-side (lowercase alphanumeric + hyphens, 3–60 chars)
    - Include all new fields in the `handleSaveOrg` PUT body
    - _Requirements: 1.3, 2.1, 2.2_

- [x] 9. Update Settings.tsx — Team Members card
  - [x] 9.1 Add enterprise plan gate: if `orgUsage?.plan_id !== 'enterprise'`, render an upgrade prompt with a button navigating to `/checkout?plan=enterprise`
    - _Requirements: 7.1, 7.3_

  - [x] 9.2 Add invite form (email input + role select + submit button) using `react-hook-form` + `zod`; on submit call `POST /api/organizations/:orgId/invites` via `apiClient`; show toast on success/error; invalidate the pending invites query
    - _Requirements: 4.1, 7.2_

  - [x] 9.3 Add pending invites list: fetch `GET /api/organizations/:orgId/invites` with React Query; display email, status badge, sent date, and a Revoke button that calls `PATCH /api/organizations/:orgId/invites/:inviteId/revoke`
    - _Requirements: 6.1, 6.2, 7.2_

  - [x] 9.4 Update the existing members table: fetch `GET /api/organizations/:orgId/members` with React Query; display `displayName`, `email`, role badge, and join date; mark the current user with "You"
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 10. Create AcceptInvite page
  - [x] 10.1 Create `frontend/src/pages/AcceptInvite.tsx`
    - On mount, read `token` from `useSearchParams`
    - Call `GET /api/invites/:token` (no auth) to fetch invite info (org name, inviter name) and display it
    - If user is authenticated: call `POST /api/invites/accept { token }` automatically; on success show a success state and navigate to `/dashboard`; on error show specific messages for expired/revoked/invalid token states
    - If user is not authenticated: show invite details and a "Create account to join" button that navigates to `/signup?invite=<token>`
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 10.2 Add `/accept-invite` route to `frontend/src/App.tsx`
    - Use `<OptionalProtectedRoute>` so both authenticated and unauthenticated users can land on the page
    - _Requirements: 5.5_

- [x] 11. Update Signup.tsx to preserve invite token
  - [x] 11.1 In `frontend/src/pages/Signup.tsx`, read `invite` query param from `useSearchParams` on mount
    - After successful registration and email verification, if `invite` param is present, redirect to `/accept-invite?token=<invite>` instead of the default post-signup route
    - _Requirements: 5.5_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (`fc`) and must run ≥ 100 iterations each
- Each property test references its design document property number in a tag comment: `// Feature: team-invite-workflow, Property N: ...`
- The `restrictTo('admin')` middleware checks `req.user.role` — ensure the Role-based admin role is set on `req.user` correctly when needed
- `enforcePlanLimit('team_members')` reuses the existing middleware from `planEnforcement.middleware.js`; the enterprise-only check is a separate inline guard in the service
