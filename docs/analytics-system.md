# Analytics System

The analytics layer extends the existing submission and moderation architecture without changing authentication, prompt management, or leaderboard ownership. Analytics are derived from submission documents already stored in Firestore.

## Behavioral Rules

- Charts only use validated, active submissions.
- Soft-deleted submissions are ignored by user analytics, platform analytics, trend charts, and averages.
- Banned users can view existing analytics but cannot create new analytics entries because they cannot submit.
- Admin-edited overall scores affect future overall-score analytics and trend charts.
- Category charts render only categories detected in the submitted response.
- Missing category scores should not render as empty rows, zero-value bars, or placeholder cards.
- Average comparison charts appear only after a user has at least two validated active submissions.
- Score trend charts use chronological submission order.
- Leaderboard averages and analytics averages must remain consistent by using the same validated active submission rules.
- Charts must remain responsive, mobile-friendly, and readable in the dark-mode visual system.

## Architecture Decisions

- Analytics logic lives in services and hooks, while chart components remain presentation-focused.
- The platform does not create separate analytics documents for this prototype; analytics are computed from Firestore submissions.
- Failed validation attempts are shown immediately in the UI but are not written as leaderboard or analytics source data.
- The admin analytics overview uses aggregate submission metadata only and does not expose private raw response text.
- Recharts is the charting layer for horizontal bar charts, comparison charts, and score trend history.

## Moderation Compatibility

- Submission status is respected before analytics calculations.
- Deleted submissions can be restored by admins and will re-enter analytics automatically if validated.
- User bans do not erase historical analytics.
- Admin score edits preserve category scores, so category analytics remain based on parsed category values while overall trend analytics use the edited overall score.
