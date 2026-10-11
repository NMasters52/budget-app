// Tests for dateUtils.js
//
// Each `test(...)` call is one check. Inside every check you:
//   1. call a real function from dateUtils.js with an input you chose,
//   2. assert the output equals the answer you expect.
//
// Run them all with:  npm test
// Vitest finds every file ending in .test.js and reports green or red.

import { describe, test, expect } from "vitest";
import {
  toISODate,
  isValidISODate,
  parseLocalDate,
  formatedDate,
  calculateYearlyTotal,
  isValidFrequency,
  validateBillInput,
  markBillAsPaid,
  getBillStatus,
  buildUpdatedBill,
} from "./dateUtils";

describe("toISODate", () => {
  test("converts a Date object to a YYYY-MM-DD string", () => {
    // Months are 0-indexed: 8 means September.
    expect(toISODate(new Date(2026, 8, 10))).toBe("2026-09-10");
  });

  test("passes an existing YYYY-MM-DD string through unchanged", () => {
    expect(toISODate("2026-09-10")).toBe("2026-09-10");
  });

  test("returns an empty string for an empty date", () => {
    expect(toISODate("")).toBe("");
  });
});

describe("isValidISODate", () => {
  test("accepts real calendar dates", () => {
    expect(isValidISODate("2026-09-10")).toBe(true);
  });

  test("rejects impossible calendar dates", () => {
    expect(isValidISODate("2026-02-29")).toBe(false);
  });
});

describe("parseLocalDate", () => {
  test("parses YYYY-MM-DD as local midnight, not UTC", () => {
    const d = parseLocalDate("2026-09-10");
    // If this used new Date("2026-09-10") it would be UTC midnight,
    // which is the previous day in US timezones.
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // 0-indexed: September
    expect(d.getDate()).toBe(10);
  });
});

describe("formatedDate", () => {
  test("formats a YYYY-MM-DD string as MM/DD/YYYY", () => {
    expect(formatedDate("2026-09-10")).toBe("09/10/2026");
  });

  test("returns an empty string for missing input", () => {
    expect(formatedDate("")).toBe("");
    expect(formatedDate(null)).toBe("");
  });
});

describe("calculateYearlyTotal", () => {
  test("annualizes each bill by its frequency and sums", () => {
    const bills = [
      { name: "Rent", amount: 100, frequency: "monthly" }, // 100 * 12
      { name: "Insurance", amount: 1200, frequency: "yearly" }, // 1200 * 1
    ];
    expect(calculateYearlyTotal(bills)).toBe(2400);
  });

  test("throws and names the offending bill when a frequency is invalid", () => {
    const bills = [{ name: "Mystery Bill", amount: 10, frequency: "sometimes" }];
    expect(() => calculateYearlyTotal(bills)).toThrow(/Mystery Bill/);
  });
});

describe("isValidFrequency", () => {
  test("accepts every supported frequency", () => {
    for (const f of [
      "weekly",
      "biweekly",
      "monthly",
      "quarterly",
      "biannually",
      "yearly",
    ]) {
      expect(isValidFrequency(f)).toBe(true);
    }
  });

  test("rejects made-up frequencies", () => {
    expect(isValidFrequency("sometimes")).toBe(false);
  });
});

describe("validateBillInput", () => {
  const validBill = {
    title: "Gym",
    amount: "30.00",
    frequency: "monthly",
    nextDue: "2026-07-09",
    lastPaid: "",
  };
  const today = new Date(2026, 8, 10);

  test("accepts a valid bill with a past next due date", () => {
    expect(validateBillInput(validBill, today)).toEqual({
      isValid: true,
      errors: [],
    });
  });

  test("rejects blank, zero, negative, non-finite, and over-precise amounts", () => {
    for (const amount of ["", "0", "-5", "1e309", "12.345"]) {
      const result = validateBillInput({ ...validBill, amount }, today);
      expect(result.isValid, amount).toBe(false);
      expect(result.errors).toContain("Bill amount must be greater than zero and use at most two decimal places.");
    }
  });

  test("rejects missing or invalid dates", () => {
    const missing = validateBillInput({ ...validBill, nextDue: "" }, today);
    const invalid = validateBillInput(
      { ...validBill, nextDue: "2026-02-29" },
      today,
    );

    expect(missing.errors).toContain("Next billing date is required.");
    expect(invalid.errors).toContain("Next billing date must be a valid date.");
  });

  test("rejects a future last-paid date and a last-paid date after next due", () => {
    const future = validateBillInput(
      { ...validBill, lastPaid: "2026-09-11" },
      today,
    );
    const inconsistent = validateBillInput(
      { ...validBill, nextDue: "2026-08-01", lastPaid: "2026-08-02" },
      today,
    );

    expect(future.errors).toContain("Last paid date cannot be in the future.");
    expect(inconsistent.errors).toContain(
      "Last paid date cannot be after the next billing date.",
    );
  });
});

