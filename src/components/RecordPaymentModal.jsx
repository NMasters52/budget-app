import { useState } from "react";
import {
  formatCurrency,
  suggestedPayment,
  validatePaymentInput,
  recordPayment,
} from "../utils/debtUtils";
import { getTodayISODate } from "../utils/dateUtils";

//design system
import { CandyButton, Field, ModalShell } from "./ui";
import { inputClass } from "./uiClasses";

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
    <ModalShell title="Record payment" onClose={onClose}>
      <p className="mb-4 text-sm font-semibold text-[#6f6b61]">
        {debt.name} — current balance{" "}
        <span className="font-bold text-[#1d1b16]">
          {formatCurrency(debt.currentBalance)}
        </span>
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
        <Field
          label="Amount"
          htmlFor="payment-amount"
          hint={`Pre-filled with the minimum: ${formatCurrency(debt.minimumPayment)}`}
        >
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
            className={inputClass}
          />
        </Field>

        <Field label="Date" htmlFor="payment-date">
          <input
            type="date"
            name="date"
            id="payment-date"
            required
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="mt-4 flex flex-col gap-2">
          <CandyButton type="submit" tone="teal" size="lg" className="w-full">
            Record payment
          </CandyButton>
          <CandyButton tone="ghost" size="md" className="w-full" onClick={onClose}>
            Cancel
          </CandyButton>
        </div>
      </form>
    </ModalShell>
  );
};

export default RecordPaymentModal;
