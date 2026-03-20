# Requirements Document

## Introduction

Trustificate is a SaaS platform for digital credential issuance, management, and verification. This document captures the complete feature set of the Trustificate platform as structured requirements, covering authentication, user management, organization management, certificate lifecycle, template management, AI assistance, administration, public verification, plan-based feature gating, email notifications, and marketing/public pages.

## Glossary

- **Platform**: The Trustificate SaaS application comprising the backend API server and the frontend web application
- **Auth_Module**: The authentication subsystem handling registration, login, logout, email verification, and password management
- **User_Module**: The subsystem responsible for user profile retrieval and updates
- **Organization_Module**: The subsystem managing organization CRUD, usage tracking, and plan enforcement
- **Certificate_Module**: The subsystem handling certificate creation, issuance, listing, updating, verification, and revocation
- **Template_Module**: The subsystem managing certificate template CRUD, activation, and default templates
- **AI_Module**: The subsystem providing OpenAI-powered suggestions for certificate fields and template creation
- **Admin_Module**: The subsystem for super admin operations including user management, role assignment, and audit logging
- **Public_Module**: The subsystem exposing unauthenticated endpoints for certificate verification and public certificate viewing
- **Email_Service**: The cross-cutting service sending transactional emails via Nodemailer with Handlebars templates
- **Storage_Service**: The cross-cutting service managing file uploads and downloads via Cloudflare R2 (S3-compatible)
- **Plan_Guard**: The frontend hook (`usePlanGuard`) enforcing plan-based feature limits in real time
- **Issuer**: A registered user who creates organizations, designs templates, and issues certificates
- **Recipient**: A person who receives a digital certificate
- **Verifier**: Any person or system that validates certificate authenticity via the public verification portal
- **JWT**: JSON Web Token used for stateless authentication with a 7-day expiration
- **OTP**: One-Time Password used for email verification and password reset flows
- **Certificate_Number**: A unique identifier assigned to each issued certificate, used for public verification
- **Slug**: A URL-friendly unique identifier for certificates and organizations
- **Super_Admin**: A platform-wide administrator with access to all organizations, users, billing, and audit logs
- **Organization_Admin**: An organization-level administrator with full control over org settings and members
- **Rate_Limiter**: Middleware that restricts the number of API requests per time window per client

## Requirements

### Requirement 1: User Registration

**User Story:** As a new Issuer, I want to register an account with my name, email, and password, so that I can access the Trustificate platform.

#### Acceptance Criteria

1. WHEN a registration request is submitted with a valid name (minimum 2 characters), a valid email address, and a valid password (minimum 8 characters), THE Auth_Module SHALL create a new user account and return a 201 status code
2. WHEN a registration request is submitted with an email that is already in use, THE Auth_Module SHALL reject the request with a 409 status code and a descriptive error message
3. WHEN a registration request is submitted with missing or invalid fields, THE Auth_Module SHALL reject the request with a 400 status code and validation error details
4. WHEN a user account is created successfully, THE Auth_Module SHALL hash the password using bcryptjs with 12 salt rounds before storing
5. WHEN a user account is created successfully, THE Email_Service SHALL send a welcome email to the registered email address

### Requirement 2: User Login

**User Story:** As a registered Issuer, I want to log in with my credentials, so that I can access my dashboard and manage certificates.

#### Acceptance Criteria

1. WHEN a login request is submitted with a valid email and correct password, THE Auth_Module SHALL return a JWT token and user profile data with a 200 status code
2. WHEN a login request is submitted with invalid credentials, THE Auth_Module SHALL reject the request with a 401 status code
3. THE Auth_Module SHALL generate JWT tokens with a 7-day expiration period
4. WHEN a login-with-OTP request is submitted with a valid email and correct OTP, THE Auth_Module SHALL return a JWT token and user profile data

### Requirement 3: User Logout

**User Story:** As a logged-in Issuer, I want to log out, so that my session is terminated securely.

#### Acceptance Criteria

