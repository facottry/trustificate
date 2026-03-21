# Requirements Document

## Introduction

The Newsletter/Broadcast feature extends the Trustificate Admin Dashboard with an end-to-end system for composing, AI-refining, and dispatching branded email broadcasts to all subscribed platform users. Admins can write a plain-text draft, optionally polish it via an AI endpoint, preview the history of past broadcasts, and send the final email wrapped in the existing Trustificate promotional HTML template. All users are opted-in by default and may unsubscribe at any time.

## Glossary

- **Newsletter**: A broadcast email composed by an admin and sent to all subscribed users.
- **Newsletter_Service**: The backend service layer responsible for persisting newsletter records and orchestrating batch dispatch.
- **Newsletter_Controller**: The Express request handler that exposes newsletter API endpoints.
- **AI_Polish_Endpoint**: The dedicated backend endpoint that accepts a raw text draft and returns a refined version using the OpenAI service.
- **Batch_Dispatcher**: The asynchronous mechanism that sends emails to all subscribed recipients without blocking the HTTP response.
- **Newsletter_Schema**: The Mongoose model that persists newsletter history in MongoDB.
- **User_Schema**: The existing Mongoose model for platform users, extended with a subscription preference field.
- **Compose_View**: The React UI panel where an admin writes a newsletter subject and body before sending.
- **History_Table**: The React UI table that lists all previously sent newsletters with metadata.
- **Promotional_Template**: The existing Handlebars HTML email template (`feature-announcement.hbs`) that wraps newsletter body content with the Trustificate branded header and promotional footer.
- **Subscription_Flag**: The boolean field on the User document that controls whether a user receives broadcast emails.
- **Admin**: A platform user with role `admin` or `super_admin`.
- **OpenAI_Service**: The existing shared backend service (`openaiService.js`) that communicates with the OpenAI API.
- **Email_Service**: The existing shared backend service (`emailService.js`) that compiles Handlebars templates and dispatches email via Nodemailer.

---

## Requirements

### Requirement 1: User Subscription Preference

**User Story:** As a platform user, I want to be opted-in to newsletters by default, so that I receive important platform updates without any manual action.

#### Acceptance Criteria

1. THE User_Schema SHALL include a `newsletterSubscribed` boolean field with a default value of `true`.
2. WHEN a new user document is created without an explicit `newsletterSubscribed` value, THE User_Schema SHALL persist the field as `true`.
3. WHEN a user sets `newsletterSubscribed` to `false`, THE User_Schema SHALL persist that value and THE Batch_Dispatcher SHALL exclude that user from all future newsletter sends.

---

### Requirement 2: Newsletter History Persistence

**User Story:** As an admin, I want every sent newsletter to be recorded in the database, so that I can audit past broadcasts and track reach.

#### Acceptance Criteria

1. THE Newsletter_Schema SHALL define a MongoDB collection with the following fields: `subject` (String, required), `body` (String, required), `sentBy` (ObjectId reference to User, required), `sentAt` (Date, default `Date.now`), and `recipientCount` (Number, required).
2. WHEN a newsletter is successfully dispatched, THE Newsletter_Service SHALL create a Newsletter document capturing the subject, body, the sending admin's user ID, the dispatch timestamp, and the total number of subscribed recipients targeted.
3. THE Newsletter_Schema SHALL enforce that `subject` and `body` are non-empty strings.

---

### Requirement 3: AI Draft Refinement Endpoint

**User Story:** As an admin, I want a backend endpoint to polish my rough draft, so that newsletters are professionally worded without requiring me to be a copywriter.

#### Acceptance Criteria

1. THE Newsletter_Controller SHALL expose a `POST /api/newsletter/polish` endpoint restricted to users with role `admin` or `super_admin`.
2. WHEN a request is received at `POST /api/newsletter/polish` with a non-empty `draft` string in the request body, THE Newsletter_Controller SHALL invoke the OpenAI_Service with a system prompt instructing it to rewrite the text in a "calm, institutional, and trustworthy" tone and return the refined text.
3. WHEN the OpenAI_Service returns a refined text, THE Newsletter_Controller SHALL respond with HTTP 200 and a JSON body containing the `polishedText` string.
4. IF the `draft` field is absent or empty in the request body, THEN THE Newsletter_Controller SHALL respond with HTTP 400 and a descriptive validation error message.
5. IF the OpenAI_Service throws an error or times out, THEN THE Newsletter_Controller SHALL respond with HTTP 502 and an error message indicating that AI assistance is temporarily unavailable.
6. THE AI_Polish_Endpoint SHALL NOT be callable from the React frontend directly via the OpenAI SDK; all AI calls MUST be routed through this backend endpoint.

---

### Requirement 4: Newsletter Broadcast Send Endpoint

**User Story:** As an admin, I want a backend endpoint to send a newsletter to all subscribed users, so that I can broadcast updates to the entire active user base in one action.

#### Acceptance Criteria

