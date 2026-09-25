import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DEBT_OWNERS,
  DEBT_TYPES,
  DEBT_TYPE_LABELS,
  createDebt,
  validateDebtInput,
} from "../utils/debtUtils";

//design system
import { CandyButton, Field, PageHeading, StickerCard } from "../components/ui";
import { inputClass } from "../components/uiClasses";

const AddDebt = ({ debts, setDebts }) => {
  const navigate = useNavigate();
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
    setError("");
  };

  const submitNewDebt = (e) => {
    e.preventDefault();

    const validation = validateDebtInput(formData);

    if (!validation.isValid) {
      setError(validation.errors.join(" "));
      return;
    }

    const newDebt = createDebt(formData);
    setDebts([...debts, newDebt]);
    navigate("/debts");
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-10 pb-16">
      <PageHeading
        kicker="New entry"
        title="Add a debt"
        sub="Track a balance and fold it into the payoff plan."
      />

      <StickerCard className="mt-6">
        <form onSubmit={submitNewDebt}>
          {error && (
            <div
              className="mb-4 rounded-2xl border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3 text-sm font-bold text-[#a83a1c]"
              role="alert"
            >
              {error}
            </div>
          )}

          <Field label="Name" htmlFor="name">
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              placeholder="Chase Sapphire"
              onChange={(e) => handleChange(e)}
              className={inputClass}
            />
          </Field>

          <Field label="Owner" htmlFor="owner">
            <select
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={(e) => handleChange(e)}
              className={`${inputClass} cursor-pointer`}
            >
              {DEBT_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Debt type" htmlFor="type">
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={(e) => handleChange(e)}
              className={`${inputClass} cursor-pointer`}
            >
              {DEBT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DEBT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Starting balance" htmlFor="startingBalance">
            <input
              type="number"
              id="startingBalance"
              name="startingBalance"
              required
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={formData.startingBalance}
              onChange={(e) => handleChange(e)}
              onWheel={(e) => e.target.blur()}
              className={inputClass}
            />
          </Field>

          <Field
            label="Current balance"
            htmlFor="currentBalance"
            hint="Leave equal to the starting balance if this debt is new to tracking."
          >
            <input
              type="number"
              id="currentBalance"
              name="currentBalance"
              required
              min="0"
              step="0.01"
              inputMode="decimal"
              value={formData.currentBalance}
              onChange={(e) => handleChange(e)}
              onWheel={(e) => e.target.blur()}
              className={inputClass}
            />
          </Field>

          <Field label="Minimum payment" htmlFor="minimumPayment">
            <input
              type="number"
              id="minimumPayment"
              name="minimumPayment"
              required
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={formData.minimumPayment}
              onChange={(e) => handleChange(e)}
              onWheel={(e) => e.target.blur()}
              className={inputClass}
            />
          </Field>

          <Field
            label="Minimum due day"
            htmlFor="minimumPaymentDueDay"
            hint="Optional — day of the month, e.g. 22. Leave blank if unknown."
          >
            <input
              type="number"
              id="minimumPaymentDueDay"
              name="minimumPaymentDueDay"
              min="1"
              max="31"
              step="1"
              inputMode="numeric"
              placeholder="Day of the month"
              value={formData.minimumPaymentDueDay}
              onChange={(e) => handleChange(e)}
              onWheel={(e) => e.target.blur()}
              className={inputClass}
            />
          </Field>

          <Field
            label="APR"
            htmlFor="apr"
            hint="Optional — annual percentage rate, when you have it."
          >
            <input
              type="number"
              id="apr"
              name="apr"
              step="0.01"
              min="0"
              max="100"
              inputMode="decimal"
              placeholder="Leave blank if unknown"
              value={formData.apr}
              onChange={(e) => handleChange(e)}
              onWheel={(e) => e.target.blur()}
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
                Counts toward the payoff plan on the Debts page.
              </span>
            </span>
          </label>

          <CandyButton type="submit" tone="coral" size="lg" className="w-full">
            Add debt
          </CandyButton>
        </form>

        <p className="mt-4 text-center">
          <Link
            to="/debts"
            className="text-sm font-extrabold text-[#2aa8a0] underline decoration-2 underline-offset-4 hover:text-[#1d7d77]"
          >
            Back to debts
          </Link>
        </p>
      </StickerCard>
    </div>
  );
};

export default AddDebt;
