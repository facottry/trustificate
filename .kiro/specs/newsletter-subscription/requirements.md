# Requirements Document

## Introduction

The Newsletter Subscription feature adds a public-facing workflow that allows anyone — including non-account holders — to subscribe to the Trustificate newsletter. Subscribers provide their email address, receive a confirmation email with a unique token link, and must click the link to activate their subscription. This double opt-in flow prevents abuse and spam signups. The feature introduces a new `Subscriber` MongoDB collection separate from the existing `User` schema, public API endpoints (no authentication required), a confirmation email template, an unsubscribe-via-link mechanism, a frontend subscribe form, and a public newsletter archive page for SEO. The existing newsletter broadcast send logic is updated to include confirmed subscribers alongside registered users who have `newsletterSubscribed: true`.

## Glossary

- **Subscriber**: A non-registered person who has submitted their email to receive newsletters. Represented by a document in the `Subscriber` collection.
- **Subscriber_Schema**: The Mongoose model defining the `Subscriber` collection in MongoDB.
- **Subscription_Service**: The backend service layer responsible for creating subscriber records, generating confirmation tokens, handling confirmation, and processing unsubscribe requests.
- **Subscription_Controller**: The Express request handler that exposes public subscription API endpoints.
- **Confirmation_Token**: A cryptographically random string generated when a subscription request is submitted, used to verify email ownership.
- **Confirmation_Email**: The transactional email sent to a new subscriber containing a link with the Confirmation_Token to verify their email address.
- **Confirmation_Link**: The URL embedded in the Confirmation_Email that the subscriber clicks to activate their subscription.
- **Subscribe_Form**: The public-facing React UI component where visitors enter their email to subscribe.
- **Newsletter_Service**: The existing backend service responsible for dispatching newsletter broadcasts (in `newsletter.service.js`).
- **Email_Service**: The existing shared backend service (`emailService.js`) that compiles Handlebars templates and dispatches email via Nodemailer.
- **User_Schema**: The existing Mongoose model for registered platform users, which includes the `newsletterSubscribed` boolean field.
- **Unsubscribe_Link**: A URL included in every newsletter email that allows the recipient to opt out of future newsletters with a single click.
- **Newsletter_Archive**: A public-facing page listing all previously sent newsletters, accessible to both signed-in and anonymous users, designed to support programmatic SEO.
- **Newsletter_Detail_Page**: A public page displaying the full content of a single newsletter, accessible via a unique slug, crawlable by search engines.

---

## Requirements

### Requirement 1: Subscriber Data Model

**User Story:** As a platform operator, I want a dedicated collection for non-registered newsletter subscribers, so that subscriber data is cleanly separated from registered user accounts.

#### Acceptance Criteria

1. THE Subscriber_Schema SHALL define a MongoDB collection with the following fields: `email` (String, required, unique, lowercase, trimmed), `confirmationToken` (String, default null), `confirmationExpiry` (Date, default null), `isConfirmed` (Boolean, default false), and `confirmedAt` (Date, default null).
2. THE Subscriber_Schema SHALL enforce a unique index on the `email` field to prevent duplicate subscriptions.
3. WHEN a new Subscriber document is created without an explicit `isConfirmed` value, THE Subscriber_Schema SHALL persist the field as `false`.
4. THE Subscriber_Schema SHALL include Mongoose `timestamps` (createdAt, updatedAt) for audit purposes.

---

### Requirement 1b: Newsletter Schema Slug Extension

**User Story:** As a platform operator, I want each newsletter to have a unique SEO-friendly slug, so that individual newsletters are accessible via clean, crawlable URLs.

#### Acceptance Criteria

1. THE Newsletter_Schema (from the existing newsletter-broadcast feature) SHALL be extended with a `slug` field (String, unique, lowercase, trimmed) that is auto-generated from the `subject` at creation time.
2. THE slug generation SHALL convert the subject to lowercase, replace spaces and special characters with hyphens, remove consecutive hyphens, and append a short unique suffix (e.g., first 6 characters of a UUID) to guarantee uniqueness.
3. WHEN a Newsletter document is created without an explicit `slug`, THE Newsletter_Schema SHALL auto-generate the slug before saving.