1. WHEN a logout request is submitted by an authenticated user, THE Auth_Module SHALL acknowledge the logout with a 200 status code
2. WHEN a user logs out, THE Platform frontend SHALL discard the stored JWT from localStorage

### Requirement 4: Email Verification

**User Story:** As a registered Issuer, I want to verify my email address, so that I can access protected platform features.

#### Acceptance Criteria

1. WHEN a verification OTP request is submitted with a valid registered email, THE Auth_Module SHALL generate an OTP and send it to the email address
2. WHEN a valid OTP is submitted for email verification, THE Auth_Module SHALL mark the user email as verified and return a 200 status code
3. WHEN an invalid or expired OTP is submitted, THE Auth_Module SHALL reject the request with a 400 status code
4. WHEN a verification link request is submitted, THE Auth_Module SHALL generate a unique token and send a verification link to the email address
5. WHEN a valid verification token is accessed via the confirmation link, THE Auth_Module SHALL mark the user email as verified
6. WHEN an invalid or expired verification token is accessed, THE Auth_Module SHALL reject the request with a 400 status code
7. WHEN a resend-verification-link request is submitted for an unverified email, THE Auth_Module SHALL send a new verification link
8. WHEN a resend-verification-link request is submitted for an already-verified email, THE Auth_Module SHALL reject the request with a 400 status code
9. WHILE a user email is not verified, THE Platform SHALL block access to all protected API routes except authentication endpoints

### Requirement 5: Password Reset

**User Story:** As a registered Issuer, I want to reset my password if I forget it, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a forgot-password request is submitted with a valid registered email, THE Auth_Module SHALL send a password reset email containing a reset token
2. WHEN a reset-password request is submitted with a valid token and a new password (minimum 8 characters), THE Auth_Module SHALL update the user password and return a 200 status code
3. WHEN a reset-password request is submitted with an invalid or expired token, THE Auth_Module SHALL reject the request with a 400 status code
4. WHEN a forgot-password-OTP request is submitted with a valid registered email, THE Auth_Module SHALL generate an OTP and send it to the email address
5. WHEN a reset-password-OTP request is submitted with a valid email, correct OTP, and new password (minimum 8 characters), THE Auth_Module SHALL update the user password
6. WHEN a password is successfully reset, THE Email_Service SHALL send a password-changed confirmation email to the user

### Requirement 6: Email Status Check

**User Story:** As a platform component, I want to check a user's email verification status, so that I can enforce verification requirements.

#### Acceptance Criteria

1. WHEN an email-status request is submitted with a valid email query parameter, THE Auth_Module SHALL return the email verification status
2. WHEN an email-status request is submitted without an email parameter, THE Auth_Module SHALL reject the request with a 400 status code
3. WHEN an email-status request is submitted for a non-existent user, THE Auth_Module SHALL reject the request with a 404 status code


### Requirement 7: User Profile Management

**User Story:** As a logged-in Issuer, I want to view and update my profile, so that my account information stays current.

#### Acceptance Criteria

1. WHEN an authenticated user requests their profile, THE User_Module SHALL return the current user profile data including displayName, email, role, and organizationId
2. WHEN an authenticated user submits a profile update with a new displayName or avatar, THE User_Module SHALL update the profile and return the updated data
3. WHEN an authenticated user submits a password change request with a valid current password and new password, THE User_Module SHALL update the password

### Requirement 8: User Administration

**User Story:** As a Super_Admin, I want to manage all platform users, so that I can oversee user accounts.

#### Acceptance Criteria

1. WHEN a Super_Admin requests the user list, THE User_Module SHALL return all users on the platform
2. WHEN a Super_Admin requests a specific user by ID, THE User_Module SHALL return that user's profile data
3. WHEN a Super_Admin soft-deletes a user, THE User_Module SHALL mark the user as deleted without permanently removing the data

### Requirement 9: Organization Creation

**User Story:** As an Issuer, I want to create an organization, so that I can manage certificates under a branded entity.

#### Acceptance Criteria

