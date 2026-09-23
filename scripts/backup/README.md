# Cloud-only database backup — prepared, not enabled

GitHub-hosted Ubuntu runner → Supabase read-only CLI dumps → AES-256-GCM → local authenticated round-trip and inner SHA-256 validation → private R2 upload → full download SHA-256 verification → verified receipt → optional remote retention. No AI, Mac, Worker, app process, or production restore is involved. Local backups/scripts are not modified. The old Codex automation is paused; the prepared launchd job was never activated.

## Manual setup (not performed)

1. In Cloudflare, enable R2 if needed and review its billing/free-tier terms yourself. Create a **private Standard storage** bucket, suggested name `pixel-dex-database-backups`. Leave r2.dev/public access/custom domains OFF. Do not add lifecycle expiration rules (they could remove the newest backup independently of this script). No bucket or billing service is created by this change.
2. Create an R2 S3 API token with **Object Read & Write**, restricted to this bucket only. Save its Access Key ID and Secret Access Key securely. No account-wide admin token is needed. Copy the bucket's HTTPS S3 endpoint, normally `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (not an r2.dev URL).
3. In this GitHub repository, create environment **database-backup**. Restrict deployment branches to the protected default branch. Only trusted maintainers should change the workflow or access these secrets; these are sensitive database backup credentials. No pull-request triggers are present.
4. Add these **environment secrets**, never repository files:
   - `SUPABASE_DB_URL`: the existing working percent-encoded PostgreSQL database connection URL. Use the IPv4-capable **session pooler port 5432** if the hosted runner cannot reach the direct IPv6 endpoint. Do not use the transaction pooler port 6543. Use existing credentials; do not reset/change database privileges for this preparation.
   - `BACKUP_KEY_B64`: exactly 32 random bytes encoded as base64, one line. Reuse the existing 32-byte archive.key by encoding it without printing it, or generate a new key and store a secure offline copy. Losing this key loses the cloud archives. GitHub secrets cannot be read back for recovery. Key changes need a documented key inventory; do not rotate it casually.
   - `R2_ACCESS_KEY_ID`: bucket-scoped access key.
   - `R2_SECRET_ACCESS_KEY`: corresponding secret key.
5. Add **repository variables**: `R2_BUCKET` = chosen bucket name; `R2_ENDPOINT_URL` = HTTPS S3 endpoint; `BACKUP_CONFIGURED` = `false`; `BACKUP_RETENTION_ENABLED` = `false`; `R2_MAX_BACKUP_BYTES` = `5000000000`.
6. Review and push these files to the protected default branch. This task does not push or deploy them. The daily schedule remains commented out. No secrets or database data belong in GitHub artifacts/logs/cache.
7. After credentials, bucket privacy and variable values are verified, set `BACKUP_CONFIGURED=true` and manually run **Database backup (cloud)** via Actions → Run workflow. Do not enable retention yet. Confirm SUCCESS, one encrypted `.tar.gz.enc` object and a small `.json` receipt under `pixel-dex/v1/`. No plaintext SQL or encryption key may appear in R2.
8. Download and authenticate that archive using the instructions below. Confirm all inner SQL checksums. A future restore drill must use an isolated non-production database only; this change performs no restore.
9. Resolve the cleanup limitation below, review retention dry-run candidates, and only then set `BACKUP_RETENTION_ENABLED=true`. Uncomment the workflow schedule only after manual verification succeeds. It targets **09:00 America/Tijuana**, including DST; GitHub scheduling can be delayed and is not an exact-time SLA. Workflow concurrency serializes jobs with cancellation disabled. This prefix must have exactly one writer; no second repository/job may run independent cleanup.

## Key setup without terminal disclosure (manual example)

From the repository, with GitHub CLI already authenticated and environment created, this transfers the existing key directly to GitHub secret input without displaying it:

    python3 -c 'import base64,pathlib,sys; sys.stdout.buffer.write(base64.b64encode((pathlib.Path.home()/"Library/Application Support/PixelDexBackup/archive.key").read_bytes()))' | gh secret set BACKUP_KEY_B64 --env database-backup

Do not run with shell tracing. This command is documentation only; it has NOT been executed. Keep an independent secure copy of the key before enabling scheduled backups. Enter the other secrets via GitHub's environment secret UI or secure stdin. Never put secret values in workflow YAML, command history, issues, or chat.

## Download/verify for future restore

