import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import Nav from "./Nav";
import BillsOverview from "./components/BillsOverview";
import DebtsTable from "./components/DebtsTable";
import Seed from "./components/Seed";
import AddBills from "./services/AddBills";
import AddDebt from "./services/AddDebt";
import { calculateDueWithinDays, isValidISODate } from "./utils/dateUtils";
import { validateAllDebts } from "./utils/debtUtils";
import { buildSeedBills, buildSeedDebts } from "./utils/seedData";

// Smoke test: server-render every page of the restyled app with
// representative data. A crash here means the page is broken in the
// browser too.

const isoFromOffset = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const bills = [
  {
    id: "1",
    title: "Electric",
    amount: "82.40", // string amount on purpose
    frequency: "monthly",
    nextDue: isoFromOffset(3),
    lastPaid: isoFromOffset(-27),
    unpaidDueDates: [],
    paymentHistory: [],
  },
  {
    id: "2",
    title: "Internet",
    amount: 59.99,
    frequency: "monthly",
    nextDue: isoFromOffset(-4),
    lastPaid: "",
    unpaidDueDates: [isoFromOffset(-4)], // triggers the review banner
    paymentHistory: [],
  },
];

const debts = [
  {
    id: "d1",
    name: "Visa",
    owner: "Nick",
    type: "credit-card",
    startingBalance: 1000,
    currentBalance: 600,
    minimumPayment: 40,
    minimumPaymentDueDay: 22,
    includeInPayoffGoal: true,
    isCurrentTarget: true,
    paymentHistory: [],
  },
];

const setNothing = () => {};

describe("restyled pages render", () => {
  it("projects every recurring payment inside a summary window", () => {
    const today = new Date(2026, 8, 29);
    const weeklyBill = [{
      amount: 25,
      frequency: "weekly",
      nextDue: "2026-09-30",
    }];

    expect(calculateDueWithinDays(weeklyBill, today, 7)).toBe(25);
    expect(calculateDueWithinDays(weeklyBill, today, 30)).toBe(125);
  });

  it("navigation exposes only Bills and Debts", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    );

    expect(html).toContain(">Bills<");
    expect(html).toContain(">Debts<");
    expect(html).not.toContain(">Seed<"); // dev tool: URL-only, never in the nav
    expect(html).not.toContain("Bills Preview");
    expect(html).not.toContain("Bills Overview");
    expect(html).not.toContain(">Add Bill<");
  });

  it("seed page renders", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Seed setBills={setNothing} setDebts={setNothing} />
      </MemoryRouter>,
    );

    expect(html).toContain("Seed Bills");
    expect(html).toContain("Seed Debts");
    expect(html).toContain("Add Both");
    expect(html).toContain("fake");
  });

  it("seed builders produce valid fake data", () => {
    const seededBills = buildSeedBills();
    expect(seededBills).toHaveLength(10);
    seededBills.forEach((bill) => {
      expect(typeof bill.amount).toBe("number"); // string-amount regression guard
      expect(isValidISODate(bill.nextDue)).toBe(true);
      expect(isValidISODate(bill.lastPaid)).toBe(true);
      expect(bill.lastPaid < bill.nextDue).toBe(true);
      expect(bill.unpaidDueDates).toEqual([]);
    });

    const seededDebts = buildSeedDebts();
    expect(seededDebts).toHaveLength(7);
    expect(seededDebts.filter((debt) => debt.includeInPayoffGoal)).toHaveLength(6);
    expect(
      seededDebts.find((debt) => debt.type === "mortgage").includeInPayoffGoal,
    ).toBe(false);
    expect(validateAllDebts(seededDebts).allValid).toBe(true);
  });

  it("bills overview renders", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BillsOverview bills={bills} setBills={setNothing} today={new Date()} />
      </MemoryRouter>,
    );

    expect(html).toContain("Due in 7 days");
    expect(html).toContain("Due in 30 days");
    expect(html).toContain("Due in 1 year");
    expect(html).not.toContain("2 of 2 bills");
    expect(html).not.toContain("Clear dates");
    expect(html).toContain("Electric");
    expect(html).toContain("Review missed bills");
    expect(html).toContain("Needs review");
  });

  it("bills overview renders the empty state", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BillsOverview bills={[]} setBills={setNothing} today={new Date()} />
      </MemoryRouter>,
    );

    expect(html).toContain("No bills yet");
  });

  it("bills filters are shareable through the URL", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[`/?from=${isoFromOffset(10)}&sort=amount-high`]}>
        <BillsOverview bills={bills} setBills={setNothing} today={new Date()} />
      </MemoryRouter>,
    );

    expect(html).toContain("No bills match these dates");
    expect(html).toContain('for="bill-from-date"');
    expect(html).toContain(">From<");
    expect(html).toContain("Amount, highest first");
    expect(html).toContain("$0.00 due");
    expect(html).toContain("Clear dates");
    expect(html).toContain("Show all bills");
  });

  it("debts dashboard renders", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DebtsTable debts={debts} setDebts={setNothing} />
      </MemoryRouter>,
    );

    expect(html).toContain("Payoff goal");
    expect(html).toContain("Visa");
    expect(html).toContain("Current target");
  });

  it("debts renders a direct empty state", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DebtsTable debts={[]} setDebts={setNothing} />
      </MemoryRouter>,
    );

    expect(html).toContain("No debts yet");
    expect(html).not.toContain("Payoff goal");
  });

  it("forms render", () => {
    const addBillHtml = renderToStaticMarkup(
      <MemoryRouter>
        <AddBills bills={[]} setBills={setNothing} />
      </MemoryRouter>,
    );
    expect(addBillHtml).toContain("Bill title");
    expect(addBillHtml).toContain('for="bill-title"');
    expect(addBillHtml).toContain('id="bill-title"');

    const addDebtHtml = renderToStaticMarkup(
      <MemoryRouter>
        <AddDebt debts={debts} setDebts={setNothing} />
      </MemoryRouter>,
    );
    expect(addDebtHtml).toContain("Starting balance");
    expect(addDebtHtml).toContain('for="debt-name"');
    expect(addDebtHtml).toContain('id="debt-name"');
  });
});
