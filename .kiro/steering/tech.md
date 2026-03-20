# Tech Stack & Build System

## Monorepo Structure
Two independent apps in a single repo: `backend/` and `frontend/`. No shared workspace tooling — each has its own `package.json` and `node_modules`.

## Backend
- Runtime: Node.js with Express
- Language: JavaScript (CommonJS — `require`/`module.exports`)
- Database: MongoDB via Mongoose ODM
- Auth: JWT (jsonwebtoken) + bcryptjs password hashing
- Validation: Joi schemas
- Storage: Cloudflare R2 (S3-compatible, via @aws-sdk/client-s3)
- Email: Nodemailer with Handlebars templates
- AI: OpenAI SDK (server-side only)
- API Docs: Swagger (swagger-jsdoc + swagger-ui-express) at `/api-docs`
- Logging: Winston
- Security: Helmet, CORS, express-rate-limit
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
- Testing: Vitest + @testing-library/react + jsdom
- Linting: ESLint 9 (flat config) with react-hooks and react-refresh plugins
- Formatting: Prettier

## Common Commands

### Backend (`backend/`)
```bash
npm run dev          # Start dev server with nodemon (port 3000)
npm start            # Start production server
```

### Frontend (`frontend/`)
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run tests once (vitest run)
npm run test:watch   # Run tests in watch mode
npm run format       # Prettier format all files
```

## Environment Variables
- Backend: `backend/.env` (see `backend/.env.example` for required vars)
- Frontend: `frontend/.env` — uses `VITE_` prefix (e.g., `VITE_API_BASE_URL`)
