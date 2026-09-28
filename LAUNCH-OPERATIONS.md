# Pixel Dex launch operations

Updated September 15, 2026.

Authentication sign-off: all requested checks are covered in AUTH-VALIDATION.md, including Google chooser, recovery email delivery after SMTP credential rotation, cross-browser and expired/used recovery links, account isolation, and automatic session renewal. Earlier pending-authentication statements below describe historical validation. Physical-device, monitoring, backup, and launch-setting work remains outstanding.

## Beta settings audit — September 24, 2026

Read-only production audit: public Supabase auth settings report signup enabled and `mailer_autoconfirm=true`; the dashboard confirms Email and Google enabled, Confirm email OFF, anonymous sign-in OFF, and CAPTCHA OFF. No accounts were created and no emails sent. Dummy syntactically valid email addresses can receive sessions without proof of inbox control; this is inferred from the effective provider configuration and the deployed signup branch, not a new signup experiment. Password recovery still requires access to the address. Google chooser sign-in and persisted collection loading passed during the rollback rehearsal.

App `/api/login` enforces 10 attempts per 15 minutes per hashed source IP using a Durable Object. Direct Supabase password authentication bypasses that app limit. Signup/reset use Supabase directly, without CAPTCHA tokens or an app-side limiter. Provider dashboard values: signup/sign-in 30 requests/5 minutes/IP; refresh 150/5 minutes/IP; verification 30/5 minutes/IP. IP forwarding is OFF; the Worker does not forward the end-user IP upstream, so proxied logins can share upstream rate limits. The hourly email-cap field is blank: effective email cap NOT verified; do not infer unlimited capacity. Email cooldown is 60 seconds/user and OTP expiry 3600 seconds. Email/password hardening switches (secure email change, secure password change, require current password, leaked-password protection) are OFF; leaked-password protection requires a paid plan. Provider minimum-password-length field is blank; app UI enforces eight characters, which is not proof of the direct API minimum.

Gmail SMTP remains enabled at smtp.gmail.com:587, sender name Pixel Dex. Task 4E remains passed: Supabase and SMTP accepted the controlled send, no errors observed, inbox receipt confirmed by the user. No repeat send needed. The owner confirmed a public beta with unpredictable signup spikes. This audit does not sign off the existing personal Gmail sender or open unverified signup for that launch. Personal Gmail's documented sending ceiling is not a delivery guarantee and is shared with personal mail; retain conservative limits and review suitability before a public launch. Existing failure visibility is Supabase auth logs plus app error states; direct signup/reset failures do not traverse Worker failure logging. The monitoring Worker does not verify inbox delivery.

Security/provider changes require separate review: real-email confirmation or restricted beta access, provider-level CAPTCHA with matching client token handling, direct-auth bypass of the custom limiter, SMTP capacity and effective email cap, and unauthenticated catalog traffic (cache/coalescing/queue bounds exist, per-client quotas do not). No auth settings, RLS, credentials, or limits changed in this audit.

Privacy notice source updated factually for Gmail SMTP, hardware search/assets, Durable Object search caches, monitoring, GitHub Actions exports and encrypted private R2 backups. Backup cleanup remains disabled; no fixed deletion period can currently be promised. Source change is not yet deployed or a legal compliance sign-off. Provider-log retention and an archive-deletion policy require review. Earlier operational statements below are historical: monitoring is deployed; daily cloud backups are enabled at 09:00 America/Tijuana, with retention OFF and a 5,000,000,000-byte cap; rollback rehearsal passed on September 24 and restored original version 68d1abac-68cf-4faf-b9a0-096a4b41a6fe.

References: https://supabase.com/docs/guides/auth/general-configuration ; https://supabase.com/docs/guides/auth/rate-limits ; https://supabase.com/docs/guides/auth/auth-captcha ; https://support.google.com/mail/answer/22839

## Check availability

Public endpoint: https://pixel-dex.gasca-aldo.workers.dev/api/health

GET or HEAD returns 200 when the worker can read Supabase authentication settings. A generic 503 means configuration, connection, timeout, or provider response failure. Successful results are reused within a worker instance for 30 seconds; failures for 5 seconds. Requests have a three-second upstream timeout and responses use Cache-Control: no-store. The probe performs no writes and requires no user credentials.

