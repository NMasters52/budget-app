import { useState } from "react";

const EditModal = ({ bill, onSave, onClose }) => {

    const [formData, setFormData] = useState({
        title: bill.title,
        amount: bill.amount,
        frequency: bill.frequency,
        nextDue: bill.nextDue,
        lastPaid: bill.lastPaid,
        paymentHistory: bill.paymentHistory,
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = e => {
        e.preventDefault()

        onSave(formData);
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
        </div>

        <div className="mb-4">
            <label htmlFor="lastPaid" className="block font-semibold">Last Paid Date:</label>
            <input 
                type="date" 
                name="lastPaid" 
                placeholder={bill.lastPaid} 
                value={formData.lastPaid} 
                onChange={(e) => handleChange(e)}
                className="w-full border-2 border-black rounded-sm p-2"
            />
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

        <div>
            <button 
                className="p-2 cursor-pointer border-2 border-gray-500"
                type="submit"
            >
                submit
            </button>
            <button 
                className="p-2 cursor-pointer border-2 border-gray-500"
                onClick={() => onClose(false)}
            >
                Cancel
            </button>
        </div>
    </form>
  )
}

export default EditModal