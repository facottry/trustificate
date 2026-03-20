# Requirements Document

## Introduction

Trustificate needs a fully functional SaaS pricing and plan enforcement system. The platform currently has placeholder pricing tiers and usage tracking that always returns unlimited access. This feature will implement real plan definitions, persistent usage tracking, server-side and client-side limit enforcement, plan upgrade flows, and improved CTAs when plan limits are reached. The user has specified a generous Free tier (1 template, 10 certificates/month), a Starter tier with 100% discount (effectively free during launch), a Pro tier, and an Enterprise tier.

## Glossary

- **Plan_Service**: The backend service responsible for managing plan definitions, limits, and plan assignment to organizations
- **Usage_Service**: The backend service responsible for tracking and persisting resource consumption (certificates created, templates created) per organization per billing cycle
- **Enforcement_Middleware**: The backend middleware that validates whether an organization has remaining quota before allowing resource creation
- **Plan_Guard**: The frontend hook (`usePlanGuard`) that fetches usage data and checks limits on the client side before allowing actions
- **Upgrade_Modal**: The frontend dialog component that prompts users to upgrade when they hit a plan limit
- **Checkout_Page**: The frontend page where users select a plan, apply coupons, and complete plan activation
- **Organization_Schema**: The Mongoose model for organizations, which will be extended with plan and billing fields
- **Usage_Collection**: A new MongoDB collection that persists per-organization usage counters with billing cycle awareness
- **Billing_Cycle**: A monthly period (30 days from plan activation or last reset) during which usage counters accumulate before resetting
- **CTA_Banner**: A UI component displayed on the dashboard and action pages when usage approaches or exceeds plan limits

## Requirements

### Requirement 1: Plan Definitions in Backend Constants

**User Story:** As a platform operator, I want plan definitions stored as backend constants, so that plan limits are centrally managed and consistent across the system.

#### Acceptance Criteria

1. THE Plan_Service SHALL define four plans: Free, Starter, Pro, and Enterprise with the following certificate limits per Billing_Cycle: Free = 10, Starter = 500, Pro = unlimited (represented as -1), Enterprise = unlimited (represented as -1)
2. THE Plan_Service SHALL define template limits per plan: Free = 1, Starter = 10, Pro = unlimited (represented as -1), Enterprise = unlimited (represented as -1)
3. THE Plan_Service SHALL define feature flags per plan: bulk_import (Free = false, Starter = true, Pro = true, Enterprise = true), api_access (Free = false, Starter = true, Pro = true, Enterprise = true), webhook_access (Free = false, Starter = false, Pro = true, Enterprise = true), analytics_access (Free = false, Starter = false, Pro = true, Enterprise = true), priority_support (Free = false, Starter = false, Pro = true, Enterprise = true)
4. THE Plan_Service SHALL define pricing per plan: Free = 0 INR, Starter = 999 INR/month (original 1999 INR with 50% launch discount), Pro = 3499 INR/month (original 6999 INR with 50% launch discount), Enterprise = custom pricing

### Requirement 2: Organization Schema Extension

**User Story:** As a platform operator, I want each organization to have a plan assignment and billing cycle tracked in the database, so that the system knows which limits apply to each organization.

#### Acceptance Criteria

1. THE Organization_Schema SHALL include a `plan` field with a default value of "free"
2. THE Organization_Schema SHALL include a `billingCycleStart` field of type Date that records when the current Billing_Cycle began
3. THE Organization_Schema SHALL include a `billingCycleEnd` field of type Date that records when the current Billing_Cycle ends
4. WHEN a new organization is created, THE Plan_Service SHALL assign the Free plan and set the Billing_Cycle to a 30-day period starting from the creation date

### Requirement 3: Usage Collection and Persistence

**User Story:** As a platform operator, I want usage counters persisted in MongoDB, so that certificate and template creation counts survive server restarts and are accurate across sessions.

#### Acceptance Criteria

1. THE Usage_Collection SHALL store documents with fields: organizationId, metric (string identifying the counter, e.g. "certificates_created" or "templates_created"), count (integer), billingCycleStart (Date), and billingCycleEnd (Date)
2. WHEN the Usage_Service increments a counter, THE Usage_Service SHALL upsert the Usage_Collection document matching the organizationId, metric, and current Billing_Cycle
3. WHEN the Usage_Service retrieves usage for an organization, THE Usage_Service SHALL return counters only for the current Billing_Cycle
4. WHEN the current date exceeds the Billing_Cycle end date, THE Usage_Service SHALL treat usage as zero for the new cycle and create fresh counter documents

