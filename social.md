PRD: Unified Authentication (Email + Google Sign-In with Single Profile)
1. Summary

Build a unified authentication system where users can sign up or log in using:

Email + Password
Google Sign-In

Key requirement:
If the same email is used across methods, it must map to a single user profile, not create duplicates.

2. Problem Statement

Current systems often create:

Separate accounts for Email login and Google login
Duplicate user records
Fragmented user data and poor UX

What this really means:
A user should feel like they have one identity, regardless of how they log in.

3. Goals
Primary Goals
Single user profile per unique email
Seamless login/signup via Google or Email
Auto-link accounts when emails match
Secondary Goals
Allow users to link/unlink providers manually
Maintain secure authentication flows
Avoid account duplication edge cases
4. Non-Goals
Social login beyond Google (future scope)
Phone-based authentication
Multi-email per account (out of scope for now)
5. User Flows
5.1 New User – Email Signup
User enters email + password
System checks if email exists:
❌ No → Create new profile
✅ Yes → Show "Account already exists, please login"
5.2 New User – Google Sign-In
User clicks "Continue with Google"
Google returns verified email
System checks:
❌ No existing email → Create new profile
✅ Email exists → Link Google to existing profile
5.3 Existing User – Email Login
User enters email + password
Authenticate normally
5.4 Existing User – Google Login
User clicks Google Sign-In
System:
Matches email
Logs user into same profile
5.5 Account Linking (Edge Case)

Case:

User signed up with Email earlier
Now tries Google with same email

👉 System behavior:

Detect match via email
Link Google provider silently
No duplicate account
6. Functional Requirements
6.1 Authentication Providers
Email/Password
Google OAuth
6.2 User Model
type User = {
  id: string
  email: string
  isEmailVerified: boolean

  providers: {
    email?: {
      passwordHash: string
    }
    google?: {
      googleId: string
    }
  }

  createdAt: Date
  updatedAt: Date
}
6.3 Identity Resolution Logic
function resolveUser(authPayload) {
  const email = authPayload.email

  let user = findUserByEmail(email)

  if (!user) {
    return createUser(authPayload)
  }

  // Link provider if not already linked
  if (!user.providers[authPayload.provider]) {
    linkProvider(user, authPayload)
  }

  return user
}
6.4 Provider Linking Rules
Scenario	Action
Email exists, Google login	Link Google
Google exists, Email signup	Allow password set
Both exist	Normal login
Different emails	Separate accounts
7. UX Requirements
Login Page
Show:
Continue with Google
Email + Password form
Messaging
If email exists:
“Account already exists. Continue with Google or login via password.”
Settings Page
Show linked accounts:
Email ✅
Google ✅ / ❌
Actions:
Link Google
Set/Change Password
Unlink provider (with constraints)
8. Edge Cases
8.1 Email Already Exists via Different Provider
Auto-link silently
8.2 Google Email Not Verified
Reject login OR enforce verification
8.3 Password Not Set (Google-only users)
Allow “Set Password” flow
8.4 Account Takeover Risk
Always trust:
Google verified email
Never auto-link if:
Email is unverified in Email signup
9. Security Considerations
Enforce email verification for email/password users
Use OAuth best practices for Google
Prevent account takeover:
Require re-authentication before linking/unlinking
Store password hashes securely (bcrypt/argon2)
10. API Design
POST /auth/email/signup
Input: email, password
Output: user + token
POST /auth/email/login
Input: email, password
Output: user + token
POST /auth/google
Input: Google ID token
Flow:
Verify token
Extract email
Resolve user (link/create)
POST /auth/link/google
Requires auth
Links Google account
11. Metrics / Success Criteria
% of duplicate accounts → should approach 0
Login success rate
Drop-off during signup
Provider linking success rate
12. Future Enhancements
Add more providers (Apple, Facebook)
Multi-device session management
Account merging UI (manual override)
Phone-based fallback auth
13. Implementation Notes (Practical)
Use a unique constraint on email
Always treat email as primary identity key
Keep provider data modular (extensible)
Bottom Line

This system ensures:

One user = one identity
No duplicate accounts
Flexible login options