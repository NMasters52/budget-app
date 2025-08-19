import React from 'react'
import bills from '../data/bills'

const BillsTable = () => {
  return (
    <table>
      {bills.length > 0 ? (
        <tr>
          <th>Bills are here</th>
        </tr>
      ) :
      <tr>
        <th>No Bills to show</th>
      </tr>
      }
    </table>
  )
}

export default BillsTable