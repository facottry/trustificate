# Project Structure & Conventions

## Backend (`backend/src/`)

### Module Pattern
Each domain lives in `modules/{name}/` with up to four files:
- `{name}.route.js` — Express router with Swagger JSDoc annotations
- `{name}.controller.js` — Request handlers wrapped in `asyncHandler()`, use `success()`/`error()`/`paginate()` response helpers
- `{name}.service.js` — Business logic, DB queries, throws `AppError` on failure
- `{name}.schema.js` — Mongoose model definition

Not all modules have all four files. Some (like `event`, `role`, `externalCertificate`) only define a schema.

### Middleware (`middlewares/`)
- `auth.middleware.js` — `protect` (JWT verification), `restrictTo(...roles)` (role guard)
- `emailVerification.middleware.js` — `requireEmailVerified` (blocks unverified users)
- `error.middleware.js` — `asyncHandler` (async wrapper), `AppError` (operational error class)
- `validate.middleware.js` — Joi request validation

### Services (`services/`)
Shared cross-cutting services:
- `cloudflareR2Service.js` — S3-compatible file upload/download
- `emailService.js` — Nodemailer email sending with Handlebars templates
- `openaiService.js` — OpenAI API integration

### Utils (`utils/`)
- `apiResponse.js` — `success()`, `error()`, `paginate()` response helpers
- `constants.js` — Shared constants
- `logger.js` — Winston logger configuration

### API Routes
All routes are prefixed with `/api/`. Most require `requireEmailVerified` middleware. Auth routes (`/api/auth`) are public.

### API Response Format
All responses follow: `{ success: boolean, message: string, data?: any, pagination?: { total, page, limit, pages } }`

## Frontend (`frontend/src/`)

### Directory Layout
- `components/` — Reusable components + `ui/` subfolder for shadcn/ui primitives
- `pages/` — Route-level page components (one per route), including `super-admin/` subfolder
- `hooks/` — Custom React hooks (`useAuth`, `useAIAssist`, `usePlanGuard`, etc.)
- `lib/` — Utilities: `apiClient.ts` (fetch wrapper), `utils.ts` (cn helper), `pdf-generator.ts`
- `data/` — Static data files
- `assets/` — Images and static assets
- `integrations/` — Third-party integration configs (legacy Supabase references remain)
- `test/` — Test files

### Path Aliases
Configured via `@/` prefix: `@/components`, `@/hooks`, `@/lib`, `@/pages`, etc.

### API Client
`lib/apiClient.ts` is the central fetch wrapper. It:
- Prepends `VITE_API_BASE_URL` to relative paths
- Attaches JWT from localStorage (`TRUSTIFICATE:token`)
- Returns typed `ApiResponse<T>` objects
- Throws `ApiError` on non-OK responses

### Route Protection
- `ProtectedRoute` — requires authentication
- `OptionalProtectedRoute` — works for both authenticated and unauthenticated users
- `SuperAdminGuard` — restricts to super admin role

### Conventions
- Pages are default-exported React components
- shadcn/ui components live in `components/ui/` and should not be manually edited
- Forms use react-hook-form + zod schemas
- Data fetching uses TanStack React Query