1. THE Newsletter_Controller SHALL expose a `POST /api/newsletter/send` endpoint restricted to users with role `admin` or `super_admin`.
2. WHEN a request is received at `POST /api/newsletter/send` with a non-empty `subject` string and a non-empty `body` string, THE Newsletter_Service SHALL query the User collection for all documents where `newsletterSubscribed` is `true` and `isActive` is `true`.
3. WHEN the recipient list is determined, THE Newsletter_Controller SHALL respond with HTTP 202 (Accepted) immediately, and THE Batch_Dispatcher SHALL send emails asynchronously without blocking the HTTP response thread.
4. THE Batch_Dispatcher SHALL inject the newsletter `body` text into the Promotional_Template and dispatch emails in batches using `Promise.allSettled`, so that a single recipient failure does not abort the entire send.
5. WHEN all batches are processed, THE Newsletter_Service SHALL persist a Newsletter document with the subject, body, sending admin ID, dispatch timestamp, and the total count of targeted recipients.
6. IF the `subject` or `body` field is absent or empty in the request body, THEN THE Newsletter_Controller SHALL respond with HTTP 400 and a descriptive validation error message.
7. THE Batch_Dispatcher SHALL NOT use a synchronous loop that blocks the main request thread.
8. WHEN composing each outgoing email, THE Newsletter_Service SHALL construct a per-recipient unsubscribe link and pass it to the Promotional_Template so the `{{unsubscribeLink}}` partial variable is always populated.

---

### Requirement 5: Newsletter History API Endpoint

**User Story:** As an admin, I want a backend endpoint that returns the list of past newsletters, so that the frontend History_Table can display broadcast history.

#### Acceptance Criteria

1. THE Newsletter_Controller SHALL expose a `GET /api/newsletter/history` endpoint restricted to users with role `admin` or `super_admin`.
2. WHEN a request is received at `GET /api/newsletter/history`, THE Newsletter_Service SHALL return all Newsletter documents sorted by `sentAt` descending.
3. WHEN returning Newsletter documents, THE Newsletter_Service SHALL populate the `sentBy` field with the sender's `displayName` and `email`.

---

### Requirement 6: Admin Compose View

**User Story:** As an admin, I want a UI form to write a newsletter subject and body, so that I can compose and send broadcasts from the dashboard.

#### Acceptance Criteria

1. THE Compose_View SHALL render a form containing a `subject` text input and a `body` textarea, both validated as required non-empty strings using a zod schema via react-hook-form.
2. WHEN the admin submits the form with a valid subject and body, THE Compose_View SHALL call `POST /api/newsletter/send` via the API client and display a success toast notification upon HTTP 202 response.
3. WHEN the admin submits the form with an empty subject or empty body, THE Compose_View SHALL display inline validation error messages and SHALL NOT submit the request to the backend.
4. WHILE the send request is in-flight, THE Compose_View SHALL disable the submit button and display a loading indicator.
5. WHEN the send request completes successfully, THE Compose_View SHALL invalidate the React Query cache for the newsletter history so the History_Table refreshes automatically.

---

### Requirement 7: AI Polish UI Flow

**User Story:** As an admin, I want an "AI Polish" button in the Compose view, so that I can refine my rough draft into professional copy before sending.

#### Acceptance Criteria

1. THE Compose_View SHALL render a clearly labelled "AI Polish" button adjacent to the body textarea.
2. WHEN the admin clicks "AI Polish" and the body textarea is non-empty, THE Compose_View SHALL call `POST /api/newsletter/polish` via the API client, passing the current textarea content as `draft`.
3. WHILE the polish request is in-flight, THE Compose_View SHALL display a loading state on the "AI Polish" button and SHALL disable the button to prevent duplicate submissions.
4. WHEN the polish request returns successfully, THE Compose_View SHALL replace the body textarea content with the returned `polishedText` value, leaving the subject field unchanged.
5. WHEN the admin clicks "AI Polish" and the body textarea is empty, THE Compose_View SHALL display a validation error and SHALL NOT submit the request to the backend.
6. IF the polish request returns an error (network failure, HTTP 4xx, or HTTP 5xx), THEN THE Compose_View SHALL stop the loading state and display a toast error message indicating that AI assistance is currently unavailable, without clearing or modifying the existing textarea content.

---

### Requirement 8: Newsletter History Table

**User Story:** As an admin, I want a table of past newsletters in the dashboard, so that I can review what has been sent and to how many recipients.

#### Acceptance Criteria

1. THE History_Table SHALL display the following columns for each Newsletter record: subject, a truncated preview of the body, the sender's display name, the `sentAt` timestamp formatted as a human-readable date, and the `recipientCount`.
2. WHEN the History_Table is first rendered, THE History_Table SHALL fetch data from `GET /api/newsletter/history` using TanStack React Query.
3. WHILE the history fetch is in-flight, THE History_Table SHALL display a loading skeleton or spinner.
4. IF the history fetch returns an error, THEN THE History_Table SHALL display an error message and a retry option.
5. WHEN a new newsletter is successfully sent via the Compose_View, THE History_Table SHALL reflect the new entry without requiring a full page reload, achieved by React Query cache invalidation.

---

### Requirement 9: Email Formatting and Template Compliance

**User Story:** As a newsletter recipient, I want to receive a well-formatted branded email, so that the communication looks professional and consistent with the Trustificate brand.

#### Acceptance Criteria

1. THE Newsletter_Service SHALL use the Email_Service `compileTemplate` function to render the newsletter body inside the Promotional_Template, ensuring the Trustificate branded header and promotional footer are always present.
2. THE Newsletter_Service SHALL pass the newsletter `body` text as a template variable to the Promotional_Template and SHALL NOT require the admin to write raw HTML.
3. WHEN the compiled email HTML is inspected, THE Promotional_Template SHALL include the `{{> promotional-footer}}` partial, which renders the unsubscribe link.
4. THE Newsletter_Service SHALL NOT inject unsanitised admin-authored HTML directly into the email template; plain text content SHALL be passed as a Handlebars variable and rendered safely by the template engine.
