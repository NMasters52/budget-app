import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import BillsOverview from "./components/BillsOverview";
import BillsList from "./components/BillsList";
import DebtsTable from "./components/DebtsTable";
import AddBills from "./services/AddBills";
import AddDebt from "./services/AddDebt";

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
  it("bills overview renders", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BillsOverview bills={bills} setBills={setNothing} today={new Date()} />
      </MemoryRouter>,
    );

    expect(html).toContain("Your bills");
    expect(html).toContain("Electric");
    expect(html).toContain("Review now"); // review banner for the missed bill
  });

  it("bills overview renders the empty state", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BillsOverview bills={[]} setBills={setNothing} today={new Date()} />
      </MemoryRouter>,
    );

    expect(html).toContain("No bills in this view");
  });

  it("bills preview renders", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BillsList bills={bills} setBills={setNothing} />
      </MemoryRouter>,
    );

    expect(html).toContain("Bills Preview");
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

  it("forms render", () => {
    const addBillHtml = renderToStaticMarkup(
      <MemoryRouter>
        <AddBills bills={[]} setBills={setNothing} />
      </MemoryRouter>,
    );
    expect(addBillHtml).toContain("Add a bill");

    const addDebtHtml = renderToStaticMarkup(
      <MemoryRouter>
        <AddDebt debts={debts} setDebts={setNothing} />
      </MemoryRouter>,
    );
    expect(addDebtHtml).toContain("Add a debt");
  });
});
