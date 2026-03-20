# Implementation Plan: SaaS Pricing Plans

## Overview

Replace all placeholder plan/usage stubs with a real SaaS pricing system: plan definitions as constants, persistent MongoDB usage tracking, server-side enforcement middleware, backend-driven checkout (removing Supabase), and frontend plan guard + upgrade UX. Backend is Node.js/Express/CommonJS/Mongoose; frontend is React 18/TypeScript/Vite/shadcn-ui.

## Tasks

- [x] 1. Create plan configuration and data layer
  - [x] 1.1 Create `backend/src/utils/planConfig.js` with PLANS object defining Free, Starter, Pro, Enterprise tiers including limits, feature flags, and pricing
    - Export `PLANS`, `getPlan(planId)`, `isUnlimited(limit)` helpers
    - Free: 10 certs/month, 1 template; Starter: 500/10; Pro: unlimited (-1); Enterprise: unlimited (-1)
    - Feature flags: bulk_import, api_access, webhook_access, analytics_access, priority_support per plan
    - Pricing: Free=0, Starter=999, Pro=3499, Enterprise=-1 (custom)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create `backend/src/modules/usage/usage.schema.js` Mongoose model
    - Fields: organizationId (ObjectId ref Organization, required, indexed), metric (String, required), count (Number, default 0), billingCycleStart (Date, required), billingCycleEnd (Date, required)
    - Compound index on { organizationId, metric, billingCycleStart }
    - _Requirements: 3.1_

  - [x] 1.3 Create `backend/src/modules/usage/usage.service.js` with getUsageForOrg, incrementUsage, getUsageForMetric functions
    - `getUsageForOrg(orgId, cycleStart, cycleEnd)` → returns object with all metric counts for the cycle
    - `incrementUsage(orgId, metric, cycleStart, cycleEnd, amount)` → upserts with `$inc`
    - `getUsageForMetric(orgId, metric, cycleStart, cycleEnd)` → returns single count
    - If no records exist for the cycle, return 0
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 1.4 Create `backend/src/modules/order/order.schema.js` Mongoose model
    - Fields: organizationId, userId, planName, originalPrice, discountPercent, discountedPrice, couponCode, couponDiscountPercent, finalAmount, currency (default 'INR'), status (enum: completed/pending/failed), paymentMethod, metadata
    - _Requirements: 10.4, 10.5_

  - [x] 1.5 Create `backend/src/modules/coupon/coupon.schema.js` Mongoose model
    - Fields: code (String, unique, uppercase), discountPercent (Number, 0-100), isActive (Boolean, default true), maxUses (Number, default null), currentUses (Number, default 0), expiresAt (Date, default null)
    - _Requirements: 10.2, 10.3_

  - [ ]* 1.6 Write property test for plan config defaults (Property 1)
    - **Property 1: New organization defaults**
    - **Validates: Requirements 2.4**

  - [ ]* 1.7 Write property test for usage increment upsert (Property 2)
    - **Property 2: Usage increment upsert**
    - **Validates: Requirements 3.2**

  - [ ]* 1.8 Write property test for billing cycle isolation (Property 3)
    - **Property 3: Billing cycle isolation**
    - **Validates: Requirements 3.3, 3.4, 6.4**

