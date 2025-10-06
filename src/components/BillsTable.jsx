import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

//components
import DeleteBills from "../services/DeleteBills";
import BillsTotal from "./BillsTotal";
import BillsFilter from "./BillsFilter";
import EditModal from "./EditModal";

//helper functions
import {
  formatedDate,
  isBillPaidThisPeriod,
  markBillAsPaid,
} from "../utils/dateUtils";

const BillsTable = ({ bills = [], setBills, today, weekFromToday }) => {
  const [filter, setFilter] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [billsIDToEdit, setBillsIDToEdit] = useState("");

  const filteredBills = useMemo(() => {
    //useMemo is used here to skip extra rerenders of the shallow array created
    const list = bills.slice(); //creating a shallow copy to not mutate state

    return list.sort((a, b) => {
      switch (filter) {
        case "ascendingPrice":
          return a.amount - b.amount;
        case "descendingPrice":
          return b.amount - a.amount;
        case "ascendingDate":
          return new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime();
        case "descendingDate":
          return new Date(b.nextDue).getTime() - new Date(a.nextDue).getTime();
        default:
          return 0;
      }
    });
  }, [bills, filter]);

  const handleMarkPaid = (billId) => {
    const updatedBills = markBillAsPaid(bills, billId);
    setBills(updatedBills);
  };

  const getBillStatus = (bill) => {
    const nextDue = new Date(bill.nextDue);
    const todaysDate = new Date(today);

    const monthStart = new Date(
      todaysDate.getFullYear(),
      todaysDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      todaysDate.getFullYear(),
      todaysDate.getMonth() + 1,
      0
    );

    if (isBillPaidThisPeriod(bill, monthStart, monthEnd)) {
      return { text: "Paid", color: "bg-green-500" };
    }

    if (nextDue < todaysDate) {
      return { text: "Over Due", color: "bg-red-500" };
    }

    const sevenDaysFromNow = new Date(todaysDate);
    sevenDaysFromNow.setDate(todaysDate.getDate() + 7);

    if (nextDue <= sevenDaysFromNow) {
      return { text: "Due Soon", color: "bg-yellow-500" };
    }

    return { text: "Pending", color: "bg-blue-500" };
  };

  const addBillsLinkStyles =
    "text-green-500 hover:underline hover:underline-offset-4";

  // edit logics
  const openEditModal = (billID) => {
    setIsEditModalOpen(true);
    setBillsIDToEdit(billID);
  };

  const bill = bills.find((bill) => bill.id === billsIDToEdit);

  const onEditFormSubmit = (updated) => {
    setBills(bills.map((bill) => (bill.id === updated.id ? updated : bill)));
    setIsEditModalOpen(false);
    console.log(updated);
  };

  return (
    <>
      {/* when the edit button is clicked */}
      {isEditModalOpen && billsIDToEdit && (
        <div className="fixed inset-0  z-50">
          <div className="flex items-center justify-center absolute inset-0 bg-black/30 backdrop-blur-sm">
            <div className="relative bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
              <EditModal
                bill={bill}
                onClose={() => setIsEditModalOpen(false)}
                onSave={onEditFormSubmit}
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <BillsFilter filter={filter} setFilter={setFilter} />
        <BillsTotal bills={bills} today={today} weekFromToday={weekFromToday} />
      </div>

      <div className="mx-auto w-full px-4 sm:px-6">
        <div className="relative overflow-x-auto">
          <table className="bg-white table-auto w-max-96 mx-auto border-2 border-collapse border-gray-500">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 outline outline-black text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Bill Names
                </th>
                <th className="text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Cost
                </th>
                <th className="text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Frequency
                </th>
                <th className="text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Next Due Date
                </th>
                <th className="text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Last Paid
                </th>
                <th className="text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Bill Status
                </th>
                <th className="text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Mark Paid
                </th>
                <th className="text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Delete Bill
                </th>
                <th className="text-center px-4 py-2 bg-green-100 border border-gray-500">
                  Edit Bill
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => {
                  const status = getBillStatus(bill);

                  return (
                    <tr key={bill.id}>
                      <td className="bg-white sticky left-0 z-10 outline outline-black text-center px-4 py-2 border border-black">
                        {bill.title}
                      </td>
                      <td className="text-center px-4 py-2 border border-black">
                        ${bill.amount}
                      </td>
                      <td className="text-center px-4 py-2 border border-black">
                        {bill.frequency}
                      </td>
                      <td className="text-center px-4 py-2 border border-black">
                        {formatedDate(bill.nextDue)}
                      </td>
                      <td className="text-center px-4 py-2 border border-black">
                        {formatedDate(bill.lastPaid)}
                      </td>
                      <td
                        className={`text-center px-4 py-2 border border-black ${status.color}`}
                      >
                        {status.text}
                      </td>
                      <td className="text-center px-4 py-2 border border-black">
                        <button
                          className={`${
                            status.text === "Paid"
                              ? "bg-gray-500"
                              : "bg-green-500 hover:bg-green-600 cursor-pointer"
                          }  text-white p-2  shadow-md rounded-md`}
                          onClick={() => handleMarkPaid(bill.id)}
                          disabled={status.text === "Paid"}
                        >
                          Mark Paid
                        </button>
                      </td>
                      <td className="text-center px-4 py-2 sm:px-3 sm:py-2 border border-black">
                        {" "}
                        <DeleteBills
                          billID={bill.id}
                          bills={bills}
                          setBills={setBills}
                        />{" "}
                      </td>
                      <td className="text-center px-4 py-2 sm:px-3 sm:py-2 border border-black">
                        <button
                          className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 cursor-pointer"
                          onClick={() => openEditModal(bill.id)}
                        >
                          Edit Bills
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-2">
                    No bills to show. Add a new bill{" "}
                    <Link to="/addBill" className={addBillsLinkStyles}>
                      here
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default BillsTable;
