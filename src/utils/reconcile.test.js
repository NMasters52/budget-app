// Tests for reconcileBillOnOpen, resolveBillMissedDates, and the
// getBillStatus interaction with unpaid missed dates.
//
// reconcileBillOnOpen answers: "the user was gone for a while, what should
// the schedule look like when they come back?" It must move nextDue up to
// today or later, keep every skipped date as an UNPAID review item, and
// never invent payment history.

import { describe, test, expect } from "vitest";
import {
  reconcileBillOnOpen,
  reconcileAllBills,
  resolveBillMissedDatesInList,
  resolveBillMissedDates,
  getBillsNeedingReview,
  getBillStatus,
} from "./dateUtils";

const TODAY = new Date(2026, 8, 10); // September 10, 2026

const makeBill = (overrides = {}) => ({
  id: "b1",
  title: "Gym",
  amount: 30,
  frequency: "monthly",
  nextDue: "2026-07-09",
  originalDueDate: "2026-07-09",
  lastPaid: "",
  paymentHistory: [],
  ...overrides,
});

describe("reconcileBillOnOpen", () => {
  test("monthly bill two months behind: nextDue skips ahead, missed dates kept", () => {
    // Due Jul 9, Aug 9, and Sep 9 all passed. nextDue becomes Oct 9 and
    // all three dates stay on the books as unpaid.
    const bill = reconcileBillOnOpen(makeBill(), TODAY);

    expect(bill.nextDue).toBe("2026-10-09");
    expect(bill.unpaidDueDates).toEqual([
      "2026-07-09",
      "2026-08-09",
      "2026-09-09",
    ]);
  });

  test("current bill is left alone and still gets an empty unpaidDueDates", () => {
    const bill = reconcileBillOnOpen(
      makeBill({ nextDue: "2026-10-10", originalDueDate: "2026-10-10" }),
      TODAY,
    );

    expect(bill.nextDue).toBe("2026-10-10");
    expect(bill.unpaidDueDates).toEqual([]);
  });

  test("every frequency advances by its own period length", () => {
    // All bills were due June 1. September 10 is today.
    const cases = [
      { frequency: "weekly", nextDue: "2026-09-14", missed: 15 },
      { frequency: "biweekly", nextDue: "2026-09-21", missed: 8 },
      { frequency: "monthly", nextDue: "2026-10-01", missed: 4 },
      { frequency: "quarterly", nextDue: "2026-12-01", missed: 2 },
      { frequency: "biannually", nextDue: "2026-12-01", missed: 1 },
      { frequency: "yearly", nextDue: "2027-06-01", missed: 1 },
    ];

    for (const c of cases) {
      const bill = reconcileBillOnOpen(
        makeBill({ frequency: c.frequency, nextDue: "2026-06-01", originalDueDate: "2026-06-01" }),
        TODAY,
      );
      expect(bill.nextDue, c.frequency).toBe(c.nextDue);
      expect(bill.unpaidDueDates, c.frequency).toHaveLength(c.missed);
    }
  });

  test("end of month: a bill on the 30th skips short months without inventing dates", () => {
    // January 30 -> February has no 30th, so the walk lands on March 30.
    const bill = reconcileBillOnOpen(
      makeBill({ nextDue: "2026-01-30", originalDueDate: "2026-01-30" }),
      new Date(2026, 2, 15), // March 15
    );

    expect(bill.nextDue).toBe("2026-03-30");
    expect(bill.unpaidDueDates).toEqual(["2026-01-30"]);
  });

  test("uses originalDueDate as the recurrence anchor when nextDue drifted", () => {
    const bill = reconcileBillOnOpen(
      makeBill({
        nextDue: "2026-02-06",
        originalDueDate: "2026-01-05",
      }),
      new Date(2026, 2, 1), // March 1
    );

    expect(bill.nextDue).toBe("2026-03-05");
    expect(bill.unpaidDueDates).toEqual(["2026-02-06"]);
  });

  test("running it twice changes nothing (idempotent)", () => {
    const once = reconcileBillOnOpen(makeBill(), TODAY);
    const twice = reconcileBillOnOpen(once, TODAY);

    expect(twice).toEqual(once);
  });

  test("reconciliation never creates payment history or sets lastPaid", () => {
    const bill = reconcileBillOnOpen(makeBill(), TODAY);

    expect(bill.paymentHistory).toEqual([]);
    expect(bill.lastPaid).toBe("");
  });

  test("bills with an invalid or missing frequency are returned untouched", () => {
    const bill = reconcileBillOnOpen(
      makeBill({ frequency: "sometimes", nextDue: "2020-01-01" }),
      TODAY,
    );

    expect(bill.nextDue).toBe("2020-01-01");
    expect(bill.unpaidDueDates).toEqual([]);
  });

  test("reconcileAllBills maps every bill", () => {
    const bills = [
      makeBill({ id: "a" }),
      makeBill({ id: "b", nextDue: "2026-12-25" }),
    ];
    const [a, b] = reconcileAllBills(bills, TODAY);

    expect(a.unpaidDueDates).toHaveLength(3);
    expect(b.unpaidDueDates).toEqual([]);
  });
});