1. WHEN an authenticated user submits a create-organization request with a valid name and slug, THE Organization_Module SHALL create the organization and return a 201 status code
2. THE Organization_Module SHALL associate the creating user with the new organization
3. WHERE a logoUrl is provided, THE Organization_Module SHALL store the logo URL with the organization record

### Requirement 10: Organization Management

**User Story:** As an Organization_Admin, I want to manage my organization details, so that the organization profile remains accurate.

#### Acceptance Criteria

1. WHEN an authenticated user requests their organizations, THE Organization_Module SHALL return all organizations the user belongs to
2. WHEN an authenticated user requests a specific organization by ID, THE Organization_Module SHALL return the organization details
3. WHEN an authorized user submits an update to an organization's name or logo, THE Organization_Module SHALL update the organization and return the updated data
4. WHEN an authorized user submits a delete request for an organization, THE Organization_Module SHALL remove the organization

### Requirement 11: Organization Usage and Plan Tracking

**User Story:** As an Organization_Admin, I want to track my organization's usage against plan limits, so that I can manage resource consumption.

#### Acceptance Criteria

1. WHEN an authenticated user requests usage data for their organization, THE Organization_Module SHALL return current usage metrics and plan limit information including plan_name, price_monthly, billing_cycle dates, and limits for certificates_created, templates_created, team_members, bulk_import, api_access, webhook_access, analytics_access, audit_exports, and priority_support
2. WHEN a usage increment request is submitted with a metric name and amount, THE Organization_Module SHALL increment the specified usage counter
3. THE Plan_Guard SHALL fetch organization usage data on component mount and expose helper functions for checking limits, getting usage percentages, getting usage counts, and getting plan limits
4. WHILE the Plan_Guard is loading usage data, THE Platform frontend SHALL indicate a loading state

### Requirement 12: Certificate Template Creation

**User Story:** As an Issuer, I want to create certificate templates, so that I can define reusable layouts for certificate issuance.

#### Acceptance Criteria

1. WHEN an authenticated user submits a create-template request with a title and configuration, THE Template_Module SHALL create the template scoped to the user's organization
2. THE Template_Module SHALL support template fields including title, placeholders, numberPrefix, layout, configuration, colorTheme, backgroundStyle, signatureConfig, and sealConfig
3. WHEN a template is created, THE Template_Module SHALL set the template as active by default

### Requirement 13: Certificate Template Management

**User Story:** As an Issuer, I want to list, view, update, and delete my templates, so that I can maintain my certificate designs.

#### Acceptance Criteria

1. WHEN an authenticated user requests the template list, THE Template_Module SHALL return all templates belonging to the user's organization
2. WHEN an authenticated user requests a template by ID, THE Template_Module SHALL return the full template data
3. WHEN an authenticated user submits an update to a template, THE Template_Module SHALL update the template fields and return the updated data
4. WHEN an authenticated user submits a delete request for a template, THE Template_Module SHALL remove the template
5. THE Template_Module SHALL provide system default templates that are available to all organizations

### Requirement 14: Single Certificate Issuance

**User Story:** As an Issuer, I want to issue a single certificate to a recipient, so that the recipient receives a verifiable digital credential.

#### Acceptance Criteria

1. WHEN an authenticated user submits a certificate creation request with recipient details and a template reference, THE Certificate_Module SHALL create a certificate record with a unique certificateNumber and slug
2. THE Certificate_Module SHALL support certificate fields including recipientName, recipientEmail, courseName, trainingName, companyName, score, duration, issuerName, issuerTitle, issueDate, and completionDate
3. WHEN a certificate is created, THE Certificate_Module SHALL set the initial status to "draft"
4. WHEN a certificate is issued, THE Email_Service SHALL send a certificate-issued notification email to the recipient
5. WHEN a certificate is issued, THE Email_Service SHALL send a certificate-issuer notification email to the issuer

### Requirement 15: Bulk Certificate Issuance

**User Story:** As an Issuer, I want to issue multiple certificates at once from a CSV file, so that I can efficiently credential large groups.

