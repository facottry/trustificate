Product Requirements Document: Social Login Integration
1. Executive Summary
Objective: Implement OAuth 2.0 social login for Trustificate to reduce onboarding friction and improve conversion rates for both document issuers and recipients.
Scope: Integrate Google and LinkedIn as the primary identity providers, given Trustificate’s B2B and professional certification focus.

2. User Experience (UX) & Interface
Authentication Screens: The Login and Signup views must feature prominent "Continue with Google" and "Continue with LinkedIn" buttons above the standard email/password form separator.

OTP Bypass: Users authenticating via a social provider skip the 6-digit email OTP verification step, as their email address is inherently verified by the identity provider.

Account Unification: If a user registers via standard email/password and later clicks "Continue with Google" using the exact same email address, the system must seamlessly link the Google identity to their existing Trustificate account rather than throwing a "User already exists" error.

3. Technical Architecture (Node.js/React/MongoDB)
3.1 Database Schema Updates (User Model)
The existing MongoDB user schema requires expansion to handle OAuth identities:

authProvider: Enum array or string (e.g., ['local', 'google', 'linkedin']). Default is ['local'].

googleId: String (unique, sparse).

linkedinId: String (unique, sparse).

avatarUrl: Update to automatically ingest the profile picture provided by the OAuth payload if the user does not already have one set.

3.2 Backend API Endpoints (Express)
Initiation Routes: Endpoints to redirect the client to the respective provider's OAuth consent screen.

Callback Routes: Endpoints to handle the redirect from the provider, exchange the authorization code for an access token, and fetch the user's profile data.

Session Generation: Upon successful profile retrieval, the backend must generate the standard JWT and redirect the user back to the frontend dashboard with the token securely delivered (via HTTP-only cookie or short-lived URL token).

3.3 Frontend Flow (React/Vite)
Routing: The frontend must handle the specific callback routes to parse the incoming authentication state and update the global user context.

Error Handling: Graceful toast notifications for OAuth failures (e.g., "Authentication cancelled by user" or "Failed to connect to Google").

4. Security & Edge Cases
Missing Emails: If a social provider payload does not return an email address (rare, but possible depending on user privacy settings), the backend must cleanly abort the login and redirect the user to a standard email registration fallback.

Password Resets: If a user exclusively uses social login (i.e., they have no hashed password in the database), attempting to use the "Forgot Password" flow should trigger an email gently reminding them to log in via their social provider, rather than generating a password reset OTP.

Environment Parity: OAuth callback URLs must be strictly configured in the respective developer consoles (Google Cloud Console, LinkedIn Developer Portal) to support both the local frontend port (8080) and the production domain (trustificate.clicktory.in).