This is not a guarantee that account-library writes, IGDB searches, Google consent, or email delivery work. Check those separately when investigating an incident.

## Inspect failures

Open Cloudflare → Workers & Pages → pixel-dex → Observability. Search logs for `pixel_dex_service_failure`. The application emits this record for server responses with status 500 or higher, with only `area` and `status`; area is a fixed category such as login, account, catalog, sharing, app, or health. Request URLs, query strings, bodies, credentials, user identifiers, and collection contents are not added to these custom records.

Automatic invocation logs and traces are disabled. Provider-level operational/security records have their own policies. See the [Cloudflare Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) for dashboard behavior and limits.

Logging is passive. There is no scheduled uptime checker, alert destination, or notification-delivery validation configured yet. Before a broader launch, connect an uptime monitor to the public health endpoint and verify an alert and recovery notification. Do not treat a single probe failure as evidence of lost collection data.

## Rollback

Current tested authentication release: `acea7a8c-2a42-457b-a886-727e7fa084cb`.
Earlier browser-validated release before monitoring: `8e1bc579-5388-40e6-a1b1-67da7e13c0b8`.

Use Cloudflare's deployment history to select a known release. The available CLI also supports:

```sh
pnpm exec wrangler rollback 8e1bc579-5388-40e6-a1b1-67da7e13c0b8 --config dist/server/wrangler.json
```

This is an emergency instruction, not a command already executed. The earlier version has no /api/health endpoint. Review binding/configuration differences and check login, account loading, saving, and public links afterward. An application rollback is not a database restoration. No database schema change was made in the monitoring release.

## Data and launch settings

- Keep collection exports outside the browser before destructive recovery or account deletion.
- Verify the Supabase plan's available database backups and test a restoration into a separate environment before relying on it. A production restoration has not been tested.
- Review the deliberately enabled unverified-email signup before inviting more users. It remains unchanged.
- Finish real Google consent, email-reset delivery/expired-link tests, physical mobile keyboard behavior, and screen-reader walkthroughs.
- See LIVE-VALIDATION.md for what has actually been exercised.

## Task 6 — SMTP migration verification, September 28, 2026

SMTP/delivery verification PASSED. Supabase custom SMTP is enabled with smtp-relay.brevo.com:587 and a 60-second minimum per-user interval; Gmail is no longer the configured relay. No credential values were read or changed. The production dashboard shows 30 auth emails/hour. Google remains enabled and email confirmation remains on; the previously verified Google OAuth code was unchanged.

Existing Brevo real-time logs show both “Confirm your email address” and “Reset your password” sent and delivered on September 28 at 14:13 (dashboard display time), with subsequent open/click events. Two delivered, zero bounced, zero paused emails. No additional emails were sent for this audit. These are provider delivery events, not a fresh manual inbox-placement test.

Brevo Free usage showed 298 emails remaining from the daily allowance after those two sends, with zero prepaid credits. Task 6 SMTP/delivery verification is complete; this is not unlimited public-traffic capacity sign-off. Supabase's 30/hour cap and Brevo's 300/day allowance constrain signup/recovery demand. The production privacy notice still names Gmail SMTP and must be updated for Brevo and its actual open/click tracking before public launch.

## Task 6 COMPLETE — September 28, 2026

Owner explicitly accepts Supabase 30 auth emails/hour and Brevo Free 300/day as beta capacity constraints, not launch blockers, with Google OAuth available. No provider, rate-limit, CAPTCHA, RLS, or capacity settings changed.

Deployed version c50d5a81-68d8-414a-b3ee-8f93ab215b2d replaces Gmail SMTP disclosure with Brevo transactional delivery plus delivery/open/click tracking. Google is the primary recommended action on login, signup, and recovery forms. Email throttling and provider/network failures now show safe retry/Google guidance without leaking provider errors or promising delivery times.

Verification: 15 focused automated tests passed, TypeScript/build/diff checks passed, production login/signup/recovery Google presentation and privacy text verified in browser. Failure messages tested with controlled automated errors, not by exhausting production quotas. No additional emails sent. Prior real delivery and user-confirmed auth-flow validations remain valid.
