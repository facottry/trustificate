# Design Document

## Overview

The email infrastructure refactor unifies Trustificate's email system under a single, brand-consistent pipeline. Currently, `emailService.js` mixes raw HTML strings (for verification and link emails) with Handlebars-compiled templates (for password reset, welcome, certificate emails), and every template duplicates the same header/footer HTML inline. There is no CSS inlining strategy, no promotional email path, and no legal compliance enforcement.

The new design introduces:

- A **partial system** — four Handlebars partials (header, brand-tokens, transactional-footer, promotional-footer) registered once at module load, shared by all 11 templates.
- A **CSS inlining approach** — brand token values are authored as inline `style` attributes directly in the partials, so no external CSS inliner library is needed. The partials themselves are the single source of truth.
- A **`compileTemplate(name, data)` function** — reads `.hbs` files, compiles with the shared Handlebars instance, throws descriptive errors on missing files or partials.
- A **`Transactional_Sender`** — wraps `compileTemplate` + `transporter.sendMail` for single-recipient lifecycle emails.
- A **`Promotional_Sender`** — validates `unsubscribeLink` presence before compiling, then fans out to a list of recipients.

The existing six `.hbs` files will be rewritten to use partials. Three new transactional templates and two new promotional templates will be added.

---

## Architecture

```mermaid
graph TD
    subgraph "Module Load (once)"
        A[emailService.js] -->|registers| B[Handlebars Instance]
        B --> P1[partial: email-header]
        B --> P2[partial: brand-tokens]
        B --> P3[partial: transactional-footer]
        B --> P4[partial: promotional-footer]
    end

    subgraph "Runtime — Transactional"
        C[Controller / Service] -->|sendTransactional(to, template, data)| D[Transactional_Sender]
        D -->|compileTemplate(name, data)| E[Template_Engine]
        E -->|reads .hbs file| F[templates/emails/*.hbs]
        E -->|resolves partials| B
        D -->|sendMail| G[Nodemailer Transporter]
    end

    subgraph "Runtime — Promotional"
        H[Scheduled Job / Admin] -->|sendPromotional(recipients[], template, data)| I[Promotional_Sender]
        I -->|validate unsubscribeLink| I
        I -->|compileTemplate(name, data)| E
        I -->|sendMail × N| G
    end

    subgraph "Error Path"
        E -->|missing partial or template| J[throw descriptive Error]
        D -->|catch| K[logger.error + throw AppError]
        I -->|catch| K
    end
```

### Key Architectural Decisions

**No external CSS inliner.** Libraries like `juice` or `inline-css` add a build step and a dependency. Since the brand tokens are a small, stable set of values, they are authored directly as inline `style` attributes inside the partials. This is simpler, more predictable, and avoids runtime transformation.

**Single Handlebars instance.** Partials are registered on the module-level `handlebars` object once at `require()` time. All `compileTemplate` calls share this instance, so partials are always available without re-registration.

**Fail-fast on missing partials/templates.** Handlebars throws by default when a partial is missing if `allowProtoPropertiesByDefault` is not set. We rely on this behavior and wrap it with a descriptive error message. Template file existence is checked with `fs.existsSync` before compilation.

**Promotional sender validates before compiling.** The `unsubscribeLink` check happens before `compileTemplate` is called, so the Template_Engine is never invoked with an incomplete payload.

---

## Components and Interfaces

### 1. Template_Engine (`compileTemplate`)

```js
/**
 * Compiles a Handlebars template with the shared registered-partial context.
 * @param {string} templateName - filename without extension (e.g. 'welcome')
 * @param {object} data         - template variables
 * @returns {string}            - rendered HTML string
 * @throws {Error}              - if template file not found or partial missing
 */
function compileTemplate(templateName, data) { ... }
```

