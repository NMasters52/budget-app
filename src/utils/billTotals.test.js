// Tests for calculateBillsTotal, the sum behind the Bills Preview header.
//
// The bug it locks down: an amount saved as a string (e.g. "120.00" from an
// edit form input) used to turn the reduce into string concatenation, so the
// total was a string and .toFixed(2) crashed, white-screening /list.

import { describe, test, expect } from "vitest";
import { calculateBillsTotal } from "./dateUtils";

describe("calculateBillsTotal", () => {
  test("adds numeric amounts", () => {
    const bills = [{ amount: 100 }, { amount: 50.5 }];

    expect(calculateBillsTotal(bills)).toBe(150.5);
  });

  test("treats string amounts as numbers instead of concatenating", () => {
    // 0 + "120.00" would be "0120.00" without the coercion.
    const bills = [{ amount: "120.00" }, { amount: 30 }];

    const total = calculateBillsTotal(bills);

    expect(total).toBe(150);
    expect(typeof total).toBe("number");
  });

  test("result supports .toFixed(2) — the call that crashed /list", () => {
    const bills = [{ amount: "120.00" }, { amount: 30.01 }];

    expect(calculateBillsTotal(bills).toFixed(2)).toBe("150.01");
  });

  test("returns 0 for an empty list", () => {
    expect(calculateBillsTotal([])).toBe(0);
  });
});
