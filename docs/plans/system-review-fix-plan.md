# Bill Buddy system review fix plan

Status: Plan only  
Branch reviewed: `playground-restyle`  
Scope: Five confirmed bugs from the September 29, 2026 system review

## Goal

Fix the five confirmed issues without changing the two-page Bills and Debts structure or losing saved user data. Each fix must begin with a failing regression test, pass through the public behavior named below, and finish with a browser check against an isolated localStorage origin.

## Working rules

- Preserve all current uncommitted restyle work.
- Do not commit, push, or deploy unless the user asks.
- Work in the order listed in this plan. The first three issues can change money or saved data.
- Complete one red, green cycle at a time. Do not write all tests before implementing the first fix.
- Use known literal expectations in tests. Do not calculate the expected value with the same helper used by production code.
- Run `npm test -- --run`, `npm run lint`, `npm run build`, and `git diff --check` after each issue.
- Use an isolated browser origin or temporary localStorage keys for destructive storage tests. Never corrupt the user's existing `bills` or `debts` values.

## Test seams

Use these public boundaries for regression coverage:

- Recurrence and range math: exported functions in `src/utils/dateUtils.js`.
- Saved-state loading: exported loader functions called by `App`.
- Edit validation: the Edit bill form as a user submits it.
- Mobile navigation: the rendered dialog as a keyboard user presses Tab, Shift+Tab, and Escape.
- Browser acceptance: the running app with isolated seed data.

If the current Vitest setup cannot exercise form and keyboard behavior, add `jsdom`, `@testing-library/react`, and `@testing-library/user-event` as development dependencies. Do not replace behavior tests with static markup assertions.

## 1. Fix weekly and biweekly payment status

### Confirmed failure

`getBillStatus` treats any payment in the current calendar month as payment for the current period. A weekly bill paid on September 1 advances to September 8 but still returns `paid` on September 8. `BillsOverview` disables Pay for that status.

Affected code:

- `src/utils/dateUtils.js`, `isBillPaidThisPeriod`
- `src/utils/dateUtils.js`, `getBillStatus`
- `src/components/BillsOverview.jsx`, `billStatus` and `renderActions`

### Intended behavior

- Payment status follows the bill's recurrence interval, not the calendar month.
- After paying an occurrence, the bill may show Paid until the next due date.
- On the next due date, a weekly or biweekly bill becomes payable again.
- Monthly, quarterly, biannual, and yearly bills keep the same visible behavior they have now.
- Unresolved missed dates still take priority and return Needs review.
- A late payment may show Paid late only until the next due date.

### Regression tests first

Add cases to `src/utils/dateUtils.test.js`:

1. A weekly bill paid September 1 has `nextDue` September 8 and returns `due_soon`, not `paid`, on September 8.
2. The same weekly bill returns `paid` on September 2.
3. A biweekly bill paid September 1 is payable again on September 15.
4. A monthly bill paid September 2 remains Paid on September 29 and becomes payable on October 2.
5. A bill with `unpaidDueDates` returns `overdue` regardless of its last payment date.
6. A late payment stops returning `paid_late` when the next occurrence becomes due.

Use fixed local dates such as `new Date(2026, 8, 8)`. Do not use the current clock.

### Implementation steps

1. Replace month boundaries in `getBillStatus` with recurrence-cycle boundaries.
2. Derive the paid interval from `previousDueDate`, `nextDue`, and `frequency`.
3. Add a date utility that determines whether `lastPaid` covers the immediately previous occurrence. Keep this rule in one function.
4. Return Paid or Paid late only while `today < nextDue` and the last payment belongs to that previous occurrence.
5. Keep the existing priority order: missed dates, paid state, overdue, due soon, scheduled.
6. Confirm that `markBillAsPaid` still records `previousDueDate` before advancing `nextDue` for every supported frequency.

### Browser acceptance

Seed one weekly bill due today. Pay it and confirm:

- The next due date advances seven days.
- The button becomes Paid immediately after payment.
- With the test clock set to the new due date, the button is Pay again.

Repeat with a biweekly bill.

## 2. Stop malformed saved data from being overwritten

### Confirmed failure

The bills and debts initializers catch parse or shape errors and return `[]`. Their effects then save `[]` to the same localStorage keys, destroying the unreadable value.

Affected code:

- `src/App.jsx`, bills initializer and bills persistence effect
- `src/App.jsx`, debts initializer and debts persistence effect
- `src/utils/dateUtils.js`, bill migration and validation entry points
- `src/utils/debtUtils.js`, debt normalization and validation entry points

### Intended behavior

- App startup must never overwrite an unreadable or structurally invalid saved value.
- Valid arrays continue through migration, normalization, reconciliation, and persistence.
- Invalid data produces a visible recovery message for the affected domain.
- Bills and debts fail independently. Broken bills must not block valid debts.
- The user must make an explicit, confirmed choice before resetting an invalid key.
- Resetting invalid data must first copy the raw value to a recovery key.

Use stable recovery keys:

- `bills:recovery`
- `debts:recovery`

### Regression tests first

Create `src/App.storage.test.jsx` with jsdom localStorage:

