# Project Structure & Conventions

## Backend (`backend/src/`)

### Module Pattern
Each domain lives in `modules/{name}/` with up to four files:
- `{name}.route.js` — Express router with Swagger JSDoc annotations
- `{name}.controller.js` — Request handlers wrapped in `asyncHandler()`, use `success()`/`error()`/`paginate()` response helpers
- `{name}.service.js` — Business logic, DB queries, throws `AppError` on failure
- `{name}.schema.js` — Mongoose model definition

Not all modules have all four files. Some (like `event`, `role`, `externalCertificate`) only define a schema.

### Key Modules
- `auth` — Email/password login, Google OAuth, GitHub OAuth, OTP verification, password reset
- `user` — Profile CRUD, avatar upload (R2), password change
- `template` — Certificate templates with categories, color themes, sample PDF/image URLs, system seed
- `plan` — Subscription plans stored in MongoDB (seeded from defaults, editable by super admin)
- `certificate` — Certificate issuance, verification, PDF generation
- `admin` — Super admin endpoints for users, orgs, templates, plans, billing, audit logs

### Middleware (`middlewares/`)
- `auth.middleware.js` — `protect` (JWT verification), `restrictTo(...roles)` (role guard)
- `emailVerification.middleware.js` — `requireEmailVerified` (blocks unverified users)
- `error.middleware.js` — `asyncHandler` (async wrapper), `AppError` (operational error class)
- `validate.middleware.js` — Joi request validation

### Services (`services/`)
Shared cross-cutting services:
- `cloudflareR2Service.js` — S3-compatible file upload/download (certificates, avatars, logos)
- `emailService.js` — Nodemailer email sending with Handlebars templates
- `openaiService.js` — OpenAI API integration

### Utils (`utils/`)
- `apiResponse.js` — `success()`, `error()`, `paginate()` response helpers
- `constants.js` — Shared constants
- `logger.js` — Winston logger configuration
- `planConfig.js` — Plan configuration with DB-backed cache (1-min TTL), fallback to hardcoded defaults

### API Routes
All routes are prefixed with `/api/`. Most require `requireEmailVerified` middleware. Auth routes (`/api/auth`) are public. Public routes (`/api/public`) require no auth.

### Public API Endpoints (no auth)
- `GET /api/public/plans` — Returns all active plans with display data for pricing page
- `GET /api/public/platform-stats` — Aggregated platform statistics
- `GET /api/public/verify/:certificateNumber` — Certificate verification
- `POST /api/public/contact` — Contact form submission
- `GET /api/public/newsletter` — Public newsletter archive

### API Response Format
All responses follow: `{ success: boolean, message: string, data?: any, pagination?: { total, page, limit, pages } }`

## Frontend (`frontend/src/`)

### Directory Layout
- `components/` — Reusable components + `ui/` subfolder for shadcn/ui primitives
- `pages/` — Route-level page components (one per route), including `super-admin/` subfolder
- `hooks/` — Custom React hooks (`useAuth`, `useAIAssist`, `usePlanGuard`, etc.)
- `lib/` — Utilities: `apiClient.ts` (fetch wrapper), `utils.ts` (cn helper), `pdf-generator.ts`
- `data/` — Static data files (platformStats; pricingTiers is now API-driven)
- `assets/` — Images and static assets, including mascot mood images (`mascot_*.png`)
- `test/` — Test setup and utilities
- `e2e/` — Playwright E2E test specs (at `frontend/e2e/`)

### Key Components
- `Mascot.tsx` — "Rusti" the mascot with 6 mood images, sound effects, emoji bursts, click interactions
- `SocialLoginButtons.tsx` — Google/GitHub login buttons, controlled by env vars
- `GoogleOneTap.tsx` — Auto-prompt Google One Tap for unauthenticated visitors (production only)
- `ProtectedRoute.tsx` / `OptionalProtectedRoute.tsx` / `SuperAdminGuard.tsx` — Route guards

### Path Aliases
Configured via `@/` prefix: `@/components`, `@/hooks`, `@/lib`, `@/pages`, etc.

### API Client
`lib/apiClient.ts` is the central fetch wrapper. It:
- Prepends `VITE_API_BASE_URL` to relative paths
- Attaches JWT from localStorage (`TRUSTIFICATE:token`)
- Returns typed `ApiResponse<T>` objects
- Throws `ApiError` on non-OK responses
- Captures `X-App-Version` header for version display

### Route Protection
- `ProtectedRoute` — requires authentication + verified email
- `OptionalProtectedRoute` — works for both authenticated and unauthenticated users
- `SuperAdminGuard` — restricts to super admin role (`role === 'admin'`)

### Conventions
- Pages are default-exported React components
- shadcn/ui components live in `components/ui/` and should not be manually edited
- Forms use react-hook-form + zod schemas
- Data fetching uses TanStack React Query
- Pricing/plans data fetched from `GET /api/public/plans` (not hardcoded)
- Template categories and display data fetched from API