#### Acceptance Criteria

1. WHEN an authenticated user submits a bulk issuance request with CSV data and a template reference, THE Certificate_Module SHALL create individual certificate records for each row in the CSV
2. THE Certificate_Module SHALL assign a unique certificateNumber and slug to each certificate in the bulk batch
3. IF a row in the CSV contains invalid data, THEN THE Certificate_Module SHALL report the error for that row without blocking the processing of valid rows

### Requirement 16: Certificate Listing and Filtering

**User Story:** As an Issuer, I want to list and filter my certificates, so that I can find and manage specific credentials.

#### Acceptance Criteria

1. WHEN an authenticated user requests the certificate list, THE Certificate_Module SHALL return certificates belonging to the user's organization with pagination metadata (total, page, limit, pages)
2. WHERE a status filter is provided (draft, issued, or revoked), THE Certificate_Module SHALL return only certificates matching the specified status
3. WHERE a search query is provided, THE Certificate_Module SHALL return certificates matching the search term against relevant fields

### Requirement 17: Certificate Detail and Update

**User Story:** As an Issuer, I want to view and update individual certificates, so that I can correct or modify credential details.

#### Acceptance Criteria

1. WHEN an authenticated user requests a certificate by ID, THE Certificate_Module SHALL return the full certificate data
2. WHEN an authenticated user submits an update to a certificate, THE Certificate_Module SHALL update the certificate fields and return the updated data
3. THE Certificate_Module SHALL support certificate statuses: draft, issued, and revoked

### Requirement 18: Public Certificate Verification

**User Story:** As a Verifier, I want to verify a certificate by its number, so that I can confirm the authenticity of a digital credential.

#### Acceptance Criteria

1. WHEN a verification request is submitted with a valid certificateNumber, THE Public_Module SHALL return the certificate details without requiring authentication
2. WHEN a verification request is submitted with a non-existent certificateNumber, THE Public_Module SHALL return a 404 status code
3. WHEN a certificate slug is accessed via the public URL, THE Certificate_Module SHALL return the certificate data for public display without requiring authentication

### Requirement 19: External Certificate Registration

**User Story:** As an Issuer, I want to register certificates issued by other platforms, so that I can maintain a unified certificate registry.

#### Acceptance Criteria

1. WHEN an authenticated user submits an external certificate registration with issuerName and originalUrl, THE Certificate_Module SHALL create an external certificate record associated with the user's organization
2. WHERE a PDF file is provided, THE Storage_Service SHALL upload the PDF to Cloudflare R2 and store the bucket path in the external certificate record

### Requirement 20: AI-Assisted Certificate Generation

**User Story:** As an Issuer, I want AI-generated suggestions for certificate fields and templates, so that I can create credentials more efficiently.

#### Acceptance Criteria

1. WHEN an authenticated user requests document fill suggestions, THE AI_Module SHALL return AI-generated suggestions for certificate fields using the OpenAI API
2. WHEN an authenticated user requests template suggestions, THE AI_Module SHALL return AI-generated suggestions for template creation
3. THE Rate_Limiter SHALL restrict AI requests to 50 per 15-minute window per user
4. IF the AI request rate limit is exceeded, THEN THE AI_Module SHALL return an error message indicating the limit has been exceeded


### Requirement 21: Super Admin Dashboard

**User Story:** As a Super_Admin, I want a platform-wide analytics dashboard, so that I can monitor overall platform health and usage.

#### Acceptance Criteria

1. WHEN a Super_Admin accesses the super admin dashboard, THE Platform SHALL display platform-wide KPIs, charts, and data tables
2. THE Platform SHALL restrict super admin routes to users with the Super_Admin role using the SuperAdminGuard component

### Requirement 22: Super Admin User Management

**User Story:** As a Super_Admin, I want to manage all users across the platform, so that I can oversee accounts and enforce policies.

#### Acceptance Criteria

