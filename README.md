# Pixel Dex

A local-first, responsive prototype for your game, console, and PC collection. Built with React, TypeScript, Vinext/Vite and the starter’s accessible Base UI / Shadcn primitives.

## Open the prototype

Double-click **Start Pixel Dex.command** in this folder, then open **http://localhost:3000/**. Keep the terminal open while using it. Stop with Control-C. The launcher uses the bundled Node runtime on this Mac; on another machine install Node 22.13+ and pnpm, then run `pnpm install` and `pnpm dev`.

## What works

- Owned games: status, platform, launcher, digital/physical format, 1–5 star ratings, and reviews.
- Owned consoles: model, edition, color, and notes.
- A unified wishlist with Games, Consoles, and Planned builds filters; priority, notes, and optional release date.
- Multiple PC builds with editable components and dated upgrade history. Mark a planned build as built.
- Tile/list views, search, filters, sorting, light/dark themes, and phone layouts.
- A searchable sample catalog (16 games and 8 consoles) and custom entries.
- Local collection backup import/export, safe destructive confirmations, and read-only HTML sharing snapshots.

## Prototype boundaries

This is a responsive web prototype, not a native iOS/Android application. A web app manifest provides a starting point for an installable web app; offline caching is not implemented.

Records and preferences persist in browser localStorage, under `pixel-tracker:v1`, on the current origin. Use the same URL/browser to retain access. Clearing browser storage removes the collection. Use Settings → Export backup to transfer data to another browser/device.

Sample content is preloaded once. Clear it in Settings when ready. Cover art is loaded from Steam’s publisher-provided CDN; it needs network access. There is no account or launcher integration, and catalog search is local to the sample catalog. Console/custom entries use a device icon and title when no artwork is available. Release dates are user-entered, not live catalog data.

Collections are Private or Public. Lists are Private, Unlisted, or Public; their entry notes follow list visibility. Shared HTML snapshots are separate exported copies and cannot be revoked after download.

Optional WebMCP hooks expose collection reading and opening an unsaved entry form when supported. No compatible runtime was available for their contract validation; they are not required for the application.

## Code and checks

- `app/page.tsx`: responsive collection UI and workflows.
- `lib/tracker.ts`: record types, validation, filtering, and component history.
- `lib/covers.ts`: verified Steam cover sources.
- `app/globals.css`: shared light/dark tokens and responsive styling.
- `tests/tracker.test.mjs`: persistence round-trip, invalid imports, filters, collection transitions, and build history.

Run `pnpm exec tsc --noEmit`, `node --experimental-strip-types --test tests/tracker.test.mjs`, and `pnpm build`. `pnpm format` formats source.

Accounts and cloud libraries use Supabase. Apply the migrations below before enabling shared pages. IGDB integration is pending.

## Dashboard and releases

My collection is the home dashboard, with linked summary counts, currently playing games, recent additions, and wishlist releases due today through the next 30 days. Upcoming groups wishlist entries by future confirmed date, confirmed year, and TBA. Both games and hardware are included. Edit a wishlist entry to choose its release timing. Existing catalog entries without a release date are treated as already released, since the bundled sample catalog contains released products; custom entries without dates are TBA. No future dates are fabricated or fetched automatically.

Release tests: `node --experimental-strip-types --test tests/releases.test.mjs`.

## Lists and profile

Games → Lists creates independent named lists with descriptions, per-game notes, manual up/down ordering, and optional numbered rankings. Any sample-catalog game or custom game can be added, without creating an owned or wishlist record. Lists default to Private; Unlisted lists can be previewed and exported from their own page but are absent from the public profile; Public lists appear on the profile. Share snapshot produces a read-only HTML file containing only list-specific content.

Profile → Edit profile sets the display name, bio, and up to six unranked favorites. Visitor preview shows those favorites independently of collection access. One Private/Public setting now controls the entire collection. The legacy per-section values remain in existing backups for compatibility, but no longer control the UI; until a new choice is saved, the collection defaults to Private unless all old sections were Public. The collection preview exposes only titles, platforms, kinds, and owned/wishlisted labels—not personal notes, reviews, or upgrade history.

Public profiles and lists use restricted Supabase functions that select allowed fields directly from the current library. Existing saves load without losing data; optional lists and profile fields are validated during import. Clearing collection records preserves lists and profile favorites.

Social model checks: `node --experimental-strip-types --test tests/social.test.mjs`.

## Account libraries (development)

Google and email login use Supabase. Configure `.env.local` using `.env.example`.
Run `supabase/migrations/202609080001_account_libraries.sql` once in the Supabase SQL Editor before testing account storage. This creates an owner-only library table and an atomic version-checked save function. No anonymous access is granted to this table; shared pages use the projection functions from the second migration.

Signed-out users retain the existing browser library. Signed-in accounts start empty and may explicitly import the browser library from Settings. Account drafts are stored under a user-specific key until the remote save is confirmed. Conflicting edits are blocked; export the draft before choosing to load the account version. New devices load the latest account library on opening the app. Existing tabs detect stale revisions on save; live collaborative updates are not implemented.

Validation still required against your Supabase project: sign in as two distinct users, save and reload each library, verify the second user cannot read the first user's row or save with their owner ID, and test the same account from two browsers for revision conflicts. Test failed-network saves and recovery. The migration has not been applied automatically.

## Shared pages and Cloudflare

Run `supabase/migrations/202609080002_shared_pages.sql` once after the account library migration. Choose a username in My profile. Profile addresses are `/p/username`; list addresses are `/p/username/title-stable-id`. Usernames are permanent for this initial release, and list addresses survive title changes.