describe("markBillAsPaid", () => {
  test("paid on the due date: advances exactly one period, not late", () => {
    const bills = [
      {
        id: "gym",
        title: "Gym",
        amount: 30,
        frequency: "monthly",
        nextDue: "2026-09-10",
        originalDueDate: "2026-09-10",
        paymentHistory: [],
      },
    ];
    const [updated] = markBillAsPaid(bills, "gym", new Date(2026, 8, 10));

    expect(updated.lastPaid).toBe("2026-09-10");
    expect(updated.nextDue).toBe("2026-10-10");
    expect(updated.paymentHistory).toHaveLength(1);
    expect(updated.paymentHistory[0].wasLate).toBe(false);
  });

  test("paid two months late: records 2 missed periods and skips ahead 3", () => {
    // Due July 9, paid September 9. The schedule must jump to October 9
    // (not August 9) and history must record two missed periods.
    const bills = [
      {
        id: "gym",
        title: "Gym",
        amount: 30,
        frequency: "monthly",
        nextDue: "2026-07-09",
        originalDueDate: "2026-07-09",
        paymentHistory: [],
      },
    ];
    const [updated] = markBillAsPaid(bills, "gym", new Date(2026, 8, 9));

    expect(updated.lastPaid).toBe("2026-09-09");
    expect(updated.nextDue).toBe("2026-10-09");
    expect(updated.paymentHistory[0].wasLate).toBe(true);
    expect(updated.paymentHistory[0].periodsMissed).toBe(2);
  });

  test("paying today while nextDue is still ahead advances one cycle, never rewinds", () => {
    // After reconciliation nextDue can sit in the future (Oct 5) while
    // earlier missed dates are still unresolved. Paying today (Sep 10)
    // must move the schedule forward from Oct 5 to Nov 5, not recompute
    // from the anchor and land in the past.
    const bills = [
      {
        id: "water",
        title: "Water",
        amount: 45,
        frequency: "monthly",
        nextDue: "2026-10-05",
        originalDueDate: "2026-08-05",
        unpaidDueDates: ["2026-08-05", "2026-09-05"],
        paymentHistory: [],
      },
    ];
    const [updated] = markBillAsPaid(bills, "water", new Date(2026, 8, 10));

    expect(updated.lastPaid).toBe("2026-09-10");
    expect(updated.nextDue).toBe("2026-11-05");
    expect(updated.paymentHistory[0].wasLate).toBe(false);
    expect(updated.unpaidDueDates).toEqual(["2026-08-05", "2026-09-05"]);
  });

  test("leaves other bills untouched", () => {
    const bills = [
      { id: "a", title: "A", amount: 1, frequency: "monthly", nextDue: "2026-09-10" },
      { id: "b", title: "B", amount: 2, frequency: "monthly", nextDue: "2026-09-11" },
    ];
    const [, b] = markBillAsPaid(bills, "a", new Date(2026, 8, 10));
    expect(b.nextDue).toBe("2026-09-11");
    expect(b.paymentHistory).toBeUndefined();
  });
});

