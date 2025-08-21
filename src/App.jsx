import React from 'react'
import BillsTable from './components/BillsTable'
import BillsList from './components/BillsList'

const App = () => {
  return (
    <div className="">
      <h1>Budget App</h1>
      <BillsTable />
      <BillsList />
    </div>
  )
}

export default App