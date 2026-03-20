# Trustificate Codebase Summary

Trustificate is a production-grade SaaS platform for digital credential issuance and management.

## Architecture
- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, TypeScript
- **Backend**: Node.js, Express, MongoDB (Mongoose) - *Migrating from Supabase*
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Storage**: AWS S3 integration via `aws-sdk`
- **PDF Generation**: Client-side rendering via HTML to canvas/PDF
- **AI Integration**: OpenAI API moved to the backend for security

## Key Folders & Files
- `frontend/` - Contains the React Vite application.
  - `frontend/package.json` - Lists React, Vite, Tailwind, Shadcn UI (`radix-ui`) dependencies.
- `backend/` - Contains the Node.js Express application.
  - `backend/package.json` - Lists Express, Mongoose, AWS SDK, OpenAI, JWT, bcryptjs dependencies.
- `prd.md` - Product Requirements Document outlining the target audience, UX principles, features, architecture, and SaaS pricing model.
- `task.md` - Detailed instructions for migrating the backend from Supabase to MongoDB/Express.
- `shift_to_ai_backend.md` - Instructions for removing OpenAI API calls from the frontend and implementing them securely in the Express backend.

## Summary of Relevant Documents

### `prd.md`
Outlines the core vision for "Trustificate":
- **Target Audiences:** Issuers, Recipients, Verifiers.
- **Key Features:** Marketing shell, Issuer Dashboard, Template Engine, Multi-Step Issuance & Registry, Verification Portal.
- **Database Schema (pre-migration):** `profiles`, `organizations`, `user_roles`, `certificate_templates`, `certificates`, `external_certificates`, `certificate_events`.
- **Pricing Model:** Free, Starter, Pro, Enterprise.

### `task.md`
Describes the backend migration objective:
- Transition from Supabase (Auth, Database, Storage) to a custom Node.js + Express backend.
- Replace Supabase Auth with standard JWT+bcrypt.
- Replace Supabase DB with MongoDB using Mongoose schemas.
- Replace Supabase Storage with AWS S3.
- Replace Row Level Security (RLS) with Express middleware to scope data to `organizationId`.
- Refactor the frontend React app to use REST endpoints instead of the Supabase client.

### `shift_to_ai_backend.md`
Details a security refactor for AI features:
- Move OpenAI integrations into the Node.js backend.
- Use a dedicated Express controller protected by JWT.
- Remove the `openai` SDK from the React frontend.
