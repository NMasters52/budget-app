import { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

//components
import BillsTable from './components/BillsTable'
import BillsList from './components/BillsList'
import AddBills from './services/AddBills';
import Nav from './Nav'

//utilities 
import { addDays } from './utils/dateUtils';


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
    <main className="w-max-xl">
      <Nav />
      <Routes>
        <Route path="/" element={<BillsTable bills={bills} setBills={setBills} today={today} weekFromToday={weekFromToday} />}  />
        <Route path="/list" element={<BillsList bills={bills} today={today} weekFromToday={weekFromToday} />}  />
        <Route path="/addBill" element={<AddBills bills={bills} setBills={setBills} today={today} />}  />
      </Routes>
    </main>
  )
}

export default App