1. WHEN a Super_Admin requests the admin user list, THE Admin_Module SHALL return all admin-level users
2. WHEN a Super_Admin assigns a role to a user for an organization, THE Admin_Module SHALL create or update the role assignment
3. WHEN a Super_Admin requests roles for a user, THE Admin_Module SHALL return all role assignments for that user

### Requirement 23: Super Admin Audit Logging

**User Story:** As a Super_Admin, I want an audit trail of admin actions, so that I can track changes and ensure accountability.

#### Acceptance Criteria

1. WHEN an admin action is performed, THE Admin_Module SHALL log the action with the actor, action type, and timestamp
2. WHEN a Super_Admin requests audit logs, THE Platform SHALL display the logged admin actions in a searchable, sortable view

### Requirement 24: Super Admin Resource Management

**User Story:** As a Super_Admin, I want to manage organizations, billing, plans, certificates, and templates across the platform, so that I have full operational control.

#### Acceptance Criteria

1. WHEN a Super_Admin accesses the organizations page, THE Platform SHALL display all organizations with management capabilities
2. WHEN a Super_Admin accesses the billing page, THE Platform SHALL display billing information across all organizations
3. WHEN a Super_Admin accesses the plans page, THE Platform SHALL display and allow management of pricing plan configurations
4. WHEN a Super_Admin accesses the certificates page, THE Platform SHALL display all certificates across all organizations
5. WHEN a Super_Admin accesses the templates page, THE Platform SHALL display all templates across all organizations

### Requirement 25: Route Protection and Authorization

**User Story:** As a platform operator, I want route-level access control, so that only authorized users can access protected resources.

#### Acceptance Criteria

1. THE Platform SHALL protect authenticated routes using JWT verification via the protect middleware
2. WHEN an unauthenticated request is made to a protected route, THE Platform SHALL reject the request with a 401 status code
3. THE Platform SHALL enforce role-based access using the restrictTo middleware for admin-only endpoints
4. WHILE a user's email is not verified, THE Platform SHALL block access to all API routes except /api/auth endpoints using the requireEmailVerified middleware
5. THE Platform frontend SHALL use ProtectedRoute components to redirect unauthenticated users to the login page
6. THE Platform frontend SHALL use OptionalProtectedRoute components for pages accessible by both authenticated and unauthenticated users

### Requirement 26: Rate Limiting

**User Story:** As a platform operator, I want rate limiting on API endpoints, so that the platform is protected from abuse and denial-of-service attacks.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL restrict general API requests to 100 per 15-minute window per IP address
2. THE Rate_Limiter SHALL restrict AI API requests to 50 per 15-minute window per authenticated user (falling back to IP if unauthenticated)
3. IF the general rate limit is exceeded, THEN THE Platform SHALL return a 429 status code with the message "Too many requests. Try again later."
4. IF the AI rate limit is exceeded, THEN THE Platform SHALL return a 429 status code with the message "AI request limit exceeded. Try again later."
5. THE Rate_Limiter SHALL include standard rate limit headers in responses

### Requirement 27: API Response Format

**User Story:** As a frontend developer, I want consistent API responses, so that I can reliably parse and handle backend data.

#### Acceptance Criteria

1. THE Platform SHALL return all API responses in the format: `{ success: boolean, message: string, data?: any, pagination?: { total, page, limit, pages } }`
2. WHEN a paginated list is requested, THE Platform SHALL include pagination metadata with total count, current page, page size limit, and total pages
3. IF an operational error occurs, THEN THE Platform SHALL return a structured error response with success set to false and a descriptive message

### Requirement 28: Email Notification Service

**User Story:** As a platform operator, I want automated email notifications, so that users receive timely communications for key events.

#### Acceptance Criteria

1. WHEN a new user registers, THE Email_Service SHALL send a welcome email using the welcome Handlebars template
2. WHEN a certificate is issued, THE Email_Service SHALL send a notification email to the recipient using the certificate-receiver Handlebars template
3. WHEN a certificate is issued, THE Email_Service SHALL send a notification email to the issuer using the certificate-issuer Handlebars template
4. WHEN a forgot-password request is processed, THE Email_Service SHALL send a password reset email using the forgot-password Handlebars template
5. WHEN a password is successfully changed, THE Email_Service SHALL send a confirmation email using the password-changed Handlebars template

