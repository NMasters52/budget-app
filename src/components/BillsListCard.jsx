import { isBillPaidThisPeriod, formatLocaleDate } from "../utils/dateUtils";

const BillsListCard = ({ bill }) => {

    const getBillStatus = (bill) => {
        const nextDue = new Date(bill.nextDue);
        const todaysDate = new Date();
        
        const monthStart = new Date(todaysDate.getFullYear(), todaysDate.getMonth(), 1);
        const monthEnd = new Date(todaysDate.getFullYear(), todaysDate.getMonth() + 1, 0);
    
        if (isBillPaidThisPeriod(bill, monthStart, monthEnd)) {
          return {text: 'Paid', color: 'border-green-500'};
        }
    
        if (nextDue < todaysDate) {
          return {text: 'Over Due', color: 'border-red-500'};
        }
    
        const sevenDaysFromNow = new Date(todaysDate);
        sevenDaysFromNow.setDate(todaysDate.getDate() + 7);
    
        if (nextDue <= sevenDaysFromNow) {
            return {text: 'Due Soon', color: 'border-yellow-500'};
        }
    
        return {text: 'Pending', color: 'border-blue-500'};
      }

      const status = getBillStatus(bill);

  return (
    <div dir="ltr"  className={`border-s-4 ${status.color} bg-white rounded-r-lg shadow-md px-2 py-4 my-2 flex flex-col space-y-2 w-lg mt-10`}>
        <h4 className='font-bold text-lg'>{bill.title}</h4>
        <div className="flex space-x-2">
            <p className="bg-blue-500 text-white p-2 rounded-xl text-sm font-semibold">Amount: ${bill.amount}</p>
            <p className="bg-blue-500 text-white p-2 rounded-xl text-sm font-semibold">Due Date: {formatLocaleDate(bill.nextDue)}</p>
            <p className="bg-blue-500 text-white p-2 rounded-xl text-sm font-semibold">Last Paid: {formatLocaleDate(bill.lastPaid)}</p>
        </div>
    </div>
  )
}

export default BillsListCard