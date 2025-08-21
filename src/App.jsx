import { useState, useEffect } from 'react';
import BillsTable from './components/BillsTable'
import BillsList from './components/BillsList'
import { addDays } from './utils';


const App = () => {

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
      <BillsTable />
      <BillsList today={today} weekFromToday={weekFromToday} />
    </div>
  )
}

export default App