Internals:
1. Build path: `path.join(__dirname, '../templates/emails', templateName + '.hbs')`
2. `fs.existsSync` check → throw `Error(\`Template "${templateName}" not found\`)` if absent
3. `fs.readFileSync` → `handlebars.compile(source)` → `template(data)`
4. Handlebars throws automatically on unresolved `{{> partialName}}` — caught upstream

### 2. Transactional_Sender

```js
/**
 * @param {string} to           - single recipient email address
 * @param {string} templateName - e.g. 'welcome', 'certificate-receiver'
 * @param {object} data         - template variables
 * @param {string} subject      - email subject line
 * @returns {Promise<void>}
 * @throws {AppError}
 */
async function sendTransactional(to, templateName, data, subject) { ... }
```

Flow: `compileTemplate` → `transporter.sendMail` → on any error: `logger.error` + `throw new AppError(msg, 500)`

### 3. Promotional_Sender

```js
/**
 * @param {string[]} recipients  - list of recipient email addresses
 * @param {string}  templateName - e.g. 'feature-announcement', 'plan-upsell'
 * @param {object}  data         - template variables (must include unsubscribeLink)
 * @param {string}  subject      - email subject line
 * @returns {Promise<void>}
 * @throws {AppError}
 */
async function sendPromotional(recipients, templateName, data, subject) { ... }
```

Flow: validate `data.unsubscribeLink` (non-empty string) → `compileTemplate` → `transporter.sendMail` × N → on any error: `logger.error` + `throw new AppError(msg, 500)`

### 4. Partial Files

| Partial name           | File path                                          | Used by              |
|------------------------|----------------------------------------------------|----------------------|
| `email-header`         | `templates/emails/partials/email-header.hbs`       | all templates        |
| `brand-tokens`         | `templates/emails/partials/brand-tokens.hbs`       | all templates        |
| `transactional-footer` | `templates/emails/partials/transactional-footer.hbs` | transactional only |
| `promotional-footer`   | `templates/emails/partials/promotional-footer.hbs` | promotional only     |

### 5. Template Files (11 total)

**Transactional (9):**

| Template name              | New / Rewrite | Key variables |
|----------------------------|---------------|---------------|
| `welcome`                  | Rewrite       | `userName`, `dashboardLink` |
| `forgot-password`          | Rewrite       | `userName`, `otp`, `resetLink` |
| `certificate-receiver`     | Rewrite       | `recipientName`, `issuerName`, `certificateTitle`, `certificateLink` |
| `certificate-issuer`       | Rewrite       | `issuerName`, `recipientName`, `certificateTitle`, `issuanceLogLink` |
| `certificate-revoked`      | New           | `recipientName`, `certificateTitle`, `supportLink` |
| `password-changed`         | Rewrite       | `userName`, `timestamp`, `supportLink` |
| `team-invite`              | Rewrite       | `orgName`, `inviterName`, `joinLink` |
| `email-verification-otp`   | New           | `userName`, `otp` |
| `email-verification-link`  | New           | `userName`, `verificationLink` |

**Promotional (2):**

| Template name          | New / Rewrite | Key variables |
|------------------------|---------------|---------------|
| `feature-announcement` | New           | `recipientName`, `featureTitle`, `featureDescription`, `ctaLink`, `ctaLabel`, `unsubscribeLink` |
| `plan-upsell`          | New           | `recipientName`, `currentPlan`, `targetPlan`, `benefitsList`, `upgradeLink`, `unsubscribeLink` |

### 6. Partial Registration (module load)

```js
// At top of emailService.js, runs once on require()
const PARTIALS_DIR = path.join(__dirname, '../templates/emails/partials');
const PARTIAL_NAMES = ['email-header', 'brand-tokens', 'transactional-footer', 'promotional-footer'];

PARTIAL_NAMES.forEach((name) => {
  const filePath = path.join(PARTIALS_DIR, `${name}.hbs`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required partial "${name}" not found at ${filePath}`);
  }
  handlebars.registerPartial(name, fs.readFileSync(filePath, 'utf8'));
});
```

---

## Data Models

No new database models are introduced. The email system is stateless — it compiles and dispatches. The relevant data shapes are the **template data objects** passed to each sender.

### Transactional data shapes

```js
// welcome
{ userName: string, dashboardLink: string }