describe("resolveBillMissedDates", () => {
  const bill = reconcileBillOnOpen(makeBill(), TODAY);

  test("resolving as paid records late history and moves lastPaid", () => {
    const resolved = resolveBillMissedDates(
      bill,
      bill.unpaidDueDates,
      "paid",
    );

    expect(resolved.unpaidDueDates).toEqual([]);
    expect(resolved.lastPaid).toBe("2026-09-09"); // latest resolved date
    expect(resolved.paymentHistory).toHaveLength(3);
    expect(resolved.paymentHistory.every((h) => h.wasLate)).toBe(true);
    expect(resolved.nextDue).toBe("2026-10-09"); // schedule untouched
  });

  test("resolving as skipped drops the dates without inventing payments", () => {
    const resolved = resolveBillMissedDates(
      bill,
      bill.unpaidDueDates,
      "skipped",
    );

    expect(resolved.unpaidDueDates).toEqual([]);
    expect(resolved.paymentHistory).toEqual([]);
    expect(resolved.lastPaid).toBe("");
  });

  test("resolving a subset keeps the rest queued for review", () => {
    const resolved = resolveBillMissedDates(bill, ["2026-07-09"], "paid");

    expect(resolved.unpaidDueDates).toEqual(["2026-08-09", "2026-09-09"]);
  });
});

describe("review helpers", () => {
  test("getBillsNeedingReview lists only bills with unpaid dates", () => {
    const bills = [
      makeBill({ id: "stale", lastPaid: "2026-09-01" }),
      makeBill({ id: "fresh", nextDue: "2026-12-25" }),
    ];
    const needing = getBillsNeedingReview(reconcileAllBills(bills, TODAY));

    expect(needing.map((b) => b.id)).toEqual(["stale"]);
  });

  test("getBillStatus reports overdue while missed dates are unresolved, even if lastPaid is this month", () => {
    // The user paid something recently, but July and August went unpaid.
    // "paid" would be a lie.
    const bill = reconcileBillOnOpen(
      makeBill({ lastPaid: "2026-09-01" }),
      TODAY,
    );

    expect(bill.unpaidDueDates.length).toBeGreaterThan(0);
    expect(getBillStatus(bill, TODAY)).toBe("overdue");
  });

  test("list resolution preserves every bill in a bulk-style update", () => {
    const bills = reconcileAllBills(
      [
        makeBill({ id: "a" }),
        makeBill({ id: "b", nextDue: "2026-08-01", originalDueDate: "2026-08-01" }),
      ],
      TODAY,
    );

    const afterFirst = resolveBillMissedDatesInList(
      bills,
      "a",
      bills[0].unpaidDueDates,
      "skipped",
    );
    const afterSecond = resolveBillMissedDatesInList(
      afterFirst,
      "b",
      afterFirst[1].unpaidDueDates,
      "skipped",
    );

    expect(afterSecond.every((bill) => bill.unpaidDueDates.length === 0)).toBe(
      true,
    );
  });
});
