# Hard-Won Lessons (Do Not Repeat)

## 1. Variable scope across try/catch blocks
When splitting code into multiple try/catch phases, variables declared with `const`/`let` inside a block are NOT visible outside it.
- Always hoist shared variables (`let aiLimiter;`) BEFORE the try block
- Assign inside the block without re-declaring: `aiLimiter = rateLimit({...})`
- Never use `const` for a variable that needs to be used in a later phase/block

## 2. Incremental strReplace on broken files makes things worse
If a file has a syntax error or is partially broken, do NOT keep applying strReplace patches.
- Read the full file first with `skipPruning: true`
- If it's mangled, rewrite it completely with `fsWrite` in one shot
- Verify with `getDiagnostics` after writing

## 3. package.json path from backend/src/app.js
The correct relative path to `backend/package.json` from `backend/src/app.js` is `../package.json`, NOT `../../package.json`.
- `../../package.json` resolves to the repo root, which may not have a `version` field or may not exist

## 4. Nodemon truncates error output
Nodemon swallows or truncates crash output, especially stack traces.
- When debugging startup crashes, write errors to a file (`fs.writeFileSync('crash.log', ...)`) in addition to `console.error`
- Use versioned phase logs (`[1.1]`, `[2.3]`, etc.) so the last printed line pinpoints exactly where the crash occurred

## 5. Mongoose duplicate index warnings crash the server
Defining `unique: true` on a field AND calling `schema.index({ field: 1 })` separately creates a duplicate index.
- Mongoose treats `unique: true` as an implicit index — never add a redundant `.index()` call for the same field
- Check all schemas when this warning appears; scan for both `unique: true` and `.index()` on the same field

## 6. CORS must run before Helmet
Helmet's `crossOriginResourcePolicy` can block preflight OPTIONS responses before CORS headers are set.
- Always mount `cors()` middleware BEFORE `helmet()` in Express
- Add `crossOriginResourcePolicy: { policy: 'cross-origin' }` to Helmet config
- Keep the CORS allowed origins list up to date with all deployment URLs

## 7. Google One Tap has dismissal cooldown
If a user dismisses Google One Tap, Google suppresses it for increasing periods (2h → 1d → 1w).
- The 403 on `/gsi/status` is Google's anti-annoyance behavior, not a code bug
- Fix: clear cookies for `accounts.google.com` or test in incognito
- The "Continue with Google" button (OAuth popup) is unaffected by this cooldown

## 8. Mongoose user schema: social-only users need no password
When adding social auth, the pre-save hook must allow users without a password if their `authProvider` is not `['local']`.
- Check `this.authProvider.every(p => p === 'local')` before requiring password
- Social-only users have no `passwordHash` — handle this in login and forgot-password flows

## 9. MongoDB _id vs id in API responses
Mongoose documents have `_id` in JSON but a virtual `id` getter. The frontend `useAuth` must handle both.
- Map `raw.id || raw._id` when consuming `/api/auth/me` responses
- This prevents `undefined` user IDs causing "Cast to ObjectId failed" errors on PUT requests

## 10. Plan data should live in the database, not code
Hardcoded plan configs require code deployments to change pricing.
- Plans are now stored in MongoDB (`Plan` schema) and seeded on startup
- `planConfig.js` reads from DB with 1-minute in-memory cache
- Super admin can edit plans via `PATCH /api/admin/super/plans/:planId`
- Cache invalidates on every update so changes take effect immediately
- Public pricing page fetches from `GET /api/public/plans`
