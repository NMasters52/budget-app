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
          <h3 className="mb-4 font-bold text-2xl">Edit Debt</h3>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="debt-name" className="block font-semibold">
              Name:
            </label>
            <input
              type="text"
              name="name"
              id="debt-name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border-2 border-black rounded-sm p-2"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="debt-owner" className="block font-semibold">
              Owner:
            </label>
            <select
              name="owner"
              id="debt-owner"
              value={formData.owner}
              onChange={handleChange}
              className="w-full border-2 border-black rounded-sm p-2"
            >
              {DEBT_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="debt-type" className="block font-semibold">
              Type:
            </label>
            <select
              name="type"
              id="debt-type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border-2 border-black rounded-sm p-2"
            >
              {DEBT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DEBT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="debt-starting-balance"
              className="block font-semibold"
            >
              Starting Balance:
            </label>
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
              className="w-full border-2 border-black rounded-sm p-2"
            />
            {startingBalanceChanged && (
              <div
                className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-2"
                role="alert"
              >
                Changing the starting balance recalculates historical payoff
                progress for this debt.
              </div>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="debt-current-balance"
              className="block font-semibold"
            >
              Current Balance:
            </label>
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
              className="w-full border-2 border-black rounded-sm p-2"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="debt-minimum-payment"
              className="block font-semibold"
            >
              Minimum Payment:
            </label>
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
              className="w-full border-2 border-black rounded-sm p-2"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="debt-minimum-payment-due-day"
              className="block font-semibold"
            >
              Minimum Payment Due Day (optional):
            </label>
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
              className="w-full border-2 border-black rounded-sm p-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Leave blank if you do not know the recurring due day.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="debt-apr" className="block font-semibold">
              APR (optional):
            </label>
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
              className="w-full border-2 border-black rounded-sm p-2"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="includeInPayoffGoal"
                checked={formData.includeInPayoffGoal}
                onChange={handleChange}
                className="w-5 h-5 border-2 border-black rounded"
              />
              <span className="font-semibold">Include in Payoff Goal</span>
            </label>
          </div>

          <div className="mb-4">
            <label htmlFor="debt-target" className="block font-semibold">
              Current Target:
            </label>
            <select
              name="targetSelection"
              id="debt-target"
              value={targetSelection}
              onChange={(e) => setTargetSelection(e.target.value)}
              className="w-full border-2 border-black rounded-sm p-2"
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
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <button
              type="submit"
              className="w-full p-3 cursor-pointer bg-blue-500 hover:bg-blue-400 rounded-md text-white"
            >
              Submit
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

export default EditDebtModal;
