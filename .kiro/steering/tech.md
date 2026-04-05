# Tech Stack & Build System

## Monorepo Structure
Two independent apps in a single repo: `backend/` and `frontend/`. No shared workspace tooling — each has its own `package.json` and `node_modules`.

## Backend
- Runtime: Node.js with Express
- Language: JavaScript (CommonJS — `require`/`module.exports`)
- Database: MongoDB via Mongoose ODM
- Auth: JWT (jsonwebtoken) + bcryptjs password hashing + Google OAuth (google-auth-library) + GitHub OAuth
- Validation: Joi schemas
- Storage: Cloudflare R2 (S3-compatible, via @aws-sdk/client-s3)
- Email: Nodemailer with Handlebars templates
- AI: OpenAI SDK (server-side only)
- API Docs: Swagger (swagger-jsdoc + swagger-ui-express) at `/api-docs`
- Logging: Winston
- Security: Helmet, CORS (before Helmet), express-rate-limit
- Dev: Nodemon for hot reload

## Frontend
- Framework: React 18 with TypeScript
- Build: Vite (with @vitejs/plugin-react-swc)
- Styling: Tailwind CSS 3 with tailwindcss-animate
- UI Components: shadcn/ui (Radix UI primitives, default style, slate base color, CSS variables)
- Routing: react-router-dom v6
- State/Data: TanStack React Query
- Forms: react-hook-form + zod validation + @hookform/resolvers
- Charts: Recharts
- PDF: jsPDF + html2canvas (client-side)
- QR Codes: qrcode.react
- Toasts: sonner + Radix toast
- Testing: Vitest + @testing-library/react + jsdom + @vitest/coverage-v8
- E2E Testing: Playwright (chromium)
- Linting: ESLint 9 (flat config) with react-hooks and react-refresh plugins
- Formatting: Prettier

## Social Login
- Google: GSI (Identity Services) — One Tap auto-prompt for unauthenticated users + OAuth popup on login/signup pages
- GitHub: OAuth redirect flow via `/auth/github/callback` frontend route
- Controlled by env vars: `VITE_ENABLE_GOOGLE_LOGIN`, `VITE_ENABLE_GITHUB_LOGIN` (default: off)
- Backend endpoints: `POST /api/auth/social/google`, `POST /api/auth/social/github`
- Account linking: same email across providers maps to a single user profile

## Local Dev (Portless)
- Install: `npm install -g portless` (global, not a project dependency)
- Proxy: `portless proxy start -p 80` (run once from Admin terminal)
- Backend URL: `http://api.trustificate.localhost`
- Frontend URL: `http://trustificate.localhost`
- Portless auto-assigns a random port via `PORT` env var; Express and Vite both respect it
- CORS allows any `*.localhost` origin for portless dev URLs
- Vite proxies `/api` requests to the backend portless URL with `changeOrigin: true`
- To bypass portless: `PORTLESS=0 npm run dev`

## Common Commands

### Backend (`backend/`)
```bash
npm run dev          # Start via portless → http://api.trustificate.localhost
npm start            # Start production server (no portless)
```

### Frontend (`frontend/`)
```bash
npm run dev          # Start via portless → http://trustificate.localhost
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run tests once (vitest run)
npm run test:coverage # Run tests with coverage report
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run Playwright E2E tests
npm run format       # Prettier format all files
```

## Environment Variables
- Backend: `backend/.env` (see `backend/.env.example` for required vars)
  - Social auth: `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Frontend: `frontend/.env` — uses `VITE_` prefix (e.g., `VITE_API_BASE_URL`)
  - Social login: `VITE_ENABLE_GOOGLE_LOGIN`, `VITE_ENABLE_GITHUB_LOGIN`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GITHUB_CLIENT_ID`
