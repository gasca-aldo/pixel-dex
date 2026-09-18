# Sharing browser validation — September 18, 2026

Tested production using two disposable accounts, Chrome for the owner and a separate in-app browser for signed-out and second-account access. Fixtures contained synthetic titles, descriptions, and notes only. Existing users and collections were not changed.

## Passed browser checks

- Signed-out profile discovery showed the public list and omitted private/unlisted lists and the private collection.
- Public and unlisted direct links displayed their descriptions and individual game notes.
- Private direct links returned Page unavailable for both signed-out and second-account visitors. The owner could read the private list and notes through both the collection UI and direct link.
- Copy list link returned the correct production domain and stable list address.
- Owner changed the public list to private in the editor. The visitor's fresh request was rejected and the profile no longer listed it.
- Renaming the list and changing its note persisted; the original URL still resolved for the owner with the new name and note.
- Changing the synthetic list to unlisted made its original direct link readable while keeping it absent from profile discovery.
- After removing the synthetic list through the normal save RPC, the already-open visitor page cleared its content and showed Page unavailable on automatic revalidation. The observation was taken after waiting 35 seconds; this does not establish an exact latency bound.

## Confirmed issue and fix

Before the fix, signing out in one Chrome tab left private-list content visible in another already-open tab. Fresh server reads were correctly denied; the fault was cached client state without an auth-change subscription.

SharedPage now subscribes to identity changes, immediately clears profile/list/name state (including hidden tabs), aborts the old request, and uses an identity-generation guard so old results or completion callbacks cannot restore content or settle a newer request. Timeouts target their own request controller. RLS and server authorization are unchanged.

Deployed version: `461e4d9f-1e39-4ea1-a1e5-4c0f05733da3`.

On September 18, reloaded the private page as the owner, verified its private note, and signed out in the other tab. Without reloading the private tab, it changed to Page unavailable and no longer contained the note. The sign-out tab showed Welcome back.

## Automated checks and scope

All 93 automated tests, TypeScript, and production build passed before deployment. Added a stale shared-list result regression in tests/auth-identity.test.mjs. Existing sharing/RLS tests remained passing.

Changes: components/shared-page.tsx and tests/auth-identity.test.mjs, plus validation/roadmap documentation.

The deleted-link browser test used an API deletion of the synthetic list; it does not claim to test the list-delete confirmation dialog. Revocation on another user's device uses the existing visible-page polling/focus revalidation, not instant push. Content already read or copied by a recipient cannot be recalled. Physical-device and screen-reader testing remains separate.

## Cleanup

Both disposable sharing accounts were deleted through the authenticated account-deletion API on September 18. Their old identities were rejected and the profile no longer resolved. No main-user account was changed. Temporary test script cleanup completed after verification.
