import bills from "../data/bills"
import { formatLocaleDate } from "../utils"

const BillsList = ({ today, weekFromToday }) => {

  return (
    <>
        <h3>{formatLocaleDate(today)} - {formatLocaleDate(weekFromToday)}</h3>
    </>
  )
}

export default BillsList