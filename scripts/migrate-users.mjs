/**
 * scripts/migrate-users.mjs
 * ---------------------------------------------------------------------------
 * One-time bulk migration: Firestore plaintext users -> Firebase Auth.
 *
 * For every `users/{username}` document that still has a legacy `password`
 * field, this script:
 *   1. Creates (or reuses) a Firebase Auth account with the synthetic email
 *      `${username}@scoreboard.internal` and the user's existing password.
 *   2. Writes `email` and `authUid` onto the Firestore profile.
 *   3. Deletes the legacy `password` field.
 *
 * Run OFFLINE with a Firebase service-account key. It never runs in the app.
 *
 * USAGE
 * -----
 *   1. In the Firebase Console -> Project settings -> Service accounts ->
 *      Generate new private key. Save as ./serviceAccountKey.json (gitignored).
 *   2. node scripts/migrate-users.mjs
 *   3. (Optional) Re-run with --dry-run first to preview changes.
 *
 * SAFETY
 *   - Idempotent: skips users who already have `authUid`.
 *   - --dry-run prints actions without writing.
 *   - Failed users are listed at the end; the script keeps going.
 *
 * NOTE: Requires the `firebase-admin` package (install with `npm i -D
 * firebase-admin` or run `npm i firebase-admin`). It is NOT imported by the app.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// firebase-admin v14 exposes auth/firestore/FieldValue via modular subpath
// imports (the legacy `admin.credential` / `admin.auth()` shape was removed).
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// --- Load service account --------------------------------------------------
const KEY_PATH = resolve(process.cwd(), "serviceAccountKey.json");
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(KEY_PATH, "utf8"));
} catch {
  console.error(
    `\n✖ Could not read ${KEY_PATH}.\n` +
      `  Download a service-account key from Firebase Console and place it there.\n`,
  );
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");

const app = admin.initializeApp({
  credential: admin.cert(serviceAccount),
});
const auth = getAuth(app);
const db = getFirestore(app);

const DOMAIN = "scoreboard.internal";
const syntheticEmail = (username) => `${username}@${DOMAIN}`;

async function main() {
  console.log(
    DRY_RUN
      ? "DRY RUN — no writes will be performed.\n"
      : "LIVE RUN — writes will be applied.\n",
  );

  const snapshot = await db.collection("users").get();
  console.log(`Found ${snapshot.size} user documents.`);

  let migrated = 0;
  let skipped = 0;
  const shortPasswordSkipped = [];
  const noPasswordSkipped = [];
  const failed = [];

  for (const docSnap of snapshot.docs) {
    const username = docSnap.id;
    const data = docSnap.data();
    const ref = docSnap.ref;

    // Already migrated.
    if (data.authUid) {
      console.log(`→ ${username}: already migrated (authUid present). SKIP.`);
      skipped += 1;
      continue;
    }

    if (typeof data.password !== "string" || !data.password) {
      console.log(
        `→ ${username}: no legacy password and no authUid. SKIP (needs manual review).`,
      );
      noPasswordSkipped.push(username);
      skipped += 1;
      continue;
    }

    // Firebase Auth enforces a 6-char minimum. Pre-validate so these are a
    // deliberate skip (not a failure) with a clean record for later handling.
    if (data.password.length < 6) {
      console.log(
        `→ ${username}: password shorter than 6 chars. SKIP (decide individually later).`,
      );
      shortPasswordSkipped.push(username);
      skipped += 1;
      continue;
    }

    const email = syntheticEmail(username);

    try {
      // Create the Auth account, or reuse if it already exists.
      let uid;
      try {
        const created = await auth.createUser({
          uid: username,
          email,
          password: data.password,
          emailVerified: true,
        });
        uid = created.uid;
      } catch (createError) {
        if (createError.code === "auth/uid-already-exists") {
          uid = username;
        } else if (createError.code === "auth/email-already-exists") {
          const existing = await auth.getUserByEmail(email);
          uid = existing.uid;
        } else {
          throw createError;
        }
      }

      if (!DRY_RUN) {
        // Write identity fields and remove plaintext password atomically.
        await ref.update({
          email,
          authUid: uid,
          password: FieldValue.delete(),
        });
      }

      console.log(`✓ ${username}: migrated (uid=${uid}).`);
      migrated += 1;
    } catch (error) {
      console.error(`✖ ${username}: FAILED — ${error.message}`);
      failed.push({ username, message: error.message });
    }
  }

  console.log(
    `\nDone. Migrated: ${migrated}. Skipped: ${skipped}. Failed: ${failed.length}.`,
  );
  if (shortPasswordSkipped.length > 0) {
    console.log(
      "\nSkipped — password shorter than 6 chars (decide individually later):",
    );
    for (const u of shortPasswordSkipped) console.log(`  - ${u}`);
  }
  if (noPasswordSkipped.length > 0) {
    console.log(
      "\nSkipped — no password and no authUid (legacy ghost docs):",
    );
    for (const u of noPasswordSkipped) console.log(`  - ${u}`);
  }
  if (failed.length > 0) {
    console.log("\nFailed users:");
    for (const f of failed) console.log(`  - ${f.username}: ${f.message}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
