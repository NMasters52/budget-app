import React from 'react'
import bills from '../data/bills'

const BillsTable = () => {
  return (
    <table>
      {bills.length > 0 ? (
        bills.map((bill) => (
          <tr id={bill.title}>
            <th>{bill.title}</th>
            <td>{bill.amount}</td>
          </tr>
        ))
      ) :
      <tr>
        <th>No Bills to show</th>
      </tr>
      }
    </table>
  )
}

export default BillsTable