### Requirement 29: File Storage Service

**User Story:** As an Issuer, I want to upload and retrieve files (PDFs, logos), so that certificates and organization assets are stored reliably.

#### Acceptance Criteria

1. WHEN a file upload is requested, THE Storage_Service SHALL upload the file to Cloudflare R2 using the S3-compatible API
2. WHEN a file download is requested, THE Storage_Service SHALL generate a presigned URL for secure, time-limited access to the file
3. THE Storage_Service SHALL store certificate PDFs and organization logos in the configured R2 bucket

### Requirement 30: Security Middleware

**User Story:** As a platform operator, I want security hardening on all API requests, so that the platform is protected against common web vulnerabilities.

#### Acceptance Criteria

1. THE Platform SHALL apply Helmet.js security headers to all HTTP responses
2. THE Platform SHALL configure CORS to allow requests only from authorized frontend origins
3. THE Platform SHALL limit request body size to 10MB for JSON payloads
4. THE Platform SHALL assign a unique request ID (correlation ID) to each incoming request for log tracing
5. IF an unhandled error occurs, THEN THE Platform SHALL return a generic error response without leaking stack traces in production

### Requirement 31: Health Check Endpoint

**User Story:** As a platform operator, I want a health check endpoint, so that monitoring systems can verify the platform is operational.

#### Acceptance Criteria

1. WHEN a GET request is made to /health, THE Platform SHALL check the MongoDB connection status
2. WHEN the database connection is healthy, THE Platform SHALL return a 200 status code with status "ok"
3. IF the database connection is unhealthy, THEN THE Platform SHALL return a 503 status code with status "degraded" and an error message

### Requirement 32: User Dashboard

**User Story:** As an Issuer, I want a dashboard overview, so that I can quickly see my certificate statistics and recent activity.

#### Acceptance Criteria

1. WHEN an authenticated user accesses the dashboard, THE Platform SHALL display certificate statistics, plan usage metrics, recent activity, and quick action buttons
2. THE Platform SHALL display the current plan information and usage percentages for the user's organization

### Requirement 33: Certificate Event Tracking

**User Story:** As a platform operator, I want to track certificate lifecycle events, so that there is an auditable history of certificate actions.

#### Acceptance Criteria

1. WHEN a certificate is issued, THE Platform SHALL create an event record with eventType "issued", the certificateId, timestamp, and actorId
2. WHEN a certificate is revoked, THE Platform SHALL create an event record with eventType "revoked", the certificateId, timestamp, and actorId
3. WHEN a certificate is viewed publicly, THE Platform SHALL create an event record with eventType "viewed", the certificateId, and timestamp

### Requirement 34: Pricing and Plan Feature Gating

**User Story:** As a platform operator, I want plan-based feature gating, so that users are limited to the capabilities of their subscription tier.

#### Acceptance Criteria

1. THE Platform SHALL support four pricing tiers: Free, Starter, Pro, and Enterprise
2. THE Platform SHALL enforce plan limits on certificates_created, templates_created, and team_members based on the organization's active plan
3. WHERE the plan includes bulk_import capability, THE Platform SHALL allow bulk certificate issuance
4. WHERE the plan includes api_access capability, THE Platform SHALL allow API-based certificate operations
5. WHERE the plan includes analytics_access capability, THE Platform SHALL allow access to analytics features
6. WHERE the plan includes audit_exports capability, THE Platform SHALL allow exporting audit log data

### Requirement 35: Marketing and Public Pages

**User Story:** As a platform visitor, I want informational public pages, so that I can learn about the platform before signing up.

#### Acceptance Criteria

