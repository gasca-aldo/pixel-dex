# Authentication validation — 2026-09-14

Deployed version: `acea7a8c-2a42-457b-a886-727e7fa084cb` (includes the reset-instruction correction; TypeScript and production build passed).
Scope: authentication, sessions, password recovery and account isolation only. No database migrations, RLS changes or main-user collection/password changes.

## Completed

- Actual Google account chooser sign-in with the authorized account: correct email and existing collection loaded; ordinary sign-in opened My collection.
- Actual reset email delivered to a disposable Gmail alias. Fresh link in the originating Chrome browser opened the password form; updating the disposable password opened My collection.
- Reopening that consumed link returned a safe error and did not use the existing signed-in session to accept it.
- After the new template was activated and the user confirmed recovery, reopening the latest token-hash reset email and pressing Continue returned the safe invalid/expired/already-used error. This was observed directly in Chrome. Separate new-password sign-in still needs confirmation.
- Before the fix, a fresh Chrome-initiated reset link failed safely in a separate browser because its PKCE verifier was absent. After the token-hash template was activated, the user confirmed the requested separate-browser password reset and redirect to My collection worked. This final result is user-verified; browser automation could not observe it.
- Browser race reproduction: held the initial identity response for A, broadcast a real B session, then released A. Before the fix the form displayed A while storage held B. After the fix the built app kept B visible.
- Account switch during a held save: request retained A's token and expected owner; B saw an empty private collection and received none of A's data. Supabase denied B's direct read of A and rejected a mismatched-owner write.
- Simulated server-expired access token and rejected refresh: collection initialization returned to login with no private collection displayed. Natural session expiry/refresh lifetime is not yet verified.
- The original disposable session subsequently expired naturally. Supabase rejected its identity request (403) and private-library request (401); both responses explicitly referred to expiry. Refresh returned 400 `refresh_token_not_found`. The test account was still present in the dashboard. This confirms actual expired access and unusable refresh rejection at the service boundary, not successful automatic refresh in the app.
- Deployed callback regressions: malformed callback error and credential URL cleanup; ordinary callback routes home; controlled PKCE recovery routes to password form; real disposable password mutation and new-password sign-in succeed.
- TypeScript, production build and all 85 automated tests passed. Nine focused tests added in auth-identity, password-update and auth-callback suites. Existing RLS, stale save completion, draft preservation and account deletion tests remained passing.
- Natural reset-link expiry passed on September 15: the reserved September 14, 9:23 p.m. email was opened after more than 11 hours against a verified 3600-second lifetime. Continue returned the safe rejection message, and visiting My collection returned to Welcome back / Sign in, confirming no session was granted.

## Confirmed causes and minimal fixes

1. An unversioned initial getUser response could overwrite a newer auth event. Login now ignores outdated identity results, clears password/messages on auth events, and invalidates pending lookups on unmount.
2. Password mutation previously delegated session selection to the shared SDK. The update now verifies and pins the original account token; switches during verification abort, and late responses cannot redirect the new account. Regression tests cover missing/expired/mismatched identities and switches before/during mutation.
3. Default PKCE reset email links require initiating-browser state. Added a recovery-only token-hash fragment handler using Supabase verifyOtp, with explicit confirmation, URL cleanup, no open redirects and safe rejected-token errors. Google and legacy reset links retain PKCE. The handler is deployed and activated in outgoing reset emails. The user confirmed cross-browser password submission and the redirect to My collection.

## SMTP and email template status

Gmail custom SMTP was saved with the user's supplied configuration. The reset template was updated, and a real email arrived for the disposable alias `aldongasca+pixel-auth-8cb051aa@gmail.com`. Its link used the production host and token-hash fragment. Opening that link in a separate in-app browser displayed the recovery confirmation page. After clicking Continue, browser access failed before the verification result or password form could be observed. The user subsequently completed the requested manual test and reported “It works,” confirming the reset and redirect. Separate new-password sign-in and replay of the new token-hash link were not included in that confirmation.

The active reset link is:

```html
<a href="{{ .SiteURL }}/auth/callback#token_hash={{ .TokenHash }}&type=recovery">Reset password</a>
```