Private lists resolve only for their owner, unlisted lists resolve by direct link but never appear in the public profile, and public lists appear on the profile. Notes inherit the list visibility. The database checks the latest visibility on every request; already viewed or downloaded content cannot be recalled. Open shared pages refresh on focus and every 30 seconds.

`node --experimental-strip-types --test tests/*.mjs` runs library tests and actual PostgreSQL permission tests using an ephemeral PGlite instance (no cloud data involved).

For Cloudflare, run `pnpm exec wrangler login` and `pnpm deploy`. The local build reads the two public Supabase variables from `.env.local`. No privileged Supabase key is required. After publishing, set Supabase Site URL to the deployed HTTPS origin and allow its `/auth/callback` redirect. Retain the localhost callback for development. Add the deployed origin to the Google OAuth client's JavaScript origins; Google's redirect URI remains the Supabase callback.

## Login limits and test accounts

Password sign-in through `/api/login` permits 10 attempts per rolling 15-minute window per Cloudflare client IP. A SQLite Durable Object stores only attempt timestamps per hashed IP. The endpoint proxies password verification to Supabase and returns session tokens with no-store headers; request bodies and passwords are not logged by the application. Supabase's directly accessible Auth API retains its own rate limits; this application limiter does not override or secure every Supabase entrypoint. Google OAuth, sign-up, recovery, and refresh use Supabase's existing controls.

Test-only users with `@test.com` addresses must be created as confirmed users using Supabase admin user creation (email_confirm=true). No public email-verification bypass is added. Do not disable verification for all users. A publishable key cannot create admin-confirmed users.

The private library checks the requested user ID on reads, clears state when the active account changes, and rejects late responses for an invalidated session. The active email is displayed in the header. PostgreSQL tests cover independent records for two users.

## IGDB catalog

Game search is available in the collection/wishlist picker and list/profile game picker. It uses `/api/catalog` with a 250 ms debounce and at least two characters. Manual entry remains available. Existing Steam catalog IDs remain unchanged; IGDB IDs use an `igdb:` prefix and persist in the existing account schema. No database migration is required.

The Cloudflare Worker requires `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` bindings. Keep the latter as a Worker secret. `keep_vars` preserves dashboard variables during deployment. The GameCatalog SQLite Durable Object caches search results for one hour, retains cover addresses, renews the Twitch app token, and limits uncached upstream requests. Credentials and tokens never enter browser responses.

For local development, configure the same bindings in an ignored `.dev.vars` file (never commit credentials), then restart the development server. Without these bindings, live search shows a configuration message; manual entry continues to work. Cloudflare secrets are not automatically copied to localhost.

Release dates retain IGDB platform/region records and source precision. New IGDB entries default to Worldwide / earliest available; the editor also offers North America, Europe, and Japan. Regional selection uses a matching regional record, then a worldwide record, never a different region. Known early-access, alpha/beta, cancelled, and delisted records are excluded. Exact dates stay exact; month/quarter/year formats display their known year, and unknown dates show TBA.

Wishlist games with releaseSource=catalog are checked once when the library opens if more than 24 hours old, up to 20 entries, oldest first. Settings → Refresh wishlist dates supports manual batches. The server coalesces requests and caches release metadata for one hour. Opening the editor checks that game's release metadata and updates the available platform options. Changes to platform or region recalculate catalog dates. Editing a date or timing switches it to manual. Legacy entries without an explicit catalog source remain unchanged until the user chooses IGDB dates.

Refreshes preserve saved dates on failure and discard results if the account or library changed while requests were in flight. Updates use the normal account revision/draft save path. No scheduled background refresh runs while the app is closed. No database migration is needed.

Validation: TypeScript and production build passed; all 36 existing/new tests passed, followed by the added current-format date test. Production checks confirmed Hades search, confirmed dates, short-query validation, and a cover returning HTTP 200 image/jpeg.

Catalog search hides IGDB mod/fork types and entries tagged unofficial, fangame, ROM hack, homebrew, unlicensed, or bootleg. Official ports/remakes remain eligible. This is a metadata filter, not a licensing guarantee: incomplete IGDB tags may leave unofficial results visible. Existing saved records and their covers are unaffected.

Search performance: browser caches up to 30 recent queries for five minutes; related-game lookups are reused for one hour; exact matches skip prefix fallback; cached searches and covers are read before serial upstream work; cover metadata writes are batched. Cold searches still depend on IGDB response times.

Search resilience: direct suggestions are returned separately from optional related games. The browser skips obsolete queued searches and keeps direct results if enrichment fails. The catalog coalesces identical requests, spaces upstream starts, and allows cached requests through without a global concurrency block. Non-JSON responses use a controlled UI error. Regression tests cover concurrent requests, nonblocking cached covers, query coalescing and malformed responses.

## Hardware

Hardware combines owned devices and existing PC builds. Category sections cover Consoles, PCs, Handhelds, Controllers, VR headsets and Accessories; the hardware wishlist uses the same categories. The curated catalog includes 172 models/editions and supports custom entries. Catalog search matches model, manufacturer, edition and handheld subtype. Existing model IDs remain stable and legacy devices infer their category without rewriting the user's library. The optional hardwareCategory field is validated in saved/imported data. PCs continue using component and upgrade-history editing.

Manufacturer references checked: https://play.date/ , https://www.goretroid.com/collections/retro-game-system , https://www.ayntec.com/ , https://rog.asus.com/us/gaming-handhelds/rog-ally/rog-ally-x-2024/ , https://www.playstation.com/en-us/accessories/dualsense-wireless-controller/ , https://www.meta.com/quest/ . This is a curated starting catalog, not a complete or automatically synced manufacturer feed. Hardware artwork still uses the existing fallback illustrations.