- [x] 2. Extend Organization schema and service with real plan logic
  - [x] 2.1 Update `backend/src/modules/organization/organization.schema.js` to add plan, billingCycleStart, billingCycleEnd fields
    - plan: String, enum ['free','starter','pro','enterprise'], default 'free'
    - billingCycleStart: Date, default Date.now
    - billingCycleEnd: Date, default 30 days from now
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Update `backend/src/modules/organization/organization.service.js` — replace placeholder getUsage with real implementation
    - Read org's plan field, look up planConfig, query Usage collection for current billing cycle
    - Return real plan_name, limits, usage counters, billing dates, price_monthly
    - If billingCycleEnd is past, treat usage as 0 for the new cycle
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 2.3 Update `backend/src/modules/organization/organization.service.js` — replace placeholder incrementUsage with real implementation
    - Delegate to usageService.incrementUsage with org's billing cycle dates
    - _Requirements: 3.2_

  - [x] 2.4 Update createOrganization in organization.service.js to set plan='free' and billing cycle dates on new orgs
    - _Requirements: 2.4_

  - [ ]* 2.5 Write property test for usage API response consistency (Property 8)
    - **Property 8: Usage API response consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 3. Checkpoint — Ensure data layer and org service work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement server-side enforcement middleware
  - [x] 4.1 Create `backend/src/middlewares/planEnforcement.middleware.js`
    - Export `enforcePlanLimit(metric)` middleware factory
    - Gets org from req.user.organizationId, looks up plan config
    - If limit is -1, call next() (unlimited)
    - Gets current usage for metric in current billing cycle
    - If usage >= limit, throw AppError(403, 'Plan limit reached...', 'PLAN_LIMIT_REACHED')
    - For bulk: check req.body rows length + usage vs limit
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 5.1, 5.2, 5.4_

  - [x] 4.2 Add enforcement middleware to `backend/src/modules/certificate/certificate.route.js`
    - Apply `enforcePlanLimit('certificates_created')` to POST `/` and POST `/issue` routes
    - _Requirements: 4.1, 4.2_

  - [x] 4.3 Add enforcement middleware to `backend/src/modules/template/template.route.js`
    - Apply `enforcePlanLimit('templates_created')` to POST `/` route
    - _Requirements: 5.1, 5.2_

  - [x] 4.4 Add usage increment to `backend/src/modules/certificate/certificate.service.js` after successful non-draft certificate creation
    - Call usageService.incrementUsage('certificates_created') after certificate is created with status !== 'draft'
    - _Requirements: 4.3_

  - [x] 4.5 Add usage increment to `backend/src/modules/template/template.service.js` after successful template creation
    - Call usageService.incrementUsage('templates_created') after template is created
    - _Requirements: 5.3_

  - [ ]* 4.6 Write property test for enforcement rejects over-limit (Property 4)
    - **Property 4: Enforcement rejects over-limit requests**
    - **Validates: Requirements 4.2, 5.2**

  - [ ]* 4.7 Write property test for resource creation increments usage (Property 5)
    - **Property 5: Resource creation increments usage**
    - **Validates: Requirements 4.3, 5.3**

  - [ ]* 4.8 Write property test for bulk enforcement (Property 6)
    - **Property 6: Bulk enforcement checks total**
    - **Validates: Requirements 4.4**

  - [ ]* 4.9 Write property test for unlimited plans bypass (Property 7)
    - **Property 7: Unlimited plans bypass enforcement**
    - **Validates: Requirements 4.5, 5.4**

- [x] 5. Checkpoint — Ensure enforcement middleware works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement plan and coupon backend endpoints
  - [x] 6.1 Create `backend/src/modules/plan/plan.service.js`
    - `validateCoupon(code)` — looks up coupon in DB, checks isActive, expiry, maxUses; returns { valid, discount_percent, code } or { valid: false, error }
    - `upgradePlan(orgId, userId, planName, couponCode)` — validates plan name, validates coupon if provided, creates Order record, updates org plan + billing cycle, increments coupon currentUses
    - _Requirements: 13.3, 13.4, 10.2, 10.5_

  - [x] 6.2 Create `backend/src/modules/plan/plan.controller.js`
    - `validateCoupon` handler: POST body { code }, returns coupon validation result
    - `upgradePlan` handler: POST body { plan, couponCode }, calls planService.upgradePlan
    - _Requirements: 13.3, 13.4_

  - [x] 6.3 Create `backend/src/modules/plan/plan.route.js` and register in `backend/src/app.js`
    - POST `/api/coupons/validate` → planController.validateCoupon
    - POST `/api/organizations/:id/plan` → planController.upgradePlan (protected)
    - Register coupon routes and plan route in app.js
    - _Requirements: 13.3, 13.4_

  - [ ]* 6.4 Write property test for coupon validation (Property 11)
    - **Property 11: Coupon validation correctness**
    - **Validates: Requirements 13.4, 10.2**

  - [ ]* 6.5 Write property test for plan upgrade (Property 12)
    - **Property 12: Plan upgrade creates order and updates organization**
    - **Validates: Requirements 13.3, 10.5**

