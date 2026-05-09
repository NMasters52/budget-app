import { getBillStatus, formatLocaleDate } from "../utils/dateUtils";

const STATUS_BORDER_MAP = {
  paid: "border-green-500",
  paid_late: "border-orange-500",
  overdue: "border-red-500",
  due_soon: "border-yellow-500",
  pending: "border-blue-500",
};

const BillsListCard = ({ bill }) => {
  const statusKey = getBillStatus(bill);
  const borderColor = STATUS_BORDER_MAP[statusKey];

  return (
    <div
      dir="ltr"
      className={`border-s-4 ${borderColor} bg-white rounded-r-lg shadow-md px-2 py-4 flex flex-col space-y-2 w-lg mt-7`}
    >
      <h4 className="font-bold text-lg">{bill.title}</h4>
      <div className="flex space-x-2">
        <p className="bg-blue-500 text-white p-2 rounded-xl text-sm font-semibold">
          Amount: ${bill.amount}
        </p>
        <p className="bg-blue-500 text-white p-2 rounded-xl text-sm font-semibold">
          Due Date: {formatLocaleDate(bill.nextDue)}
        </p>
        <p className="bg-blue-500 text-white p-2 rounded-xl text-sm font-semibold">
          Last Paid: {formatLocaleDate(bill.lastPaid)}
        </p>
      </div>
    </div>
  );
};

export default BillsListCard;
