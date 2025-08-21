import bills from "../data/bills"
import { formatLocaleDate } from "../utils"

const BillsList = ({ today, weekFromToday }) => {

    const filteredBills = bills.filter(bill => bill.nextDue < formatLocaleDate(weekFromToday) || bill.nextDue > formatLocaleDate(today));
    console.log(filteredBills);
    console.log(formatLocaleDate(today))

  return (
    <>
        <h3>{formatLocaleDate(today)} - {formatLocaleDate(weekFromToday)}</h3>
        {filteredBills.length > 0 ? (
            filteredBills.map((bill) => (
                <div key={bill.id}>
                    <h4>{bill.title}</h4>
                    <div>
                        <p>Amount: {bill.amount}</p>
                        <p>Due Date: {bill.nextDue}</p>
                        <p>Paid for this month: </p>
                    </div>
                </div>
            ))
        ) : 
        <p> no bills to show</p>}
    </>
  )
}

export default BillsList