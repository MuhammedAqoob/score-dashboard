# AI Context

This file is a compact handoff for future AI agents working on this project.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Firebase Firestore
- Firebase Anonymous Authentication
- Recharts

The app is a client-heavy Firebase prototype. It does not call AI APIs internally. Users copy the official prompt, run it in an external AI tool, paste the result back into the app, and the app parses/validates the returned scorecard.

## Architecture Rules

- Preserve Firebase Anonymous Authentication.
- Preserve the custom username/password flow stored in Firestore.
- Preserve separate admin and user session systems.
- Preserve public leaderboard access.
- Preserve Firestore collection shapes unless a backward-compatible addition is clearly required.
- Keep Firebase reads/writes in `services/`.
- Keep reused React data state in `hooks/`.
- Keep shared UI in `components/`.
- Do not add AI API calls to the app.

## Folder Structure

```txt
app/                  Next.js App Router pages
app/admin/            Admin dashboard and admin login
app/dashboard/        User dashboard and persistent analytics
app/leaderboard/      Public leaderboard and comparison modal entry point
app/login/            User login/signup
app/prompts/          Current prompt display
components/           Shared UI components
components/analytics/ Recharts analytics UI
context/              Auth context provider
docs/                 Project architecture notes
hooks/                React hooks around services/state
lib/                  Firebase initialization
public/               Static assets
services/             Firestore, auth, parsing, scoring, analytics services
types/                Shared TypeScript types
```

## Active Routes

Page routes:

- `/`
- `/login`
- `/dashboard`
- `/leaderboard`
- `/prompts`
- `/admin`
- `/admin/login`

API routes:

- None currently. There are no active `app/api` route handlers.

## Firestore Schemas

### `users/{username}`

```ts
{
  username: string;
  password: string;
  score: number;
  approved: boolean;
  status?: "pending" | "approved" | "revoked" | "banned";
  bannedUntil?: Timestamp | null;
  banReason?: string | null;
  createdAt?: Timestamp;
  currentUid?: string;
}
```

Compatibility rule: if `status` is missing, derive it from legacy `approved`.

### `prompts/activePrompt`

```ts
{
  title: string;
  content: string;
  version: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

The default prompt content is defined in `services/promptService.ts`. Existing Firestore prompt content remains editable by admins.

### `submissions/{username_dayKey}`

```ts
{
  username: string;
  promptId: string;
  promptVersion: number;
  dayKey: string;
  responseText: string;
  submittedAt?: Timestamp;
  scores: ScoreMap;
  aiReportedScore: number;
  calculatedScore: number;
  validated: boolean;
  status?: "active" | "deleted";
  editedByAdmin?: boolean;
  editedAt?: Timestamp;
}
```

Compatibility rule: if `status` is missing, treat the submission as `active`.

### `adminLogs/{logId}`

```ts
{
  actionType:
    | "approve_user"
    | "revoke_user"
    | "ban_user"
    | "unban_user"
    | "edit_score"
    | "delete_submission"
    | "restore_submission"
    | "prompt_update";
  targetUsername: string;
  adminUsername: string;
  details: string;
  createdAt?: Timestamp;
}
```

## Scoring And Parsing

Primary file: `services/analysisService.ts`.

Current parser rules:

- Only parse inside `BEGIN_SCORECARD ... END_SCORECARD`.
- Ignore essay text for score extraction.
- Support multiline and compressed single-line scorecards.
- Parse exact/alias category keys plus `FINAL_WEIGHTED_SCORE`.
- Require all categories defined in `SCORE_CATEGORIES`.
- Compare AI-reported score against independently calculated score.
- Accept tolerance `<= 1`.
- Reject missing scorecard, missing categories, missing final score, or mismatch.
- Development-only logs show scorecard block, detected pairs, parsed scores, and weighted math.

Scoring is normalized dynamically:

```ts
weightedTotal = sum(score * weight)
totalWeight = sum(weights)
normalizedScore = weightedTotal / totalWeight
finalScore = round(normalizedScore)
```

`decisionMaking` is currently display-only and has weight `0`.

## Analytics Rules

Primary files:

- `services/analyticsService.ts`
- `components/analytics/*`
- `app/dashboard/page.tsx`

Rules:

- Use only validated active submissions.
- Ignore deleted submissions.
- Admin-edited `calculatedScore` affects overall-score analytics and trends.
- Category analytics use stored parsed category scores.
- Dashboard analytics persist from Firestore submission history.
- Leaderboard comparison modal derives both users from stored submissions.
- Recharts containers include minimum dimensions to avoid invalid responsive measurements.
- Category Y-axis ticks should render all labels with `interval={0}`.

## Leaderboard Rules

Primary file: `services/leaderboardService.ts`.

- Public route.
- Ranking is by average score.
- Use validated active submissions only.
- Use approved users only.
- Deleted submissions never affect averages.
- Do not change ranking to latest score, top score, or total score.

## Admin Capabilities

Primary route: `/admin`.

Admin can:

- approve/revoke users
- ban/unban users
- edit submission overall score
- soft-delete/restore submissions
- view activity logs
- manage active prompt
- view platform analytics

Admin and normal user sessions must remain separate.

## Known Bugs / Risks

- Existing Firestore prompt content may still be an older human-readable prompt until an admin loads and saves the structured default prompt.
- `npm install recharts` previously reported moderate audit findings in the dependency tree; no forced audit fix has been run.
- Browser viewport verification has not been automated because Playwright is not installed.
- Firestore access is client-heavy prototype logic; production security rules should be reviewed before real deployment.
- Username/password storage is prototype-only and not suitable for production credentials.

## Immediate Next Development Goals

1. Backfill or migrate existing Firestore prompts to the structured scorecard prompt.
2. Add automated parser tests for multiline and single-line scorecards.
3. Add Playwright or another browser test setup for mobile overflow and chart rendering.
4. Review Firebase security rules for admin-only collections and raw submission access.
5. Add a lightweight migration/backfill path for legacy user `status` and submission `status`.
6. Improve admin prompt versioning history if prompt changes become frequent.
7. Consider replacing prototype username/password storage before production use.

## Verification Commands

Run from `my-app/`:

```bash
npm run lint
npm run build
```
