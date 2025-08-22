import { useState } from 'react'
import {v4 as uuidv4} from 'uuid';

const AddBills = ( { bills, setBills, today } ) => {

   
    const [formData, setFormData] = useState({
        title: '',
        amount: 1,
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

    const submitNewBill = () => {
        const newBill = {
            id: uuidv4(),
            amount: parseFloat(formData.amount),
            ...formData
        };
        setBills([...bills, newBill])
    }

    console.log(formData)

  return (
    <>
        <p>Add Bills</p>
        <label htmlFor="title">Title</label>
        <input type="text" name='title' value={formData.title} onChange={(e) => handleChange(e)}/>
        <label htmlFor="amount">Bills Amount</label>
        <input type="number" step='1' name='amount' value={formData.amount} onChange={(e) => handleChange(e)}/>
        <label htmlFor="nextDue">Next Billing Date</label>
        <input type="date" name="nextDue" placeholder={today} value={formData.nextDue} onChange={(e) => handleChange(e)}/>
        <label htmlFor="lastPaid">Last Paid Date</label>
        <input type="date" name="lastPaid" placeholder={today} value={formData.lastPaid} onChange={(e) => handleChange(e)}/>
        <label htmlFor="frequency">Bill Frequency</label>
        <select 
            name="frequency"
            value={formData.frequency}
            onChange={(e) => handleChange(e)}
        >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="biannually">Bi Annually</option>
            <option value="yearly">Yearly</option>
        </select>
        <button
            onClick={submitNewBill}
        >
            Add New Bill 🤮
        </button>
    </>
  )
}

export default AddBills