import { v4 as uuidv4 } from "uuid";

// Debts are a separate domain from bills: debts track balances, payoff
// progress, and payments; bills track recurring monthly expenses. The two
// share no state. All dashboard numbers are derived from the debt list at
// render time and are never saved independently.

export const DEBT_OWNERS = ["Nick", "Allison", "Household"];

export const DEBT_TYPES = [
  "credit-card",
  "auto-loan",
  "student-loan",
  "mortgage",
  "other",
];

export const DEBT_TYPE_LABELS = {
  "credit-card": "Credit Card",
  "auto-loan": "Auto Loan",
  "student-loan": "Student Loan",
  mortgage: "Mortgage",
  other: "Other",
};

// Filter keys accepted by filterDebts: "all", an owner, a debt type, or
// one of the payoff views.
export const DEBT_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "Nick", label: "Nick" },
  { value: "Allison", label: "Allison" },
  { value: "Household", label: "Household" },
  { value: "credit-card", label: "Credit Cards" },
  { value: "auto-loan", label: "Auto Loans" },
  { value: "student-loan", label: "Student Loans" },
  { value: "mortgage", label: "Mortgage" },
  { value: "payoff", label: "Included in Payoff Goal" },
  { value: "paid-off", label: "Paid Off" },
];

// Optional minimum-payment due day (1-31). "" and null mean none. Returns
// null for anything that is not a valid day; validation reports bad input
// before this is ever needed.
function normalizeDueDay(value) {
  if (value === "" || value == null) {
    return null;
  }
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}

// Dollar amounts are plain numbers. Round to cents after every write so
// floating point drift (0.1 + 0.2 problems) can never leak into balance
// comparisons.
export function roundToCents(value) {
  return Math.round(Number(value) * 100) / 100;
}

// A debt is paid off at zero or below. Because balances are rounded on
// write, "<= 0" only ever matches an exact $0.00 in practice.
export function isPaidOff(debt) {
  return debt.currentBalance <= 0;
}

// "$2,777.00" style display strings, matching the spec's examples.
// Negative amounts read "-$200.00", not "$-200.00".
export function formatCurrency(value) {
  const cents = roundToCents(value);
  const formatted = Math.abs(cents).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function createDebt(formData) {
  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    name: formData.name.trim(),
    owner: formData.owner,
    type: formData.type,
    startingBalance: roundToCents(formData.startingBalance),
    currentBalance: roundToCents(formData.currentBalance),
    minimumPayment: roundToCents(formData.minimumPayment),
    minimumPaymentDueDay: normalizeDueDay(formData.minimumPaymentDueDay),
    apr: formData.apr === "" || formData.apr == null ? null : roundToCents(formData.apr),
    includeInPayoffGoal: Boolean(formData.includeInPayoffGoal),
    isCurrentTarget: false,
    createdAt: now,
    updatedAt: now,
    paymentHistory: [],
  };
}