1. Invalid JSON in `bills` remains byte-for-byte unchanged after App mounts.
2. A valid JSON object instead of an array remains unchanged and reports a bills load error.
3. The same two cases are covered for `debts`.
4. Invalid bills do not prevent valid debts from loading.
5. Valid migrated bills still persist their migrated shape.
6. Valid normalized debts still persist their normalized shape.
7. An explicit reset copies the raw value to the recovery key before writing `[]`.

### Implementation steps

1. Extract `loadBills` and `loadDebts` into a small storage module such as `src/utils/storage.js`.
2. Return a result object with `data`, `status`, and `rawValue`. Use statuses `empty`, `ready`, and `invalid`.
3. Reject non-array parsed values before calling `.some`, migration, or normalization.
4. Store each load result in App state. Do not collapse `invalid` into a normal empty state.
5. Guard each persistence effect. Write only when that domain's load status is `empty` or `ready`.
6. Show an inline error above the affected page: `Saved bills could not be read. Your saved data has not been changed.` Use equivalent debt wording.
7. Add an explicit `Reset saved bills` or `Reset saved debts` action behind a confirmation dialog.
8. On confirmation, copy the raw string to the matching recovery key, write `[]` to the primary key, clear the load error, and initialize that domain as empty.
9. Log the parse or validation error for diagnosis without logging personal financial values.

### Browser acceptance

On an isolated origin:

1. Set `bills` to invalid JSON and `debts` to one valid debt.
2. Reload.
3. Confirm the bills recovery message appears and the debt still renders.
4. Read localStorage and confirm the invalid `bills` string is unchanged.
5. Use the explicit reset action.
6. Confirm `bills:recovery` contains the original string before `bills` becomes `[]`.

## 3. Make date-range totals recurrence-aware

### Confirmed failure

The range filter compares only a bill's stored `nextDue` and sums each visible bill once. A $25 weekly bill due October 1 reports $25 for October 1 through October 31, even though five $25 payments fall in that range.

Affected code:

- `src/components/BillsOverview.jsx`, `visibleBills`
- `src/components/BillsOverview.jsx`, conditional range result
- `src/utils/dateUtils.js`, recurrence projection helpers

### Intended behavior

- A closed range includes every recurrence whose due date falls on or between the selected dates.
- The range total sums every included occurrence.
- The ledger includes each bill that has at least one occurrence in the range.
- When one bill occurs more than once, its row shows the number of payments and its range subtotal.
- A total appears only when both From and To contain valid dates.
- With only one date selected, show `Choose an end date to calculate a total` or `Choose a start date to calculate a total`.
- If From is later than To, show an inline error and do not display a total.
- Clear dates removes only `from` and `to`. It must preserve the selected sort.

### Regression tests first

Add public utility tests to `src/utils/dateUtils.test.js`:

1. A $25 weekly bill due October 1 has five occurrences and a $125 subtotal through October 31.
2. The same bill has four occurrences and a $100 subtotal from October 8 through October 31.
3. A monthly bill on the 31st follows the app's existing month-roll behavior. Pin the expected dates with literals.
4. Range boundaries are inclusive.
5. A bill with no occurrence in the range returns zero occurrences and a zero subtotal.
6. An invalid or reversed range returns a typed validation result rather than a misleading zero.

Add page behavior tests to `src/pages.render.test.jsx` or a jsdom component test:

1. A complete range renders `$125.00 due`, `5 payments`, and the weekly bill.
2. A single-sided range renders the missing-bound instruction and no dollar total.
3. A reversed range renders the date error.
4. Clear dates preserves `sort=name` in the URL.

### Implementation steps

1. Add `getBillOccurrencesInRange(bill, fromDate, toDate)` to `src/utils/dateUtils.js`.
2. Reuse the same frequency advance function as the 7-day, 30-day, and 1-year summaries. Do not create a second recurrence switch.
3. Return occurrence dates, count, and subtotal for each bill.
4. In `BillsOverview`, build one range projection with `useMemo` when both dates are valid.
5. Derive visible bills from projections whose count is greater than zero.
6. Derive the result-card total from projection subtotals.
7. In filtered ledger rows, show base amount, occurrence count, and range subtotal. Example: `$25 each, 5 payments, $125 due`.
8. Keep ordinary ledger rows unchanged when no complete range is active.
9. Keep sorting semantic. Amount sorting during a complete range should sort by range subtotal, not the single-payment amount.

### Browser acceptance

Seed a $25 weekly bill due October 1 and choose October 1 through October 31. Confirm:

- The card shows `$125.00 due`.
- The bill remains visible.
- Its row explains that five payments make up the total.
- Changing From to October 8 changes the total to `$100.00` without removing the bill.
- Clearing dates keeps the current sort.

## 4. Validate the Edit bill form before saving

### Confirmed failure

The edit form validates only frequency and amount. It can save a blank title or blank next billing date, leaving `Unknown` and `In NaN days` in the ledger.

Affected code:

- `src/components/EditModal.jsx`, `handleSubmit`
- `src/utils/dateUtils.js`, `validateBillInput`
- `src/components/BillsOverview.jsx`, edit save path

