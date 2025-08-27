import DeleteBills from '../services/DeleteBills'
import { formatLocaleDate, isBillPaidThisPeriod, markBillAsPaid } from '../utils/dateUtils'


const BillsTable = ({ bills, setBills, today }) => {

  const handleMarkPaid = (billId) => {
    const updatedBills = markBillAsPaid(bills, billId);
    setBills(updatedBills);
    console.log(bills)
  }

  const getBillStatus = (bill) => {
    const nextDue = new Date(bill.nextDue);
    const todaysDate = new Date(today);
    console.log(nextDue > todaysDate)
    
    
    const monthStart = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), 1);
    const monthEnd = new Date(todaysDate.getFullYear(), todaysDate.getMonth() + 1, 0);

    if (isBillPaidThisPeriod(bill, monthStart, monthEnd)) {
      return {text: 'Paid', color: 'bg-green-500'};
    }

    if (nextDue < todaysDate) {
      return {text: 'Over Due', color: 'bg-red-500'};
    }

    const sevenDaysFromNow = new Date(todaysDate);
    sevenDaysFromNow.setDate(todaysDate.getDate() + 7);

    if (nextDue <= sevenDaysFromNow) {
        return {text: 'Due Soon', color: 'bg-yellow-500'};
    }

    return {text: 'Pending', color: 'bg-blue-500'};
  }

  console.log(bills.length)

  return (
    <table className="table-auto w-full border-collapse border border-black">
      <thead>
        <tr>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Bill Names</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Cost</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Frequency</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Next Due Date</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Last Paid</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Bill Status</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Mark Paid</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Delete Bill</th>
        </tr>
      </thead>
        <tbody>
          {bills.length > 0 ? (
            bills.map((bill) => {
              const status = getBillStatus(bill);

              return (
                <tr key={bill.id}>
                <td className="text-center px-4 py-2 border border-black">{bill.title}</td>
                <td className="text-center px-4 py-2 border border-black">{bill.amount}</td>
                <td className="text-center px-4 py-2 border border-black">{bill.frequency}</td>
                <td className="text-center px-4 py-2 border border-black">{formatLocaleDate(bill.nextDue)}</td>
                <td className="text-center px-4 py-2 border border-black">{formatLocaleDate(bill.lastPaid)}</td>
                <td className={`text-center px-4 py-2 border border-black ${status.color}`}>{status.text}</td>
                <td className="text-center px-4 py-2 border border-black">
                  <button 
                    className="cursor-pointer bg-green-500 text-white p-2 hover:bg-green-600 shadow-md rounded-md"
                    onClick={() => handleMarkPaid(bill.id)}
                  >
                    Mark Paid
                  </button>
                </td>
                <td className="text-center px-4 py-2 border border-black"> <DeleteBills billID={bill.id} bills={bills} setBills={setBills} /> </td>
              </tr>
              )
            })
          ) :
          <tr>
            <td className="p-2">No bills to show. Add a new bill to begin.</td>
          </tr>
          }
        </tbody>
    </table>
  )
}

export default BillsTable