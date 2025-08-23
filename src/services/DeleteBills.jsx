import {  HiTrash } from 'react-icons/hi';

const DeleteBills = ({ billID, bills, setBills }) => {

    const onDelete = () => {
        setBills(bills.filter(bill => billID !== bill.id))
    }

  return (
    <button onClick={onDelete} className="bg-red-500 hover:bg-red-400 text-white text-2xl p-2 rounded-md cursor-pointer">
         < HiTrash />
    </button>
  )
}

export default DeleteBills