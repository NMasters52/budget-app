import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  getTodayISODate,
  calculateNextDueFromFrequency,
  reconcileBillOnOpen,
  validateBillInput,
} from "../utils/dateUtils";
import FrequencySelect from "../components/FrequencySelect";

//design system
import { CandyButton, Field, PageHeading, StickerCard } from "../components/ui";
import { inputClass } from "../components/uiClasses";

const AddBills = ({ setBills }) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    frequency: "monthly",
    nextDue: "",
    lastPaid: "",
    paymentHistory: [],
    autoCalculateDue: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    const updatedFormData = {
      ...formData,
      [name]: newValue,
    };

    // Auto-calculate nextDue when lastPaid or frequency changes and autoCalculateDue is true
    if (
      formData.autoCalculateDue &&
      (name === "lastPaid" || name === "frequency") &&
      updatedFormData.lastPaid &&
      updatedFormData.frequency
    ) {
      try {
        updatedFormData.nextDue = calculateNextDueFromFrequency(
          updatedFormData.lastPaid,
          updatedFormData.frequency,
        );
      } catch (error) {
        console.error("Error auto-calculating nextDue:", error);
      }
    }

    setFormData(updatedFormData);
    setError("");
  };

  const submitNewBill = (e) => {
    e.preventDefault();

    const inputBill = {
      ...formData,
      title: formData.title.trim(),
      amount: formData.amount,
      lastPaid: formData.lastPaid || "",
    };
    const validation = validateBillInput(inputBill);

    if (!validation.isValid) {
      setError(validation.errors.join(" "));
      setSuccess(false);
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
    setFormData({
      title: "",
      amount: 0,
      frequency: "monthly",
      nextDue: "",
      lastPaid: "",
      paymentHistory: [],
      autoCalculateDue: true,
    });
    setError("");
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-10 pb-16">
      <PageHeading
        kicker="New entry"
        title="Add a bill"
        sub="Recurring costs live here; the schedule keeps itself up to date."
      />

      <StickerCard className="mt-6">
        <form onSubmit={submitNewBill}>
          {error && (
            <div
              className="mb-4 rounded-2xl border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3 text-sm font-bold text-[#a83a1c]"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-2xl border-2 border-[#2aa8a0] bg-[#2aa8a0]/10 px-4 py-3 text-sm font-bold text-[#1d7d77]">
              <span className="mr-1 inline-block animate-pop">✓</span> Bill
              added
            </div>
          )}

          <Field label="Bill title" htmlFor="title">
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              placeholder="Rent"
              onChange={(e) => handleChange(e)}
              className={inputClass}
            />
          </Field>

          <Field label="Bill amount" htmlFor="amount">
            <input
              type="number"
              name="amount"
              required
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={formData.amount}
              onChange={(e) => handleChange(e)}
              onWheel={(e) => e.target.blur()}
              className={inputClass}
            />
          </Field>

          <Field label="Next billing date" htmlFor="nextDue">
            <input
              type="date"
              name="nextDue"
              required
              value={formData.nextDue}
              onChange={(e) => handleChange(e)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Last paid date"
            htmlFor="lastPaid"
            hint="Optional — powers the auto-calculated next due date."
          >
            <div className="flex gap-2">
              <input
                type="date"
                name="lastPaid"
                value={formData.lastPaid}
                onChange={(e) => handleChange(e)}
                max={getTodayISODate()}
                className={inputClass}
              />
              {formData.lastPaid && (
                <button
                  type="button"
                  onClick={() =>
                    handleChange({ target: { name: "lastPaid", value: "" } })
                  }
                  className="shrink-0 cursor-pointer rounded-xl border-2 border-[#ff6b4a]/40 bg-white px-4 font-extrabold text-[#d64522] transition-colors hover:border-[#ff6b4a]"
                  title="Clear date"
                >
                  Clear
                </button>
              )}
            </div>
          </Field>

          <Field label="Bill frequency" htmlFor="frequency">
            <FrequencySelect
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
              Auto-calculate next due date
              <span className="block text-[13px] font-semibold text-[#6f6b61]">
                Derives it from the last paid date and frequency.
              </span>
            </span>
          </label>

          <CandyButton type="submit" tone="coral" size="lg" className="w-full">
            Add bill
          </CandyButton>
        </form>
      </StickerCard>
    </div>
  );
};

export default AddBills;
