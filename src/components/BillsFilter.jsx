import React from 'react'

const BillsFilter = ({ filter, setFilter}) => {
  return (
    <div className=" bg-white mb-2 w-[300px] mx-auto flex justify-between border-2 border-gray-500 p-2 rounded-md">
      <h3 className="font-bold text-xl">Filters:</h3>
      <select 
        id="filterBills"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border-2 border-black text-sm"
      >
        <option value="">Select Filter</option>
        <option value="ascendingPrice"> Price: Low → High</option>
        <option value="descendingPrice">Price: High → Low</option>
        <option value="ascendingDate">Date: Earliest → Latest</option>
        <option value="descendingDate">Date: Latest → Earliest</option>
      </select>
    </div>
  )
}

export default BillsFilter