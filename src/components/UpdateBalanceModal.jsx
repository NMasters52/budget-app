import { useState } from "react";
import {
  formatCurrency,
  validateBalanceInput,
  updateBalance,
} from "../utils/debtUtils";

//design system
import { CandyButton, Field, ModalShell } from "./ui";
import { inputClass } from "./uiClasses";

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
    <ModalShell title="Update balance" onClose={onClose}>
      <p className="mb-2 text-sm font-semibold text-[#6f6b61]">
        {debt.name} — currently tracked at{" "}
        <span className="font-bold text-[#1d1b16]">
          {formatCurrency(debt.currentBalance)}
        </span>
      </p>
      <p className="mb-4 text-sm font-semibold text-[#6f6b61]">
        Reconcile the tracked balance with your lender's real balance. Use this
        for interest, fees, new spending, or lender corrections. Payment
        history is not changed.
      </p>

      {error && (
        <div
          className="mb-4 rounded-2xl border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3 text-sm font-bold text-[#a83a1c]"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Field label="New balance" htmlFor="new-balance">
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
            className={inputClass}
          />
        </Field>

        <div className="mt-4 flex flex-col gap-2">
          <CandyButton type="submit" tone="ink" size="lg" className="w-full">
            Update balance
          </CandyButton>
          <CandyButton tone="ghost" size="md" className="w-full" onClick={onClose}>
            Cancel
          </CandyButton>
        </div>
      </form>
    </ModalShell>
  );
};

export default UpdateBalanceModal;
