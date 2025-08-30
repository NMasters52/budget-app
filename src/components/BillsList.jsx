import { useState } from "react";
import { formatLocaleDate, toISODate, addDays } from "../utils/dateUtils"

const BillsList = ({ today, bills }) => {

    const [filteredDay, setFilteredDay] = useState(new Date());

    const weekAfterFilteredDay = addDays(filteredDay, 7);

    //filtering bills by week
    const filteredBills = bills.filter(bill => 
        bill.nextDue >= toISODate(filteredDay) && 
        bill.nextDue <= toISODate(weekAfterFilteredDay)
    );

    const totalCost = filteredBills.reduce((acc, bill) => acc + bill.amount, 0);


  return (
    <div className="flex flex-col items-center justify-center mt-5 mb-5">
        <h2 className="font-black">Bills Upcoming</h2>
        <div className="text-center">
            <p>{formatLocaleDate(filteredDay)} - {formatLocaleDate(weekAfterFilteredDay)} </p>
            <p>Total Amount needed: ${totalCost}</p>
        </div>

        <div className="border-2 border-gray-500 p-2 rounded-md mt-2 ">
            <label htmlFor="nextDue" className="text-md font-semibold">Choose starting date:</label>
            <input 
                type="date" 
                name="nextDue" 
                placeholder={today} 
                value={toISODate(filteredDay)} 
                onChange={(e) => setFilteredDay(e.target.valueAsDate)}
                className="w-full border-2 border-black rounded-sm mt-2"
            />
        </div>

        
        {filteredBills.length > 0 ? (
            filteredBills.map((bill) => (
                <div key={bill.id} className="border-2 border-gray-600 rounded-lg shadow-md p-2 my-2 flex flex-col space-y-2 w-lg">
                    <h4 className='font-bold'>{bill.title}</h4>
                    <div className="flex space-x-2">
                        <p className="border-1 border-gray-500 p-2 rounded-xl text-sm">Amount: {bill.amount}</p>
                        <p className="border-1 border-gray-500 p-2 rounded-xl text-sm">Due Date: {bill.nextDue}</p>
                        <p className="border-1 border-gray-500 p-2 rounded-xl text-sm">Last Paid: {bill.lastPaid}</p>
                    </div>
                </div>
            ))
        ) : 
        <p className="font-black text-xl mt-2">No bills to show... Add a bill below.</p>}
    </div>
  )
}

export default BillsList