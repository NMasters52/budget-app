import React from 'react'
import bills from '../data/bills'

const BillsTable = () => {
  return (
    <table className="table-auto w-full border-collapse border border-black">
      <thead>
        <tr>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Bill Names</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Cost</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Frequency</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Next Due Date</th>
          <th className="text-center px-4 py-2 bg-gray-200 border border-black">Last Paid</th>
        </tr>
      </thead>
        <tbody>
          {bills.length > 0 ? (
            bills.map((bill) => (
              <tr key={bill.id}>
                <td className="text-center px-4 py-2 border border-black">{bill.title}</td>
                <td className="text-center px-4 py-2 border border-black">{bill.amount}</td>
                <td className="text-center px-4 py-2 border border-black">{bill.frequency}</td>
                <td className="text-center px-4 py-2 border border-black">{bill.nextDue}</td>
                <td className="text-center px-4 py-2 border border-black">{bill.lastPaid}</td>
              </tr>
            ))
          ) :
          <tr>
            <td>No bills to show</td>
          </tr>
          }
        </tbody>
    </table>
  )
}

export default BillsTable