describe("getBillStatus", () => {
  test("overdue when nextDue is in the past and never paid", () => {
    const bill = { nextDue: "2026-01-15", lastPaid: "" };
    expect(getBillStatus(bill, new Date(2026, 8, 10))).toBe("overdue");
  });

  test("paid when lastPaid falls inside the current month", () => {
    const bill = {
      nextDue: "2026-10-10",
      lastPaid: "2026-09-05",
      paymentHistory: [{ wasLate: false }],
    };
    expect(getBillStatus(bill, new Date(2026, 8, 15))).toBe("paid");
  });

  test("a bill due today is due_soon, not overdue, even when checked mid-day", () => {
    // 3:30pm on the due date: the old code compared local midnight (the due
    // date) against 3:30pm (now) and called the bill overdue.
    const bill = { nextDue: "2026-09-10", lastPaid: "" };
    expect(getBillStatus(bill, new Date(2026, 8, 10, 15, 30))).toBe("due_soon");
  });

  // Sweep calendar dates rather than depend on the date the test is run.
  // 2024 includes leap day; 2026 includes the reported October 11 case.
  test.each(["weekly", "biweekly", "monthly", "quarterly", "biannually", "yearly"])(
    "%s due-day payment regression across calendar dates",
    (frequency) => {
      for (const year of [2024, 2026]) {
        for (let due = new Date(year, 0, 1); due.getFullYear() === year; due.setDate(due.getDate() + 1)) {
          const date = toISODate(due);
          const previous = new Date(due);
          previous.setDate(previous.getDate() - 1);
          const anchor = new Date(due);
          const daysPerPeriod = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : null;
          if (daysPerPeriod) anchor.setDate(anchor.getDate() - daysPerPeriod);
          const bill = {
            id: "recurring", amount: 200, frequency,
            nextDue: date, originalDueDate: toISODate(anchor),
            lastPaid: toISODate(previous), unpaidDueDates: [],
            paymentHistory: [{ date: toISODate(previous), amount: 200, wasLate: true }],
          };
          const context = `${frequency} due ${date}`;

          // These statuses control whether the UI enables Pay.
          for (const hour of [0, 13, 23]) {
            const now = new Date(due);
            now.setHours(hour, 30);
            expect(getBillStatus(bill, now), context).toBe("due_soon");
          }
          const tomorrow = new Date(due);
          tomorrow.setDate(tomorrow.getDate() + 1);
          expect(getBillStatus(bill, tomorrow), context).toBe("overdue");

          const [paid] = markBillAsPaid([bill], bill.id, due);
          expect(paid.nextDue, context).toBeTruthy();
          expect(paid.nextDue > date, context).toBe(true);
          if (daysPerPeriod) {
            const expected = new Date(due);
            expected.setDate(expected.getDate() + daysPerPeriod);
            expect(paid.nextDue, context).toBe(toISODate(expected));
          }
          expect(paid.lastPaid, context).toBe(date);
          expect(paid.paymentHistory, context).toHaveLength(2);
          expect(paid.paymentHistory[1], context).toEqual({
            date, amount: 200, wasLate: false, periodsMissed: 0,
            originalDueDate: date,
          });
          expect(getBillStatus(paid, due), context).toBe("paid");
          expect(getBillStatus(paid, parseLocalDate(paid.nextDue)), context).toBe("due_soon");
        }
      }
    },
  );

  test("the due_soon window covers 7 calendar days, then it is pending", () => {
    const thisWeek = { nextDue: "2026-09-17", lastPaid: "" };
    expect(getBillStatus(thisWeek, new Date(2026, 8, 10, 15, 30))).toBe("due_soon");

    const nextWeek = { nextDue: "2026-09-18", lastPaid: "" };
    expect(getBillStatus(nextWeek, new Date(2026, 8, 10, 15, 30))).toBe("pending");
  });
});

describe("buildUpdatedBill", () => {
  // A bill that has been through reconciliation, so it carries the fields
  // the edit form doesn't know about.
  const bill = {
    id: "b1",
    title: "Gym",
    amount: 30,
    frequency: "monthly",
    nextDue: "2026-10-09",
    lastPaid: "2026-09-09",
    originalDueDate: "2026-07-09",
    previousDueDate: "2026-09-09",
    unpaidDueDates: ["2026-09-09"],
    paymentHistory: [{ date: "2026-09-09", amount: 30 }],
  };

  test("edited fields win", () => {
    const updated = buildUpdatedBill(bill, { title: "Climbing", amount: 45 });

    expect(updated.title).toBe("Climbing");
    expect(updated.amount).toBe(45);
    expect(updated.id).toBe("b1");
  });

  test("fields the form doesn't touch carry over untouched", () => {
    const updated = buildUpdatedBill(bill, { title: "Gym" });

    expect(updated.originalDueDate).toBe("2026-07-09");
    expect(updated.previousDueDate).toBe("2026-09-09");
    expect(updated.unpaidDueDates).toEqual(["2026-09-09"]);
    expect(updated.paymentHistory).toEqual(bill.paymentHistory);
  });

  test("UI-only flags never reach storage", () => {
    const updated = buildUpdatedBill(bill, {
      title: "Gym",
      isPaid: true,
      autoCalculateDue: true,
    });

    expect(updated).not.toHaveProperty("isPaid");
    expect(updated).not.toHaveProperty("autoCalculateDue");
  });
});
