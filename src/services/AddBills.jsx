import { useState, useEffect } from 'react'
import {v4 as uuidv4} from 'uuid';
import { toISODate, getTodayISODate, isValidFrequency, parseLocalDate, validateBillDates } from '../utils/dateUtils';

const AddBills = ( { bills, setBills, today } ) => {

    const [success, setSuccess] = useState(false);
   
    const [formData, setFormData] = useState({
        title: "",
        amount: 0,
        frequency: 'monthly',
        nextDue: "",
        lastPaid: "",
        paymentHistory: [],
        autoCalculateDue: true, // Default to auto-calculate
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    // Auto-calculate nextDue when lastPaid changes and autoCalculateDue is true
    useEffect(() => {
        if (formData.autoCalculateDue && formData.lastPaid && formData.frequency) {
            try {
                const lastPaidDate = parseLocalDate(formData.lastPaid);
                const baseDate = formData.lastPaid; // For new bills, use lastPaid as base

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

                setFormData(prev => ({
                    ...prev,
                    nextDue: toISODate(newDueDate)
                }));
            } catch (error) {
                console.error('Error auto-calculating nextDue:', error);
            }
        }
    }, [formData.lastPaid, formData.frequency, formData.autoCalculateDue]);

    const submitNewBill = (e) => {
        e.preventDefault();

        // Validate frequency
        if (!isValidFrequency(formData.frequency)) {
            alert('Invalid frequency selected. Please choose a valid option.');
            return;
        }

        // Validate dates
        const tempBill = {
            ...formData,
            amount: parseFloat(formData.amount),
            nextDue: toISODate(formData.nextDue),
            lastPaid: toISODate(formData.lastPaid),
        };
        const dateValidation = validateBillDates(tempBill);

        if (!dateValidation.isValid) {
            if (confirm(dateValidation.errors.join('\n\n'))) {
                // User confirmed, proceed anyway
            } else {
                return;
            }
        }

        const newBill = {
            id: uuidv4(),
            ...formData,
            amount: parseFloat(formData.amount),
            nextDue: toISODate(formData.nextDue),
            lastPaid: toISODate(formData.lastPaid),
            // Add new fields for new bills
            originalDueDate: toISODate(formData.nextDue),
            previousDueDate: toISODate(formData.nextDue),
        };
        //add new bill to bills state
        setBills([...bills, newBill]);
        //reset form
        setFormData({
            title: "",
            amount: 0,
            frequency: 'monthly',
            nextDue: "",
            lastPaid: "",
            paymentHistory: [],
            autoCalculateDue: true,
        }
        )
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
        }, 3000);
    }

  return (
    <form className=" w-xs sm:w-lg md:w-xl p-4 border-2 border-gray-500 rounded-lg shadow-md mx-auto">
        <h3 className="mb-4 p-2 font-bold text-2xl">Add New Bill</h3>

        {success && 
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                ✅ Bill added successfully!
            </div>
        }

        <div className="mb-4">
            <label htmlFor="title" className="block font-semibold">Bill Title:</label>
            <input 
                type="text" 
                name='title' 
                value={formData.title} 
                placeholder='Rent'
                onChange={(e) => handleChange(e)}
                className="w-full border-2 border-black rounded-sm p-2"
            />
        </div>
          
        <div className="mb-4">
            <label htmlFor="amount" className="block font-semibold">Bill Amount:</label>
            <input 
                type="number"  
                name='amount' 
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
                placeholder={today}
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
                    placeholder={today}
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

        <button
            onClick={submitNewBill}
            className="bg-blue-600 hover:bg-blue-300 cursor-pointer w-full shadow-md rounded-lg text-white p-2"
        >
            Add New Bill 🤮
        </button>
    </form>
  )
}

export default AddBills