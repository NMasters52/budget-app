import { useState } from "react";
import {
  toISODate,
  markBillAsPaid,
  getTodayISODate,
  isValidFrequency,
  calculateNextDueFromFrequency,
  validateBillDates,
  buildUpdatedBill,
} from "../utils/dateUtils";
import FrequencySelect from "./FrequencySelect";

//design system
import { CandyButton, Field } from "./ui";
import { inputClass } from "./uiClasses";

// Edit form for one bill. Renders inside a ModalShell owned by the
// caller, so this component is the form only — no heading, no overlay.
const EditModal = ({ bill, bills, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: bill.title,
    amount: bill.amount,
    frequency: bill.frequency,
    nextDue: bill.nextDue,
    lastPaid: bill.lastPaid,
    paymentHistory: bill.paymentHistory,
    isPaid: !!bill.lastPaid && bill.lastPaid !== "",
    autoCalculateDue: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    // If autoCalculateDue is being unchecked, don't override nextDue
    if (name === "autoCalculateDue" && !checked) {
      setFormData({
        ...formData,
        [name]: newValue,
      });
      return;
    }

    const updatedFormData = {
      ...formData,
      [name]: newValue,
    };

    // Auto-calculate nextDue when lastPaid changes and autoCalculateDue is true
    if (
      name === "lastPaid" &&
      value &&
      formData.autoCalculateDue &&
      formData.frequency
    ) {
      try {
        const baseDate = bill.originalDueDate || value;
        updatedFormData.nextDue = calculateNextDueFromFrequency(
          value,
          formData.frequency,
          baseDate,
        );
      } catch (error) {
        console.error("Error auto-calculating nextDue:", error);
      }
    }

    setFormData(updatedFormData);
  };

  const handleMarkPaidToggle = (e) => {
    const isChecked = e.target.checked;

    if (isChecked) {
      const today = new Date();
      const paidDateString = toISODate(today);
      setFormData({
        ...formData,
        isPaid: true,
        lastPaid: paidDateString,
      });
    } else {
      const revertedNextDue = bill.previousDueDate || bill.nextDue;
      setFormData({
        ...formData,
        isPaid: false,
        lastPaid: "",
        nextDue: revertedNextDue,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate frequency
    if (!isValidFrequency(formData.frequency)) {
      alert("Invalid frequency selected. Please choose a valid option.");
      return;
    }

    // Amount comes back from the input as a string; save a number so a
    // string amount can never reach localStorage and break totals.
    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Bill amount must be a positive number.");
      return;
    }

    // Form fields win, everything else on the bill (originalDueDate,
    // previousDueDate, unpaidDueDates) carries over untouched.
    let updatedBill = buildUpdatedBill(bill, {
      ...formData,
      amount,
    });

    if (formData.isPaid && (!bill.lastPaid || bill.lastPaid === "")) {
      const updatedBills = markBillAsPaid(bills, bill.id, new Date());
      const paidBill = updatedBills.find((b) => b.id === bill.id);
      if (paidBill) {
        updatedBill = {
          ...updatedBill,
          nextDue: paidBill.nextDue,
          lastPaid: paidBill.lastPaid,
          originalDueDate: paidBill.originalDueDate,
          previousDueDate: paidBill.previousDueDate,
          paymentHistory: paidBill.paymentHistory,
        };
      }
    } else {
      const dateValidation = validateBillDates(updatedBill);
      if (!dateValidation.isValid) {
        if (confirm(dateValidation.errors.join("\n\n"))) {
          // User confirmed, proceed anyway
        } else {
          return;
        }
      }
    }

    onSave(updatedBill);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Bill title" htmlFor="title">
        <input
          id="title"
          type="text"
          name="title"
          value={formData.title}
          placeholder={formData.title}
          onChange={(e) => handleChange(e)}
          className={inputClass}
        />
      </Field>

      <Field label="Bill amount" htmlFor="amount">
        <input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          name="amount"
          placeholder={bill.amount}
          value={formData.amount}
          onChange={(e) => handleChange(e)}
          onWheel={(e) => e.target.blur()}
          className={inputClass}
        />
      </Field>

      <Field label="Next billing date" htmlFor="nextDue">
        <input
          id="nextDue"
          type="date"
          name="nextDue"
          placeholder={bill.nextDue}
          value={formData.nextDue}
          onChange={(e) => handleChange(e)}
          className={inputClass}
        />
      </Field>

      <Field label="Last paid date" htmlFor="lastPaid">
        <div className="flex gap-2">
          <input
            id="lastPaid"
            type="date"
            name="lastPaid"
            placeholder={bill.lastPaid}
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
          id="frequency"
          value={formData.frequency}
          onChange={handleChange}
          className={`${inputClass} cursor-pointer`}
        />
      </Field>

      <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#1d1b16]/10 bg-[#faf8f2] px-4 py-3">
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

      <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#1d1b16]/10 bg-[#faf8f2] px-4 py-3">
        <input
          type="checkbox"
          name="isPaid"
          checked={formData.isPaid}
          onChange={handleMarkPaidToggle}
          className="h-5 w-5 shrink-0 accent-[#2aa8a0]"
        />
        <span className="text-sm font-bold text-[#1d1b16]">
          Mark as paid
          <span className="block text-[13px] font-semibold text-[#6f6b61]">
            {formData.isPaid
              ? "Unchecking reverts to the previous due date and clears last paid."
              : "Checking sets last paid to today and bumps the due date."}
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <CandyButton type="submit" tone="teal" size="lg" className="w-full">
          Save changes
        </CandyButton>
        <CandyButton tone="ghost" size="md" className="w-full" onClick={onClose}>
          Cancel
        </CandyButton>
      </div>
    </form>
  );
};

export default EditModal;