1. THE Platform SHALL serve public pages for Home, Pricing, About, Contact, Blog, Team, Testimonials, Docs, Careers, Terms, and Privacy without requiring authentication
2. THE Platform SHALL support blog post detail pages accessible via slug-based URLs
3. THE Platform SHALL support team member detail pages accessible via slug-based URLs
4. THE Platform SHALL support testimonial detail pages accessible via slug-based URLs
5. THE Platform SHALL support documentation pages accessible via slug-based URLs

### Requirement 36: Onboarding Welcome Flow

**User Story:** As a newly registered Issuer, I want a guided onboarding experience, so that I can quickly understand how to use the platform.

#### Acceptance Criteria

1. WHEN a newly registered and verified user logs in for the first time, THE Platform SHALL display a welcome/onboarding page with guidance on getting started
2. THE Platform SHALL protect the welcome page so only authenticated users can access it

### Requirement 37: Public Certificate Generator Tools

**User Story:** As a visitor, I want to use free certificate generator tools, so that I can create basic certificates without an account.

#### Acceptance Criteria

1. THE Platform SHALL provide a public single certificate generator page accessible without authentication
2. THE Platform SHALL provide a public bulk certificate generator page accessible without authentication
3. THE Platform SHALL provide a public certificate verification page accessible without authentication

### Requirement 38: Swagger API Documentation

**User Story:** As a developer, I want interactive API documentation, so that I can explore and test the platform API endpoints.

#### Acceptance Criteria

1. THE Platform SHALL serve Swagger UI documentation at the /api-docs endpoint
2. THE Platform SHALL generate API documentation from JSDoc annotations in route files
3. THE Platform SHALL display the documentation with the title "trustificate API Docs"

### Requirement 39: Checkout and Billing

**User Story:** As an Issuer, I want to upgrade my plan through a checkout flow, so that I can access premium features.

#### Acceptance Criteria

1. WHEN a user accesses the checkout page, THE Platform SHALL display plan upgrade options and payment flow
2. THE Platform SHALL allow both authenticated and unauthenticated users to view the checkout page

### Requirement 40: Certificate Registry

**User Story:** As an Issuer, I want a unified certificate registry, so that I can view both internally issued and externally registered certificates in one place.

#### Acceptance Criteria

1. WHEN an authenticated user accesses the registry, THE Platform SHALL display all certificates (internal and external) belonging to the user's organization
2. WHEN an authenticated user navigates to register an external certificate, THE Platform SHALL provide a form to capture external certificate details
3. WHEN an authenticated user selects a certificate in the registry, THE Platform SHALL display the full certificate detail view

### Requirement 41: Admin Verification Tools

**User Story:** As an Organization_Admin, I want admin-level verification tools, so that I can verify and manage certificates within my organization.

#### Acceptance Criteria

1. WHEN an authenticated admin user accesses the admin verification page, THE Platform SHALL provide tools to verify and inspect certificates within the organization
2. THE Platform SHALL protect the admin verification page so only authenticated users can access it

### Requirement 42: Settings Management

**User Story:** As an Issuer, I want a settings page, so that I can manage my profile, organization, team, and password in one place.

#### Acceptance Criteria

1. WHEN an authenticated user accesses the settings page, THE Platform SHALL display sections for profile settings, organization settings, team member management, and password change
2. THE Platform SHALL protect the settings page so only authenticated users can access it

### Requirement 43: Legacy Route Redirects

**User Story:** As a platform operator, I want legacy URL redirects, so that old bookmarks and links continue to work after route renaming.

#### Acceptance Criteria

1. WHEN a user navigates to /certificates, THE Platform SHALL redirect to /documents
2. WHEN a user navigates to /certificates/new, THE Platform SHALL redirect to /documents/new
3. WHEN a user navigates to /certificates/:id, THE Platform SHALL redirect to /documents

### Requirement 44: 404 Not Found Handling

**User Story:** As a platform visitor, I want a friendly error page for invalid URLs, so that I understand the page does not exist and can navigate elsewhere.

#### Acceptance Criteria

1. WHEN a user navigates to an undefined route, THE Platform SHALL display a Not Found page
2. THE Platform SHALL match all undefined routes using a wildcard route handler
