import { toISODate, addDays } from "../utils/dateUtils";

const BillsTotal = ({ bills, today, weekFromToday }) => {
    
    //amount to make it through the week
    const totalThisWeek = bills.filter(bill => 
        bill.nextDue >= toISODate(today) && 
        bill.nextDue <= toISODate(weekFromToday)
    )
    .reduce((acc, bill) => acc + bill.amount, 0);

    //amount to make it through the month
    const monthFromToday = addDays(today, 31);
    const totalThisMonth = bills.filter((bill) => bill.nextDue >= toISODate(today) && bill.nextDue <= toISODate(monthFromToday)).reduce((acc, bill) => acc + bill.amount, 0)

    //amount to make it through the year
    const totalThisYear = bills.reduce((acc, bill) => acc + bill.amount, 0 )

  return (
    <div className="w-1/2 border-2 border-green-600 flex justify-center mx-auto space-x-4 p-2 rounded-md mt-2">
        <strong>Total this week:<span className="text-md font-normal">${totalThisWeek}</span></strong>
        <strong>Total this month: <span className="text-md font-normal">${totalThisMonth}</span></strong>
        <strong>Total this year: <span className="text-md font-normal">${totalThisYear}</span></strong>
    </div>
  )
}

export default BillsTotal