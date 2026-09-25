import { getBillStatus, formatLocaleDate, markBillAsPaid } from "../utils/dateUtils";

//design system
import { CandyButton, Sticker, StickerCard } from "./ui";

const STATUS_MAP = {
  paid: { label: "Paid", tone: "teal", cardTone: "teal" },
  paid_late: { label: "Paid late", tone: "mango", cardTone: "default" },
  overdue: { label: "Overdue", tone: "coral", cardTone: "coral" },
  due_soon: { label: "Due soon", tone: "mango", cardTone: "mango" },
  pending: { label: "Scheduled", tone: "slate", cardTone: "default" },
};

const BillsListCard = ({ bill, bills, setBills, style }) => {
  const statusKey = getBillStatus(bill);
  const status = STATUS_MAP[statusKey];
  const isPaid = statusKey === "paid" || statusKey === "paid_late";

  const handleMarkPaid = () => {
    const updatedBills = markBillAsPaid(bills, bill.id);
    setBills(updatedBills);
  };

  return (
    <StickerCard
      tone={status.cardTone}
      className="animate-rise mt-3 transition-transform hover:-translate-y-0.5"
      style={style}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-display text-lg font-bold text-[#1d1b16]">
              {bill.title}
            </h4>
            <Sticker tone={status.tone}>{status.label}</Sticker>
          </div>

          <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-[#1d1b16]">
            ${Number(bill.amount).toFixed(2)}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] font-semibold text-[#827e74]">
            <span>
              Due{" "}
              <span className="text-[#6f6b61]">
                {formatLocaleDate(bill.nextDue)}
              </span>
            </span>
            <span>
              Last paid{" "}
              <span className="text-[#6f6b61]">
                {bill.lastPaid ? formatLocaleDate(bill.lastPaid) : "never"}
              </span>
            </span>
            <span>
              <span className="text-[#6f6b61]">{bill.frequency}</span>
            </span>
          </div>
        </div>

        {/* Desktop: inline candy pay button */}
        <CandyButton
          tone="coral"
          size="sm"
          onClick={handleMarkPaid}
          disabled={isPaid}
          className="mt-1 hidden shrink-0 sm:inline-flex"
        >
          {isPaid ? "✓ Paid" : "Pay"}
        </CandyButton>
      </div>

      {/* Mobile: full-width candy pay button */}
      <CandyButton
        tone="coral"
        size="md"
        onClick={handleMarkPaid}
        disabled={isPaid}
        className="mt-3 w-full sm:hidden"
      >
        {isPaid ? "✓ Paid" : "Mark as paid"}
      </CandyButton>
    </StickerCard>
  );
};

export default BillsListCard;
