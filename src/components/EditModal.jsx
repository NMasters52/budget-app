import { useState } from "react";
import {
  toISODate,
  markBillAsPaid,
  getTodayISODate,
  isValidFrequency,
  calculateNextDueFromFrequency,
  validateBillDates,
} from "../utils/dateUtils";
import FrequencySelect from "./FrequencySelect";

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

    let updatedBill = {
      ...formData,
      id: bill.id,
    };

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
    <form
      className="border-2 bg-white border-gray-500 rounded-lg shadow-md p-4"
      onSubmit={handleSubmit}
    >
      <h3 className="mb-4 p-2 font-bold text-2xl">Edit Bill: {bill.title}</h3>

      <div className="mb-4">
        <label htmlFor="title" className="block font-semibold">
          Bill Title:
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          placeholder={formData.title}
          onChange={(e) => handleChange(e)}
          className="w-full border-2 border-black rounded-sm p-2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="amount" className="block font-semibold">
          Bill Amount:
        </label>
        <input
          type="number"
          name="amount"
          placeholder={bill.amount}
          value={formData.amount}
          onChange={(e) => handleChange(e)}
          onWheel={(e) => e.target.blur()}
          className="w-full border-2 border-black rounded-sm p-2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="nextDue" className="block font-semibold">
          Next Billing Date:
        </label>
        <input
          type="date"
          name="nextDue"
          placeholder={bill.nextDue}
          value={formData.nextDue}
          onChange={(e) => handleChange(e)}
          className="w-full border-2 border-black rounded-sm p-2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="lastPaid" className="block font-semibold">
          Last Paid Date:
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            name="lastPaid"
            placeholder={bill.lastPaid}
            value={formData.lastPaid}
            onChange={(e) => handleChange(e)}
            max={getTodayISODate()}
            className="w-full border-2 border-black rounded-sm p-2"
          />
          {formData.lastPaid && (
            <button
              type="button"
              onClick={() =>
                handleChange({ target: { name: "lastPaid", value: "" } })
              }
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              title="Clear date"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="autoCalculateDue"
            checked={formData.autoCalculateDue}
            onChange={handleChange}
            className="w-5 h-5 border-2 border-black rounded"
          />
          <span className="font-semibold">Auto-calculate Next Due Date</span>
        </label>
        <p className="text-sm text-gray-600 mt-1">
          When checked, the next due date will be automatically calculated based
          on the last paid date and bill frequency.
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="frequency" className="block font-semibold">
          Bill Frequency:
        </label>
        <FrequencySelect
          value={formData.frequency}
          onChange={handleChange}
          className="w-full border-2 border-black rounded-sm p-2"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isPaid"
            checked={formData.isPaid}
            onChange={handleMarkPaidToggle}
            className="w-5 h-5 border-2 border-black rounded"
          />
          <span className="font-semibold">Mark as Paid</span>
        </label>
        <p className="text-sm text-gray-600 mt-1">
          {formData.isPaid
            ? "Unchecking will revert to previous due date and clear last paid date."
            : "Checking will set last paid to today and calculate next due date."}
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <button
          className="w-full p-3 cursor-pointer bg-blue-500 hover:bg-blue-400 rounded-md text-white"
          type="submit"
        >
          Submit
        </button>
        <button
          className="w-full p-3 cursor-pointer bg-red-500 text-white rounded hover:bg-red-600"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditModal;
