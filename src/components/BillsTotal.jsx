import { toISODate, addDays, calculateYearlyTotal } from "../utils/dateUtils";

const BillsTotal = ({ bills, today, weekFromToday }) => {
    
    //all the bills added for the week
    const totalThisWeek = bills.filter(bill => 
        bill.nextDue >= toISODate(today) && 
        bill.nextDue <= toISODate(weekFromToday)
    )
    .reduce((acc, bill) => acc + bill.amount, 0);

    //all the bills added for the month
    const monthFromToday = addDays(today, 31);
    const totalThisMonth = bills.filter((bill) => bill.nextDue >= toISODate(today) && bill.nextDue <= toISODate(monthFromToday)).reduce((acc, bill) => acc + bill.amount, 0)

    //all the bills added for the year
    const totalThisYear = calculateYearlyTotal(bills)

  return (
    <div className="w-1/2 border-2 bg-white border-gray-500 flex justify-center mx-auto space-x-4 p-2 rounded-md mt-2">
        <strong>Total this week:<span className="text-md font-normal">${totalThisWeek}</span></strong>
        <strong>Total this month: <span className="text-md font-normal">${totalThisMonth}</span></strong>
        <strong>Total this year: <span className="text-md font-normal">${totalThisYear}</span></strong>
    </div>
  )
}

export default BillsTotal