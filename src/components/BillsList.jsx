import { useState } from "react";
import { formatLocaleDate, toISODate, addDays } from "../utils/dateUtils"
import BillsListCard from "./BillsListCard";

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
    <div className="flex flex-col items-center justify-center mt-5">
        <div className="text-center bg-white p-4 border-2 border-gray-400 rounded-md">
            <h2 className="font-black text-xl mb-1">Bills Preview</h2>
            <div className="text-center">
                <p>{formatLocaleDate(filteredDay)} - {formatLocaleDate(weekAfterFilteredDay)} </p>
                <p>Total Amount Needed: ${totalCost}</p>
            </div>

            <div className=" p-2 rounded-md mt-2 bg-white">
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
        </div>
        

        
        {filteredBills.length > 0 ? (
            filteredBills.map((bill) => (
                <BillsListCard key={bill.id} bill={bill} />
            ))
        ) : 
        <p className="font-black text-xl mt-2">No bills to show... Add a bill below.</p>}
    </div>
  )
}

export default BillsList