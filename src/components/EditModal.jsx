import React from 'react'

const EditModal = ({isEditModalOpen, setIsEditModalOpen, billsIDToEdit, bills}) => {

    const targetedBillToEdit = bills.filter((bill) => bill.id === billsIDToEdit);

  return (
    <form className="bg-white">
       {/* take targeted bill cycle through the info to make a form */}
       {/* make a function to take the new informtaion and uddate the data. ps use localstorage. confirm the way we are doing this is how it is inteded. Is this mutating state directly? */}
    </form>
  )
}

export default EditModal