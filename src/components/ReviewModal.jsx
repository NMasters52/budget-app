import { useState } from "react";
import { formatedDate } from "../utils/dateUtils";

//design system
import { CandyButton, ModalShell, StickerCard } from "./ui";

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
    <ModalShell title="Review missed bills" onClose={onClose} wide>
      <p className="mb-4 text-sm font-semibold text-[#6f6b61]">
        These bills had due dates pass while you were away. Schedules are
        already up to date — just tell us what happened.
      </p>

      {visibleBills.length === 0 ? (
        <p className="py-4 font-semibold text-[#1d1b16]">
          Nothing left to decide. Bills left unpaid stay flagged — the banner
          will bring them back.
        </p>
      ) : (
        <ul className="space-y-3">
          {visibleBills.map((bill) => (
            <li key={bill.id}>
              <StickerCard tone="coral">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display text-base font-bold text-[#1d1b16]">
                    {bill.title}
                  </h4>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-[#6f6b61]">
                    ${Number(bill.amount).toFixed(2)} / {bill.frequency}
                  </span>
                </div>

                <p className="mt-1 text-[13px] font-bold text-[#d64522]">
                  Missed ({bill.unpaidDueDates.length}):{" "}
                  <span className="font-semibold text-[#6f6b61]">
                    {bill.unpaidDueDates.map(formatedDate).join(", ")}
                  </span>
                </p>
                <p className="text-[13px] font-semibold text-[#6f6b61]">
                  Next due: {formatedDate(bill.nextDue)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <CandyButton
                    tone="teal"
                    size="sm"
                    onClick={() =>
                      onResolve(bill.id, bill.unpaidDueDates, "paid")
                    }
                  >
                    Paid outside the app
                  </CandyButton>
                  <CandyButton
                    tone="ghost"
                    size="sm"
                    onClick={() =>
                      onResolve(bill.id, bill.unpaidDueDates, "skipped")
                    }
                  >
                    Skip dates
                  </CandyButton>
                  <CandyButton tone="coral" size="sm" onClick={() => dismiss(bill.id)}>
                    Still unpaid
                  </CandyButton>
                </div>
              </StickerCard>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t-2 border-[#1d1b16]/10 pt-4">
        <div className="flex gap-2">
          <CandyButton
            tone="teal"
            size="md"
            onClick={() => resolveAll("paid")}
            disabled={visibleBills.length === 0}
          >
            Mark all paid
          </CandyButton>
          <CandyButton
            tone="ghost"
            size="md"
            onClick={() => resolveAll("skipped")}
            disabled={visibleBills.length === 0}
          >
            Skip all
          </CandyButton>
        </div>
        <CandyButton tone="ink" size="md" onClick={onClose}>
          Leave for now
        </CandyButton>
      </div>
    </ModalShell>
  );
};

export default ReviewModal;
