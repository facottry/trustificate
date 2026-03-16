# Context
We are adding authentication workflows to our SaaS platform, "Trustificate" (Node.js, Express, MongoDB backend; React, Vite frontend). We need to implement OTP-based email verification for new user registrations and a forgot password flow. 

# Objective
Please implement an end-to-end OTP workflow. Crucially, I need a "Master OTP" bypass (`123987`) built into the verification logic. This Master OTP should successfully verify any account or reset any password, which is necessary for automated testing and app store reviews.

# Step 1: Database Updates (Mongoose)
Update the existing `User` schema in MongoDB to support OTPs:
1. Add `isEmailVerified` (Boolean, default: false).
2. Add `authOtp` (String, nullable) to store the hashed or plain 6-digit OTP.
3. Add `otpExpiry` (Date, nullable) to track when the OTP expires (e.g., 15 minutes after generation).

# Step 2: Email Service Setup
Create a reusable email service (`services/emailService.ts`) using Nodemailer. 
1. Configure it to use standard SMTP credentials from the `.env` file (e.g., `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`).
2. Create two template functions: `sendVerificationEmail(email, otp)` and `sendPasswordResetEmail(email, otp)`. Use the "Trustificate" brand name in the email subjects and body.

# Step 3: Backend API Controllers & Routes
Create or update the auth controllers (`controllers/authController.ts`) with the following endpoints:

1. **`POST /api/auth/register`**: 
   - Creates the user with `isEmailVerified: false`.
   - Generates a random 6-digit OTP, saves it to the DB with a 15-min expiry, and sends the verification email.
2. **`POST /api/auth/verify-email`**: 
   - Accepts `email` and `otp`.
   - **MASTER OTP LOGIC:** If `otp === '123987'`, bypass the database check and immediately verify the user.
   - Otherwise, verify against the DB, ensure it isn't expired, and set `isEmailVerified: true`.
3. **`POST /api/auth/forgot-password`**: 
   - Looks up the user. If found, generates a new 6-digit OTP, updates the DB, and sends the reset email.
4. **`POST /api/auth/reset-password`**: 
   - Accepts `email`, `otp`, and `newPassword`.
   - **MASTER OTP LOGIC:** If `otp === '123987'`, bypass the DB OTP check.
   - Otherwise, validate the OTP. Hash the `newPassword` using bcrypt, update the user record, and clear the OTP fields.

# Step 4: Frontend UI (React/Vite)
1. **Registration Flow:** After a user submits the signup form, redirect them to a `/verify-email` page containing a 6-digit OTP input component. 
2. **Forgot Password Flow:** Create a `/forgot-password` page to request the OTP, which then transitions to a state/page allowing them to input the OTP and their new password.
3. **API Integration:** Connect these UI components to the new Express endpoints using our Axios/Fetch API client. Ensure error states (e.g., "Invalid OTP" or "OTP Expired") are handled gracefully with toast notifications.

# Execution Constraints
* Provide the `User` schema updates and the Master OTP logic inside the controllers first.
* Ensure the Master OTP logic is cleanly separated from the standard OTP verification block so it can be easily toggled off in production via an environment variable (e.g., `process.env.ENABLE_MASTER_OTP === 'true'`) if needed later.
* Provide the Nodemailer setup and the React UI components next.