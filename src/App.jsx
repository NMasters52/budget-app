import { useState, useEffect } from 'react';

//components
import BillsTable from './components/BillsTable'
import BillsList from './components/BillsList'

//utilities 
import { addDays } from './utils/dateUtils';
import AddBills from './services/AddBills';
import BillsTotal from './components/BillsTotal';

const App = () => {

  const [bills, setBills] = useState(() => {
    const bills = JSON.parse(localStorage.getItem('bills'));
    return bills || [];
  })
  const [today, setToday] = useState(new Date());
  const [weekFromToday, setWeekFromToday] = useState(new Date());
  
  useEffect(() => {
      const currentDate = new Date();
      setToday(currentDate);
      setWeekFromToday(addDays(currentDate, 7));
  }, []);

  useEffect(() => {
      localStorage.setItem('bills', JSON.stringify(bills))
  }, [bills]) 

  return (
    <main className="p-5 w-max-xl">
      <h1 className="text-2xl font-black mb-2">💰 Budget App</h1>
      <BillsTable bills={bills} setBills={setBills} today={today} />
      <BillsTotal bills={bills} today={today} weekFromToday={weekFromToday} />
      <BillsList bills={bills} today={today} weekFromToday={weekFromToday} />
      <AddBills bills={bills} setBills={setBills} today={today} />
    </main>
  )
}

export default App