---

### Requirement 2: Public Subscribe Endpoint

**User Story:** As a website visitor, I want to submit my email address to subscribe to the newsletter without needing an account, so that I can receive platform updates.

#### Acceptance Criteria

1. THE Subscription_Controller SHALL expose a `POST /api/public/newsletter/subscribe` endpoint that requires no authentication.
2. WHEN a request is received with a valid email address, THE Subscription_Service SHALL create a Subscriber document with `isConfirmed` set to `false` and a cryptographically random `confirmationToken` with a `confirmationExpiry` set to 24 hours from creation.
3. WHEN a Subscriber document is created, THE Subscription_Service SHALL send a Confirmation_Email to the provided email address containing a Confirmation_Link with the token.
4. WHEN the provided email already exists as a confirmed Subscriber, THE Subscription_Controller SHALL respond with HTTP 200 and a message indicating the email is already subscribed, without sending a new email.
5. WHEN the provided email already exists as an unconfirmed Subscriber, THE Subscription_Service SHALL regenerate the `confirmationToken` and `confirmationExpiry`, send a new Confirmation_Email, and respond with HTTP 200.
6. WHEN the provided email belongs to a registered User with `newsletterSubscribed` set to `true`, THE Subscription_Controller SHALL respond with HTTP 200 and a message indicating the email is already subscribed.
7. IF the email field is absent, empty, or not a valid email format, THEN THE Subscription_Controller SHALL respond with HTTP 400 and a descriptive validation error message.
8. THE Subscription_Controller SHALL respond with HTTP 200 and a generic success message for all valid submissions, regardless of whether the email is new or existing, to prevent email enumeration.

---

### Requirement 3: Email Confirmation Endpoint

**User Story:** As a subscriber, I want to click a confirmation link in my email to verify my address, so that my subscription becomes active and I start receiving newsletters.

#### Acceptance Criteria

1. THE Subscription_Controller SHALL expose a `GET /api/public/newsletter/confirm/:token` endpoint that requires no authentication.
2. WHEN a request is received with a valid, non-expired `confirmationToken`, THE Subscription_Service SHALL set `isConfirmed` to `true`, set `confirmedAt` to the current timestamp, and clear the `confirmationToken` and `confirmationExpiry` fields.
3. WHEN confirmation succeeds, THE Subscription_Controller SHALL redirect the user to a frontend success page or respond with HTTP 200 and a success message.
4. IF the token does not match any Subscriber document, THEN THE Subscription_Controller SHALL respond with HTTP 400 and a message indicating the link is invalid.
5. IF the token matches a Subscriber document but the `confirmationExpiry` has passed, THEN THE Subscription_Controller SHALL respond with HTTP 400 and a message indicating the link has expired.
6. WHEN a Subscriber whose `isConfirmed` is already `true` attempts to confirm again, THE Subscription_Controller SHALL respond with HTTP 200 and a message indicating the subscription is already confirmed.

---

### Requirement 4: Public Unsubscribe Endpoint

**User Story:** As a newsletter recipient, I want to click an unsubscribe link in any newsletter email to stop receiving future emails, so that I have control over my inbox.

#### Acceptance Criteria

1. THE Subscription_Controller SHALL expose a `GET /api/public/newsletter/unsubscribe/:email` endpoint that requires no authentication.
2. WHEN a request is received with an email matching a confirmed Subscriber, THE Subscription_Service SHALL delete the Subscriber document from the collection.
3. WHEN a request is received with an email matching a registered User, THE Subscription_Service SHALL set the User's `newsletterSubscribed` field to `false`.
4. WHEN unsubscribe succeeds, THE Subscription_Controller SHALL redirect the user to a frontend confirmation page or respond with HTTP 200 and a success message.
5. IF the email does not match any Subscriber or User, THEN THE Subscription_Controller SHALL respond with HTTP 200 with a generic message to prevent email enumeration.

---

### Requirement 5: Newsletter Broadcast Integration

**User Story:** As an admin sending a newsletter, I want the broadcast to reach both registered users and confirmed external subscribers, so that the full audience receives the update.

