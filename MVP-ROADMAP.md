# Pixel Dex MVP roadmap

Updated September 15, 2026. Cloudflare hosting is already running.

Authentication validation and cleanup are complete: actual Google sign-in, account isolation during saves, real password recovery (valid, expired, used, and cross-browser links), new-password sign-in, expired-session rejection, and automatic session renewal passed. All 85 automated tests passed. See AUTH-VALIDATION.md for evidence and the distinction between observed and user-verified results. Older authentication-pending statements below are historical and superseded. The final disposable account was deleted through the app after confirmation; temporary authentication scripts, logs, and the saved test session have been removed.
This checklist distinguishes implemented safeguards from validation still needed on the live project.

## 1. Release dates

September 15 validation: postponements, TBA changes, platform/region selection, manual-date preservation, refresh failures and invalidated account/snapshot results pass deterministic tests. Month/quarter labels and Upcoming grouping are implemented; the actual editor and Upcoming components passed local mobile-width checks at 390px/320px. All 92 automated tests and TypeScript pass. See RELEASE-VALIDATION.md for evidence and remaining physical-device/live-provider validation limits. The historical year-only display limitation below is superseded.

Implemented first release-date milestone: linked games retain IGDB platform/region metadata. Catalog dates recalculate on platform/region changes. Existing entries remain manual until opted in; new IGDB entries use catalog dates. Opening the library refreshes up to 20 stale opted-in wishlist entries, oldest first. Settings provides manual batch refresh; provider results are cached for one hour. Errors retain saved dates and concurrent library/account changes cancel applying the refresh. Month/quarter metadata is retained, but the current display still shows its known year.

- Preserve available platforms, release precision, region, and source timestamps.
- Recalculate the displayed release when the selected platform or region changes.
- Refresh saved IGDB wishlist releases in bounded, cached batches, with a manual refresh option and last-checked indicator.
- Preserve manually entered dates unless the user explicitly switches to catalog dates.
- Retain existing data on upstream failures; report unavailable dates rather than inventing them.
- Verify postponement, date-to-TBA changes, different platform dates, regional differences, and account changes during an in-flight refresh.

Initial default is Worldwide / earliest available, selectable per game. Local dates fall back to explicit worldwide dates; unknown or other regional dates are not treated as local. Worldwide / earliest available is an explicit alternative. Full live-account and mobile validation remains pending.

## 2. Privacy controls

Prepared September 12: server-side deletion with verified identity, typed confirmation, scoped browser cleanup, and a draft privacy notice. The server secret and public contact details are configured, and the notice/deletion flow are deployed. A disposable account was deleted successfully. September 13: applied the shared-pages migration through the Supabase SQL Editor. Live API checks with two disposable accounts and signed-out requests passed, including deletion of profile/list links. Both disposable accounts were removed.

- Add authenticated account deletion with explicit confirmation and clear scope.
- Remove the account's library, profile, and lists; revoke access and clear that account's local recovery data.
- Implement deletion on a trusted server or database boundary; never expose privileged credentials to the browser.
- Confirm the production database relationships and cascading behavior before enabling deletion.
- Publish a notice covering collected data, Supabase and Cloudflare, public/unlisted visibility, browser recovery copies, retention, exports, deletion, and a real contact address.
- Verify that removed or private lists no longer resolve, including from another browser.

## 3. Sharing validation

Verified September 13: local PostgreSQL checks plus live API checks with two disposable accounts and signed-out requests. Public/private/unlisted lists and notes, profile discovery, cross-account reads/writes, visibility changes, stable links, public field filtering, stale-save rejection, and account-deletion cascades passed. Browser interaction, mobile accessibility, and offline recovery tests remain separate outstanding work.

- Test with two separately authenticated accounts and a signed-out browser.
- Public: discoverable on profile and readable by others.
- Unlisted: readable by direct link, absent from public profile listings.
- Private: readable only by the owner; inaccessible through direct links or API requests by other users.
- Check visibility changes, deletion, notes inheriting visibility, account isolation, and stale open tabs.

## 4. Everyday reliability

September 13: added stale-response guards on account changes/unmount, guarded draft cleanup and overwrite prevention between tabs, exact-payload reconciliation after a lost save response, and 20-second network request timeouts. All 73 automated tests and TypeScript checks passed. These include offline/timeout failures, competing payloads, retry reconciliation, and delayed responses; live Chrome tests now cover offline save/reload/retry, lost-response reconciliation, competing browser edits, export/discard recovery, password sign-in, and key mobile screens. See LIVE-VALIDATION.md. Physical-device, screen-reader, Google OAuth, and email-recovery walkthroughs remain pending. Login routing and service errors also have regression tests.

- Exercise network loss before, during, and after a save.
- Exercise competing edits from two browsers, recovery export, reload, and retry.
- Verify logout or account switching cannot apply another account's delayed response.
- Test Google login, password recovery, expired links, session expiry, and production redirects.
- Check keyboard access, focus restoration, dialog behavior, screen-reader labels, contrast, zoom, and narrow mobile layouts.

## 5. Hardware catalog

Current: searchable curated catalog of 172 models/editions, custom entries, category filters, and partial variant/photo coverage. It is not a live manufacturer catalog.

- Evaluate structured hardware sources for models, revisions, aliases, regions, and editions before committing to a provider.
- Improve search aliases and ranking while keeping stable IDs for existing records.
- Expand verified variant colors and exact-model photo coverage.
- Prefer official manufacturer assets when their reuse terms permit this catalog; retain licensed fallbacks and attribution.
- Preserve custom entries and avoid presenting incomplete source coverage as complete.

## 6. Launch preparation

September 14: deployed a read-only health endpoint and sanitized server-failure logs. Live health check, Google handoff, controlled recovery/ordinary callbacks, and a real disposable-account password update passed. All 76 unit/database/service tests passed. See LAUNCH-OPERATIONS.md for incident checks and rollback instructions. Scheduled uptime alerts, notification delivery, and backup restoration remain unconfigured or untested.

- Complete the live scenarios above and record outcomes and unresolved defects.
- Add minimal error/availability monitoring with no passwords, tokens, collection contents, or private notes in logs.
- Verify production settings, backup/recovery procedures, deployment rollback, and provider limits.
- Review temporary dummy-email signup settings before inviting real users.
- Keep existing Cloudflare hosting; no hosting migration is needed.

## Completion rule

An item is complete only when its behavior is implemented and its relevant checks have passed. Keep local automated results separate from production account/device tests, and identify any user-side setup still required.
