// Tests for the debt domain: dashboard math, payment/balance reducers,
// target invariants, sorting, filtering, and load-time normalization.
//
// The `household` fixture is the eight-debt example from the debt feature
// spec, so the totals tests double as a spec-conformance check: the numbers
// asserted here (86,185 goal, 3,898 minimums, 3.22% after paying off
// Lowe's) are the same ones printed in that document.

import { describe, test, expect } from "vitest";

import {
  DEBT_OWNERS,
  DEBT_TYPES,
  DEBT_FILTER_OPTIONS,
  roundToCents,
  isPaidOff,
  createDebt,
  validateDebtInput,
  validatePaymentInput,
  validateBalanceInput,
  calculateDebtProgress,
  calculateDebtTotals,
  formatCurrency,
  suggestedPayment,
  dueDayInMonth,
  formatDayOrdinal,
  recordPayment,
  updateBalance,
  setCurrentTarget,
  clearCurrentTarget,
  updateDebt,
  sortDebts,
  filterDebts,
  normalizeDebt,
  normalizeDebts,
  validateAllDebts,
} from "./debtUtils";

const makeDebt = (overrides = {}) => ({
  id: "debt-1",
  name: "Test Debt",
  owner: "Nick",
  type: "credit-card",
  startingBalance: 1000,
  currentBalance: 1000,
  minimumPayment: 50,
  apr: null,
  includeInPayoffGoal: true,
  isCurrentTarget: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  paymentHistory: [],
  ...overrides,
});

// The eight debts from the spec, at their starting balances.
const household = () => [
  makeDebt({
    id: "mortgage",
    name: "House Mortgage",
    owner: "Household",
    type: "mortgage",
    startingBalance: 290000,
    currentBalance: 290000,
    minimumPayment: 2249,
    includeInPayoffGoal: false,
  }),
  makeDebt({
    id: "allison-auto",
    name: "Auto Loan - Allison",
    owner: "Allison",
    type: "auto-loan",
    startingBalance: 22384,
    currentBalance: 22384,
    minimumPayment: 398,
  }),
  makeDebt({
    id: "vystar",
    name: "VyStar Credit Card",
    owner: "Allison",
    type: "credit-card",
    startingBalance: 2021,
    currentBalance: 2021,
    minimumPayment: 40,
  }),
  makeDebt({
    id: "amazon",
    name: "Amazon Credit Card",
    owner: "Allison",
    type: "credit-card",
    startingBalance: 4945,
    currentBalance: 4945,
    minimumPayment: 155,
  }),
  makeDebt({
    id: "student",
    name: "Student Loans",
    owner: "Allison",
    type: "student-loan",
    startingBalance: 29521,
    currentBalance: 29521,
    minimumPayment: 350,
  }),
  makeDebt({
    id: "nick-auto",
    name: "Auto Loan - Nick",
    owner: "Nick",
    type: "auto-loan",
    startingBalance: 17646,
    currentBalance: 17646,
    minimumPayment: 374,
  }),
  makeDebt({
    id: "lowes",
    name: "Lowes Synchrony",
    owner: "Nick",
    type: "credit-card",
    startingBalance: 2777,
    currentBalance: 2777,
    minimumPayment: 150,
  }),
  makeDebt({
    id: "boa",
    name: "Bank of America",
    owner: "Nick",
    type: "credit-card",
    startingBalance: 6891,
    currentBalance: 6891,
    minimumPayment: 182,
  }),
];

describe("roundToCents", () => {
  test("removes floating point drift", () => {
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
  });

  test("keeps normal values unchanged", () => {
    expect(roundToCents(2777)).toBe(2777);
    expect(roundToCents("19.999")).toBe(20);
  });
});

describe("formatCurrency", () => {
  test("groups thousands like the spec's examples", () => {
    expect(formatCurrency(2777)).toBe("$2,777.00");
    expect(formatCurrency(86185)).toBe("$86,185.00");
    expect(formatCurrency(0)).toBe("$0.00");
  });

  test("prefixes negative progress", () => {
    expect(formatCurrency(-200)).toBe("-$200.00");
  });
});

describe("isPaidOff", () => {
  test("true at zero, false at any positive balance", () => {
    expect(isPaidOff(makeDebt({ currentBalance: 0 }))).toBe(true);
    expect(isPaidOff(makeDebt({ currentBalance: 0.01 }))).toBe(false);
  });
});

