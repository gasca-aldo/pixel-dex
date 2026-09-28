# Pixel Dex monitoring

Separate Worker `pixel-dex-monitor`; deploy with `pnpm exec wrangler deploy --config monitoring/wrangler.json`.
No application credentials, public routes, collection writes, or email sending.

Cron runs every five minutes. The single SQLite-backed Durable Object serializes runs and skips already completed schedule slots. Homepage and health run every five minutes; game and hardware searches every fifteen. At most four parallel read-only requests, twelve-second request timeouts, ten-second slow-response threshold, 512 KiB response limit. Expected catalog records are IGDB game 1022 and platform 130/version 503. Search checks exercise cached serving too; they do not guarantee an uncached IGDB request on every run.

State key `state` stores four check states and the last 32 incident events. `pixel_dex_monitor_run` is the completion heartbeat. `pixel_dex_monitor_event` records OUTAGE, REMINDER, RECOVERY; lastNotification refers to this log-only event, not email delivery. Events are persisted before logging; after a crash, durable state is authoritative. Monitor failures log only `pixel_dex_monitor_failure` and fail the scheduled invocation.

Thresholds: three failed uptime checks, two failed search checks. One outage per incident, at most one reminder per hour, recovery after two consecutive successes. A stale hardware response counts as failure with reason `stale`. Each check has its own incident, so a broad outage can create separate incidents.

The `run` notification callback is the delivery adapter, currently configured only for sanitized logging in worker.ts. A future verified delivery adapter must add a durable outbox/retry policy before claiming email delivery. Do not configure email or credentials just to test monitoring. There is no verified destination today.

Budget: 288 scheduled runs/DO calls and 768 target HTTP probes per day, plus bounded upstream traffic through the existing app cache. No new paid plan required; the account's shared quotas still apply. One bounded state record; no timers retaining the DO in memory. Cloudflare-wide failures or missed scheduler executions require an independent heartbeat watcher; this Worker cannot detect its own complete absence.

Tests simulate outages locally; never disrupt production to validate thresholds. To pause, deploy this config with an empty crons array. Logs/state contain no response bodies, URLs, identities, tokens, collection data, or raw exception text.