- [x] 7. Checkpoint — Ensure backend is complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update frontend plan guard and upgrade UX
  - [x] 8.1 Update `frontend/src/hooks/usePlanGuard.ts` — replace placeholder checkLimit with real logic
    - Fetch fresh usage from API, compare usage[metric] against limits[metric]
    - If limit is -1, return allowed: true (unlimited)
    - Return { allowed, usage, limit, remaining, plan_name }
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 8.2 Update `frontend/src/components/UpgradeModal.tsx` with enhanced CTA
    - Show current usage, limit, plan name, and next plan benefits
    - Include button navigating to /checkout?plan=<next>
    - Show FREE_100 coupon mention for Free→Starter upgrades
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 8.3 Update `frontend/src/data/siteData.ts` — change Free tier from "Up to 50 credentials/month" to "Up to 10 credentials/month"
    - _Requirements: 11.1_

  - [ ]* 8.4 Write property test for plan guard limit check (Property 9)
    - **Property 9: Plan guard limit check correctness**
    - **Validates: Requirements 7.2, 7.3, 7.4**

  - [ ]* 8.5 Write property test for usage banner thresholds (Property 10)
    - **Property 10: Usage banner threshold rendering**
    - **Validates: Requirements 9.1, 9.2, 9.6**

- [x] 9. Update Settings page with plan & billing section
  - [x] 9.1 Update `frontend/src/pages/Settings.tsx` — add Plan & Billing card
    - Display current plan name and billing cycle end date
    - Display usage progress bars for certificates and templates (percentage consumed)
    - Include "Upgrade Plan" button navigating to /checkout?plan=<next>
    - Show promotional banner for Free plan users mentioning FREE_100 coupon
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 10. Migrate Checkout page from Supabase to backend API
  - [x] 10.1 Update `frontend/src/pages/Checkout.tsx` — replace Supabase coupon validation with POST `/api/coupons/validate` via apiClient
    - Remove supabase import
    - Call backend API for coupon validation
    - _Requirements: 13.1_

  - [x] 10.2 Update `frontend/src/pages/Checkout.tsx` — replace Supabase order creation with POST `/api/organizations/:id/plan` via apiClient
    - Remove all supabase table operations
    - Call backend API to create order and update plan
    - Show order confirmation with plan name, pricing breakdown, and dashboard link
    - _Requirements: 13.2, 10.1, 10.4, 10.6_

- [x] 11. Wire dashboard usage banners and final integration
  - [x] 11.1 Add usage CTA banners to Dashboard page
    - Show warning banner at 80% usage, urgent banner at 100% usage
    - Do not show banners when limit is -1 (unlimited)
    - Include upgrade button on urgent banner
    - _Requirements: 9.1, 9.2, 9.6_

  - [x] 11.2 Ensure DocumentNew page correctly calls incrementUsage after non-draft certificate generation and refreshes cached usage
    - Verify existing integration in DocumentNew.tsx works with the updated usePlanGuard
    - _Requirements: 8.1, 8.2_

  - [x] 11.3 Ensure bulk upload page enforces plan limits and increments usage by the number of successfully created certificates
    - _Requirements: 8.3, 4.4_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Backend uses CommonJS (`require`/`module.exports`), frontend uses TypeScript with `@/` path aliases
- The Checkout page migration (task 10) removes all Supabase dependencies for plan management