Site URL remains the deployed HTTPS site. Separate-browser recovery and redirect are user-confirmed. Used token-hash link rejection and natural expiration have been observed directly. Verify a separate new-password sign-in. The obsolete same-browser instruction has now been removed and deployed.

The browser connection previously failed while loading its request-header policy. Direct Chrome control later allowed used-link rejection to be observed, although tab automation remained unavailable and subsequent settings inspection was blocked by an inaccessible navigation menu. Password entry/submission requires the user to take over under the current computer-use rules. The latest disposable alias remains pending cleanup after testing.

The Gmail App Password was visible in the setup page output. The user confirmed completion of the replacement-and-revocation instructions on September 15. Afterward, one reset was requested through the deployed app for the disposable alias; Gmail showed a newly received reset email at 10:12 a.m. Tijuana time (17:12 UTC). Delivery with the replacement configuration passed. The new email was left unopened, and Safari's signed-in session was preserved. No replacement credential was inspected or included in this report or chat.

## Final validation status

### Untouched-link expiry test — passed

Read the actual Email OTP expiration in Supabase: 3600 seconds. No setting was changed. Sent a fresh reset through the deployed login UI for `aldongasca+pixel-auth-8cb051aa@gmail.com` at approximately 2026-09-15 04:23:36 UTC. Gmail confirmed receipt at 9:23 p.m. Tijuana time on September 14. The new email and its link were left unopened overnight. Verification began after 2026-09-15 15:33:47 UTC, well beyond the configured hour.

Opened the reserved 9:23 p.m. email and followed its link in signed-out Chrome. Pressing Continue password reset returned “This link is invalid, expired, or already used. Please request a new link.” Visiting the collection root subsequently showed Welcome back / Sign in, with no collection access. This is a separate test from the 8:26 p.m. used-link check. Preserve the temporary account until the remaining sign-in check is complete.

### New-password sign-in — passed (user verified)

The user confirmed the requested sign-out and separate sign-in with the newly set password succeeded. The password was not shared in chat.

### Automatic session renewal — passed (screenshot and user verified)

After leaving the Safari test session signed in, the user supplied Network inspector evidence of a Supabase SDK-initiated request to `/auth/v1/token?grant_type=refresh_token` returning HTTP 200 from the network, with the production app as its origin. Following the request to reload and confirm the same collection without signing in, the user reported “working.” Successful refresh is directly evidenced by the screenshot; continued app access after reload is user-verified. No token contents were copied. This closes the outstanding session-renewal check; it does not independently measure the configured token lifetime.

### Cleanup — September 15

Removed the temporary saved test session `/tmp/pixel-auth-smtp.json` and the authentication-only scripts/log in `/tmp/pixel-browser-check` (auth-race.mjs, auth.mjs, auth.log, isolation.mjs). Retained the checked-in regression tests and unrelated browser/accessibility artifacts. After explicit user confirmation, deleted `aldongasca+pixel-auth-8cb051aa@gmail.com` through the application's authenticated deletion page in Safari. The page identified the disposable alias before submission and redirected to `/login?account=deleted` with the signed-out Welcome back form afterward. No main-user account or collection was changed.

### Cleanup complete

- Disposable account deletion and temporary authentication artifact cleanup are complete. No functional authentication checks remain open in this report.

Safari session persistence passed on September 15 at approximately 17:04 UTC. Native browser inspection showed the disposable account email, Account library ready, and an empty collection. Reloading the page returned the same identity and collection with Account library ready. No collection edits or sign-out were performed. The later Network screenshot and user confirmation above additionally verify successful session renewal.

Owner-scoped unsaved drafts are intentionally retained for recovery. They are not loaded into another account's UI, but local browser storage is not an isolation boundary against someone with access to the same browser profile. No changes were made that discard unsaved work.

## Files changed for this task

- app/login/page.tsx
- app/auth/callback/page.tsx
- lib/supabase.ts
- lib/auth-identity.ts
- lib/password-update.ts
- lib/auth-callback.ts
- tests/auth-identity.test.mjs
- tests/password-update.test.mjs
- tests/auth-callback.test.mjs
- AUTH-VALIDATION.md

All other existing uncommitted project changes predated this task and were preserved.
