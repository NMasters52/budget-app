import { useState, useEffect } from 'react';

//components
import BillsTable from './components/BillsTable'
import BillsList from './components/BillsList'

//utilities 
import { addDays } from './utils/dateUtils';
import initialBills from './data/bills';
import AddBills from './services/AddBills';

const App = () => {

  const [bills, setBills] = useState(() => initialBills.length ? initialBills : [])
  const [today, setToday] = useState(new Date());
  const [weekFromToday, setWeekFromToday] = useState(new Date());
  
  useEffect(() => {
      const currentDate = new Date();
      setToday(currentDate);
      setWeekFromToday(addDays(currentDate, 7));
  }, []);

  return (
    <div className="">
      <h1>Budget App</h1>
      <BillsTable bills={bills} />
      <BillsList bills={bills} today={today} weekFromToday={weekFromToday} />
      <AddBills bills={bills} setBills={setBills} today={today} />
    </div>
  )
}

export default App