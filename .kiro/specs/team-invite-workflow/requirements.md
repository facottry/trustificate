# Requirements Document

## Introduction

This feature adds a complete team invite workflow to the Trustificate platform. It enables Enterprise plan administrators to invite team members to their organization via email, enriches the Organization model with additional business fields, surfaces the organization slug in the UI, and enforces shared usage accounting so that all team member activity counts against the organization's plan limits rather than individual accounts.

## Glossary

- **Organization**: A Mongoose document representing a company or team account in Trustificate, identified by a unique slug.
- **Slug**: A unique, URL-safe, lowercase string identifier for an Organization (e.g., `acme-corp`).
- **Admin**: A user with the `admin` role in the Role collection for a given Organization.
- **Member**: A user with the `user` role in the Role collection for a given Organization.
- **Invite**: A record representing a pending invitation for an email address to join an Organization, containing a unique token and expiry.
- **Invite_Service**: The backend service module responsible for creating, validating, and accepting invitations.
- **Invite_Email**: The transactional email sent to an invited user containing a join link.
- **Plan_Guard**: The frontend hook (`usePlanGuard`) and backend middleware (`enforcePlanLimit`) that restrict features based on the Organization's current plan.
- **Usage_Service**: The backend service that tracks and increments usage counters (certificates, templates, team members) per Organization billing cycle.
- **Enterprise_Plan**: The highest pricing tier, which grants access to the team invite workflow and unlimited certificates/templates.
- **Settings_Page**: The frontend page (`/settings`) where users manage profile, organization, and team settings.
- **Email_Service**: The backend Nodemailer service that sends transactional emails using Handlebars templates.

## Requirements

### Requirement 1: Organization Additional Fields

**User Story:** As an admin, I want my organization to have descriptive fields like website, industry, description, and contact email, so that the organization profile is complete and informative.

#### Acceptance Criteria

1. THE Organization schema SHALL include the following optional fields: `website` (String, valid URL), `industry` (String), `description` (String, max 500 characters), and `contactEmail` (String, valid email format).
2. WHEN an admin updates the Organization via the API, THE Organization_Service SHALL validate and persist the new fields.
3. WHEN the Settings_Page loads the Organization section, THE Settings_Page SHALL display editable inputs for website, industry, description, and contact email.
4. IF an admin submits an invalid URL for the website field, THEN THE Organization_Service SHALL return a 400 error with a descriptive validation message.
5. IF an admin submits an invalid email for the contactEmail field, THEN THE Organization_Service SHALL return a 400 error with a descriptive validation message.

### Requirement 2: Organization Slug Visibility and Editability

**User Story:** As an admin, I want to see and edit my organization's slug in the settings UI, so that I can control the human-readable identifier for my organization.

#### Acceptance Criteria

1. WHEN the Settings_Page loads the Organization section, THE Settings_Page SHALL display the current slug in a read-only or editable input field.
2. WHEN an admin edits the slug and saves, THE Organization_Service SHALL validate that the new slug is unique, lowercase, URL-safe (only alphanumeric characters and hyphens), and between 3 and 60 characters.
3. IF the submitted slug is already in use by another Organization, THEN THE Organization_Service SHALL return a 409 error with the message "Organization slug already in use".
4. WHEN the slug is successfully updated, THE Organization_Service SHALL persist the new slug and return the updated Organization document.

### Requirement 3: Invite Schema and Token Generation

**User Story:** As a platform developer, I want a dedicated Invite data model with secure token generation, so that invitations are trackable, expirable, and tamper-proof.

#### Acceptance Criteria

1. THE Invite schema SHALL store the following fields: `email` (String, required, lowercase), `organizationId` (ObjectId reference to Organization, required), `invitedBy` (ObjectId reference to User, required), `role` (String, enum `['admin', 'user']`, default `'user'`), `token` (String, unique, required), `status` (String, enum `['pending', 'accepted', 'expired', 'revoked']`, default `'pending'`), and `expiresAt` (Date, required).
2. WHEN the Invite_Service creates a new invite, THE Invite_Service SHALL generate a cryptographically random token of at least 32 bytes encoded as a hex string.
3. WHEN the Invite_Service creates a new invite, THE Invite_Service SHALL set `expiresAt` to 7 days from the creation time.
4. THE Invite schema SHALL have a compound index on `email` and `organizationId` to prevent duplicate pending invites for the same email and organization.

### Requirement 4: Send Team Invite (Enterprise Plan Only)

**User Story:** As an Enterprise plan admin, I want to invite team members by email, so that colleagues can join my organization and share the account.

#### Acceptance Criteria

1. WHEN an admin sends a POST request to the invite endpoint with a valid email address, THE Invite_Service SHALL create a new Invite record with status `pending`.
2. WHEN the Invite_Service creates an invite, THE Email_Service SHALL send an Invite_Email to the specified email address containing the organization name, inviter name, and a join link with the invite token.
3. IF the invitee email already has a pending invite for the same Organization, THEN THE Invite_Service SHALL return a 409 error with the message "An invite is already pending for this email".
4. IF the invitee email belongs to a user who is already a member of the Organization, THEN THE Invite_Service SHALL return a 409 error with the message "This user is already a member of the organization".
5. WHILE the Organization plan is not `enterprise`, THE invite endpoint SHALL return a 403 error with the message "Team invites are available on the Enterprise plan only".
6. WHEN an admin sends an invite, THE Plan_Guard SHALL verify that the Organization's `team_members` usage has not reached the plan limit before allowing the invite.

