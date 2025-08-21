import { useState } from 'react'

const AddBills = ( { bills, setBills } ) => {

   
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
    console.log(formData)

  return (
    <>
        <p>Add Bills</p>
        <label htmlFor="title">Title</label>
        <input type="text" name='title' value={formData.title} onChange={(e) => handleChange(e)}/>
        <label htmlFor="amount">Bills Amount</label>
        <input type="number" step='1' name='amount' value={formData.amount} onChange={(e) => handleChange(e)}/>

    </>
  )
}

export default AddBills