import { useState } from "react";
import {
  DEBT_OWNERS,
  DEBT_TYPES,
  DEBT_TYPE_LABELS,
  validateDebtInput,
  updateDebt,
  setCurrentTarget,
  clearCurrentTarget,
} from "../utils/debtUtils";

//design system
import { CandyButton, Field, ModalShell } from "./ui";
import { inputClass } from "./uiClasses";

// Overlay for editing a debt's record. Changing the starting balance is
// flagged in the form because payoff progress is calculated against it.
//
// The current-target select only offers to move the target to another
// eligible debt or clear it; the debt being edited never appears as a
// destination. updateDebt already strips the target when the debt leaves
// the payoff goal or reaches zero, so this component does not repeat that.
const EditDebtModal = ({ debt, debts, setDebts, onClose }) => {
  const [formData, setFormData] = useState({
    name: debt.name,
    owner: debt.owner,
    type: debt.type,
    startingBalance: debt.startingBalance,
    currentBalance: debt.currentBalance,
    minimumPayment: debt.minimumPayment,
    minimumPaymentDueDay:
      (debt.minimumPaymentDueDay ?? debt.dueDayOfMonth) == null
        ? ""
        : (debt.minimumPaymentDueDay ?? debt.dueDayOfMonth),
    apr: debt.apr == null ? "" : debt.apr,
    includeInPayoffGoal: debt.includeInPayoffGoal,
  });
  const [targetSelection, setTargetSelection] = useState(
    debt.isCurrentTarget ? debt.id : "",
  );
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
    setError("");
  };

  // Other debts eligible to hold the target: in the payoff goal with a
  // balance left. The edited debt only shows here as its own selection.
  const targetOptions = debts.filter(
    (candidate) =>
      candidate.id !== debt.id &&
      candidate.includeInPayoffGoal &&
      candidate.currentBalance > 0,
  );

  const startingBalanceChanged =
    Number(formData.startingBalance) !== debt.startingBalance;

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = validateDebtInput(formData);

    if (!validation.isValid) {
      setError(validation.errors.join(" "));
      return;
    }

    const updates = {
      name: formData.name.trim(),
      owner: formData.owner,
      type: formData.type,
      startingBalance: Number(formData.startingBalance),
      currentBalance: Number(formData.currentBalance),
      minimumPayment: Number(formData.minimumPayment),
      minimumPaymentDueDay:
        formData.minimumPaymentDueDay === ""
          ? null
          : Number(formData.minimumPaymentDueDay),
      apr: formData.apr === "" ? null : Number(formData.apr),
      includeInPayoffGoal: formData.includeInPayoffGoal,
    };

    let next = updateDebt(debts, debt.id, updates);

    if (targetSelection === "" && debt.isCurrentTarget) {
      next = clearCurrentTarget(next);
    } else if (targetSelection && targetSelection !== debt.id) {
      next = setCurrentTarget(next, targetSelection);
    }

    setDebts(next);
    onClose();
  };

  return (
    <ModalShell title="Edit debt" onClose={onClose} wide>
      {error && (
        <div
          className="mb-4 rounded-2xl border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3 text-sm font-bold text-[#a83a1c]"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Field label="Name" htmlFor="debt-name">
          <input
            type="text"
            name="name"
            id="debt-name"
            required
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
          />
        </Field>

        <div className="flex gap-3">
          <Field label="Owner" htmlFor="debt-owner">
            <select
              name="owner"
              id="debt-owner"
              value={formData.owner}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              {DEBT_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Type" htmlFor="debt-type">
            <select
              name="type"
              id="debt-type"
              value={formData.type}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              {DEBT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DEBT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Starting balance" htmlFor="debt-starting-balance">
          <input
            type="number"
            name="startingBalance"
            id="debt-starting-balance"
            required
            step="0.01"
            min="0.01"
            inputMode="decimal"
            value={formData.startingBalance}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className={inputClass}
          />
          {startingBalanceChanged && (
            <div
              className="mt-2 rounded-2xl border-2 border-[#f59f00] bg-[#f59f00]/10 px-4 py-3 text-[13px] font-bold text-[#a86e00]"
              role="alert"
            >
              Changing the starting balance recalculates historical payoff
              progress for this debt.
            </div>
          )}
        </Field>

        <Field label="Current balance" htmlFor="debt-current-balance">
          <input
            type="number"
            name="currentBalance"
            id="debt-current-balance"
            required
            step="0.01"
            min="0"
            inputMode="decimal"
            value={formData.currentBalance}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className={inputClass}
          />
        </Field>

        <Field label="Minimum payment" htmlFor="debt-minimum-payment">
          <input
            type="number"
            name="minimumPayment"
            id="debt-minimum-payment"
            required
            step="0.01"
            min="0.01"
            inputMode="decimal"
            value={formData.minimumPayment}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className={inputClass}
          />
        </Field>

        <Field
          label="Minimum due day"
          htmlFor="debt-minimum-payment-due-day"
          hint="Optional — leave blank if you do not know the recurring due day."
        >
          <input
            type="number"
            name="minimumPaymentDueDay"
            id="debt-minimum-payment-due-day"
            min="1"
            max="31"
            step="1"
            inputMode="numeric"
            placeholder="Day of the month, e.g. 22"
            value={formData.minimumPaymentDueDay}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className={inputClass}
          />
        </Field>

        <Field label="APR" htmlFor="debt-apr" hint="Optional.">
          <input
            type="number"
            name="apr"
            id="debt-apr"
            step="0.01"
            min="0"
            max="100"
            inputMode="decimal"
            placeholder="Leave empty if none"
            value={formData.apr}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            className={inputClass}
          />
        </Field>

        <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#1d1b16]/10 bg-[#faf8f2] px-4 py-3">
          <input
            type="checkbox"
            name="includeInPayoffGoal"
            checked={formData.includeInPayoffGoal}
            onChange={handleChange}
            className="h-5 w-5 shrink-0 accent-[#2aa8a0]"
          />
          <span className="text-sm font-bold text-[#1d1b16]">
            Include in payoff goal
          </span>
        </label>

        <Field label="Current target" htmlFor="debt-target">
          <select
            name="targetSelection"
            id="debt-target"
            value={targetSelection}
            onChange={(e) => setTargetSelection(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">No current target</option>
            {debt.isCurrentTarget && (
              <option value={debt.id}>{debt.name}</option>
            )}
            {targetOptions.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="mt-4 flex flex-col gap-2">
          <CandyButton type="submit" tone="teal" size="lg" className="w-full">
            Save changes
          </CandyButton>
          <CandyButton tone="ghost" size="md" className="w-full" onClick={onClose}>
            Cancel
          </CandyButton>
        </div>
      </form>
    </ModalShell>
  );
};

export default EditDebtModal;
