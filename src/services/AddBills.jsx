import { useState } from 'react'
import {v4 as uuidv4} from 'uuid';

const AddBills = ( { bills, setBills, today } ) => {

    const [success, setSuccess] = useState(false);
   
    const [formData, setFormData] = useState({
        title: "",
        amount: 0,
        frequency: 'monthly',
        nextDue: "",
        lastPaid: "",
        paymentHistory: []
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const submitNewBill = (e) => {
        e.preventDefault();
        const newBill = {
            id: uuidv4(),
            ...formData,
            amount: parseFloat(formData.amount)
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
            paymentHistory: []
        }
        )
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
        }, 3000);
    }


  return (
    <form className="w-lg border-2 border-gray-500 rounded-lg shadow-md mx-auto p-4">
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
        </div>
        
        <div className="mb-4">
            <label htmlFor="lastPaid" className="block font-semibold">Last Paid Date:</label>
            <input 
                type="date" 
                name="lastPaid" 
                placeholder={today} 
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