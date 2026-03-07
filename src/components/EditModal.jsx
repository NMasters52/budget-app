import { useState } from "react";
import { toISODate, markBillAsPaid, getTodayISODate, isValidFrequency, parseLocalDate, validateBillDates } from "../utils/dateUtils";

const EditModal = ({ bill, bills, onSave, onClose }) => {

    const [formData, setFormData] = useState({
        title: bill.title,
        amount: bill.amount,
        frequency: bill.frequency,
        nextDue: bill.nextDue,
        lastPaid: bill.lastPaid,
        paymentHistory: bill.paymentHistory,
        isPaid: !!bill.lastPaid && bill.lastPaid !== "",
        autoCalculateDue: true, // Default to auto-calculate
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        // If autoCalculateDue is being unchecked, don't override nextDue
        if (name === 'autoCalculateDue' && !checked) {
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
        if (name === 'lastPaid' && value && formData.autoCalculateDue && formData.frequency) {
            try {
                const lastPaidDate = parseLocalDate(value);
                const baseDate = bill.originalDueDate || value;

                // Calculate nextDue based on frequency
                let newDueDate = new Date(lastPaidDate);
                switch (formData.frequency) {
                    case 'weekly':
                        newDueDate.setDate(lastPaidDate.getDate() + 7);
                        break;
                    case 'biweekly':
                        newDueDate.setDate(lastPaidDate.getDate() + 14);
                        break;
                    case 'monthly':
                        newDueDate.setMonth(lastPaidDate.getMonth() + 1);
                        // Preserve the day of month
                        newDueDate.setDate(baseDate ? parseLocalDate(baseDate).getDate() : lastPaidDate.getDate());
                        break;
                    case 'quartly':
                        newDueDate.setMonth(lastPaidDate.getMonth() + 3);
                        break;
                    case 'biannually':
                        newDueDate.setMonth(lastPaidDate.getMonth() + 6);
                        break;
                    case 'yearly':
                        newDueDate.setFullYear(lastPaidDate.getFullYear() + 1);
                        break;
                    default:
                        newDueDate.setMonth(lastPaidDate.getMonth() + 1);
                }

                updatedFormData.nextDue = toISODate(newDueDate);
            } catch (error) {
                console.error('Error auto-calculating nextDue:', error);
            }
        }

        setFormData(updatedFormData);
    }

    const handleMarkPaidToggle = (e) => {
        const isChecked = e.target.checked;

        if (isChecked) {
            // Marking as paid: set lastPaid to today, calculate nextDue
            const today = new Date();
            const paidDateString = toISODate(today);
            setFormData({
                ...formData,
                isPaid: true,
                lastPaid: paidDateString,
            });
        } else {
            // Unmarking as paid: revert to previous due date, clear lastPaid
            const revertedNextDue = bill.previousDueDate || bill.nextDue;
            setFormData({
                ...formData,
                isPaid: false,
                lastPaid: "",
                nextDue: revertedNextDue,
            });
        }
    }

    const handleSubmit = e => {
        e.preventDefault()

        // Validate frequency
        if (!isValidFrequency(formData.frequency)) {
            alert('Invalid frequency selected. Please choose a valid option.');
            return;
        }

        // If marking as paid, use markBillAsPaid to calculate nextDue properly
        let updatedBill = {
            ...formData,
            id: bill.id,
        };

        if (formData.isPaid && (!bill.lastPaid || bill.lastPaid === "")) {
            // User is marking bill as paid for the first time in this edit session
            const updatedBills = markBillAsPaid(bills, bill.id, new Date());
            const paidBill = updatedBills.find(b => b.id === bill.id);
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
            // Validate dates for manual edits
            const dateValidation = validateBillDates(updatedBill);
            if (!dateValidation.isValid) {
                if (confirm(dateValidation.errors.join('\n\n'))) {
                    // User confirmed, proceed anyway
                } else {
                    return;
                }
            }
        }

        onSave(updatedBill);
    }

  return (
    <form className=" border-2 bg-white border-gray-500 rounded-lg shadow-md  p-4"
    onSubmit={handleSubmit}
    >
        <h3 className="mb-4 p-2 font-bold text-2xl">Edit Bill: {bill.title}</h3>

        <div className="mb-4">
            <label htmlFor="title" className="block font-semibold">Bill Title:</label>
            <input 
                type="text" 
                name='title' 
                value={formData.title} 
                placeholder={formData.title}
                onChange={(e) => handleChange(e)}
                className="w-full border-2 border-black rounded-sm p-2"
            />
        </div>

        <div className="mb-4">
            <label htmlFor="amount" className="block font-semibold">Bill Amount:</label>
            <input 
                type="number"  
                name='amount'
                placeholder={bill.amount}
                value={formData.amount} 
                onChange={(e) => handleChange(e)}
                onWheel={(e) => e.target.blur()}
                className="w-full border-2 border-black rounded-sm p-2"
            />
        </div>

        <div className="mb-4">
            <label htmlFor="nextDue" className="block font-semibold">Next Billing Date:</label>
            <input
                type="date"
                name="nextDue"
                placeholder={bill.nextDue}
                value={formData.nextDue}
                onChange={(e) => handleChange(e)}
                className="w-full border-2 border-black rounded-sm p-2"
            />
            <p className="text-sm text-gray-600 mt-1">
                Enter date as: MM/DD/YYYY (e.g., 03/15/2026)
            </p>
        </div>

        <div className="mb-4">
            <label htmlFor="lastPaid" className="block font-semibold">Last Paid Date:</label>
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
                        onClick={() => handleChange({ target: { name: 'lastPaid', value: '' } })}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Clear date"
                    >
                        Clear
                    </button>
                )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
                Enter date as: MM/DD/YYYY (e.g., 02/15/2026)
            </p>
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
                When checked, the next due date will be automatically calculated based on the last paid date and bill frequency.
            </p>
        </div>

        <div className="mb-4">
            <label htmlFor="frequency" className="block font-semibold">Bill Frequency:</label>
            <select
                name="frequency"
                value={formData.frequency}
                placeholder={bill.frequency}
                onChange={(e) => handleChange(e)}
                className="w-full border-2 border-black rounded-sm p-2"
            >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quartly">Quartly</option>
                <option value="biannually">Bi Annually</option>
                <option value="yearly">Yearly</option>
            </select>
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
  )
}

export default EditModal