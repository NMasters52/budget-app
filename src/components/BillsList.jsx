
import { formatLocaleDate, isBillPaid, toISODate } from "../utils/dateUtils"

const BillsList = ({ today, weekFromToday, bills }) => {

    const filteredBills = bills.filter(bill => 
        bill.nextDue >= toISODate(today) && 
        bill.nextDue <= toISODate(weekFromToday)
    );

    console.log(formatLocaleDate(weekFromToday), bills)

    const totalCost = filteredBills.reduce((acc, bill) => acc + bill.amount, 0);

  return (
    <div className="flex flex-col items-center justify-center mt-5 mb-5">
        <h2 className="font-black">Bills Upcoming</h2>
        <div className="text-center">
            <p>{formatLocaleDate(today)} - {formatLocaleDate(weekFromToday)} </p>
            <p>Total Amount needed: ${totalCost}</p>
        </div>
        
        {filteredBills.length > 0 ? (
            filteredBills.map((bill) => (
                <div key={bill.id} className="border-2 border-gray-600 rounded-lg shadow-md p-2 my-2 flex flex-col space-y-2 w-lg">
                    <h4 className='font-bold'>{bill.title}</h4>
                    <div className="flex space-x-2">
                        <p className="border-1 border-gray-500 p-2 rounded-xl text-sm">Amount: {bill.amount}</p>
                        <p className="border-1 border-gray-500 p-2 rounded-xl text-sm">Due Date: {formatLocaleDate(bill.nextDue)}</p>
                        <p className="border-1 border-gray-500 p-2 rounded-xl text-sm">Paid for this month: {isBillPaid(bill.nextDue, today) ? '✅' : '❌'}</p>
                    </div>
                </div>
            ))
        ) : 
        <p className="font-black text-xl mt-2">No bills to show... Add a bill below.</p>}
    </div>
  )
}

export default BillsList