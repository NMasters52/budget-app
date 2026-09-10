# Missed bill review plan

## Goal

Help users returning after a long absence without silently marking bills paid or requiring manual date edits.

## User experience

- Detect bills with past due dates when the app loads.
- Move each schedule to its next upcoming due date.
- Keep missed dates marked as unpaid.
- Show a banner such as: “You have 4 bills to review.”
- Open a review sheet showing each bill, missed count, and next scheduled date.
- Provide three choices: Paid outside the app, Still unpaid, or Skip dates.
- Include bulk actions for users who want to resolve several bills at once.

## Rule

Automatically update the schedule. Ask before changing payment status.

## Technical work

- Fix the `Date` versus string bug in `markBillAsPaid`.
- Add `reconcileBillOnOpen` for startup date checks.
- Store unpaid due dates and include them in bill status.
- Add tests for long gaps, every frequency, and end-of-month dates.

## Out of scope

- Automatically creating paid payment history.
- Requiring users to edit each missed date.
