import { getBillStatus, formatLocaleDate, markBillAsPaid } from "../utils/dateUtils";

const STATUS_BORDER_MAP = {
  paid: "border-green-400",
  paid_late: "border-orange-400",
  overdue: "border-red-400",
  due_soon: "border-yellow-400",
  pending: "border-blue-400",
};

const STATUS_LABEL_MAP = {
  paid: "Paid",
  paid_late: "Paid Late",
  overdue: "Overdue",
  due_soon: "Due Soon",
  pending: "Pending",
};

const STATUS_BADGE_MAP = {
  paid: "bg-green-50 text-green-600",
  paid_late: "bg-orange-50 text-orange-600",
  overdue: "bg-red-50 text-red-600",
  due_soon: "bg-yellow-50 text-yellow-700",
  pending: "bg-blue-50 text-blue-600",
};

const BillsListCard = ({ bill, bills, setBills }) => {
  const statusKey = getBillStatus(bill);
  const borderColor = STATUS_BORDER_MAP[statusKey];
  const statusBadge = STATUS_BADGE_MAP[statusKey];
  const statusLabel = STATUS_LABEL_MAP[statusKey];
  const isPaid = statusKey === "paid" || statusKey === "paid_late";

  const handleMarkPaid = () => {
    const updatedBills = markBillAsPaid(bills, bill.id);
    setBills(updatedBills);
  };

  return (
    <div
      className={`border-s-[3px] ${borderColor} bg-white rounded-xl px-5 py-4 mt-3 transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-lg text-gray-800 truncate">{bill.title}</h4>
            <span
              className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge}`}
            >
              {statusLabel}
            </span>
          </div>

          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            ${bill.amount}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-400">
            <span>
              Due{" "}
              <span className="text-gray-600 font-medium">
                {formatLocaleDate(bill.nextDue)}
              </span>
            </span>
            <span>
              Last paid{" "}
              <span className="text-gray-600 font-medium">
                {bill.lastPaid ? formatLocaleDate(bill.lastPaid) : "Never"}
              </span>
            </span>
            <span>
              Frequency{" "}
              <span className="text-gray-600 font-medium">
                {bill.frequency}
              </span>
            </span>
          </div>
        </div>

        {/* Desktop: inline button */}
        <button
          onClick={handleMarkPaid}
          disabled={isPaid}
          className={`hidden sm:flex shrink-0 text-sm font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all mt-1 ${
            isPaid
              ? "bg-gray-50 text-gray-300 cursor-default"
              : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 active:scale-95 shadow-sm"
          }`}
        >
          {isPaid ? "✓ Paid" : "Pay"}
        </button>
      </div>

      {/* Mobile: full-width button */}
      <button
        onClick={handleMarkPaid}
        disabled={isPaid}
        className={`sm:hidden w-full mt-3 text-base font-semibold py-3 rounded-lg cursor-pointer transition-all ${
          isPaid
            ? "bg-gray-50 text-gray-300 cursor-default"
            : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 active:scale-[0.98] shadow-sm"
        }`}
      >
        {isPaid ? "✓ Paid" : "Mark as Paid"}
      </button>
    </div>
  );
};

export default BillsListCard;
