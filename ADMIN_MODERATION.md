# Admin Moderation Reference

This project uses the existing client-side Next.js and Firebase prototype architecture. Admin moderation data is stored directly in Firestore and remains separate from normal user session state.

## User Status

User documents support these status values:

- `pending`: user can log in and view public content, but cannot submit.
- `approved`: user can submit responses.
- `revoked`: user can log in and view public content, but cannot submit.
- `banned`: user can log in and view the leaderboard, but cannot submit.

Backward compatibility is preserved. If a user does not have `status`, the app derives it from the legacy `approved` boolean.

Additional user fields:

```ts
{
  status: "pending" | "approved" | "revoked" | "banned";
  bannedUntil: Timestamp | null;
  banReason: string | null;
}
```

Expired temporary bans are cleared by frontend service logic the next time user/admin data is read.

## Submissions

Submissions are never permanently deleted by the admin UI. Soft delete uses:

```ts
{
  status: "active" | "deleted";
}
```

Deleted submissions remain visible in admin moderation tables, but are excluded from leaderboard averages, dashboard statistics, and ranking calculations.

Admin score edits update only `calculatedScore`, preserving category scores and raw response text:

```ts
{
  editedByAdmin: true;
  editedAt: Timestamp;
}
```

## Activity Logs

Moderation actions are recorded in:

```txt
adminLogs/{logId}
```

Log shape:

```ts
{
  actionType: string;
  targetUsername: string;
  adminUsername: string;
  details: string;
  createdAt: Timestamp;
}
```

Tracked actions include user approval/revocation, bans, unbans, score edits, submission delete/restore, and prompt updates.

## Leaderboard Rules

Leaderboard rankings use only:

- validated submissions
- active submissions
- approved users

The ranking score remains the average validated score per user.
