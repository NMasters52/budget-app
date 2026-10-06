import { v4 as uuidv4 } from "uuid";

import { addDays, addMonths, toISODate, reconcileBillOnOpen } from "./dateUtils";
import { createDebt } from "./debtUtils";

// Seed data and builders for the /seed page. Kept out of the component file
// so Seed.jsx only exports a component (react-refresh requirement) and the
// builders stay unit-testable. Seeding upserts by title/name: re-seeding
// refreshes the seeded items instead of duplicating them and leaves
// everything else in localStorage alone.

export const SEED_BILLS = [
  { title: "Rent", amount: 1500, frequency: "monthly" },
  { title: "Groceries", amount: 120, frequency: "weekly" },
  { title: "Car Payment", amount: 375, frequency: "monthly" },
  { title: "Electric", amount: 95, frequency: "monthly" },
  { title: "Internet", amount: 70, frequency: "monthly" },
  { title: "Water", amount: 45, frequency: "quarterly" },
  { title: "Car Insurance", amount: 130, frequency: "biannually" },
  { title: "Gas", amount: 55, frequency: "biweekly" },
  { title: "Phone Plan", amount: 85, frequency: "monthly" },
  { title: "Streaming", amount: 16, frequency: "monthly" },
];

// Balances below are invented. Real debt values live only in the gitignored
// public/seed-debts.html and must never be copied into this tracked file.
export const SEED_DEBTS = [
  { name: "House Mortgage", owner: "Household", type: "mortgage", currentBalance: 238400, minimumPayment: 1645, minimumPaymentDueDay: 1, apr: 6.25, includeInPayoffGoal: false },
  { name: "Auto Loan - Allison", owner: "Allison", type: "auto-loan", currentBalance: 14750, minimumPayment: 385, minimumPaymentDueDay: 15, apr: 7.4, includeInPayoffGoal: true },
  { name: "VyStar Credit Card", owner: "Allison", type: "credit-card", currentBalance: 2340, minimumPayment: 95, minimumPaymentDueDay: 22, apr: 24.9, includeInPayoffGoal: true },
  { name: "Amazon Credit Card", owner: "Allison", type: "credit-card", currentBalance: 840, minimumPayment: 40, minimumPaymentDueDay: 12, apr: 28.9, includeInPayoffGoal: true },
  { name: "Student Loans", owner: "Allison", type: "student-loan", currentBalance: 27600, minimumPayment: 320, minimumPaymentDueDay: 28, apr: 5.8, includeInPayoffGoal: true },
  { name: "Auto Loan - Nick", owner: "Nick", type: "auto-loan", currentBalance: 9820, minimumPayment: 340, minimumPaymentDueDay: 5, apr: 6.9, includeInPayoffGoal: true },
  { name: "Bank of America", owner: "Nick", type: "credit-card", currentBalance: 1275, minimumPayment: 60, minimumPaymentDueDay: 18, apr: 26.5, includeInPayoffGoal: true },
];

// Mirror of dateUtils' private nextOccurrence, stepped backwards, so seeded
// last-paid dates use the same calendar math the scheduler itself uses.
const previousOccurrence = (date, frequency) => {
  switch (frequency) {
    case "weekly":
      return addDays(date, -7);
    case "biweekly":
      return addDays(date, -14);
    case "monthly":
      return addMonths(date, -1);
    case "quarterly":
      return addMonths(date, -3);
    case "biannually":
      return addMonths(date, -6);
    case "yearly":
      return addMonths(date, -12);
    default:
      return date;
  }
};

export const buildSeedBills = () => {
  const today = new Date();
  return SEED_BILLS.map((def) => {
    const offset = 3 + Math.floor(Math.random() * 10); // due 3-12 days out
    const nextDueDate = addDays(today, offset);
    const nextDue = toISODate(nextDueDate);
    const lastPaid = toISODate(previousOccurrence(nextDueDate, def.frequency));
    const bill = {
      id: uuidv4(),
      title: def.title,
      amount: Number(def.amount),
      frequency: def.frequency,
      nextDue,
      lastPaid,
      originalDueDate: nextDue,
      previousDueDate: nextDue,
      unpaidDueDates: [],
      paymentHistory: [],
    };
    return reconcileBillOnOpen(bill);
  });
};

export const buildSeedDebts = () =>
  SEED_DEBTS.map((def) =>
    createDebt({ ...def, startingBalance: def.currentBalance }),
  );

const matchesSeedName = (value, defs, key) => {
  const cleaned = (value ?? "").trim().toLowerCase();
  return defs.some((def) => def[key].toLowerCase() === cleaned);
};

export const isSeedBill = (bill) => matchesSeedName(bill?.title, SEED_BILLS, "title");
export const isSeedDebt = (debt) => matchesSeedName(debt?.name, SEED_DEBTS, "name");
