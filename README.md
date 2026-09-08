# Pixel Tracker

A local-first, responsive prototype for your game, console, and PC collection. Built with React, TypeScript, Vinext/Vite and the starter’s accessible Base UI / Shadcn primitives.

## Open the prototype

Double-click **Start Pixel Tracker.command** in this folder, then open **http://localhost:3000/**. Keep the terminal open while using it. Stop with Control-C. The launcher uses the bundled Node runtime on this Mac; on another machine install Node 22.13+ and pnpm, then run `pnpm install` and `pnpm dev`.

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

Private, Unlisted, and Public settings are stored per collection to preview the future sharing flow. All records remain local; those settings do not publish anything or create a live link. The HTML snapshot export is a genuinely shareable, read-only file and includes the chosen collection’s notes.

Optional WebMCP hooks expose collection reading and opening an unsaved entry form when supported. No compatible runtime was available for their contract validation; they are not required for the application.

## Code and checks

- `app/page.tsx`: responsive collection UI and workflows.
- `lib/tracker.ts`: record types, validation, filtering, and component history.
- `lib/covers.ts`: verified Steam cover sources.
- `app/globals.css`: shared light/dark tokens and responsive styling.
- `tests/tracker.test.mjs`: persistence round-trip, invalid imports, filters, collection transitions, and build history.

Run `pnpm exec tsc --noEmit`, `node --experimental-strip-types --test tests/tracker.test.mjs`, and `pnpm build`. `pnpm format` formats source.

No hosted service, account, database, or deployment is configured. A future version can replace the collection persistence adapter with a server API, add catalog search, and enforce collection permissions on the server.

## Dashboard and releases

My collection is the home dashboard, with linked summary counts, currently playing games, recent additions, and wishlist releases due today through the next 30 days. Upcoming groups wishlist entries by future confirmed date, confirmed year, and TBA. Both games and hardware are included. Edit a wishlist entry to choose its release timing. Existing catalog entries without a release date are treated as already released, since the bundled sample catalog contains released products; custom entries without dates are TBA. No future dates are fabricated or fetched automatically.

Release tests: `node --experimental-strip-types --test tests/releases.test.mjs`.

## Lists and profile

Games → Lists creates independent named lists with descriptions, per-game notes, manual up/down ordering, and optional numbered rankings. Any sample-catalog game or custom game can be added, without creating an owned or wishlist record. Lists default to Private; Unlisted lists can be previewed and exported from their own page but are absent from the public profile; Public lists appear on the profile. Share snapshot produces a read-only HTML file containing only list-specific content.

Profile → Edit profile sets the display name, bio, and up to six unranked favorites. Visitor preview shows those favorites independently of collection access. One Private/Public setting now controls the entire collection. The legacy per-section values remain in existing backups for compatibility, but no longer control the UI; until a new choice is saved, the collection defaults to Private unless all old sections were Public. The collection preview exposes only titles, platforms, kinds, and owned/wishlisted labels—not personal notes, reviews, or upgrade history.

All of these controls remain local prototype previews. No account, live URL, server-enforced permission, or public publication is created. Public-profile and list projections are deliberately separated from private data, ready for the future backend. Existing saves load without losing data; optional lists and profile fields are validated during import. Clearing collection records preserves lists and profile favorites.

Social model checks: `node --experimental-strip-types --test tests/social.test.mjs`.