#### Acceptance Criteria

1. WHEN the Newsletter_Service dispatches a newsletter broadcast, THE Newsletter_Service SHALL query both the User collection (where `newsletterSubscribed` is `true` and `isActive` is `true`) and the Subscriber collection (where `isConfirmed` is `true`) to build the combined recipient list.
2. THE Newsletter_Service SHALL deduplicate recipients by email address, giving priority to the User record when a registered user's email also exists in the Subscriber collection.
3. WHEN composing each outgoing email for a Subscriber recipient, THE Newsletter_Service SHALL construct an Unsubscribe_Link using the subscriber's email address and pass it to the email template.
4. WHEN composing each outgoing email for a User recipient, THE Newsletter_Service SHALL construct an Unsubscribe_Link using the user's ID (preserving the existing pattern) and pass it to the email template.
5. WHEN the broadcast completes, THE Newsletter_Service SHALL persist the `recipientCount` as the total number of unique recipients (registered users plus confirmed subscribers, after deduplication).

---

### Requirement 6: Confirmation Email Template

**User Story:** As a subscriber, I want to receive a professional branded confirmation email, so that I trust the link and complete my subscription.

#### Acceptance Criteria

1. THE Email_Service SHALL support a new Handlebars template named `newsletter-subscription-confirm` that renders a branded confirmation email.
2. THE `newsletter-subscription-confirm` template SHALL accept the following variables: `confirmationLink` (the full URL to confirm the subscription) and `email` (the subscriber's email address).
3. THE `newsletter-subscription-confirm` template SHALL reuse the existing `{{> email-header}}` and `{{> transactional-footer}}` partials for consistent branding.
4. THE `newsletter-subscription-confirm` template SHALL include a clearly labelled call-to-action button linking to the `confirmationLink`.
5. THE `newsletter-subscription-confirm` template SHALL include text informing the recipient that the link expires in 24 hours.

---

### Requirement 7: Expired Subscription Cleanup

**User Story:** As a platform operator, I want unconfirmed subscriptions to be cleaned up after expiry, so that the database does not accumulate stale records.

#### Acceptance Criteria

1. THE Subscription_Service SHALL provide a cleanup function that deletes all Subscriber documents where `isConfirmed` is `false` and `confirmationExpiry` is earlier than the current timestamp.
2. WHEN the cleanup function executes, THE Subscription_Service SHALL log the number of deleted records using the application logger.
3. THE cleanup function SHALL be callable on a scheduled basis or manually by an admin endpoint.

---

### Requirement 8: Public Subscribe Form

**User Story:** As a website visitor, I want a subscribe form on the public site, so that I can easily enter my email and sign up for the newsletter.

#### Acceptance Criteria

1. THE Subscribe_Form SHALL render an email input field and a submit button, validated as a required valid email using a zod schema via react-hook-form.
2. WHEN the visitor submits a valid email, THE Subscribe_Form SHALL call `POST /api/public/newsletter/subscribe` via the API client without attaching an authorization header.
3. WHEN the API responds with HTTP 200, THE Subscribe_Form SHALL display a success message instructing the visitor to check their inbox for the confirmation email.
4. WHILE the subscribe request is in-flight, THE Subscribe_Form SHALL disable the submit button and display a loading indicator.
5. IF the subscribe request returns an error, THEN THE Subscribe_Form SHALL display a toast error message without clearing the email input.
6. THE Subscribe_Form SHALL be placed on the landing page in a dedicated section before the footer.

---

### Requirement 9: Frontend Confirmation and Unsubscribe Pages

**User Story:** As a subscriber, I want to see a clear confirmation or unsubscribe result page after clicking a link in my email, so that I know the action was successful.

#### Acceptance Criteria

1. THE frontend SHALL provide a `/newsletter/confirm` route that reads a `token` query parameter and calls `GET /api/public/newsletter/confirm/:token` on mount.
2. WHEN the confirmation API responds with success, THE confirmation page SHALL display a success message indicating the subscription is active.
3. IF the confirmation API responds with an error, THEN THE confirmation page SHALL display an appropriate error message (invalid link or expired link).
4. THE frontend SHALL provide a `/newsletter/unsubscribed` route that displays a static message confirming the user has been unsubscribed.

---

### Requirement 10: Public Newsletter Archive API

**User Story:** As a website visitor or search engine crawler, I want a public API endpoint that returns all sent newsletters, so that the archive page and individual newsletter pages can be rendered.

#### Acceptance Criteria

1. THE Subscription_Controller SHALL expose a `GET /api/public/newsletter` endpoint that requires no authentication.
2. WHEN a request is received at `GET /api/public/newsletter`, THE endpoint SHALL return all Newsletter documents sorted by `sentAt` descending, including `subject`, `body`, `slug`, `sentAt`, and `recipientCount`.
3. THE endpoint SHALL NOT return the `sentBy` field or any admin-identifying information in the public response.
4. THE Subscription_Controller SHALL expose a `GET /api/public/newsletter/:slug` endpoint that requires no authentication.
5. WHEN a request is received with a valid slug, THE endpoint SHALL return the matching Newsletter document with `subject`, `body`, `slug`, `sentAt`, and `recipientCount`.
6. IF the slug does not match any Newsletter document, THEN THE endpoint SHALL respond with HTTP 404 and a descriptive error message.

---

### Requirement 11: Public Newsletter Archive Page

**User Story:** As a website visitor, I want to browse all past newsletters on a public archive page, so that I can read previous updates and discover the platform through search engines.

#### Acceptance Criteria

1. THE frontend SHALL provide a `/newsletter` route accessible to both signed-in and anonymous users (wrapped in `OptionalProtectedRoute`).
2. THE Newsletter_Archive page SHALL fetch data from `GET /api/public/newsletter` using TanStack React Query.
3. THE Newsletter_Archive page SHALL display a list of newsletters showing the subject as a clickable link, a truncated body preview, and the formatted `sentAt` date.
4. EACH newsletter item SHALL link to `/newsletter/:slug` for the full detail view.
5. WHILE the fetch is in-flight, THE Newsletter_Archive page SHALL display a loading skeleton.
6. IF the fetch returns an error, THE Newsletter_Archive page SHALL display an error message with a retry option.
7. THE Newsletter_Archive page SHALL include a conditional CTA section based on the user's state:
   - IF the user is not logged in, THE page SHALL display the Subscribe_Form component.
   - IF the user is logged in and their `newsletterSubscribed` field is `false`, THE page SHALL display the Subscribe_Form component.
   - IF the user is logged in and their `newsletterSubscribed` field is `true`, THE page SHALL display a generic welcome message (e.g., "You're subscribed! We'll keep you posted on the latest updates.").
8. THE site navigation header SHALL include a "Newsletter" link pointing to `/newsletter`.

---

### Requirement 12: Public Newsletter Detail Page

**User Story:** As a website visitor or search engine crawler, I want to view the full content of a single newsletter on a dedicated page with a clean URL, so that individual newsletters are indexable and shareable.

#### Acceptance Criteria

1. THE frontend SHALL provide a `/newsletter/:slug` route accessible to both signed-in and anonymous users (wrapped in `OptionalProtectedRoute`).
2. THE Newsletter_Detail_Page SHALL fetch data from `GET /api/public/newsletter/:slug` using TanStack React Query.
3. THE Newsletter_Detail_Page SHALL display the full newsletter subject as the page heading and the complete body text.
4. THE Newsletter_Detail_Page SHALL display the `sentAt` date formatted as a human-readable string.
5. THE Newsletter_Detail_Page SHALL include a link back to the `/newsletter` archive page.
6. THE Newsletter_Detail_Page SHALL include a conditional CTA section using the same logic as the Newsletter_Archive page (Requirement 11.7): Subscribe_Form for anonymous or unsubscribed users, welcome message for subscribed users.
7. IF the slug does not match any newsletter (404 response), THE Newsletter_Detail_Page SHALL display a "Newsletter not found" message.
8. THE Newsletter_Detail_Page SHALL set the document `<title>` to the newsletter subject for SEO.
