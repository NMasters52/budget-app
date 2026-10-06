import { useState } from "react";
import {
  DEBT_OWNERS,
  DEBT_TYPES,
  DEBT_TYPE_LABELS,
  createDebt,
  validateDebtInput,
} from "../utils/debtUtils";
import { CandyButton, Field } from "../components/ui";
import { inputClass } from "../components/uiClasses";

const AddDebt = ({ setDebts, onAdded, onCancel }) => {
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    owner: "Nick",
    type: "credit-card",
    startingBalance: "",
    currentBalance: "",
    minimumPayment: "",
    minimumPaymentDueDay: "",
    apr: "",
    includeInPayoffGoal: true,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const submitNewDebt = (event) => {
    event.preventDefault();
    const validation = validateDebtInput(formData);

    if (!validation.isValid) {
      setError(validation.errors.join(" "));
      return;
    }

    const newDebt = createDebt(formData);
    setDebts((currentDebts) => [...currentDebts, newDebt]);
    onAdded?.(newDebt);
  };

  return (
    <form onSubmit={submitNewDebt} autoComplete="off">
      {error && (
        <div
          className="mb-4 rounded-2xl border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3 text-sm font-bold text-[#a83a1c]"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <Field label="Name" htmlFor="debt-name">
        <input
          id="debt-name"
          type="text"
          name="name"
          required
          value={formData.name}
          placeholder="Chase Sapphire…"
          onChange={handleChange}
          className={inputClass}
        />
      </Field>

      <Field label="Owner" htmlFor="debt-owner">
        <select
          id="debt-owner"
          name="owner"
          value={formData.owner}
          onChange={handleChange}
          className={`${inputClass} cursor-pointer`}
        >
          {DEBT_OWNERS.map((owner) => (
            <option key={owner} value={owner}>{owner}</option>
          ))}
        </select>
      </Field>

      <Field label="Debt type" htmlFor="debt-type">
        <select
          id="debt-type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={`${inputClass} cursor-pointer`}
        >
          {DEBT_TYPES.map((type) => (
            <option key={type} value={type}>{DEBT_TYPE_LABELS[type]}</option>
          ))}
        </select>
      </Field>

      <Field label="Starting balance" htmlFor="debt-starting-balance">
        <input
          id="debt-starting-balance"
          type="number"
          name="startingBalance"
          required
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={formData.startingBalance}
          onChange={handleChange}
          onWheel={(event) => event.currentTarget.blur()}
          className={inputClass}
        />
      </Field>

      <Field
        label="Current balance"
        htmlFor="debt-current-balance"
        hint="Use the starting balance if this debt is new to Bill Buddy."
      >
        <input
          id="debt-current-balance"
          type="number"
          name="currentBalance"
          required
          min="0"
          step="0.01"
          inputMode="decimal"
          value={formData.currentBalance}
          onChange={handleChange}
          onWheel={(event) => event.currentTarget.blur()}
          className={inputClass}
        />
      </Field>

      <Field label="Minimum payment" htmlFor="debt-minimum-payment">
        <input
          id="debt-minimum-payment"
          type="number"
          name="minimumPayment"
          required
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={formData.minimumPayment}
          onChange={handleChange}
          onWheel={(event) => event.currentTarget.blur()}
          className={inputClass}
        />
      </Field>

      <Field
        label="Minimum due day"
        htmlFor="debt-minimum-due-day"
        hint="Optional. Enter a day from 1 to 31."
      >
        <input
          id="debt-minimum-due-day"
          type="number"
          name="minimumPaymentDueDay"
          min="1"
          max="31"
          step="1"
          inputMode="numeric"
          placeholder="22…"
          value={formData.minimumPaymentDueDay}
          onChange={handleChange}
          onWheel={(event) => event.currentTarget.blur()}
          className={inputClass}
        />
      </Field>

      <Field label="APR" htmlFor="debt-apr" hint="Optional annual percentage rate.">
        <input
          id="debt-apr"
          type="number"
          name="apr"
          step="0.01"
          min="0"
          max="100"
          inputMode="decimal"
          placeholder="18.99…"
          value={formData.apr}
          onChange={handleChange}
          onWheel={(event) => event.currentTarget.blur()}
          className={inputClass}
        />
      </Field>

      <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#1d1b16]/10 bg-[#faf8f2] px-4 py-3">
        <input
          type="checkbox"
          name="includeInPayoffGoal"
          checked={formData.includeInPayoffGoal}
          onChange={handleChange}
          className="h-5 w-5 shrink-0 accent-[#ff6b4a]"
        />
        <span className="text-sm font-bold text-[#1d1b16]">
          Include in payoff goal
          <span className="block text-[13px] font-semibold text-[#6f6b61]">
            Counts toward the payoff plan on this page.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <CandyButton type="submit" tone="coral" size="lg" className="w-full">
          Add debt
        </CandyButton>
        {onCancel && (
          <CandyButton tone="ghost" size="md" className="w-full" onClick={onCancel}>
            Cancel
          </CandyButton>
        )}
      </div>
    </form>
  );
};

export default AddDebt;