### Requirement 5: Accept Invite

**User Story:** As an invited user, I want to click a join link and be added to the organization, so that I can start working under the shared account.

#### Acceptance Criteria

1. WHEN a user navigates to the accept-invite URL with a valid token, THE Invite_Service SHALL validate that the token exists, has status `pending`, and has not expired.
2. IF the invite token is invalid or does not exist, THEN THE Invite_Service SHALL return a 404 error with the message "Invite not found".
3. IF the invite has expired, THEN THE Invite_Service SHALL update the invite status to `expired` and return a 410 error with the message "This invite has expired".
4. WHEN a registered user accepts a valid invite, THE Invite_Service SHALL create a Role record linking the user to the Organization with the role specified in the invite, update the user's `organizationId` to the invite's Organization, and set the invite status to `accepted`.
5. WHEN an unregistered user navigates to the accept-invite URL, THE frontend SHALL redirect the user to the registration page with the invite token preserved, so that after registration the invite is automatically accepted.
6. IF the accepting user is already a member of a different Organization, THEN THE Invite_Service SHALL return a 409 error with the message "User already belongs to another organization".

### Requirement 6: Manage Invites (List, Revoke)

**User Story:** As an admin, I want to view pending invites and revoke them if needed, so that I have full control over who joins my organization.

#### Acceptance Criteria

1. WHEN an admin sends a GET request to the invites list endpoint, THE Invite_Service SHALL return all invites for the Organization, sorted by creation date descending.
2. WHEN an admin sends a DELETE or PATCH request to revoke an invite, THE Invite_Service SHALL set the invite status to `revoked` and the invite token SHALL no longer be valid for acceptance.
3. IF a non-admin user attempts to list or revoke invites, THEN THE auth middleware SHALL return a 403 error.
4. WHILE the Organization plan is not `enterprise`, THE invites list endpoint SHALL return a 403 error with the message "Team invites are available on the Enterprise plan only".

### Requirement 7: Enterprise Plan Gating in the Frontend

**User Story:** As a non-Enterprise user, I want to see an upgrade prompt instead of the invite UI, so that I understand the feature requires an Enterprise plan.

#### Acceptance Criteria

1. WHILE the Organization plan is not `enterprise`, THE Settings_Page team section SHALL display an upgrade prompt with a call-to-action button linking to the checkout page for the Enterprise plan.
2. WHILE the Organization plan is `enterprise`, THE Settings_Page team section SHALL display the invite form, pending invites list, and current team members list.
3. WHEN the user clicks the upgrade button in the team section, THE Settings_Page SHALL navigate to `/checkout?plan=enterprise`.

### Requirement 8: Shared Organization Usage Accounting

**User Story:** As a platform operator, I want all team member activity to count against the organization's plan limits, so that usage is tracked at the organization level rather than per individual.

#### Acceptance Criteria

1. WHEN any Member of an Organization creates a certificate, THE Usage_Service SHALL increment the `certificates_created` counter for the Organization, not for the individual user.
2. WHEN any Member of an Organization creates a template, THE Usage_Service SHALL increment the `templates_created` counter for the Organization, not for the individual user.
3. WHEN a new member joins an Organization via an accepted invite, THE Usage_Service SHALL increment the `team_members` metric for the Organization.
4. THE Plan_Guard SHALL enforce the `team_members` limit from the plan configuration when an admin attempts to send a new invite.
5. THE planConfig for the Enterprise plan SHALL include a `team_members` limit (numeric value or -1 for unlimited).

### Requirement 9: Team Members Display

**User Story:** As an admin, I want to see all current team members with their roles and join dates, so that I can manage my team effectively.

#### Acceptance Criteria

1. WHEN the Settings_Page team section loads for an Enterprise Organization, THE Settings_Page SHALL fetch and display all Role records for the Organization, showing each member's display name, email, role, and join date.
2. WHEN the members list is displayed, THE Settings_Page SHALL indicate the current user with a "You" label.
3. THE members list endpoint SHALL return member data including `displayName`, `email`, `role`, and `createdAt` by populating the User reference from the Role records.

### Requirement 10: Invite Email Template

**User Story:** As an invited user, I want to receive a clear, branded email with a join link, so that I understand who invited me and can easily accept.

#### Acceptance Criteria

1. THE Email_Service SHALL use a Handlebars template named `team-invite` for invite emails.
2. THE `team-invite` template SHALL include the inviter's display name, the organization name, and a prominent call-to-action button linking to the accept-invite URL.
3. THE accept-invite URL in the email SHALL follow the format: `{FRONTEND_URL}/accept-invite?token={invite_token}`.
4. THE `team-invite` email subject SHALL be "You've been invited to join {organization_name} on Trustificate".
