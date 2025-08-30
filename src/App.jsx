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

  useEffect(() => {
      localStorage.setItem('bills', JSON.stringify(bills))
  }, [bills]) 

  const today = new Date();
  const weekFromToday = addDays(today, 7);

  return (
    <main className="bg-gray-100 h-screen">
      <Nav/>
      <Routes>
        <Route path="/" element={<BillsTable bills={bills} setBills={setBills} today={today} weekFromToday={weekFromToday} />} />
        <Route path="/list" element={<BillsList bills={bills} today={today} weekFromToday={weekFromToday} />}  />
        <Route path="/addBill" element={<AddBills bills={bills} setBills={setBills} today={today} />}  />
      </Routes>
    </main>
  )
}

export default App