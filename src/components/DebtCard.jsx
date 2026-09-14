import { useState } from "react";

//components
import RecordPaymentModal from "./RecordPaymentModal";
import UpdateBalanceModal from "./UpdateBalanceModal";
import EditDebtModal from "./EditDebtModal";
import DeleteDebt from "../services/DeleteDebt";

//helper functions
import {
  formatCurrency,
  DEBT_TYPE_LABELS,
  calculateDebtProgress,
  dueDayInMonth,
  formatDayOrdinal,
  isPaidOff,
} from "../utils/debtUtils";

const DebtCard = ({ debt, debts, setDebts }) => {
  const [activeModal, setActiveModal] = useState(null);

  const paidOff = isPaidOff(debt);
  // A negative percentage is real: the balance grew past where tracking
  // began. Only the bar gets clamped, never the number.
  const percentage = paidOff ? 100 : calculateDebtProgress(debt);
  const barWidth = Math.min(100, Math.max(0, percentage));

  const closeModal = () => setActiveModal(null);

  const cardBorder = paidOff
    ? "border-2 border-green-400"
    : debt.isCurrentTarget
      ? "border-2 border-green-500 ring-2 ring-green-200"
      : "border-s-[3px] border-gray-300";

  return (
    <div
      className={`${cardBorder} bg-white rounded-xl px-5 py-4 mt-3 transition-shadow hover:shadow-md`}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-lg text-gray-800 truncate">
            {debt.name}
          </h4>
          {paidOff && (
            <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
              Paid Off
            </span>
          )}
          {debt.isCurrentTarget && (
            <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500 text-white">
              Current Target
            </span>
          )}
          {debt.includeInPayoffGoal && (
            <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              In Payoff Goal
            </span>
          )}
        </div>

        <p className="text-2xl font-bold text-gray-900 tracking-tight">
          {formatCurrency(debt.currentBalance)} remaining
        </p>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-400">
          <span>
            Owner:{" "}
            <span className="text-gray-600 font-medium">{debt.owner}</span>
          </span>
          <span>
            Type:{" "}
            <span className="text-gray-600 font-medium">
              {DEBT_TYPE_LABELS[debt.type] ?? debt.type}
            </span>
          </span>
          <span>
            Starting:{" "}
            <span className="text-gray-600 font-medium">
              {formatCurrency(debt.startingBalance)}
            </span>
          </span>
          <span>
            Minimum:{" "}
            <span className="text-gray-600 font-medium">
              {formatCurrency(debt.minimumPayment)}
            </span>
          </span>
          {dueDayInMonth(debt, new Date()) != null && (
            <span>
              Minimum due on the{" "}
              <span className="text-gray-600 font-medium">
                {formatDayOrdinal(dueDayInMonth(debt, new Date()))}
              </span>
            </span>
          )}
          {debt.apr != null && (
            <span>
              APR:{" "}
              <span className="text-gray-600 font-medium">{debt.apr}%</span>
            </span>
          )}
        </div>

        <div className="mt-1">
          <p className="text-sm font-semibold text-green-600">
            {percentage.toFixed(2)}% paid off
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action row. The modals render their own overlay. */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          onClick={() => setActiveModal("payment")}
          disabled={paidOff}
          className={`text-sm font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all ${
            paidOff
              ? "bg-gray-50 text-gray-300 cursor-default"
              : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 active:scale-95 shadow-sm"
          }`}
        >
          Record Payment
        </button>
        <button
          onClick={() => setActiveModal("balance")}
          className="text-sm font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-sm"
        >
          Update Balance
        </button>
        <button
          onClick={() => setActiveModal("edit")}
          className="text-sm font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all border-2 border-gray-500 text-gray-700 hover:bg-gray-100"
        >
          Edit
        </button>
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
    </div>
  );
};

export default DebtCard;