export function validateDebtInput(input) {
  const errors = [];

  if (!input.name || !input.name.trim()) {
    errors.push("Name is required.");
  }
  if (!DEBT_OWNERS.includes(input.owner)) {
    errors.push("Owner must be Nick, Allison, or Household.");
  }
  if (!DEBT_TYPES.includes(input.type)) {
    errors.push("Please choose a debt type.");
  }

  const checkAmount = (label, value, { allowZero = false } = {}) => {
    // Number("") is 0, so an empty field must be caught before conversion.
    if (value === "" || value == null) {
      errors.push(`${label} is required.`);
      return;
    }
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount <= 0)) {
      errors.push(
        allowZero
          ? `${label} cannot be negative.`
          : `${label} must be greater than 0.`,
      );
    }
  };

  checkAmount("Starting balance", input.startingBalance);
  checkAmount("Current balance", input.currentBalance, { allowZero: true });
  checkAmount("Minimum payment", input.minimumPayment);

  if (
    input.minimumPaymentDueDay != null &&
    input.minimumPaymentDueDay !== ""
  ) {
    const day = Number(input.minimumPaymentDueDay);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      errors.push("Due day must be a whole number from 1 to 31.");
    }
  }

  if (input.apr !== "" && input.apr != null) {
    const apr = Number(input.apr);
    if (!Number.isFinite(apr) || apr < 0 || apr > 100) {
      errors.push("APR must be between 0 and 100.");
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validatePaymentInput(debt, amount) {
  const errors = [];
  const payment = Number(amount);

  if (!Number.isFinite(payment) || payment <= 0) {
    errors.push("Payment must be greater than 0.");
  } else if (payment > debt.currentBalance) {
    errors.push("Payment cannot exceed the current balance.");
  }

  return { isValid: errors.length === 0, errors };
}

// The amount the payment modal opens with: the monthly minimum, clamped to
// the remaining balance for a debt's final payment. Still fully editable.
export function suggestedPayment(debt) {
  return roundToCents(Math.min(debt.minimumPayment, debt.currentBalance));
}

export function validateBalanceInput(debt, balance) {
  const errors = [];

  // Number("") is 0, so an empty field must be rejected before conversion.
  if (balance === "" || balance == null) {
    return { isValid: false, errors: ["Balance cannot be empty."] };
  }

  const value = Number(balance);

  if (!Number.isFinite(value) || value < 0) {
    errors.push("Balance cannot be negative.");
  }

  return { isValid: errors.length === 0, errors };
}

// Display helpers for the minimum-payment due day. The entered day clamped to the real
// length of the month (a 31st becomes Feb 28). Display-only: debts never
// schedule or remind, the lender's statement stays the source of truth.
export function dueDayInMonth(debt, today) {
  const dueDay = debt.minimumPaymentDueDay ?? debt.dueDayOfMonth;

  if (dueDay == null) {
    return null;
  }
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  return Math.min(dueDay, daysInMonth);
}

export function formatDayOrdinal(day) {
  if (day % 100 >= 11 && day % 100 <= 13) {
    return `${day}th`;
  }
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th";
  return `${day}${suffix}`;
}

// Individual progress toward paid off. Negative is valid: it means the
// balance has grown past where tracking began.
export function calculateDebtProgress(debt) {
  if (debt.startingBalance <= 0) {
    return 0;
  }
  return ((debt.startingBalance - debt.currentBalance) / debt.startingBalance) * 100;
}

// All dashboard metrics, derived from the debt list on every call. Paid-off
// debts keep contributing to startingPayoffTotal so the original goal never
// shrinks.
export function calculateDebtTotals(debts) {
  const payoffDebts = debts.filter((debt) => debt.includeInPayoffGoal);
  const activeDebts = debts.filter((debt) => debt.currentBalance > 0);
  const activePayoffDebts = payoffDebts.filter((debt) => debt.currentBalance > 0);

  const totalDebt = roundToCents(
    activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0),
  );
  const payoffDebt = roundToCents(
    activePayoffDebts.reduce((sum, debt) => sum + debt.currentBalance, 0),
  );
  const startingPayoffTotal = roundToCents(
    payoffDebts.reduce((sum, debt) => sum + debt.startingBalance, 0),
  );
  const amountEliminated = roundToCents(startingPayoffTotal - payoffDebt);
  const payoffPercentage =
    startingPayoffTotal > 0 ? (amountEliminated / startingPayoffTotal) * 100 : 0;
  const totalMonthlyMinimumPayments = roundToCents(
    activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
  );
  const totalMonthlyMinimumPaymentsLeft = roundToCents(
    activePayoffDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0),
  );
  const monthlyMinimumsFreed = roundToCents(
    payoffDebts
      .filter((debt) => debt.currentBalance <= 0)
      .reduce((sum, debt) => sum + debt.minimumPayment, 0),
  );
  const debtsPaidOff = payoffDebts.filter((debt) => debt.currentBalance <= 0).length;
  const payoffDebtCount = payoffDebts.length;

  return {
    totalDebt,
    payoffDebt,
    startingPayoffTotal,
    amountEliminated,
    payoffPercentage,
    totalMonthlyMinimumPayments,
    totalMonthlyMinimumPaymentsLeft,
    monthlyMinimumsFreed,
    debtsPaidOff,
    payoffDebtCount,
  };
}

// Reduces the tracked balance immediately, records the payment, and clears
// the current target when the debt reaches zero. Assumes the amount already
// passed validatePaymentInput; clamps at zero as a backstop.
export function recordPayment(debts, debtId, amount, date) {
  const payment = roundToCents(amount);

  return debts.map((debt) => {
    if (debt.id !== debtId) {
      return debt;
    }

    const currentBalance = roundToCents(Math.max(0, debt.currentBalance - payment));

    return {
      ...debt,
      currentBalance,
      isCurrentTarget: currentBalance <= 0 ? false : debt.isCurrentTarget,
      updatedAt: new Date().toISOString(),
      paymentHistory: [
        ...debt.paymentHistory,
        { id: uuidv4(), amount: payment, date },
      ],
    };
  });
}

// Manual reconciliation with the lender's real balance (interest, fees, new
// spending). Sets the balance only; payment history is never touched.
export function updateBalance(debts, debtId, newBalance) {
  const currentBalance = roundToCents(Math.max(0, Number(newBalance)));

  return debts.map((debt) => {
    if (debt.id !== debtId) {
      return debt;
    }

    return {
      ...debt,
      currentBalance,
      isCurrentTarget: currentBalance <= 0 ? false : debt.isCurrentTarget,
      updatedAt: new Date().toISOString(),
    };
  });
}

// Only one debt may be the target at a time, and only payoff-goal debts
// with a remaining balance qualify. Returns the list unchanged when the
// request is invalid.
export function setCurrentTarget(debts, debtId) {
  const target = debts.find((debt) => debt.id === debtId);

  if (!target || !target.includeInPayoffGoal || target.currentBalance <= 0) {
    return debts;
  }

  return debts.map((debt) => ({
    ...debt,
    isCurrentTarget: debt.id === debtId,
  }));
}