describe("createDebt", () => {
  test("builds a full record from form data", () => {
    const debt = createDebt({
      name: "  Lowes  ",
      owner: "Nick",
      type: "credit-card",
      startingBalance: "2777",
      currentBalance: "2700",
      minimumPayment: "150",
      apr: "",
      includeInPayoffGoal: true,
    });

    expect(debt.name).toBe("Lowes");
    expect(debt.id).toBeTruthy();
    expect(debt.startingBalance).toBe(2777);
    expect(debt.currentBalance).toBe(2700);
    expect(debt.apr).toBeNull();
    expect(debt.isCurrentTarget).toBe(false);
    expect(debt.paymentHistory).toEqual([]);
    expect(debt.createdAt).toBeTruthy();
  });
});

describe("validateDebtInput", () => {
  test("accepts a valid form", () => {
    const result = validateDebtInput({
      name: "Lowes",
      owner: "Nick",
      type: "credit-card",
      startingBalance: "2777",
      currentBalance: "2777",
      minimumPayment: "150",
      apr: "27.99",
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("collects all problems, not just the first", () => {
    const result = validateDebtInput({
      name: "   ",
      owner: "Dog",
      type: "spaceship",
      startingBalance: "0",
      currentBalance: "-5",
      minimumPayment: "",
      apr: "200",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(7);
  });

  test("empty numeric fields are required, not coerced to zero", () => {
    const result = validateDebtInput({
      name: "X",
      owner: "Nick",
      type: "other",
      startingBalance: "",
      currentBalance: "",
      minimumPayment: "",
      apr: "",
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error === "Current balance is required.")).toBe(true);
    expect(result.errors.some((error) => error === "Minimum payment is required.")).toBe(true);
  });

  test("APR is optional", () => {
    const result = validateDebtInput({
      name: "Lowes",
      owner: "Nick",
      type: "credit-card",
      startingBalance: "2777",
      currentBalance: "2777",
      minimumPayment: "150",
      apr: "",
    });
    expect(result.isValid).toBe(true);
  });
});

describe("validatePaymentInput", () => {
  const debt = makeDebt({ currentBalance: 100 });

  test("rejects zero, negative, and non-numeric amounts", () => {
    expect(validatePaymentInput(debt, 0).isValid).toBe(false);
    expect(validatePaymentInput(debt, -10).isValid).toBe(false);
    expect(validatePaymentInput(debt, "abc").isValid).toBe(false);
  });

  test("rejects a payment larger than the balance", () => {
    const result = validatePaymentInput(debt, 150);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/exceed/i);
  });

  test("accepts a payment up to the exact balance", () => {
    expect(validatePaymentInput(debt, 100).isValid).toBe(true);
    expect(validatePaymentInput(debt, "99.99").isValid).toBe(true);
  });
});

describe("validateBalanceInput", () => {
  test("rejects negative and non-numeric balances", () => {
    expect(validateBalanceInput(makeDebt(), -1).isValid).toBe(false);
    expect(validateBalanceInput(makeDebt(), "").isValid).toBe(false);
  });

  test("accepts zero and positive balances", () => {
    expect(validateBalanceInput(makeDebt(), 0).isValid).toBe(true);
    expect(validateBalanceInput(makeDebt(), 1940).isValid).toBe(true);
  });
});

describe("suggestedPayment", () => {
  test("is the monthly minimum in the normal case", () => {
    expect(suggestedPayment(makeDebt({ currentBalance: 2021, minimumPayment: 40 }))).toBe(40);
  });

  test("clamps to the remaining balance on a final payment", () => {
    expect(suggestedPayment(makeDebt({ currentBalance: 23, minimumPayment: 150 }))).toBe(23);
  });

  test("zero for a paid-off debt", () => {
    expect(suggestedPayment(makeDebt({ currentBalance: 0, minimumPayment: 150 }))).toBe(0);
  });
});

describe("minimumPaymentDueDay validation", () => {
  const base = { name: "X", owner: "Nick", type: "other", startingBalance: "100", currentBalance: "100", minimumPayment: "10", apr: "" };

  test("accepts a valid day, empty, and missing", () => {
    expect(validateDebtInput({ ...base, minimumPaymentDueDay: "22" }).isValid).toBe(true);
    expect(validateDebtInput({ ...base, minimumPaymentDueDay: "" }).isValid).toBe(true);
    expect(validateDebtInput({ ...base, minimumPaymentDueDay: null }).isValid).toBe(true);
    expect(validateDebtInput(base).isValid).toBe(true);
  });

  test("rejects days outside 1-31 and non-integers", () => {
    expect(validateDebtInput({ ...base, minimumPaymentDueDay: "0" }).isValid).toBe(false);
    expect(validateDebtInput({ ...base, minimumPaymentDueDay: "32" }).isValid).toBe(false);
    expect(validateDebtInput({ ...base, minimumPaymentDueDay: "7.5" }).isValid).toBe(false);
    expect(validateDebtInput({ ...base, minimumPaymentDueDay: "abc" }).isValid).toBe(false);
  });

  test("createDebt stores a number or null", () => {
    expect(createDebt({ name: "A", owner: "Nick", type: "other", startingBalance: 1, currentBalance: 1, minimumPayment: 1, minimumPaymentDueDay: "22" }).minimumPaymentDueDay).toBe(22);
    expect(createDebt({ name: "A", owner: "Nick", type: "other", startingBalance: 1, currentBalance: 1, minimumPayment: 1, minimumPaymentDueDay: "" }).minimumPaymentDueDay).toBeNull();
  });
});

describe("dueDayInMonth", () => {
  test("passes a normal day through", () => {
    const debt = makeDebt({ minimumPaymentDueDay: 15 });
    expect(dueDayInMonth(debt, new Date(2026, 2, 10))).toBe(15);
  });

  test("clamps day 31 to February's length", () => {
    const debt = makeDebt({ minimumPaymentDueDay: 31 });
    expect(dueDayInMonth(debt, new Date(2026, 1, 10))).toBe(28);
    expect(dueDayInMonth(debt, new Date(2026, 2, 10))).toBe(31);
  });

  test("null when the debt has no due day", () => {
    expect(dueDayInMonth(makeDebt({ minimumPaymentDueDay: null }), new Date())).toBeNull();
  });
});

describe("formatDayOrdinal", () => {
  test("special-cases 11th-13th, then 1st/2nd/3rd", () => {
    expect(formatDayOrdinal(1)).toBe("1st");
    expect(formatDayOrdinal(2)).toBe("2nd");
    expect(formatDayOrdinal(3)).toBe("3rd");
    expect(formatDayOrdinal(4)).toBe("4th");
    expect(formatDayOrdinal(11)).toBe("11th");
    expect(formatDayOrdinal(12)).toBe("12th");
    expect(formatDayOrdinal(13)).toBe("13th");
    expect(formatDayOrdinal(21)).toBe("21st");
    expect(formatDayOrdinal(22)).toBe("22nd");
    expect(formatDayOrdinal(30)).toBe("30th");
    expect(formatDayOrdinal(31)).toBe("31st");
  });
});

describe("normalizeDebt due day on load", () => {
  test("old records without the field load as null", () => {
    expect(normalizeDebt({ id: "x", name: "N", owner: "Nick", type: "other" }).minimumPaymentDueDay).toBeNull();
  });

  test("garbage days load as null", () => {
    expect(normalizeDebt({ id: "x", name: "N", owner: "Nick", type: "other", minimumPaymentDueDay: "45" }).minimumPaymentDueDay).toBeNull();
    expect(normalizeDebt({ id: "x", name: "N", owner: "Nick", type: "other", minimumPaymentDueDay: 22 }).minimumPaymentDueDay).toBe(22);
  });

  test("migrates the old field name", () => {
    expect(normalizeDebt({ id: "x", name: "N", owner: "Nick", type: "other", dueDayOfMonth: 22 }).minimumPaymentDueDay).toBe(22);
  });
});

describe("calculateDebtProgress", () => {
  test("percentage of the starting balance paid down", () => {
    expect(calculateDebtProgress(makeDebt({ startingBalance: 2021, currentBalance: 1921 }))).toBeCloseTo(4.95, 2);
  });

  test("negative when the balance grew past the start", () => {
    expect(calculateDebtProgress(makeDebt({ startingBalance: 1000, currentBalance: 1200 }))).toBe(-20);
  });

  test("zero when starting balance is zero", () => {
    expect(calculateDebtProgress(makeDebt({ startingBalance: 0, currentBalance: 0 }))).toBe(0);
  });
});

describe("calculateDebtTotals with the spec household", () => {
  test("matches the spec's Initial Totals exactly", () => {
    const totals = calculateDebtTotals(household());

    expect(totals.totalDebt).toBe(376185);
    expect(totals.payoffDebt).toBe(86185);
    expect(totals.startingPayoffTotal).toBe(86185);
    expect(totals.amountEliminated).toBe(0);
    expect(totals.payoffPercentage).toBe(0);
    expect(totals.totalMonthlyMinimumPayments).toBe(3898);
    expect(totals.totalMonthlyMinimumPaymentsLeft).toBe(1649);
    expect(totals.monthlyMinimumsFreed).toBe(0);
    expect(totals.debtsPaidOff).toBe(0);
    expect(totals.payoffDebtCount).toBe(7);
  });

  test("paying off Lowe's matches the spec's worked example", () => {
    const paidLowes = updateBalance(household(), "lowes", 0);
    const totals = calculateDebtTotals(paidLowes);

    // Spec: goal stays 86,185, payoff debt drops to 83,408,
    // eliminated 2,777, progress 3.22%, Lowe's $150/mo freed.
    expect(totals.startingPayoffTotal).toBe(86185);
    expect(totals.payoffDebt).toBe(83408);
    expect(totals.amountEliminated).toBe(2777);
    expect(totals.payoffPercentage).toBeCloseTo(3.22, 2);
    expect(totals.monthlyMinimumsFreed).toBe(150);
    expect(totals.debtsPaidOff).toBe(1);
    expect(totals.totalMonthlyMinimumPayments).toBe(3898 - 150);
    expect(totals.totalMonthlyMinimumPaymentsLeft).toBe(1499);
  });

  test("paid-off debts keep contributing to the starting goal", () => {
    const debts = [makeDebt({ id: "a", startingBalance: 1000, currentBalance: 0 })];
    const totals = calculateDebtTotals(debts);

    expect(totals.startingPayoffTotal).toBe(1000);
    expect(totals.payoffDebt).toBe(0);
    expect(totals.amountEliminated).toBe(1000);
    expect(totals.payoffPercentage).toBe(100);
  });

  test("mortgage is tracked in total debt but not the payoff goal", () => {
    const debts = [
      makeDebt({ id: "house", type: "mortgage", includeInPayoffGoal: false, startingBalance: 10000, currentBalance: 9500, minimumPayment: 1000 }),
      makeDebt({ id: "card", startingBalance: 500, currentBalance: 400, minimumPayment: 25 }),
    ];
    const totals = calculateDebtTotals(debts);

    expect(totals.totalDebt).toBe(9900);
    expect(totals.payoffDebt).toBe(400);
    expect(totals.totalMonthlyMinimumPayments).toBe(1025);
    expect(totals.totalMonthlyMinimumPaymentsLeft).toBe(25);
  });

  test("negative progress is valid when balances grow", () => {
    const debts = [makeDebt({ startingBalance: 1000, currentBalance: 1200 })];
    const totals = calculateDebtTotals(debts);

    expect(totals.amountEliminated).toBe(-200);
    expect(totals.payoffPercentage).toBeCloseTo(-20, 5);
  });

  test("empty list produces zeros, not NaN", () => {
    const totals = calculateDebtTotals([]);

    expect(totals.payoffPercentage).toBe(0);
    expect(totals.totalDebt).toBe(0);
  });
});

describe("recordPayment", () => {
  test("reduces the balance and records the payment", () => {
    const debts = recordPayment(household(), "vystar", 100, "2026-09-11");
    const vystar = debts.find((debt) => debt.id === "vystar");

    expect(vystar.currentBalance).toBe(1921);
    expect(vystar.paymentHistory).toHaveLength(1);
    expect(vystar.paymentHistory[0].amount).toBe(100);
    expect(vystar.paymentHistory[0].date).toBe("2026-09-11");
    expect(vystar.paymentHistory[0].id).toBeTruthy();
  });

  test("leaves other debts untouched", () => {
    const debts = recordPayment(household(), "vystar", 100, "2026-09-11");
    const amazon = debts.find((debt) => debt.id === "amazon");

    expect(amazon.currentBalance).toBe(4945);
    expect(amazon.paymentHistory).toHaveLength(0);
  });

  test("clears the current target when the debt reaches zero", () => {
    const targeted = setCurrentTarget(household(), "lowes");
    const debts = recordPayment(targeted, "lowes", 2777, "2026-09-11");
    const lowes = debts.find((debt) => debt.id === "lowes");

    expect(lowes.currentBalance).toBe(0);
    expect(isPaidOff(lowes)).toBe(true);
    expect(lowes.isCurrentTarget).toBe(false);
  });

  test("keeps the target when a balance remains", () => {
    const targeted = setCurrentTarget(household(), "lowes");
    const debts = recordPayment(targeted, "lowes", 100, "2026-09-11");
    const lowes = debts.find((debt) => debt.id === "lowes");

    expect(lowes.currentBalance).toBe(2677);
    expect(lowes.isCurrentTarget).toBe(true);
  });

  test("survives cent-scale floating point", () => {
    const debts = [makeDebt({ id: "tiny", currentBalance: 0.3 })];
    const afterTwo = recordPayment(recordPayment(debts, "tiny", 0.1, "2026-09-11"), "tiny", 0.1, "2026-09-11");
    const cleared = recordPayment(afterTwo, "tiny", 0.1, "2026-09-11");

    expect(cleared[0].currentBalance).toBe(0);
  });
});

describe("updateBalance", () => {
  test("reconciles the balance without touching payment history", () => {
    const paid = recordPayment(household(), "vystar", 100, "2026-09-11");
    const reconciled = updateBalance(paid, "vystar", 1940);
    const vystar = reconciled.find((debt) => debt.id === "vystar");

    expect(vystar.currentBalance).toBe(1940);
    expect(vystar.paymentHistory).toHaveLength(1);
  });

  test("clears the target when reconciled to zero", () => {
    const targeted = setCurrentTarget(household(), "lowes");
    const debts = updateBalance(targeted, "lowes", 0);

    expect(debts.find((debt) => debt.id === "lowes").isCurrentTarget).toBe(false);
  });
});

describe("setCurrentTarget", () => {
  test("marks exactly one debt as target", () => {
    const debts = setCurrentTarget(household(), "lowes");

    expect(debts.filter((debt) => debt.isCurrentTarget).map((debt) => debt.id)).toEqual(["lowes"]);
  });

  test("moves the target when called again", () => {
    const debts = setCurrentTarget(setCurrentTarget(household(), "lowes"), "boa");

    expect(debts.find((debt) => debt.id === "lowes").isCurrentTarget).toBe(false);
    expect(debts.find((debt) => debt.id === "boa").isCurrentTarget).toBe(true);
  });

  test("rejects a debt outside the payoff goal", () => {
    const debts = setCurrentTarget(household(), "mortgage");

    expect(debts.find((debt) => debt.id === "mortgage").isCurrentTarget).toBe(false);
    expect(debts.filter((debt) => debt.isCurrentTarget)).toHaveLength(0);
  });

  test("clearCurrentTarget removes the marking", () => {
    const debts = clearCurrentTarget(setCurrentTarget(household(), "lowes"));

    expect(debts.filter((debt) => debt.isCurrentTarget)).toHaveLength(0);
    expect(debts.find((debt) => debt.id === "lowes").currentBalance).toBe(2777);
  });

  test("rejects a paid-off debt", () => {
    const debts = setCurrentTarget(updateBalance(household(), "lowes", 0), "lowes");

    expect(debts.filter((debt) => debt.isCurrentTarget)).toHaveLength(0);
  });
});

describe("updateDebt", () => {
  test("applies edits and rounds numeric fields", () => {
    const debts = updateDebt(household(), "lowes", {
      minimumPayment: "175.005",
      startingBalance: 3000,
    });
    const lowes = debts.find((debt) => debt.id === "lowes");

    expect(lowes.minimumPayment).toBe(175.01);
    expect(lowes.startingBalance).toBe(3000);
  });

  test("clears the target when the debt leaves the payoff goal", () => {
    const targeted = setCurrentTarget(household(), "lowes");
    const debts = updateDebt(targeted, "lowes", { includeInPayoffGoal: false });
    const lowes = debts.find((debt) => debt.id === "lowes");

    expect(lowes.includeInPayoffGoal).toBe(false);
    expect(lowes.isCurrentTarget).toBe(false);
  });

  test("leaves other debts untouched", () => {
    const debts = updateDebt(household(), "lowes", { minimumPayment: 175 });
    const boa = debts.find((debt) => debt.id === "boa");

    expect(boa.minimumPayment).toBe(182);
  });
});

describe("sortDebts", () => {
  test("target first, then active payoff, then other active, paid off last", () => {
    const debts = [
      makeDebt({ id: "paid", name: "Paid Off", currentBalance: 0 }),
      makeDebt({ id: "other", name: "Other Active", includeInPayoffGoal: false }),
      makeDebt({ id: "payoff-big", name: "Big Payoff", currentBalance: 5000 }),
      makeDebt({ id: "target", name: "Target", isCurrentTarget: true }),
      makeDebt({ id: "payoff-small", name: "Small Payoff", currentBalance: 500 }),
    ];
    const order = sortDebts(debts).map((debt) => debt.id);

    expect(order).toEqual(["target", "payoff-small", "payoff-big", "other", "paid"]);
  });

  test("does not mutate the input list", () => {
    const debts = household();
    sortDebts(debts);

    expect(debts[0].id).toBe("mortgage");
  });
});

describe("filterDebts", () => {
  test("all returns everything", () => {
    expect(filterDebts(household(), "all")).toHaveLength(8);
    expect(filterDebts(household(), undefined)).toHaveLength(8);
  });

  test("filters by owner", () => {
    const debts = filterDebts(household(), "Allison");
    expect(debts.map((debt) => debt.id)).toEqual(["allison-auto", "vystar", "amazon", "student"]);
  });

  test("filters by type", () => {
    const debts = filterDebts(household(), "mortgage");
    expect(debts.map((debt) => debt.id)).toEqual(["mortgage"]);
  });

  test("payoff view excludes the mortgage", () => {
    expect(filterDebts(household(), "payoff")).toHaveLength(7);
  });

  test("paid-off view shows only zero-balance debts", () => {
    const debts = filterDebts(updateBalance(household(), "lowes", 0), "paid-off");
    expect(debts.map((debt) => debt.id)).toEqual(["lowes"]);
  });
});

describe("normalizeDebt on load", () => {
  test("fills defaults for a partial record", () => {
    const debt = normalizeDebt({ id: "x", name: "Half Stored", owner: "Nick", type: "other" });

    expect(debt.currentBalance).toBe(0);
    expect(debt.includeInPayoffGoal).toBe(false);
    expect(debt.paymentHistory).toEqual([]);
    expect(debt.isCurrentTarget).toBe(false);
  });

  test("drops garbage entries and non-arrays", () => {
    expect(normalizeDebt(null)).toBeNull();
    expect(normalizeDebt("nope")).toBeNull();
    expect(normalizeDebts("garbage")).toEqual([]);
    expect(normalizeDebts([null, makeDebt()])).toHaveLength(1);
  });

  test("coerces numeric strings from storage", () => {
    const debt = normalizeDebt({ id: "x", name: "N", owner: "Nick", type: "other", startingBalance: "2021", currentBalance: "2021", minimumPayment: "40" });

    expect(debt.startingBalance).toBe(2021);
  });
});

describe("validateAllDebts on load", () => {
  test("reports counts for warn-only logging", () => {
    const good = normalizeDebt(makeDebt({ id: "good", name: "Good" }));
    const bad = { id: "bad" };
    const result = validateAllDebts([good, bad]);

    expect(result.allValid).toBe(false);
    expect(result.invalidCount).toBe(1);
    expect(result.results[1].errors).toContain("missing name");
  });

  test("clean list passes", () => {
    expect(validateAllDebts(normalizeDebts(household())).allValid).toBe(true);
  });
});

describe("constants", () => {
  test("owners and types cover the spec's values", () => {
    expect(DEBT_OWNERS).toEqual(["Nick", "Allison", "Household"]);
    expect(DEBT_TYPES).toContain("credit-card");
    expect(DEBT_TYPES).toContain("mortgage");
    expect(DEBT_FILTER_OPTIONS).toHaveLength(10);
  });
});
