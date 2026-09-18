# Live validation — September 13, 2026

September 18 sharing update: owner/second-account/signed-out browser checks and deployed stale-private-tab regression passed. Both disposable accounts were deleted. See SHARING-VALIDATION.md for current evidence and limitations.

September 15 authentication update: the dedicated live authentication checks are complete, including actual Google chooser sign-in, real emailed recovery and invalid/used/expired links, cross-browser recovery, account switching during a save, and automatic session renewal. See AUTH-VALIDATION.md for the current results; authentication items described as pending in the historical runs below have been superseded. Physical-device and screen-reader checks remain outstanding.

Applied supabase/migrations/202609080002_shared_pages.sql to project yzmnrcfauyvcbxxmkuxh through the authenticated Supabase SQL Editor. The transaction returned success. Existing library payloads and revisions were preserved.

Two disposable accounts and anonymous API requests verified:

- Public list discovery and readable notes.
- Unlisted direct-link access without profile discovery.
- Private list access restricted to owner.
- Account isolation and rejected writes using another owner ID.
- Public-to-private changes revoke direct access.
- Renaming lists preserves their addresses.
- Public collection projection omits personal notes.
- Stale revisions cannot overwrite newer edits.
- Account deletion removes profile and list links while preserving the second account.

Both test accounts were deleted through the application endpoint. No existing user accounts were altered by the tests. These are live API checks, not browser or mobile accessibility tests.


## Browser recovery and accessibility — September 13, 2026

Production release: `8e1bc579-5388-40e6-a1b1-67da7e13c0b8`.
Tested the deployed site using isolated headless Chrome sessions, Playwright, and axe-core. Accounts used randomly generated test-only addresses; existing collections were not edited.

Passed live browser scenarios:

- Disconnect before saving a custom game: recovery copy remains in browser storage.
- Reconnect and reload: the unsaved game is restored, and Retry save persists it to the account and removes the matching recovery copy.
- Forward a save to Supabase but drop its response: retry recognizes the already-committed payload and clears the draft without a false conflict.
- Two independently loaded browser contexts editing the same account: the stale save is rejected, its draft remains exportable, and the first browser's save is preserved.
- Export the conflicting copy: downloaded JSON includes the unsaved game.
- Load account version after explicit discard confirmation: discard only the local recovery copy and load the server version.
- Keyboard traversal stays inside the game editor; Escape closes the catalog and returns focus to Add game.
- Sign out, then sign in with the disposable account's password: return to the production collection, with no localhost redirect.

Fixed and rechecked:

- Games header overflow beside the mobile icon rail: compact account actions and omit the email/privacy badge at narrow widths.
- Statistics cards overflowing at 320px: allow grid columns to shrink and labels to use the full card width.
- Insufficient contrast on primary buttons and inactive tabs: darker purple button background and readable muted tab text.
- Missing catalog focus restoration: retain the initiating control as the focus destination.

No horizontal page overflow or axe WCAG A/AA violations were found on dashboard and Games at 320, 390, 768, and 1280px. Mobile catalog/editor, dark Games/catalog, and mobile login scans also reported no violations. TypeScript and production builds passed.

All disposable accounts were removed. One cleanup request correctly failed after its original session was signed out; that test account was then removed through the authenticated Supabase dashboard, with disappearance from the user list verified.

Limits: automated browser viewport tests do not replace testing physical phones, touch keyboards, VoiceOver/TalkBack, or every app route. Google OAuth, emailed recovery/expired links, and account switching during an in-flight save still need dedicated live browser walkthroughs. Delayed-response account guards are covered by unit tests. Monitoring and launch configuration remain separate work.


## Authentication and initial monitoring — September 14, 2026

Deployed version: `b41b9235-d1bc-4c48-bd5c-97ab0c3e388c`.

- Live rejected/invalid callback links show a retry route; URL parameters are cleared after rejection or code exchange. Valid flow parameters remain available until the SDK finishes verification.
- Clicking Google sign-in uses the production callback, and Supabase returns a Google authorization URL. The browser test intercepted the handoff before Google consent; a complete Google-account sign-in was not performed.
- The reset form generates a PKCE challenge and production callback. The test intercepted the email request, so no email was sent.
- A controlled code-exchange response for a disposable account triggers the actual PASSWORD_RECOVERY path and opens New password. A real Supabase password update succeeds, redirects to the production collection, and the new password authenticates successfully.
- A controlled ordinary code-exchange response opens the collection instead of password setup.
- The disposable recovery account was deleted through the application endpoint (HTTP 200).
- Live GET /api/health returns HTTP 200 and {"service":"pixel-dex","status":"ok"}. This probes the worker and Supabase's public authentication settings, not database writes or the game catalog. Failed checks return 503 with a generic payload.
- Cloudflare logs are enabled, invocation logs and traces are disabled, and application 5xx records contain only a fixed event name, service category, and HTTP status. Unit tests verify omission of request data and exception messages. Active notification delivery has not been configured or tested.

All 76 automated tests passed, including the three health/logging tests. Production builds passed. Physical phones, screen readers, real Google consent, email delivery, and real expired/reused email links remain separate checks; controlled exchanges do not establish those external flows.