// Removes the target marking without appointing a replacement.
export function clearCurrentTarget(debts) {
  return debts.map((debt) =>
    debt.isCurrentTarget ? { ...debt, isCurrentTarget: false } : debt,
  );
}

// Applies arbitrary edits from the debt form while enforcing the target
// invariants: a debt outside the payoff goal, or at a zero balance, cannot
// hold the target.
export function updateDebt(debts, debtId, updates) {
  const numericFields = ["startingBalance", "currentBalance", "minimumPayment"];

  return debts.map((debt) => {
    if (debt.id !== debtId) {
      return debt;
    }

    const next = { ...debt, ...updates, updatedAt: new Date().toISOString() };

    numericFields.forEach((field) => {
      if (updates[field] != null) {
        next[field] = roundToCents(updates[field]);
      }
    });

    if (!next.includeInPayoffGoal || next.currentBalance <= 0) {
      next.isCurrentTarget = false;
    }

    return next;
  });
}

// Display order: current target first, then active payoff debts (smallest
// balance first), then other active debts, then paid off.
export function sortDebts(debts) {
  const rank = (debt) => {
    if (debt.isCurrentTarget) return 0;
    if (debt.includeInPayoffGoal && debt.currentBalance > 0) return 1;
    if (debt.currentBalance > 0) return 2;
    return 3;
  };

  return [...debts].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      a.currentBalance - b.currentBalance ||
      a.name.localeCompare(b.name),
  );
}

export function filterDebts(debts, filter) {
  if (!filter || filter === "all") {
    return debts;
  }
  if (DEBT_OWNERS.includes(filter)) {
    return debts.filter((debt) => debt.owner === filter);
  }
  if (DEBT_TYPES.includes(filter)) {
    return debts.filter((debt) => debt.type === filter);
  }
  if (filter === "payoff") {
    return debts.filter((debt) => debt.includeInPayoffGoal);
  }
  if (filter === "paid-off") {
    return debts.filter((debt) => debt.currentBalance <= 0);
  }
  return debts;
}

// Load-time safety net for records coming out of localStorage. Fills
// defaults for anything missing instead of trusting stored shapes.
export function normalizeDebt(debt) {
  if (!debt || typeof debt !== "object") {
    return null;
  }

  return {
    id: debt.id ?? uuidv4(),
    name: debt.name ?? "",
    owner: DEBT_OWNERS.includes(debt.owner) ? debt.owner : "Household",
    type: DEBT_TYPES.includes(debt.type) ? debt.type : "other",
    startingBalance: roundToCents(debt.startingBalance) || 0,
    currentBalance: roundToCents(debt.currentBalance) || 0,
    minimumPayment: roundToCents(debt.minimumPayment) || 0,
    // Read the old field once so existing localStorage records migrate to the
    // clearer domain name without losing their due day.
    minimumPaymentDueDay: normalizeDueDay(
      debt.minimumPaymentDueDay ?? debt.dueDayOfMonth,
    ),
    apr: debt.apr == null ? null : roundToCents(debt.apr),
    includeInPayoffGoal: Boolean(debt.includeInPayoffGoal),
    isCurrentTarget: Boolean(debt.isCurrentTarget),
    createdAt: debt.createdAt ?? new Date().toISOString(),
    updatedAt: debt.updatedAt ?? new Date().toISOString(),
    paymentHistory: Array.isArray(debt.paymentHistory) ? debt.paymentHistory : [],
  };
}

export function normalizeDebts(debts) {
  if (!Array.isArray(debts)) {
    return [];
  }
  return debts.map(normalizeDebt).filter(Boolean);
}

// Shape check for one stored record. Returns a list of problems; an empty
// list means the record is usable.
export function validateDebtRecord(debt) {
  const errors = [];

  if (!debt.id) errors.push("missing id");
  if (!debt.name) errors.push("missing name");
  if (!DEBT_OWNERS.includes(debt.owner)) errors.push("invalid owner");
  if (!DEBT_TYPES.includes(debt.type)) errors.push("invalid type");
  if (!Number.isFinite(debt.startingBalance)) errors.push("invalid startingBalance");
  if (!Number.isFinite(debt.currentBalance)) errors.push("invalid currentBalance");
  if (!Number.isFinite(debt.minimumPayment)) errors.push("invalid minimumPayment");
  if (!Array.isArray(debt.paymentHistory)) errors.push("invalid paymentHistory");
  if (
    debt.minimumPaymentDueDay != null &&
    (!Number.isInteger(debt.minimumPaymentDueDay) ||
      debt.minimumPaymentDueDay < 1 ||
      debt.minimumPaymentDueDay > 31)
  ) {
    errors.push("invalid minimumPaymentDueDay");
  }

  return errors;
}

export function validateAllDebts(debts) {
  const results = debts.map((debt) => ({
    id: debt.id,
    errors: validateDebtRecord(debt),
  }));
  const invalid = results.filter((result) => result.errors.length > 0);

  return { allValid: invalid.length === 0, invalidCount: invalid.length, results };
}
