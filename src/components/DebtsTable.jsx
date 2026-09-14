import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

//components
import DebtsFilter from "./DebtsFilter";
import DebtCard from "./DebtCard";

//helper functions
import {
  formatCurrency,
  calculateDebtTotals,
  dueDayInMonth,
  formatDayOrdinal,
  filterDebts,
  sortDebts,
} from "../utils/debtUtils";

const DebtsTable = ({ debts = [], setDebts }) => {
  const [filter, setFilter] = useState("all");

  const totals = useMemo(() => calculateDebtTotals(debts), [debts]);

  const visible = useMemo(
    () => sortDebts(filterDebts(debts, filter)),
    [debts, filter],
  );

  const target = debts.find((debt) => debt.isCurrentTarget);

  // The payoff percentage is a ratio, so clamp the bar width against bad data.
  const progressWidth = Math.min(100, Math.max(0, totals.payoffPercentage));

  const addDebtButtonStyles =
    "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md cursor-pointer";
  const addDebtLinkStyles =
    "text-green-500 hover:underline hover:underline-offset-4";

  return (
    <div className="p-6">
      {/* Page header */}
      <header className="max-w-[600px] mx-auto flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Debts</h1>
        <Link to="/addDebt" className={addDebtButtonStyles}>
          + Add Debt
        </Link>
      </header>

      {/* Primary payoff metrics */}
      <section className="bg-white border-2 border-gray-500 rounded-md p-4 mb-4 max-w-[600px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Payoff Debt
        </p>
        <p className="text-4xl font-bold mt-1">
          {formatCurrency(totals.payoffDebt)}
          <span className="text-lg font-normal text-gray-600"> remaining</span>
        </p>
        <p className="text-sm text-gray-700 mt-1">
          <span>{formatCurrency(totals.amountEliminated)} eliminated</span>
          <span className="ml-3">
            {totals.payoffPercentage.toFixed(1)}% complete
          </span>
        </p>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-green-500"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
          <div>
            <strong>{totals.payoffDebtCount - totals.debtsPaidOff}</strong>{" "}
            debts remaining
          </div>
          <div>
            <strong>
              {formatCurrency(totals.totalMonthlyMinimumPaymentsLeft)}
            </strong>
            /mo minimum payments remaining
          </div>
          <div>
            <strong>{formatCurrency(totals.monthlyMinimumsFreed)}</strong>
            /mo minimum payments freed
          </div>
          <div>
            <strong>
              {totals.debtsPaidOff} / {totals.payoffDebtCount}
            </strong>{" "}
            debts paid off
          </div>
        </div>
      </section>

      {/* Secondary household-wide metrics: the mortgage lives in totalDebt,
          so these stay quieter than the payoff goal above */}
      <section className="bg-white border border-gray-400 rounded-md p-3 mb-4 text-sm text-gray-600 flex flex-col md:flex-row justify-center gap-2 md:gap-6 max-w-[600px] mx-auto">
        <span>
          Total Household Debt:{" "}
          <strong className="text-gray-800">
            {formatCurrency(totals.totalDebt)}
          </strong>
        </span>
        <span>
          All Debt Minimums:{" "}
          <strong className="text-gray-800">
            {formatCurrency(totals.totalMonthlyMinimumPayments)}
          </strong>
          /mo
        </span>
      </section>

      {/* Current payoff target */}
      {target ? (
        <section className="bg-green-50 border-2 border-green-500 rounded-md p-3 mb-4 flex items-center justify-between gap-3 max-w-[600px] mx-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-green-700">
              Current Target
            </p>
            <p className="font-bold">{target.name}</p>
            {dueDayInMonth(target, new Date()) != null && (
              <p className="text-sm text-gray-600">
                Minimum {formatCurrency(target.minimumPayment)} · due on the{" "}
                {formatDayOrdinal(dueDayInMonth(target, new Date()))}
              </p>
            )}
          </div>
          <span className="text-lg whitespace-nowrap">
            {formatCurrency(target.currentBalance)} remaining
          </span>
        </section>
      ) : (
        <p className="text-sm text-gray-500 italic mb-4 max-w-[600px] mx-auto">
          No target selected. Choose one with Edit on a debt card.
        </p>
      )}

      <DebtsFilter filter={filter} setFilter={setFilter} />

      {/* Debt list */}
      <div className="mx-auto w-full max-w-2xl">
        {debts.length === 0 ? (
          <div className="bg-white border-2 border-gray-500 rounded-md p-6 text-center">
            No debts to show. Add a new debt{" "}
            <Link to="/addDebt" className={addDebtLinkStyles}>
              here
            </Link>
            .
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white border-2 border-gray-500 rounded-md p-6 text-center">
            No debts match this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                debts={debts}
                setDebts={setDebts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtsTable;
