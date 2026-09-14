import { useState } from "react";
import {
  formatCurrency,
  validateBalanceInput,
  updateBalance,
} from "../utils/debtUtils";

// Overlay for reconciling the tracked balance with the lender's real one.
// Interest, fees, new spending, and lender corrections all come through
// here; payment history is never touched.
const UpdateBalanceModal = ({ debt, debts, setDebts, onClose }) => {
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = validateBalanceInput(debt, balance);

    if (!validation.isValid) {
      setError(validation.errors.join(" "));
      return;
    }

    setDebts(updateBalance(debts, debt.id, Number(balance)));
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
          <h3 className="mb-1 font-bold text-2xl">Update Balance</h3>
          <p className="text-sm text-gray-600 mb-4">
            {debt.name} &mdash; currently tracked at{" "}
            <span className="font-semibold">
              {formatCurrency(debt.currentBalance)}
            </span>
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Reconcile the tracked balance with your lender's real balance. Use
            this for interest, fees, new spending, or lender corrections.
            Payment history is not changed.
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
            <label htmlFor="new-balance" className="block font-semibold">
              New Balance:
            </label>
            <input
              type="number"
              name="balance"
              id="new-balance"
              required
              step="0.01"
              min="0"
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              onWheel={(e) => e.target.blur()}
              className="w-full border-2 border-black rounded-sm p-2"
            />
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <button
              type="submit"
              className="w-full p-3 cursor-pointer bg-blue-500 hover:bg-blue-400 rounded-md text-white"
            >
              Update Balance
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

export default UpdateBalanceModal;