### Intended behavior

- Edit bill applies the same title, amount, frequency, and date rules as Add bill.
- Invalid fields show inline errors in the modal.
- The first invalid field receives focus after submission.
- The modal stays open and `onSave` is not called.
- Valid edits preserve schedule metadata and close the modal after saving.
- Native `required` attributes support browser and assistive-technology feedback.

### Regression tests first

Create `src/components/EditModal.test.jsx` with jsdom and user-event:

1. Clearing the title and submitting shows `Bill title is required`, focuses the title input, and does not call `onSave`.
2. Clearing next billing date shows `Next billing date is required`, focuses that input, and does not call `onSave`.
3. An invalid amount uses the shared validator message and does not save.
4. A valid edit calls `onSave` once with a numeric amount and preserved `paymentHistory`, `originalDueDate`, `previousDueDate`, and `unpaidDueDates`.

### Implementation steps

1. Add `required` to title, amount, next billing date, and frequency controls where appropriate.
2. Replace alert-only checks with `validateBillInput` on the proposed updated bill.
3. Keep `validateBillDates` for schedule-consistency warnings after required-field validation passes.
4. Store validation errors in component state and render them in one `role="alert"` region above the actions.
5. Map each error to its field and focus the first invalid input.
6. Clear a field's error when the user corrects that field.
7. Keep the modal open on every validation failure.

### Browser acceptance

Open Edit bill, clear the title and date, and press Save changes. Confirm:

- The modal stays open.
- Both errors are readable.
- Focus lands on Bill title.
- The ledger and localStorage remain unchanged.
- Correcting the fields allows one successful save.

## 5. Keep keyboard focus inside mobile navigation

### Confirmed failure

The mobile navigation moves focus to Close and supports Escape, but Tab can move behind the open dialog.

Affected code:

- `src/Nav.jsx`, mobile menu effect and dialog
- `src/components/ui.jsx`, existing modal focus behavior that can become shared code

### Intended behavior

- Opening the menu focuses Close.
- Tab from the last navigation item returns to Close.
- Shift+Tab from Close moves to the last navigation item.
- Page controls behind the menu cannot receive focus or clicks while it is open.
- Escape and backdrop click close the menu and restore focus to Open menu.
- Choosing Bills or Debts closes the menu and moves focus into the destination page through normal navigation.

### Regression tests first

Create `src/Nav.test.jsx` with jsdom and user-event:

1. Open menu moves focus to Close menu.
2. Tab cycles through Close, Bills, and Debts without reaching Add bill or page controls.
3. Shift+Tab cycles backward inside the same set.
4. Escape closes the menu and restores focus to Open menu.
5. Backdrop click closes the menu and restores focus.

### Implementation steps

1. Extract the tested focus-trap behavior from `ModalShell` into a shared hook such as `useModalFocusTrap`.
2. Give the hook the dialog ref, open state, close callback, and restore-focus ref.
3. Use the hook in both `ModalShell` and the mobile navigation dialog.
4. Query only enabled, visible focusable elements inside the active dialog.
5. Intercept Tab and Shift+Tab at the first and last items.
6. Lock body scrolling while the menu is open.
7. Mark the rest of the application inert while the menu is open. Remove inert state during every close and unmount path.
8. Keep the existing Escape and focus-restoration behavior.

### Browser acceptance

At a mobile width:

1. Focus Open menu and press Enter.
2. Press Tab repeatedly and confirm focus never leaves Close, Bills, and Debts.
3. Press Shift+Tab and confirm the reverse loop.
4. Press Escape and confirm focus returns to Open menu.
5. Reopen the menu and confirm background buttons cannot be clicked.

## Delivery order

1. Payment-period status
2. Saved-data protection
3. Date-range recurrence totals
4. Edit bill validation
5. Mobile navigation focus

After each numbered issue, keep its regression tests green before starting the next issue.

## Final verification matrix

Run all automated checks:

```sh
npm test -- --run
npm run lint
npm run build
git diff --check
```

Then verify these browser stories on both desktop and mobile widths:

- Add, edit, pay, review, and delete a monthly bill.
- Pay a weekly bill twice across two due occurrences in the same month.
- Filter a weekly bill across a range containing several occurrences and reconcile the displayed subtotal by hand.
- Reload with valid storage and confirm data remains stable.
- Reload with malformed bills storage and confirm it is preserved while valid debts still load.
- Submit an invalid bill edit and confirm nothing persists.
- Open the mobile menu and complete the keyboard focus loop.
- Confirm every enabled button uses `cursor: pointer` and disabled buttons use `cursor: not-allowed`.
- Check the browser console for uncaught errors and accessibility warnings.

## Definition of done

The handoff is complete only when:

- Every regression test fails before its fix and passes after it.
- All existing tests still pass.
- The five browser acceptance stories pass against the built app.
- No test uses the user's existing financial data.
- No malformed saved value is overwritten without an explicit confirmed reset and recovery copy.
- The final diff contains no unrelated changes.
- The implementation report names each issue, its proof, and any behavior that intentionally changed.

