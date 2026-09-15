# Release-date validation — September 15, 2026

Production build passed and deployed to the existing Cloudflare Worker as version `c642c2a4-76bc-44ce-b610-41a84b938605`.

## Changes and causes

- Month and quarter metadata was stored but reduced to a year for display. Display now derives the selected catalog window without changing the persisted status schema. Month-only entries join the corresponding month in Upcoming; quarter-only entries follow month sections and precede year-only/TBA sections. Past windows are excluded, and partial dates never create exact-day reminders.
- The editor now displays the actual catalog release label while IGDB is selected. Switching to Manual date exposes the existing manual controls. Manual dates are not recalculated from catalog metadata.
- IGDB's explicit month field is retained and validated; older records can use their existing timestamp to recover the month. No placeholder timestamp is presented as a confirmed day.
- Batch refresh is extracted into a testable helper. Applying results requires the same account, authentication generation, library snapshot, and absence of sign-out. Failed requests retain saved dates. Work remains bounded to 20 items, with duplicate successful catalog requests shared and a stop after three failures.

## Automated validation

All 92 tests and TypeScript passed (seven new release-specific tests). Existing tests plus the new coverage verify:

- Postponements and withdrawal to TBA.
- Platform differences, local regions, explicit worldwide fallback, and exclusion of early-access/beta records.
- Manual/legacy/owned entries excluded from refresh, retaining the original data.
- Invalid responses, total/partial failures, and bounded retries retaining original dates.
- Delayed results rejected after the supplied account/generation/snapshot guard becomes invalid.
- Month/quarter labels, month grouping, past-window exclusion, leap-year month boundaries, backup compatibility, and no invented 30-day reminders.

## Mobile browser validation

Used a local, isolated preview of the actual Editor and UpcomingPage components with production CSS and deterministic catalog responses. No production account or collection was modified.

- At 390px: month display; changing North America to Japan produces Q2 2027; changing PC to PlayStation 5 uses its worldwide September 15 date.
- Switching to Manual date, changing the day using native keyboard input, saving, and reopening retains the manually edited September 16 date despite refreshed catalog metadata.
- At 320px: the page width remains 320px and the dialog fits at 288px. Failed refresh displays the safe error and retains both manual and catalog dates in their respective flows.
- Browser viewport override was reset afterward.

The automation's fill action changed the date input's DOM value without committing a React change; native keyboard editing confirmed the app's real change/save flow works. This was not treated as an app defect.

## Limits

These are deterministic service/unit tests and local component browser checks, not a physical iPhone/Android walkthrough or a live two-account refresh race against IGDB. Existing account-isolation validation is documented separately. No external release dates, production data, RLS rules, or account settings were changed for these checks.
