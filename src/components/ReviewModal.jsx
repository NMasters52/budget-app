import { useState } from "react";
import { formatedDate } from "../utils/dateUtils";

// Review sheet for bills with missed due dates found on load.
//
// Three choices per bill:
//   - "Paid outside the app": records the missed payments in history.
//   - "Skip dates": drops the missed dates without recording payments.
//   - "Still unpaid": leaves the bill flagged for later and hides it here.
//
// Bulk "mark all paid" / "skip all" buttons cover every listed bill.
const ReviewModal = ({ reviewBills = [], onResolve, onClose }) => {
  // Bills acknowledged as still unpaid: hidden from this list, still flagged
  // in the data (unpaidDueDates keeps them Over Due and under the banner).
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const visibleBills = reviewBills.filter(
    (bill) => !dismissedIds.has(bill.id),
  );

  const dismiss = (billId) => {
    setDismissedIds((prev) => new Set(prev).add(billId));
  };

  const resolveAll = (resolveAs) => {
    for (const bill of visibleBills) {
      onResolve(bill.id, bill.unpaidDueDates, resolveAs);
    }
    setDismissedIds(new Set());
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="flex items-center justify-center absolute inset-0 bg-black/30 backdrop-blur-sm">
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-lg max-h-[85vh] overflow-y-auto">
          <h3 className="mb-1 font-bold text-2xl">Review missed bills</h3>
          <p className="text-sm text-gray-600 mb-4">
            These bills had due dates pass while you were away. Schedules are
            already up to date &mdash; just tell us what happened.
          </p>

          {visibleBills.length === 0 ? (
            <p className="text-gray-700 py-4">
              Nothing left to decide. Bills left unpaid stay flagged
              &mdash; the banner above will bring them back.
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleBills.map((bill) => (
                <li
                  key={bill.id}
                  className="border-2 border-gray-300 rounded-md p-3"
                >
                  <div className="flex justify-between items-baseline">
                    <strong>{bill.title}</strong>
                    <span className="text-sm text-gray-600">
                      ${bill.amount} / {bill.frequency}
                    </span>
                  </div>

                  <p className="text-sm mt-1">
                    Missed ({bill.unpaidDueDates.length}):{" "}
                    {bill.unpaidDueDates.map(formatedDate).join(", ")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Next due: {formatedDate(bill.nextDue)}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1.5 rounded-md cursor-pointer"
                      onClick={() =>
                        onResolve(bill.id, bill.unpaidDueDates, "paid")
                      }
                    >
                      Paid outside the app
                    </button>
                    <button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-md cursor-pointer"
                      onClick={() =>
                        onResolve(bill.id, bill.unpaidDueDates, "skipped")
                      }
                    >
                      Skip dates
                    </button>
                    <button
                      type="button"
                      className="bg-white border-2 border-gray-400 hover:bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-md cursor-pointer"
                      onClick={() => dismiss(bill.id)}
                    >
                      Still unpaid
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 justify-between mt-5 pt-4 border-t-2 border-gray-200">
            <div className="flex gap-2">
              <button
                type="button"
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md cursor-pointer disabled:opacity-50"
                onClick={() => resolveAll("paid")}
                disabled={visibleBills.length === 0}
              >
                Mark all paid
              </button>
              <button
                type="button"
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md cursor-pointer disabled:opacity-50"
                onClick={() => resolveAll("skipped")}
                disabled={visibleBills.length === 0}
              >
                Skip all
              </button>
            </div>
            <button
              type="button"
              className="bg-white border-2 border-gray-400 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-md cursor-pointer"
              onClick={onClose}
            >
              Leave for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
