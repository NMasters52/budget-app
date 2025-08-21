import { useEffect, useState } from "react"
import bills from "../data/bills"
import { addDays, formatLocaleDate } from "../utils";

const BillsList = () => {

    const [today, setToday] = useState(new Date());
    const [weekFromToday, setWeekFromToday] = useState(new Date());

    useEffect(() => {
        const currentDate = new Date();
        setToday(currentDate);
        setWeekFromToday(addDays(currentDate, 7));
    }, []);

  return (
    <>
    <h3>{formatLocaleDate(today)} - {formatLocaleDate(weekFromToday)}</h3>
    </>
  )
}

export default BillsList