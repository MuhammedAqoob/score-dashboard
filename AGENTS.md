# AGENTS.md

Guidance for AI coding agents working on this repository.

## 1. Project Overview

This project is an AI-response analysis platform built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Firebase Firestore
- Firebase Anonymous Authentication

The application does not call AI APIs internally. It displays one official global prompt, users run that prompt in external AI tools, then paste the generated result back into the site. The site parses category scores from the pasted text, validates the weighted final score, stores valid submissions, and updates the public leaderboard.

Core flow:

1. Admin sets one official global prompt.
2. All users copy the same prompt.
3. Users run the prompt in an external AI tool.
4. Users paste the AI-generated result back into the website.
5. The site parses category scores from the AI output.
6. The site validates the weighted overall score.
7. The leaderboard updates using average submission scores.

## 2. Current Architecture Summary

This is a client-heavy prototype using Firebase directly from Next.js client components.

- Firebase Auth handles anonymous UID creation and session persistence only.
- Firestore stores user identity, profile data, prompts, submissions, and leaderboard source data.
- Username/password login is custom application logic stored in Firestore.
- The username is the user-facing identity.
- The Firebase anonymous UID is treated as temporary session identity.
- Admin authentication is prototype-friendly and separate from normal user authentication.

Preserve this architecture unless the human owner explicitly requests a larger migration.

## 3. Directory Structure Overview

Expected structure:

```txt
app/          Next.js App Router pages and layouts
components/   Reusable UI components
context/      React context providers
hooks/        Reusable React hooks
lib/          Firebase initialization and low-level shared utilities
services/     Firestore/Auth/domain service functions
types/        Shared TypeScript types
public/       Static assets
```

Prefer placing Firebase reads/writes in `services/`, React state wrappers in `hooks/`, and visual reuse in `components/`.

## 4. Authentication Rules

Important:

- Use Firebase Anonymous Authentication only.
- Do not add Firebase email/password auth.
- Do not link anonymous accounts to email providers.
- Do not introduce custom JWT authentication.
- Do not replace the current custom username/password flow unless explicitly requested.

Current user behavior:

- Users can sign up/login with a custom username and password.
- Username/password data is stored in Firestore for prototype simplicity.
- Users can log in before approval, but unapproved users cannot submit results.
- Anonymous Firebase UID is only used for session persistence and current session tracking.
- Admin session state must remain separate from normal user session state.

## 5. Firestore Collections Overview

Current important collections/documents:

```txt
users/{username}
prompts/activePrompt
submissions/{username_dayKey}
```

User document shape:

```ts
{
  username: string;
  password: string;
  score: number;
  approved: boolean;
  currentUid: string;
  createdAt: Timestamp;
}
```

Active prompt document:

