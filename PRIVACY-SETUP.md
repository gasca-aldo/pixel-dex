# Privacy milestone activation

Account deletion uses Supabase Auth Admin deleteUser with hard deletion. Only the ID returned by getUser for the supplied session can be deleted; the confirmation screen's expected ID must match it. No caller-supplied target ID is accepted. Existing foreign keys cascade to account_libraries, profile_handles, and list_addresses. No new migration is needed if both existing migrations are present.

1. In Supabase Project Settings → API Keys, create/copy a server-side secret key. Never put it in chat, source control, or a NEXT_PUBLIC variable.
2. In Cloudflare → pixel-dex → Settings → Variables and Secrets, add SUPABASE_SECRET_KEY as a Secret. This is a privileged key and stays only on the Worker.
3. Provide the public operator name and privacy contact email. Set NEXT_PUBLIC_PRIVACY_OPERATOR and NEXT_PUBLIC_PRIVACY_EMAIL in the ignored build environment before building. These two values are public.
4. Build and deploy after filling the notice. Do not publish the draft as a finished privacy notice.
5. Use a disposable account to validate deletion on the live project, including its profile/list URLs and another independent account. Do not test with a real user's library.

Deletion removes active account rows. Provider backups/log retention must be confirmed separately. Stateless access tokens can remain cryptographically valid until expiry; deleted users have no library rows or handles and cannot recreate them due to auth.users foreign keys. Other devices may retain cached copies. The current browser clears only the deleted account's recovery draft and matching session key, preserving any newer account session and the separate browser-only library.

If deletion times out or fails, the UI does not claim success. The user is asked to reload and check account state. Supabase Storage ownership could block deletion if user-owned uploads are introduced later; the present app uses external/curated cover assets.
