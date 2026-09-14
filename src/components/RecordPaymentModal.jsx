import { useState } from "react";
import {
  formatCurrency,
  suggestedPayment,
  validatePaymentInput,
  recordPayment,
} from "../utils/debtUtils";
import { getTodayISODate } from "../utils/dateUtils";

// Overlay for logging one payment against a debt. Opens pre-filled with the
// monthly minimum (clamped to the balance) so the routine case is just
// review + Enter; the amount stays fully editable for custom payments.
const RecordPaymentModal = ({ debt, debts, setDebts, onClose }) => {
  const [amount, setAmount] = useState(String(suggestedPayment(debt)));
  const [date, setDate] = useState(getTodayISODate());
  const [error, setError] = useState("");

  const today = getTodayISODate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = validatePaymentInput(debt, amount);

    if (!validation.isValid) {
      setError(validation.errors.join(" "));
      return;
    }

    setDebts(recordPayment(debts, debt.id, Number(amount), date));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="flex items-center justify-center absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <form
          className="relative bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-lg max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
        >
          <h3 className="mb-1 font-bold text-2xl">Record Payment</h3>
          <p className="text-sm text-gray-600 mb-4">
            {debt.name} &mdash; current balance{" "}
            <span className="font-semibold">
              {formatCurrency(debt.currentBalance)}
            </span>
          </p>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="payment-amount" className="block font-semibold">
              Amount:
            </label>
            <p className="text-sm text-gray-500 mb-1">
              Pre-filled with the minimum: {formatCurrency(debt.minimumPayment)}
            </p>
            <input
              type="number"
              name="amount"
              id="payment-amount"
              required
              step="0.01"
              min="0.01"
              max={debt.currentBalance}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onWheel={(e) => e.target.blur()}
              className="w-full border-2 border-black rounded-sm p-2"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="payment-date" className="block font-semibold">
              Date:
            </label>
            <input
              type="date"
              name="date"
              id="payment-date"
              required
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-2 border-black rounded-sm p-2"
            />
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <button
              type="submit"
              className="w-full p-3 cursor-pointer bg-blue-500 hover:bg-blue-400 rounded-md text-white"
            >
              Record Payment
            </button>
            <button
              type="button"
              className="w-full p-3 cursor-pointer bg-red-500 text-white rounded hover:bg-red-600"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
