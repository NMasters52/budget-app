import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  calculateNextDueFromFrequency,
  getTodayISODate,
  reconcileBillOnOpen,
  validateBillInput,
} from "../utils/dateUtils";
import FrequencySelect from "../components/FrequencySelect";
import { CandyButton, Field } from "../components/ui";
import { inputClass } from "../components/uiClasses";

const emptyForm = {
  title: "",
  amount: "",
  frequency: "monthly",
  nextDue: "",
  lastPaid: "",
  paymentHistory: [],
  autoCalculateDue: true,
};

const AddBills = ({ setBills, onAdded, onCancel }) => {
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(emptyForm);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const updatedFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    if (
      updatedFormData.autoCalculateDue &&
      (name === "lastPaid" || name === "frequency") &&
      updatedFormData.lastPaid &&
      updatedFormData.frequency
    ) {
      try {
        updatedFormData.nextDue = calculateNextDueFromFrequency(
          updatedFormData.lastPaid,
          updatedFormData.frequency,
        );
      } catch (calculationError) {
        console.error("Error auto-calculating next due date:", calculationError);
      }
    }

    setFormData(updatedFormData);
    setError("");
  };

  const submitNewBill = (event) => {
    event.preventDefault();

    const inputBill = {
      ...formData,
      title: formData.title.trim(),
      amount: formData.amount,
      lastPaid: formData.lastPaid || "",
    };
    const validation = validateBillInput(inputBill);

    if (!validation.isValid) {
      setError(validation.errors.join(" "));
      return;
    }

    const newBill = {
      id: uuidv4(),
      ...inputBill,
      amount: Number(inputBill.amount),
      originalDueDate: inputBill.nextDue,
      previousDueDate: inputBill.nextDue,
      unpaidDueDates: [],
    };
    const reconciledBill = reconcileBillOnOpen(newBill);
    setBills((currentBills) => [...currentBills, reconciledBill]);
    setFormData(emptyForm);
    setError("");
    onAdded?.(reconciledBill);
  };

  return (
    <form onSubmit={submitNewBill} autoComplete="off">
      {error && (
        <div
          className="mb-4 rounded-2xl border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3 text-sm font-bold text-[#a83a1c]"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <Field label="Bill title" htmlFor="bill-title">
        <input
          id="bill-title"
          type="text"
          name="title"
          required
          value={formData.title}
          placeholder="Rent…"
          onChange={handleChange}
          className={inputClass}
        />
      </Field>

      <Field label="Bill amount" htmlFor="bill-amount">
        <input
          id="bill-amount"
          type="number"
          name="amount"
          required
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={formData.amount}
          onChange={handleChange}
          onWheel={(event) => event.currentTarget.blur()}
          className={inputClass}
        />
      </Field>

      <Field label="Next billing date" htmlFor="bill-next-due">
        <input
          id="bill-next-due"
          type="date"
          name="nextDue"
          required
          value={formData.nextDue}
          onChange={handleChange}
          className={inputClass}
        />
      </Field>

      <Field
        label="Last paid date"
        htmlFor="bill-last-paid"
        hint="Optional. This date can set the next due date."
      >
        <div className="flex gap-2">
          <input
            id="bill-last-paid"
            type="date"
            name="lastPaid"
            value={formData.lastPaid}
            onChange={handleChange}
            max={getTodayISODate()}
            className={inputClass}
          />
          {formData.lastPaid && (
            <button
              type="button"
              onClick={() =>
                handleChange({ target: { name: "lastPaid", value: "", type: "date" } })
              }
              className="shrink-0 cursor-pointer rounded-xl border-2 border-[#ff6b4a]/40 bg-white px-4 font-extrabold text-[#d64522] transition-colors hover:border-[#ff6b4a] focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/20"
            >
              Clear
            </button>
          )}
        </div>
      </Field>

      <Field label="Bill frequency" htmlFor="bill-frequency">
        <FrequencySelect
          id="bill-frequency"
          value={formData.frequency}
          onChange={handleChange}
          className={`${inputClass} cursor-pointer`}
        />
      </Field>

      <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#1d1b16]/10 bg-[#faf8f2] px-4 py-3">
        <input
          type="checkbox"
          name="autoCalculateDue"
          checked={formData.autoCalculateDue}
          onChange={handleChange}
          className="h-5 w-5 shrink-0 accent-[#ff6b4a]"
        />
        <span className="text-sm font-bold text-[#1d1b16]">
          Set the next due date automatically
          <span className="block text-[13px] font-semibold text-[#6f6b61]">
            Uses the last paid date and frequency.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <CandyButton type="submit" tone="coral" size="lg" className="w-full">
          Add bill
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

export default AddBills;
