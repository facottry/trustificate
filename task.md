# Context
We are migrating the backend of a SaaS web application named "Trustificate" from Supabase to MongoDB. Trustificate is a production-grade certificate issuance and verification platform. 
The current frontend is built with React, Vite, Tailwind CSS, Shadcn UI, and TypeScript. It currently uses `@supabase/supabase-js` for database, authentication, and storage interactions.

# Objective
Please refactor the application architecture to use a custom Node.js/Express backend with MongoDB (using Mongoose) to replace Supabase. 

# Architectural Requirements
1. **Backend Framework:** Set up a Node.js + Express backend using TypeScript.
2. **Database:** Use MongoDB with Mongoose for Object Data Modeling (ODM).
3. **Authentication:** Replace Supabase Auth with standard JWT-based authentication (email/password) and bcrypt for password hashing.
4. **Storage:** Replace Supabase Storage (used for storing external certificate PDFs and logos) with an AWS S3 integration using the `aws-sdk` (or `multer-s3`).
5. **Security (Replacing RLS):** Supabase Row Level Security (RLS) must be replaced with Express middleware. Create auth middleware to ensure users can only CRUD data belonging to their own `organizationId`. Public routes (like `/api/verify/:certificateNumber`) should remain unauthenticated but strictly read-only.

# Step 1: Data Modeling (Mongoose Schemas)
Convert the current relational schema into the following MongoDB/Mongoose models. Please use references (`ObjectId`) where necessary, and embed data where it makes sense for NoSQL performance:
* `User`: email, passwordHash, displayName, avatarUrl.
* `Organization`: name, slug, logoUrl.
* `Role`: Links User to Organization with a role enum ('admin', 'user').
* `Template`: title, placeholders (JSON/Array), isActive, layout, configuration fields, organizationId (Ref).
* `Certificate`: templateId (Ref), certificateNumber (unique), status ('issued', 'revoked'), pdfUrl, recipientDetails (embedded object), organizationId (Ref).
* `ExternalCertificate`: organizationId (Ref), issuerName, originalUrl, pdfBucketPath.
* `Event`: certificateId (Ref), eventType ('issued', 'revoked', 'viewed'), timestamp.

# Step 2: Backend API Endpoints
Generate the RESTful API routes and controllers to handle the following operations:
* **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
* **Organizations:** CRUD operations protected by JWT middleware.
* **Templates:** CRUD operations scoped to the user's organization.
* **Certificates:** `POST /api/certificates/issue` (handles generation and saving), `GET /api/certificates` (list with pagination/filters).
* **Public Verification:** `GET /api/public/verify/:certificateNumber` (returns certificate details if status is 'issued').

# Step 3: Frontend Refactoring
* Remove all `@supabase/supabase-js` imports and initializations.
* Create an `apiClient.ts` utility using `axios` or native `fetch` with an interceptor to automatically attach the JWT token from local storage to all outbound requests.
* Update the React Query/SWR hooks (or standard state data fetching) to point to the new `/api` endpoints instead of Supabase client methods.

# Execution Constraints
* Write modular, clean TypeScript code.
* Provide the Mongoose schemas first so I can review the data model transition.
* After the schemas are approved, provide the Express server setup and routing.
* Finally, provide the updated frontend API integration layer.