On a trusted recovery machine install Python 3, Node 22, and `boto3==1.40.0` in a virtualenv. Load `BACKUP_KEY_B64`, R2 credentials, bucket and endpoint securely in the process environment; do not echo them. SUPABASE_DB_URL is NOT needed for download.

    umask 077
    python3 scripts/backup/download.py --archive backup-YYYYMMDDTHHMMSSZ-XXXXXXXX.tar.gz.enc --output /PRIVATE/PATH/pixel-dex-verified.tar.gz

Use the exact archive basename from the R2 receipt. Output must not already exist. This verifies remote archive SHA-256, AES-GCM authentication, and every SQL checksum before writing the decrypted tarball. It never restores. Keep decrypted files private. The archive includes the manifest and SHA256SUMS under `backup/`.

## Retention and failure guarantees

Keep the newest representative for seven most recent UTC dates and four most recent ISO weeks, overlapping where applicable. Always retain the newest verified archive plus the current successful archive. All retained archives are downloaded and checksummed before any delete. Unknown objects, missing-receipt archives and malformed metadata are not silently removed. Upload/validation/pre-cleanup failures leave previous backups untouched; partial new uploads may remain as encrypted orphans for manual review. Temporary plaintext exists only on the disposable runner and is removed on normal exit. There is no plaintext artifact upload.

**ESCALATE MEDIUM:** R2 has no atomic multi-object delete transaction. If a deletion fails after earlier expired objects were deleted, cleanup cannot roll those deletions back. Current and retained restore points remain protected, but a literal guarantee that *every previous backup* stays unchanged on *any* failure is incompatible with physical remote pruning. Cleanup defaults OFF pending explicit acceptance of this limitation or a separately reviewed design. Do not claim atomic cleanup.

Encryption format is unchanged: PXDBK001 header, 12-byte random nonce, AES-256-GCM ciphertext, 16-byte authentication tag; a new nonce is used for each archive. Receipts expose only archive name, UTC timestamp, byte size, ciphertext SHA-256, verification flag and encryption label. No account data, SQL filenames, database URL or key is in receipts.

## Coverage and limits

Includes roles, application schema/data, explicit auth/storage schema definitions, repository migrations and SQL checksums. Applied `supabase_migrations` history was absent in the proven source database; repository SQL is not evidence of applied migration state. No Storage binary files, role passwords, encryption root keys, secrets, OAuth/SMTP configuration, Cloudflare configuration/state, or external assets. Independent dumps are not a single atomic snapshot/PITR. No change to RLS or production data.

Pinned tools: Supabase CLI 2.117.0, Node 22.19.0, boto3 1.40.0; checkout/setup-node actions pinned by commit. The workflow installs only backup dependencies, not the application. No network integration test has run yet. Seven offline tests passed with synthetic data, including encrypted round-trip, tamper rejection, remote corruption, upload failure, retention selection, newest protection and unknown-object preservation. Local legacy backups are untouched.

GitHub Actions runner minutes and R2 storage/requests are subject to account quotas; no paid resource has been activated. Check quotas before enabling. Enable GitHub Actions failure notifications for the responsible maintainer; no test emails are sent by this preparation.


## R2 storage safety guard

Set repository variable R2_MAX_BACKUP_BYTES=5000000000 (5 GB decimal). The workflow defaults to that safe cap when the variable is absent. The script rejects missing/invalid/zero/negative values and values above 5,000,000,000, rather than disabling protection. It counts every object across every page of the configured bucket, not just the backup prefix; encrypted orphans, receipts and unrelated objects all count. A pending multipart upload or non-Standard object blocks uploads because its storage cost cannot safely be treated as Standard object totals.

Before archive upload it reserves space for archive AND receipt. Before the receipt PUT it lists/checks again. If projected usage exceeds the cap, the run fails with R2_STORAGE_LIMIT_EXCEEDED and byte totals. No retention runs and nothing is deleted to make room. If an outside writer fills the bucket after the archive was uploaded, the receipt upload fails safely; the new encrypted orphan remains counted on future runs. No automatic retry creates replacement archive names.

Each object is checked with HEAD before upload and written with If-None-Match:* and explicit STANDARD storage class. The backup uses a single PUT instead of multipart upload. SDK request retries are disabled (one total attempt). Workflow concurrency remains one active backup run, with cancel-in-progress false. This relies on the documented single-writer dedicated bucket; the storage cap is not an atomic account-wide quota against unrelated concurrent writers. It also does not cap R2 request charges or other buckets' storage. The guard cannot change the account's billing configuration. Nothing has been configured in GitHub/Cloudflare by this source-only change; set the repository variable during manual setup.
