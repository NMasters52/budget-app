# Bill Buddy date fixes

## 1. Late payments stay one cycle behind

Files:

- `src/utils/dateUtils.js`
- `src/components/BillsTable.jsx`
- `src/components/BillsListCard.jsx`
- `src/components/EditModal.jsx`

`markBillAsPaid` receives a `Date`, but `calculatePeriodsPassed` expects a `YYYY-MM-DD` string and calls `.split()`. The caught error turns the period count into `0`.

Normalize the date once, then pass the string:

```js
const paidDateString = toISODate(paidDate);
calculatePeriodsPassed(bill.nextDue, paidDateString, bill.frequency);
```

Use `parseLocalDate` for date-only comparisons. A bill due `2026-07-09` and paid `2026-09-09` should move to `2026-10-09` and record two missed periods.

## 2. Saved due dates stay stale after a long absence

Files:

- `src/App.jsx`
- `src/utils/dateUtils.js`
- `src/components/BillsTable.jsx`
- `src/components/BillsListCard.jsx`

`App` returns migrated localStorage bills without checking whether `nextDue` is past.

Add a pure `reconcileBillOnOpen(bill, today)` function and run it when loading bills:

- Use `originalDueDate` as the recurrence anchor.
- Move `nextDue` to the next scheduled date on or after today.
- Keep missed due dates as unpaid, preferably in `unpaidDueDates`.
- Do not create payment history or mark bills paid automatically.
- Show the missed count and provide one review or bulk-resolve action.
- Check unpaid missed dates before current-month `lastPaid` when calculating status.

Update `migrateBills` for any new fields. Keep all date calculations local and avoid `new Date("YYYY-MM-DD")`.

## Verification

Add deterministic checks for a two-month gap, each frequency, end-of-month dates, and marking paid through the UI's `Date` path. Run `npm run lint` and `npm run build`. Preserve unrelated package changes.