### Requirement 4: Server-Side Enforcement on Certificate Creation

**User Story:** As a platform operator, I want the backend to reject certificate creation requests when the organization has exhausted its plan quota, so that limits cannot be bypassed by calling the API directly.

#### Acceptance Criteria

1. WHEN a certificate creation request is received, THE Enforcement_Middleware SHALL retrieve the organization's plan and current Billing_Cycle usage for the "certificates_created" metric
2. IF the organization's certificate usage equals or exceeds the plan limit, THEN THE Enforcement_Middleware SHALL reject the request with HTTP 403 and a message indicating the plan limit has been reached
3. WHEN a certificate is successfully created (status is not "draft"), THE Usage_Service SHALL increment the "certificates_created" counter by 1
4. WHEN a bulk certificate creation request is received, THE Enforcement_Middleware SHALL verify that the number of valid rows plus current usage does not exceed the plan limit before processing any rows
5. WHEN the plan limit is -1 (unlimited), THE Enforcement_Middleware SHALL allow the request without checking usage

### Requirement 5: Server-Side Enforcement on Template Creation

**User Story:** As a platform operator, I want the backend to reject template creation requests when the organization has exhausted its template quota, so that template limits are enforced consistently.

#### Acceptance Criteria

1. WHEN a template creation request is received, THE Enforcement_Middleware SHALL retrieve the organization's plan and current Billing_Cycle usage for the "templates_created" metric
2. IF the organization's template usage equals or exceeds the plan limit, THEN THE Enforcement_Middleware SHALL reject the request with HTTP 403 and a message indicating the template limit has been reached
3. WHEN a template is successfully created, THE Usage_Service SHALL increment the "templates_created" counter by 1
4. WHEN the plan limit is -1 (unlimited), THE Enforcement_Middleware SHALL allow the request without checking usage

### Requirement 6: Usage API Endpoint (Real Data)

**User Story:** As a frontend developer, I want the GET `/api/organizations/:id/usage` endpoint to return real plan and usage data, so that the dashboard and plan guard can display accurate information.

#### Acceptance Criteria

1. WHEN the usage endpoint is called, THE Usage_Service SHALL return the organization's current plan name, plan limits, and actual usage counters for the current Billing_Cycle
2. THE Usage_Service SHALL return the Billing_Cycle start and end dates in the response
3. THE Usage_Service SHALL return the plan's monthly price in the response
4. IF the organization has no usage records for the current Billing_Cycle, THEN THE Usage_Service SHALL return zero for all usage counters


### Requirement 7: Client-Side Plan Guard (Real Enforcement)

**User Story:** As a user, I want the UI to check my remaining quota before I attempt to create a certificate or template, so that I get immediate feedback instead of a server error.

#### Acceptance Criteria

1. WHEN the Plan_Guard checks a limit, THE Plan_Guard SHALL call the usage API and compare the current usage against the plan limit for the requested metric
2. IF the usage equals or exceeds the limit, THEN THE Plan_Guard SHALL return `allowed: false` with the current usage, limit, and plan name
3. IF the usage is below the limit, THEN THE Plan_Guard SHALL return `allowed: true` with the remaining count
4. WHEN the plan limit is -1 (unlimited), THE Plan_Guard SHALL return `allowed: true` without comparing usage

### Requirement 8: Decrease Available Counts on Certificate Generation

**User Story:** As a user, I want my available certificate count to decrease each time I generate a certificate, so that I can see my remaining quota in real time.

#### Acceptance Criteria

1. WHEN a certificate is successfully generated (not a draft), THE Plan_Guard SHALL call the POST usage increment endpoint to record the usage
2. WHEN the increment completes, THE Plan_Guard SHALL refresh the cached usage data so the UI reflects the updated count
3. WHEN a bulk certificate operation completes, THE Plan_Guard SHALL increment usage by the number of successfully created certificates
4. THE Dashboard SHALL display the current usage count and remaining count for certificates and templates

### Requirement 9: Better CTA When Plan Limits Are Reached

**User Story:** As a user who has exhausted my plan quota, I want a clear and helpful prompt to upgrade, so that I understand why I cannot create more certificates and how to resolve it.

#### Acceptance Criteria

