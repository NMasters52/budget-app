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
  getBillStatus,
  markBillAsPaid,
  parseLocalDate,
} from "../utils/dateUtils";

const BillsTable = ({ bills = [], setBills, today, weekFromToday }) => {
  const [filter, setFilter] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [billsIDToEdit, setBillsIDToEdit] = useState("");
  const [latePaymentAlert, setLatePaymentAlert] = useState(null);

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
          return (
            parseLocalDate(a.nextDue).getTime() -
            parseLocalDate(b.nextDue).getTime()
          );
        case "descendingDate":
          return (
            parseLocalDate(b.nextDue).getTime() -
            parseLocalDate(a.nextDue).getTime()
          );
        default:
          return 0;
      }
    });
  }, [bills, filter]);

  const handleMarkPaid = (billId) => {
    const bill = bills.find((b) => b.id === billId);
    const todayDate = new Date();
    const wasLate = bill.nextDue && new Date(bill.nextDue) < todayDate;

    const updatedBills = markBillAsPaid(bills, billId);
    setBills(updatedBills);

    // Show alert if payment was late
    if (wasLate && bill.nextDue) {
      const paidBill = updatedBills.find((b) => b.id === billId);
      const latestPayment =
        paidBill?.paymentHistory?.[paidBill.paymentHistory.length - 1];

      if (latestPayment) {
        setLatePaymentAlert({
          billName: bill.title,
          dueDate: formatedDate(bill.nextDue),
          paidDate: formatedDate(latestPayment.date),
          daysLate: Math.floor(
            (todayDate - new Date(bill.nextDue)) / (1000 * 60 * 60 * 24),
          ),
        });

        setTimeout(() => setLatePaymentAlert(null), 5000);
      }
    }
  };

  const STATUS_MAP = {
    paid: { text: "Paid", color: "bg-green-500" },
    paid_late: { text: "Paid Late", color: "bg-orange-500" },
    overdue: { text: "Over Due", color: "bg-red-500" },
    due_soon: { text: "Due Soon", color: "bg-yellow-500" },
    pending: { text: "Pending", color: "bg-blue-500" },
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
  };

  return (
    <>
      {/* Late Payment Alert */}
      {latePaymentAlert && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
          role="alert"
        >
          <p className="font-bold">Late Payment Recorded</p>
          <p>
            <strong>{latePaymentAlert.billName}</strong> was paid{" "}
            <strong>{latePaymentAlert.daysLate} days late</strong>. Due:{" "}
            {latePaymentAlert.dueDate} | Paid: {latePaymentAlert.paidDate}
          </p>
        </div>
      )}

      {/* when the edit button is clicked */}
      {isEditModalOpen && billsIDToEdit && (
        <div className="fixed inset-0  z-50">
          <div className="flex items-center justify-center absolute inset-0 bg-black/30 backdrop-blur-sm">
            <div className="relative bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
              <EditModal
                bill={bill}
                bills={bills}
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
                  const statusKey = getBillStatus(bill, today);
                  const status = STATUS_MAP[statusKey];

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
                        {bill.lastPaid ? formatedDate(bill.lastPaid) : "Never"}
                      </td>
                      <td
                        className={`text-center px-4 py-2 border border-black ${status.color}`}
                      >
                        {status.text}
                      </td>
                      <td className="text-center px-4 py-2 border border-black">
                        {bill.paymentHistory &&
                          bill.paymentHistory.some((p) => p.wasLate) && (
                            <span className="text-xs text-orange-600 mr-1">
                              ⚠️ Late history
                            </span>
                          )}
                        <button
                          className={`${
                            status.text === "Paid" ||
                            status.text === "Paid Late"
                              ? "bg-gray-500"
                              : "bg-green-500 hover:bg-green-600 cursor-pointer"
                          }  text-white p-2  shadow-md rounded-md`}
                          onClick={() => handleMarkPaid(bill.id)}
                          disabled={
                            status.text === "Paid" ||
                            status.text === "Paid Late"
                          }
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
                  <td className="p-2" colSpan={9}>
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
