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