1. WHEN the user's certificate usage reaches 80% of the plan limit, THE CTA_Banner SHALL display a warning on the Dashboard indicating the approaching limit
2. WHEN the user's certificate usage reaches 100% of the plan limit, THE CTA_Banner SHALL display an urgent message on the Dashboard with a prominent upgrade button
3. WHEN the user attempts to create a certificate and the Plan_Guard returns `allowed: false`, THE Upgrade_Modal SHALL open with the current usage, limit, plan name, and a description of the next available plan's benefits
4. WHEN the user attempts to create a template and the Plan_Guard returns `allowed: false`, THE Upgrade_Modal SHALL open with template-specific usage information
5. THE Upgrade_Modal SHALL include a button that navigates the user to the Checkout_Page with the recommended upgrade plan pre-selected
6. WHEN the plan limit is -1 (unlimited), THE CTA_Banner SHALL not display any usage warnings

### Requirement 10: Plan Upgrade Flow

**User Story:** As a user, I want to upgrade my organization's plan through a checkout flow, so that I can unlock higher limits and additional features.

#### Acceptance Criteria

1. WHEN the user navigates to the Checkout_Page with a plan query parameter, THE Checkout_Page SHALL display the selected plan's features, original price, launch discount, and final price
2. THE Checkout_Page SHALL accept a coupon code and validate it, applying the discount to the final price
3. WHEN the coupon code "FREE_100" is entered, THE Checkout_Page SHALL apply a 100% discount, bringing the total to ₹0
4. WHEN the user completes the checkout, THE Checkout_Page SHALL call a backend endpoint to update the organization's plan
5. WHEN the backend receives a plan update request, THE Plan_Service SHALL update the organization's `plan` field and reset the Billing_Cycle to start from the current date
6. WHEN the plan update is successful, THE Checkout_Page SHALL display an order confirmation with the plan name, pricing breakdown, and a link to the Dashboard

### Requirement 11: Update Pricing Tiers in Frontend Data

**User Story:** As a user, I want the pricing page to reflect the correct plan limits as specified, so that I can make an informed decision about which plan to choose.

#### Acceptance Criteria

1. THE Pricing page SHALL display the Free tier with: ₹0 price, 10 certificates per month, 1 template, public verification pages, QR code generation
2. THE Pricing page SHALL display the Starter tier with: ₹999/month (original ₹1,999, 50% off), 500 certificates per month, 10 templates, custom branding, CSV bulk import, REST API access
3. THE Pricing page SHALL display the Pro tier with: ₹3,499/month (original ₹6,999, 50% off), unlimited certificates, unlimited templates, AI assistance, webhook integrations, priority support
4. THE Pricing page SHALL display the Enterprise tier with: custom pricing, SSO/SAML, dedicated account manager, custom SLA
5. THE Pricing page SHALL indicate that the Starter tier can be obtained for ₹0 using the FREE_100 coupon code

### Requirement 12: Plan Management from Settings Page

**User Story:** As a user, I want to view my current plan and upgrade from the settings page, so that I can manage my subscription without navigating to the public pricing page.

#### Acceptance Criteria

1. THE Settings page SHALL display the organization's current plan name and Billing_Cycle end date
2. THE Settings page SHALL display current usage for certificates and templates with progress bars showing percentage consumed
3. THE Settings page SHALL include an "Upgrade Plan" button that navigates to the Checkout_Page
4. WHEN the organization is on the Free plan, THE Settings page SHALL display a promotional banner encouraging upgrade to Starter with the FREE_100 coupon mention

### Requirement 13: Migrate Checkout Page from Supabase to Backend API

**User Story:** As a developer, I want the checkout flow to use the Express backend API instead of Supabase direct calls, so that the system is consistent and does not depend on Supabase for plan management.

#### Acceptance Criteria

1. THE Checkout_Page SHALL call backend API endpoints for coupon validation instead of Supabase RPC calls
2. THE Checkout_Page SHALL call a backend API endpoint to create orders and update the organization's plan instead of direct Supabase table operations
3. THE Plan_Service SHALL expose a POST `/api/organizations/:id/plan` endpoint that accepts a plan name and optional coupon code, validates the coupon, creates an order record, and updates the organization's plan
4. THE Plan_Service SHALL expose a POST `/api/coupons/validate` endpoint that accepts a coupon code and returns whether the coupon is valid and the discount percentage
