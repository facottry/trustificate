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
