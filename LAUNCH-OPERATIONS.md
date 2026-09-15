# Pixel Dex launch operations

Updated September 15, 2026.

Authentication sign-off: all requested checks are covered in AUTH-VALIDATION.md, including Google chooser, recovery email delivery after SMTP credential rotation, cross-browser and expired/used recovery links, account isolation, and automatic session renewal. Earlier pending-authentication statements below describe historical validation. Physical-device, monitoring, backup, and launch-setting work remains outstanding.

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