// forgot-password
{ userName: string, otp: string, resetLink: string }

// certificate-receiver
{ recipientName: string, issuerName: string, certificateTitle: string, certificateLink: string }

// certificate-issuer
{ issuerName: string, recipientName: string, certificateTitle: string, issuanceLogLink: string }

// certificate-revoked
{ recipientName: string, certificateTitle: string, supportLink: string }

// password-changed
{ userName: string, timestamp: string, supportLink: string }

// team-invite
{ orgName: string, inviterName: string, joinLink: string }

// email-verification-otp
{ userName: string, otp: string }

// email-verification-link
{ userName: string, verificationLink: string }
```

### Promotional data shapes

```js
// feature-announcement
{
  recipientName: string,
  featureTitle: string,
  featureDescription: string,
  ctaLink: string,
  ctaLabel: string,
  unsubscribeLink: string   // required, validated before compile
}

// plan-upsell
{
  recipientName: string,
  currentPlan: string,
  targetPlan: string,
  benefitsList: string[],   // rendered as <li> items via {{#each}}
  upgradeLink: string,
  unsubscribeLink: string   // required, validated before compile
}
```

### Brand Token values (canonical)

```js
const BRAND = {
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  primaryColor: '#1F3A5F',
  bodyBg: '#f8f9fa',
  cardBg: '#ffffff',
  mutedText: '#6c757d',
  bodyText: '#495057',
  borderColor: '#e9ecef',
  maxWidth: '600px',
  cardBorderRadius: '8px',
  cardPadding: '40px',
};
```

These values are authored as inline `style` attributes in `brand-tokens.hbs` and the structural partials. No template file may hardcode these values independently.

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: All templates compile without unresolved partials

*For any* template name in the full set of 11 templates (9 transactional + 2 promotional), calling `compileTemplate` with a valid data object should return a non-empty HTML string that contains no unresolved Handlebars syntax (no `{{>` sequences in the output).

**Validates: Requirements 1.5, 3.1–3.9, 4.1–4.2, 7.2**

### Property 2: Missing partial throws a descriptive error and no HTML is returned

*For any* Handlebars instance where one of the four required partials has been deregistered, calling `compileTemplate` should throw an `Error` whose message identifies the missing partial name, and should not return any HTML string.

**Validates: Requirements 1.6, 10.1, 10.5**

### Property 3: Missing template name throws a descriptive error and no HTML is returned

*For any* string that does not correspond to an existing `.hbs` file, calling `compileTemplate` should throw an `Error` whose message identifies the missing template name, and should not return any HTML string.

**Validates: Requirements 7.3, 10.2, 10.5**

### Property 4: All compiled templates apply brand tokens as inline styles

*For any* template name in the full set of 11 templates compiled with valid data, the resulting HTML string should: (a) contain no `<style>` block element, (b) contain `font-family` with the canonical value on the body element, (c) contain `color: #1F3A5F` on heading elements, (d) contain `background-color: #f8f9fa` on the outer wrapper, (e) contain `background-color: #ffffff` and `border-radius: 8px` on the inner card, and (f) contain `background-color: #1F3A5F` on CTA button elements.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.4, 8.5**

### Property 5: All compiled templates contain a footer section

*For any* template name in the full set of 11 templates compiled with valid data, the resulting HTML string should contain a footer section with the copyright notice and website link.

**Validates: Requirements 8.3**

### Property 6: Transactional templates contain no unsubscribe link

*For any* transactional template name (from the set of 9), the compiled HTML output should not contain the string `unsubscribe` (case-insensitive) or any `{{unsubscribeLink}}` reference.

**Validates: Requirements 3.10, 9.3, 9.4**

### Property 7: Promotional templates contain exactly one unsubscribeLink anchor

*For any* promotional template name (from the set of 2) compiled with a valid data object including a non-empty `unsubscribeLink` URL, the compiled HTML output should contain exactly one `<a>` element whose `href` attribute equals the provided `unsubscribeLink` value.

**Validates: Requirements 4.3, 9.5**

### Property 8: Promotional sender rejects missing or empty unsubscribeLink before compilation

*For any* data object where `unsubscribeLink` is absent, `null`, `undefined`, or an empty/whitespace-only string, calling `sendPromotional` should throw an `AppError` before `compileTemplate` is ever invoked, and `transporter.sendMail` should not be called.

**Validates: Requirements 6.2, 6.3, 9.1, 9.2**

### Property 9: Promotional sender dispatches to every recipient exactly once

*For any* non-empty list of N recipient email addresses and a valid promotional data object, calling `sendPromotional` should result in `transporter.sendMail` being called exactly N times, once per recipient address.

**Validates: Requirements 6.5**

### Property 10: Transactional sender dispatches exactly once per call

*For any* valid `(to, templateName, data, subject)` input, calling `sendTransactional` should result in `transporter.sendMail` being called exactly once with the `to` field matching the provided recipient address.

**Validates: Requirements 5.3**

### Property 11: Nodemailer dispatch errors are caught, logged, and re-thrown as AppError

*For any* call to `sendTransactional` or `sendPromotional` where `transporter.sendMail` throws an error, the sender should catch the error, call `logger.error` with the error details, and re-throw an `AppError` (not the raw error).

**Validates: Requirements 10.4**

### Property 12: Repeated compileTemplate calls do not cause partial re-registration errors

*For any* template name called multiple times in sequence, `compileTemplate` should succeed on every call without throwing a "partial already registered" or similar idempotence error.

**Validates: Requirements 7.5**

---

## Error Handling

### Error taxonomy

| Scenario | Thrown by | Error type | Message pattern |
|---|---|---|---|
| `.hbs` file not found | `compileTemplate` | `Error` | `Template "${name}" not found` |
| Partial not in registry | Handlebars (caught upstream) | `Error` | `Could not find partial with name "${name}"` |
| Missing `unsubscribeLink` | `sendPromotional` | `AppError` (400) | `Promotional email requires a non-empty unsubscribeLink` |
| Compilation failure | `sendTransactional` / `sendPromotional` | `AppError` (500) | `Email compilation failed: ${originalMessage}` |
| Nodemailer dispatch failure | `sendTransactional` / `sendPromotional` | `AppError` (500) | `Email dispatch failed: ${originalMessage}` |
| Missing partial at module load | Module initialisation | `Error` (crashes startup) | `Required partial "${name}" not found at ${path}` |

### Principles

- **Never send broken HTML.** If `compileTemplate` throws for any reason, `transporter.sendMail` is never called. The error propagates up.
- **Fail loudly at startup.** Missing partial files cause the module to throw at `require()` time, surfacing the problem before any request is served.
- **Structured errors for callers.** All errors that escape the email service are `AppError` instances so controllers receive a consistent `{ success: false, message }` response via the existing error middleware.
- **Full logging before re-throw.** `logger.error` is called with the full error object (including stack) before re-throwing, ensuring Winston captures the trace in `logs/error.log`.

### Error flow diagram

```mermaid
flowchart TD
    A[sendTransactional / sendPromotional] --> B{unsubscribeLink valid?\n(promotional only)}
    B -- No --> C[throw AppError 400]
    B -- Yes --> D[compileTemplate]
    D --> E{.hbs file exists?}
    E -- No --> F[throw Error: template not found]
    F --> G[catch in sender]
    G --> H[logger.error]
    H --> I[throw AppError 500]
    E -- Yes --> J[handlebars.compile + render]
    J --> K{all partials resolved?}
    K -- No --> F
    K -- Yes --> L[HTML string returned]
    L --> M[transporter.sendMail]
    M --> N{sendMail success?}
    N -- No --> O[catch in sender]
    O --> H
    N -- Yes --> P[resolve]
```

---

## Testing Strategy

### Dual approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** cover specific examples, integration points, and edge cases that are hard to express as universal properties (e.g., exact subject line format, specific variable rendering in a named template).
- **Property tests** verify universal invariants across all inputs — brand consistency, error conditions, sender dispatch counts.

### Property-based testing library

**Library:** [`fast-check`](https://github.com/dubzzz/fast-check) — the most mature PBT library for Node.js/JavaScript. Install in the backend dev dependencies:

```bash
npm install --save-dev fast-check
```

Each property test runs a **minimum of 100 iterations** (fast-check default is 100; set explicitly via `{ numRuns: 100 }`).

Each property test is tagged with a comment in the format:
`// Feature: email-infrastructure, Property N: <property_text>`

### Property test specifications

Each correctness property maps to exactly one property-based test:

| Property | Test description | Generators needed |
|---|---|---|
| P1 | All templates compile without unresolved partials | `fc.constantFrom(...templateNames)` + valid data per template |
| P2 | Missing partial → descriptive error, no HTML | `fc.constantFrom(...partialNames)` (deregister one, attempt compile) |
| P3 | Missing template name → descriptive error | `fc.string()` filtered to not match any valid template name |
| P4 | Brand tokens applied as inline styles | `fc.constantFrom(...templateNames)` + valid data |
| P5 | Footer present in all compiled templates | `fc.constantFrom(...templateNames)` + valid data |
| P6 | Transactional templates have no unsubscribe content | `fc.constantFrom(...transactionalNames)` + valid data |
| P7 | Promotional templates have exactly one unsubscribeLink anchor | `fc.constantFrom(...promotionalNames)` + `fc.webUrl()` for unsubscribeLink |
| P8 | Promotional sender rejects missing/empty unsubscribeLink | `fc.option(fc.string())` filtered to empty/null/undefined |
| P9 | Promotional sender calls sendMail N times for N recipients | `fc.array(fc.emailAddress(), { minLength: 1, maxLength: 20 })` |
| P10 | Transactional sender calls sendMail exactly once | `fc.emailAddress()` + `fc.constantFrom(...transactionalNames)` |
| P11 | Dispatch errors → AppError thrown | mock `sendMail` to throw, `fc.constantFrom(...templateNames)` |
| P12 | Repeated compileTemplate calls succeed | `fc.constantFrom(...templateNames)` + `fc.integer({ min: 2, max: 10 })` for repeat count |

### Unit test specifications

Unit tests focus on:

- **Partial registration at module load**: verify all four partials are registered in the Handlebars instance after `require('./emailService')`.
- **Specific template variable rendering**: compile `welcome` with `{ userName: 'Alice', dashboardLink: 'https://...' }` and assert the output contains `Alice`.
- **`from` address fallback**: with `FROM_EMAIL` unset, verify `sendMail` is called with `from: 'noreply@trustificate.com'`.
- **`from` address from env**: with `FROM_EMAIL=custom@example.com`, verify `sendMail` is called with that address.
- **Transactional footer content**: assert the transactional-footer partial source does not contain `unsubscribe`.
- **Promotional footer content**: assert the promotional-footer partial source contains `{{unsubscribeLink}}`.
- **`benefitsList` rendering**: compile `plan-upsell` with an array and assert each item appears as an `<li>` in the output.

### Test file location

```
backend/src/services/__tests__/emailService.test.js
```

Using Node's built-in test runner or Jest (whichever is already configured). Since the backend has no test runner configured yet, use **Jest** with a minimal config added to `package.json`:

```json
"jest": {
  "testEnvironment": "node"
}
```

Install:
```bash
npm install --save-dev jest fast-check
```
