# Migration scripts

These scripts run **offline**, with a Firebase service-account key, and are not
part of the app bundle. They exist only for the one-time Firestore plaintext →
Firebase Auth migration.

## Prerequisites

1. Install the Firebase CLI: `npm i -g firebase-tools`
2. In the **Firebase Console → Project settings → Service accounts → Generate
   new private key**. Save the JSON file as `./serviceAccountKey.json` in the
   project root (it is gitignored — never commit it).

## migrate-users.mjs

Provisions a Firebase Auth account for every `users/{username}` doc that still
has a legacy `password` field, using that same password, then writes
`email` + `authUid` and **deletes** the `password` field.

```bash
# Preview changes without writing
node scripts/migrate-users.mjs --dry-run

# Apply
node scripts/migrate-users.mjs
```

### What it does per user
1. Creates a Firebase Auth user with `uid = username`, synthetic email
   `${username}@scoreboard.internal`, and the existing password. If the account
   already exists (by uid or email) it reuses it.
2. Updates the Firestore doc: sets `email` and `authUid`, deletes `password`.
3. Idempotent — users with `authUid` already present are skipped.

### After migration
- Re-run `node scripts/migrate-users.mjs` to confirm 0 failed.
- Keep `NEXT_PUBLIC_LEGACY_LOGIN_FALLBACK=false` in `.env.local`.
- (Optional cleanup) delete the `migrateLegacyUserIfEligible` function and the
  `LEGACY_FALLBACK_ENABLED` constant in `services/userService.ts`, plus this
  scripts/ folder, once every user has logged in at least once.

## set-admin (no script needed)

The admin is just a real Firebase Auth user whose email matches
`NEXT_PUBLIC_ADMIN_EMAIL`. No claim script is required — set the email in
`.env.local` and in `firestore.rules` (`adminEmail()` function), then:

```bash
firebase deploy --only firestore:rules
```
