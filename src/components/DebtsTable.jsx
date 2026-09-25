import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IoAdd } from "react-icons/io5";

//components
import DebtsFilter from "./DebtsFilter";
import DebtCard from "./DebtCard";

//design system
import { Meter, PageHeading, Sticker, StickerCard } from "./ui";
import { candyClasses } from "./uiClasses";

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

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-16">
      {/* Page header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <PageHeading
          kicker="Payoff plan"
          title="Debts"
          sub={`${totals.payoffDebtCount - totals.debtsPaidOff} still going · ${
            totals.debtsPaidOff
          } paid off`}
        />
        <Link to="/addDebt" className={candyClasses("coral", "md")}>
          <IoAdd aria-hidden="true" /> Add debt
        </Link>
      </header>

      {/* Primary payoff metrics */}
      <StickerCard className="mt-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2aa8a0]">
          Payoff goal
        </p>
        <p className="mt-1 font-display text-4xl font-bold tracking-tight tabular-nums text-[#1d1b16]">
          {formatCurrency(totals.payoffDebt)}
          <span className="text-lg font-semibold text-[#6f6b61]"> remaining</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-[#6f6b61]">
          <span>{formatCurrency(totals.amountEliminated)} eliminated</span>
          <span className="ml-3 text-[#2aa8a0]">
            {totals.payoffPercentage.toFixed(1)}% complete
          </span>
        </p>
        <Meter value={progressWidth} tone="teal" height="h-3" className="mt-3" />
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {[
            [
              `${totals.payoffDebtCount - totals.debtsPaidOff}`,
              "debts remaining",
            ],
            [
              formatCurrency(totals.totalMonthlyMinimumPaymentsLeft),
              "/mo minimums left",
            ],
            [
              formatCurrency(totals.monthlyMinimumsFreed),
              "/mo minimums freed",
            ],
            [
              `${totals.debtsPaidOff} / ${totals.payoffDebtCount}`,
              "debts paid off",
            ],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border-2 border-[#1d1b16]/10 bg-[#faf8f2] px-3 py-2"
            >
              <span className="font-display text-base font-bold tabular-nums text-[#1d1b16]">
                {value}
              </span>
              <span className="block text-xs font-semibold text-[#6f6b61]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </StickerCard>

      {/* Secondary household-wide metrics: the mortgage lives in totalDebt,
          so these stay quieter than the payoff goal above */}
      <div className="mt-4 flex flex-col justify-center gap-2 rounded-[24px] border-2 border-[#1d1b16]/10 bg-white/70 px-5 py-3 text-sm font-semibold text-[#6f6b61] md:flex-row md:gap-8">
        <span>
          Total household debt:{" "}
          <strong className="font-display text-[#1d1b16]">
            {formatCurrency(totals.totalDebt)}
          </strong>
        </span>
        <span>
          All debt minimums:{" "}
          <strong className="font-display text-[#1d1b16]">
            {formatCurrency(totals.totalMonthlyMinimumPayments)}
          </strong>
          /mo
        </span>
      </div>

      {/* Current payoff target */}
      {target ? (
        <StickerCard tone="mango" className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Sticker tone="ink">Current target</Sticker>
              <p className="mt-2 font-display text-xl font-bold text-[#1d1b16]">
                {target.name}
              </p>
              {dueDayInMonth(target, new Date()) != null && (
                <p className="text-sm font-semibold text-[#6f6b61]">
                  Minimum {formatCurrency(target.minimumPayment)} · due on the{" "}
                  {formatDayOrdinal(dueDayInMonth(target, new Date()))}
                </p>
              )}
            </div>
            <span className="font-display text-lg font-bold tabular-nums whitespace-nowrap text-[#1d1b16]">
              {formatCurrency(target.currentBalance)} remaining
            </span>
          </div>
        </StickerCard>
      ) : (
        <p className="mt-4 rounded-[24px] border-2 border-dashed border-[#c9c4b8] bg-white/60 px-5 py-4 text-center text-sm font-semibold text-[#6f6b61]">
          No target selected. Choose one with Edit on a debt card.
        </p>
      )}

      <DebtsFilter filter={filter} setFilter={setFilter} />

      {/* Debt list */}
      {debts.length === 0 ? (
        <div className="mt-4 rounded-[28px] border-2 border-dashed border-[#c9c4b8] bg-white/60 p-10 text-center">
          <p className="font-display text-lg font-bold">No debts to show</p>
          <p className="mt-1 text-sm font-semibold text-[#6f6b61]">
            Add your first debt to start the payoff plan.
          </p>
          <Link to="/addDebt" className={`${candyClasses("teal", "md")} mt-4`}>
            Add a debt
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4 rounded-[28px] border-2 border-dashed border-[#c9c4b8] bg-white/60 p-10 text-center">
          <p className="font-display text-lg font-bold">
            No debts match this filter
          </p>
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
  );
};

export default DebtsTable;
