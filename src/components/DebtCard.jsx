import { useState } from "react";

//components
import RecordPaymentModal from "./RecordPaymentModal";
import UpdateBalanceModal from "./UpdateBalanceModal";
import EditDebtModal from "./EditDebtModal";
import DeleteDebt from "../services/DeleteDebt";

//design system
import { CandyButton, Meter, Sticker, StickerCard } from "./ui";

//helper functions
import {
  formatCurrency,
  DEBT_TYPE_LABELS,
  calculateDebtProgress,
  dueDayInMonth,
  formatDayOrdinal,
  getMostRecentPayment,
  isPaidOff,
} from "../utils/debtUtils";
import { formatLocaleDate } from "../utils/dateUtils";

const DebtCard = ({ debt, debts, setDebts }) => {
  const [activeModal, setActiveModal] = useState(null);
  const lastPayment = getMostRecentPayment(debt);

  const paidOff = isPaidOff(debt);
  // A negative percentage is real: the balance grew past where tracking
  // began. Only the bar gets clamped, never the number.
  const percentage = paidOff ? 100 : calculateDebtProgress(debt);
  const barWidth = Math.min(100, Math.max(0, percentage));

  const closeModal = () => setActiveModal(null);

  // Card outline highlights state: paid off goes teal, the current target
  // gets the ink treatment.
  const cardTone = paidOff ? "teal" : debt.isCurrentTarget ? "mango" : "default";

  return (
    <StickerCard
      tone={cardTone}
      className="animate-rise transition-transform hover:-translate-y-0.5"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="truncate font-display text-lg font-bold text-[#1d1b16]">
            {debt.name}
          </h4>
          {paidOff && <Sticker tone="teal">Paid off</Sticker>}
          {debt.isCurrentTarget && <Sticker tone="ink">Current target</Sticker>}
          {debt.includeInPayoffGoal && !paidOff && (
            <Sticker tone="slate">In payoff goal</Sticker>
          )}
        </div>

        <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-[#1d1b16]">
          {formatCurrency(debt.currentBalance)}{" "}
          <span className="text-sm font-semibold text-[#6f6b61]">remaining</span>
        </p>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] font-semibold text-[#827e74]">
          <span>
            Owner: <span className="text-[#6f6b61]">{debt.owner}</span>
          </span>
          <span>
            Type:{" "}
            <span className="text-[#6f6b61]">
              {DEBT_TYPE_LABELS[debt.type] ?? debt.type}
            </span>
          </span>
          <span>
            Starting:{" "}
            <span className="text-[#6f6b61]">
              {formatCurrency(debt.startingBalance)}
            </span>
          </span>
          <span>
            Minimum:{" "}
            <span className="text-[#6f6b61]">
              {formatCurrency(debt.minimumPayment)}
            </span>
          </span>
          {dueDayInMonth(debt, new Date()) != null && (
            <span>
              Due on the{" "}
              <span className="text-[#6f6b61]">
                {formatDayOrdinal(dueDayInMonth(debt, new Date()))}
              </span>
            </span>
          )}
          <span>
            Last paid{" "}
            <span className="text-[#6f6b61]">
              {lastPayment
                ? `${formatCurrency(lastPayment.amount)} on ${formatLocaleDate(lastPayment.date)}`
                : "never"}
            </span>
          </span>
          {debt.apr != null && (
            <span>
              APR: <span className="text-[#6f6b61]">{debt.apr}%</span>
            </span>
          )}
        </div>

        <div className="mt-1">
          <p
            className={`text-sm font-extrabold ${
              paidOff ? "text-[#1d7d77]" : "text-[#2aa8a0]"
            }`}
          >
            {percentage.toFixed(2)}% paid off
          </p>
          <Meter value={barWidth} tone="teal" height="h-2.5" className="mt-1.5" />
        </div>
      </div>

      {/* Action row. The modals render their own overlay. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CandyButton
          tone="teal"
          size="sm"
          onClick={() => setActiveModal("payment")}
          disabled={paidOff}
        >
          Record payment
        </CandyButton>
        <CandyButton
          tone="ink"
          size="sm"
          onClick={() => setActiveModal("balance")}
        >
          Update balance
        </CandyButton>
        <CandyButton
          tone="ghost"
          size="sm"
          onClick={() => setActiveModal("edit")}
        >
          Edit
        </CandyButton>
        <DeleteDebt debt={debt} debts={debts} setDebts={setDebts} />
      </div>

      {activeModal === "payment" && (
        <RecordPaymentModal
          debt={debt}
          debts={debts}
          setDebts={setDebts}
          onClose={closeModal}
        />
      )}

      {activeModal === "balance" && (
        <UpdateBalanceModal
          debt={debt}
          debts={debts}
          setDebts={setDebts}
          onClose={closeModal}
        />
      )}

      {activeModal === "edit" && (
        <EditDebtModal
          debt={debt}
          debts={debts}
          setDebts={setDebts}
          onClose={closeModal}
        />
      )}
    </StickerCard>
  );
};

export default DebtCard;