```ts
{
  title: string;
  content: string;
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Submission document:

```ts
{
  username: string;
  promptId: string;
  promptVersion: number;
  dayKey: string;
  responseText: string;
  scores: object;
  aiReportedScore: number;
  calculatedScore: number;
  validated: boolean;
  submittedAt: Timestamp;
}
```

Avoid schema changes unless they are small, clearly justified, and backward compatible.

## 6. Submission Rules

- Only approved logged-in users can submit results.
- Logged-out users can browse the public leaderboard.
- Unapproved users can log in but cannot submit results.
- Users can paste long AI responses manually.
- Users can upload `.txt` files.
- Empty submissions must be rejected.
- Users may submit only once per day.
- Daily locking is based on a current date/day key.
- Submissions must be attached to the current active prompt version.
- Outdated prompt-version submissions must be rejected.
- Users must not be able to view other users' raw AI outputs.

## 7. Leaderboard Rules

- The leaderboard is public.
- Leaderboard score is the average of all validated submission scores for that user.
- Do not rank by latest score unless explicitly requested.
- Do not rank by total score.
- Keep leaderboard logic based on validated submissions only.
- Realtime listeners may be used for live updates.
- The UI may show extra context such as top score, submission count, or date achieved, but the ranking rule must remain average validated score.

## 8. Validation Logic Rules

The site must validate AI-generated score output without AI APIs.

Validation flow:

1. Parse category scores from the pasted AI output.
2. Parse the AI-reported final overall score.
3. Independently calculate the weighted score.
4. Compare calculated score against AI-reported score.
5. Accept tiny rounding differences.
6. Reject submissions when the mismatch is too large.

Weighted score validation must preserve the current category mapping and weighting rules. The parser should tolerate:

- capitalization differences
- hyphen variations
- slash variations
- extra wording in labels
- markdown tables
- compact copied text

Do not bypass validation to force submissions through.

## 9. Admin System Rules

The admin module is prototype-friendly.

Admin can:

- approve/revoke users
- delete submissions
- temporarily ban users
- manually edit scores
- manage prompts
- view leaderboard insights

Rules:

- Keep admin and user sessions separate.
- Admin login should clear normal user session where applicable.
- Normal user login should clear admin session where applicable.
- Do not expose admin controls to normal users.
- Keep prompt management isolated and deliberate.
- Destructive admin actions should be visually clear and hard to trigger accidentally.

## 10. UI/UX Design Rules

Use a layered dark mode visual system:

- Main backgrounds: `bg-zinc-950`
- Cards, tables, boxes: `bg-zinc-900`
- Borders: `border-zinc-800`
- Headings: `text-white font-bold`
- Body text: `text-zinc-200`
- Meta labels/dates: `text-zinc-400` or `text-zinc-500`

Accent rules:

- Green is reserved for primary actions, approve actions, success states, approved badges, and positive scores.
- Copy/secondary actions should use neutral zinc/light styling.
- Avoid overusing green in headers and normal navigation.

Interaction rules:

- Buttons must have hover, active, disabled, and cursor states.
- Forms must show clear feedback after save/copy/paste/submit actions.
- Pages must be responsive.
- Keep UI minimal, modern, calm, and readable.
- Do not show Firebase internal details such as UID or anonymous status to normal users.

## 11. Reusable Component Philosophy

Create reusable components when they reduce real duplication or clarify page structure.

Good candidates:

- Navbar
- Avatar dropdown
- Metric cards
- Status badges
- Prompt cards
- Submission cards
- Tables
- Empty/loading/error states

Avoid overengineering. Keep components small, typed, and easy to understand.

## 12. Forbidden Architecture Changes

Do not make these changes unless explicitly requested by the human owner:

- Do not rewrite authentication architecture.
- Do not switch to Firebase email/password authentication.
- Do not link anonymous accounts to email providers.
- Do not introduce an external backend.
- Do not add AI API calls.
- Do not rewrite Firestore schema unnecessarily.
- Do not remove the custom username/password prototype system.
- Do not break user/admin session separation.
- Do not bypass submission validation.
- Do not change leaderboard averaging logic.
- Do not expose raw user AI outputs publicly.

## 13. Coding Standards

- Use TypeScript throughout.
- Use Firebase modular SDK imports.
- Use async/await for asynchronous work.
- Keep Firestore logic in service functions.
- Keep React state logic in hooks when reused.
- Prefer simple, readable code over clever abstractions.
- Handle loading, empty, and error states.
- Keep edits focused on the requested task.
- Preserve existing behavior unless the request says otherwise.
- Use Tailwind CSS for styling.
- Keep files client/server compatible with Next.js App Router rules.

When working with Next.js, remember that framework APIs may differ by installed version. Check local project files and installed package behavior instead of assuming from memory.

## 14. Build/Test Verification Commands

Use these commands from the project root (`my-app/`):

```bash
npm run lint
npm run build
```

If a task touches parsing, scoring, submission, dashboard, admin, or leaderboard behavior, run both commands before finishing when possible.

For local development:

```bash
npm run dev
```

If the terminal is at the parent folder, enter the app first:

```bash
cd my-app
```

## 15. Preferred Development Workflow

1. Inspect the existing code before editing.
2. Identify the smallest safe change.
3. Preserve existing data flow and Firestore structure.
4. Implement focused changes.
5. Run lint/build checks.
6. Summarize what changed and mention any verification failures.

Commit frequently when working manually. Small commits make it easier to recover if UI, Firebase, or validation behavior regresses.

## 16. Important Notes for Future AI Agents

- The website itself does not use AI internally.
- The parser/scoring system is intentionally regex/string based.
- The official prompt is global and manually managed by admin.
- The prompt does not rotate automatically.
- Users can browse leaderboard without login.
- Approved login is required for submissions.
- One submission per user per day is enforced by day key.
- Leaderboard average must include all validated submissions for that user.
- Rounding tolerance is intentional during validation.
- Keep admin tools powerful but separated from normal user UI.
- Keep user-facing pages free of implementation details.
