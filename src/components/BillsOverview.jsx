import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IoAdd,
  IoArrowDown,
  IoArrowUp,
  IoCreateOutline,
  IoTrashOutline,
} from "react-icons/io5";

//components
import EditModal from "./EditModal";
import ReviewModal from "./ReviewModal";

//design system
import {
  CandyButton,
  Meter,
  ModalShell,
  PageHeading,
  Sticker,
  StickerCard,
} from "./ui";
import { candyClasses } from "./uiClasses";

//helpers
import {
  addDays,
  calculateBillsTotal,
  calculateYearlyTotal,
  formatedDate,
  getBillStatus,
  getBillsNeedingReview,
  markBillAsPaid,
  parseLocalDate,
  resolveBillMissedDatesInList,
  toISODate,
} from "../utils/dateUtils";

// The bills overview: the Playground dashboard promoted to the real "/".
// Stat tiles, a tappable next-7-days strip, and sticker cards for each
// bill. Mark-paid, edit, delete, and the missed-payment review flow are
// the same behaviors the old table had.

const PILL = {
  paid: { label: "Paid", tone: "teal" },
  paid_late: { label: "Paid late", tone: "mango" },
  overdue: { label: "Overdue", tone: "coral" },
  due_soon: { label: "Due soon", tone: "mango" },
  pending: { label: "Scheduled", tone: "slate" },
};

const DOT = {
  paid: "bg-[#2aa8a0]",
  paid_late: "bg-[#f59f00]",
  overdue: "bg-[#ff6b4a]",
  due_soon: "bg-[#f59f00]",
  pending: "bg-[#c9c4b8]",
};

const PAID_STATUSES = new Set(["paid", "paid_late"]);

const STAT_COLORS = ["#2aa8a0", "#f59f00", "#ff6b4a"];

const pct = (part, whole) => Math.min(100, Math.round((part / (whole || 1)) * 100));

const shortDate = (isoDate) => {
  if (!isoDate) return "";
  const d = parseLocalDate(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Human relative wording for a due date ("in 3 days", "2 days late").
const dueRelation = (isoDate, todayDate) => {
  if (!isoDate) return "";
  const due = parseLocalDate(isoDate);
  const todayStart = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate(),
  );
  const days = Math.round((due - todayStart) / (1000 * 60 * 60 * 24));

  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "1 day late";
  return `${-days} days late`;
};

const BillsOverview = ({ bills = [], setBills, today }) => {
  const [sort, setSort] = useState("due");
  const [direction, setDirection] = useState("asc");
  // ISO date picked on the week strip; filters the cards to that day.
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingBillId, setEditingBillId] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [latePaymentAlert, setLatePaymentAlert] = useState(null);

  const reviewBills = getBillsNeedingReview(bills);
  const editingBill = bills.find((bill) => bill.id === editingBillId);

  // Next 7 days: one chip per day, with the bills due on it.
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(today, i);
        const iso = toISODate(date);
        return {
          iso,
          dayNum: date.getDate(),
          weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
          isToday: i === 0,
          bills: bills.filter((bill) => bill.nextDue === iso),
        };
      }),
    [bills, today],
  );

  const sorted = useMemo(() => {
    const dir = direction === "asc" ? 1 : -1;
    return [...bills].sort((a, b) =>
      sort === "amount"
        ? (Number(a.amount) - Number(b.amount)) * dir
        : (parseLocalDate(a.nextDue) - parseLocalDate(b.nextDue)) * dir,
    );
  }, [bills, sort, direction]);

  const visible = selectedDay
    ? bills.filter((bill) => bill.nextDue === selectedDay)
    : sorted;

  // Stat tiles: 7-day / 30-day sums plus the annual obligation, each with
  // a bar relative to the next-larger horizon.
  const stats = useMemo(() => {
    const weekEnd = toISODate(addDays(today, 7));
    const monthEnd = toISODate(addDays(today, 30));
    const sumThrough = (end) =>
      bills
        .filter(
          (bill) => bill.nextDue >= toISODate(today) && bill.nextDue <= end,
        )
        .reduce((acc, bill) => acc + Number(bill.amount), 0);

    const week = sumThrough(weekEnd);
    const month = sumThrough(monthEnd);
    const year = calculateYearlyTotal(bills);

    return [
      { label: "Next 7 days", value: week, bar: pct(week, month) },
      { label: "Next 30 days", value: month, bar: pct(month, year / 12) },
      { label: "Per year", value: year, bar: pct(month * 12, year) },
    ];
  }, [bills, today]);

  const overdueCount = bills.filter(
    (bill) => getBillStatus(bill, today) === "overdue",
  ).length;

  const toggleDay = (iso) =>
    setSelectedDay((current) => (current === iso ? null : iso));

  // "Mark paid": advance the schedule, record history, and surface an
  // alert when the payment was late. Same flow the old table used.
  const handleMarkPaid = (billId) => {
    const bill = bills.find((b) => b.id === billId);
    const todayCalendarDate = parseLocalDate(toISODate(new Date()));
    // Date-only compare, matching how markBillAsPaid records wasLate:
    // paying on the due date is on time, not late.
    const wasLate =
      bill.nextDue && todayCalendarDate > parseLocalDate(bill.nextDue);

    const updatedBills = markBillAsPaid(bills, billId);
    setBills(updatedBills);

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
            (todayCalendarDate - parseLocalDate(bill.nextDue)) /
              (1000 * 60 * 60 * 24),
          ),
        });

        setTimeout(() => setLatePaymentAlert(null), 5000);
      }
    }
  };

  const handleDelete = (bill) => {
    if (!window.confirm(`Delete "${bill.title}"? This cannot be undone.`)) {
      return;
    }
    setBills(bills.filter((b) => b.id !== bill.id));
  };

  const openEditModal = (billId) => setEditingBillId(billId);
  const closeEditModal = () => setEditingBillId("");

  const onEditSubmit = (updated) => {
    setBills(bills.map((bill) => (bill.id === updated.id ? updated : bill)));
    setEditingBillId("");
  };

  // Review sheet resolutions: "paid" records history, "skipped" drops dates.
  const resolveMissed = (billId, dates, resolveAs) => {
    setBills((currentBills) =>
      resolveBillMissedDatesInList(currentBills, billId, dates, resolveAs),
    );
  };

  const monthLabel = today.toLocaleString("en-US", { month: "long" });

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16">
      {/* Hero */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          kicker={`${monthLabel} ${today.getFullYear()}`}
          title="Your bills"
          sub={`${bills.length} on the books · ${
            overdueCount > 0
              ? `${overdueCount} overdue`
              : "nothing overdue"
          }`}
        />
        <Link to="/addBill" className={candyClasses("coral", "md")}>
          <IoAdd aria-hidden="true" /> Add a bill
        </Link>
      </header>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <StickerCard key={stat.label}>
            <p
              className="text-[11px] font-extrabold uppercase tracking-[0.16em]"
              style={{ color: STAT_COLORS[index] }}
            >
              {stat.label}
            </p>
            <p
              className="mt-1 font-display text-3xl font-bold tracking-tight tabular-nums"
              style={{ color: STAT_COLORS[index] }}
            >
              ${Number(stat.value).toFixed(2)}
            </p>
            <Meter
              value={stat.bar}
              tone={["teal", "mango", "coral"][index]}
              height="h-2.5"
              className="mt-3"
            />
          </StickerCard>
        ))}
      </div>

      {/* Next 7 days strip */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold">Next 7 days</h2>
        <p className="text-sm font-semibold text-[#6f6b61]">
          Tap a day to see what lands on it.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {days.map((day) => (
            <button
              key={day.iso}
              type="button"
              onClick={() => toggleDay(day.iso)}
              className={`min-w-[72px] shrink-0 cursor-pointer rounded-2xl border-2 bg-white p-2.5 text-center transition-all hover:-translate-y-0.5 ${
                day.isToday
                  ? "border-[#1d1b16] bg-[#1d1b16] text-white shadow-[3px_4px_0_rgba(29,27,22,0.25)]"
                  : "border-[#1d1b16]/10 shadow-[2px_3px_0_rgba(29,27,22,0.08)]"
              } ${
                selectedDay === day.iso
                  ? "ring-2 ring-[#ff6b4a] ring-offset-2"
                  : ""
              }`}
            >
              <span
                className={`block text-[10px] font-extrabold uppercase tracking-[0.14em] ${
                  day.isToday ? "text-[#ffd28f]" : "text-[#6f6b61]"
                }`}
              >
                {day.isToday ? "Today" : day.weekday}
              </span>
              <span className="mt-0.5 block font-display text-lg font-bold leading-none">
                {day.dayNum}
              </span>
              <span className="mt-1.5 flex h-3 items-center justify-center gap-1">
                {day.bills.slice(0, 3).map((bill) => (
                  <span
                    key={bill.id}
                    className={`h-1.5 w-1.5 rounded-full ${DOT[getBillStatus(bill, today)]}`}
                  />
                ))}
                {day.bills.length > 3 && (
                  <span className="text-[9px] font-extrabold">
                    +{day.bills.length - 3}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="mt-6 space-y-3">
        {reviewBills.length > 0 && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border-2 border-[#f59f00] bg-[#f59f00]/15 px-4 py-3"
          >
            <p className="text-sm font-bold text-[#7a5310]">
              {reviewBills.length} bill{reviewBills.length > 1 ? "s" : ""}{" "}
              passed their due date while you were away.
            </p>
            <CandyButton tone="mango" size="md" onClick={() => setIsReviewOpen(true)}>
              Review now
            </CandyButton>
          </div>
        )}

        {latePaymentAlert && (
          <div
            role="alert"
            className="rounded-[24px] border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3 text-sm font-semibold text-[#a83a1c]"
          >
            <strong>{latePaymentAlert.billName}</strong> recorded{" "}
            {latePaymentAlert.daysLate}{" "}
            {latePaymentAlert.daysLate === 1 ? "day" : "days"} late — due{" "}
            {latePaymentAlert.dueDate}, paid {latePaymentAlert.paidDate}.
          </div>
        )}
      </div>

      {/* Sort controls */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">
          {selectedDay ? `Due ${shortDate(selectedDay)}` : "All bills"}
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="ml-2 cursor-pointer rounded-full border-2 border-[#1d1b16]/20 px-2 py-0.5 align-middle text-xs font-extrabold text-[#6f6b61] hover:border-[#1d1b16]/50"
            >
              clear ✕
            </button>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border-2 border-[#1d1b16]/10 bg-white p-1">
            {[
              ["due", "Due date"],
              ["amount", "Amount"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm font-extrabold transition-colors ${
                  sort === key
                    ? "bg-[#1d1b16] text-white"
                    : "text-[#6f6b61] hover:text-[#1d1b16]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setDirection((d) => (d === "asc" ? "desc" : "asc"))}
            aria-label={
              direction === "asc" ? "Ascending order" : "Descending order"
            }
            className="cursor-pointer rounded-full border-2 border-[#1d1b16]/20 bg-white p-2 transition-colors hover:border-[#1d1b16]/50"
          >
            {direction === "asc" ? (
              <IoArrowUp aria-hidden="true" />
            ) : (
              <IoArrowDown aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Bill cards */}
      {visible.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((bill, index) => {
            const statusKey = getBillStatus(bill, today);
            const pill = PILL[statusKey];
            const isPaid = PAID_STATUSES.has(statusKey);
            const rel = dueRelation(bill.nextDue, today);
            const cardTone =
              statusKey === "overdue"
                ? "coral"
                : statusKey === "due_soon"
                  ? "mango"
                  : "default";

            return (
              <StickerCard
                key={bill.id}
                tone={cardTone}
                className="animate-rise"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="pt-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6f6b61]">
                    {bill.frequency}
                  </span>
                  <Sticker tone={pill.tone}>{pill.label}</Sticker>
                </div>

                <h3 className="mt-2 truncate font-display text-lg font-bold">
                  {bill.title}
                </h3>
                <p className="mt-0.5 font-display text-[30px] font-bold leading-none tracking-tight tabular-nums">
                  ${Number(bill.amount).toFixed(2)}
                </p>

                <p className="mt-3 text-sm font-semibold text-[#6f6b61]">
                  Due{" "}
                  <span className="font-extrabold text-[#1d1b16]">
                    {shortDate(bill.nextDue)}
                  </span>
                  {rel && (
                    <span
                      className={`ml-1.5 font-extrabold ${
                        statusKey === "overdue"
                          ? "text-[#d64522]"
                          : statusKey === "due_soon"
                            ? "text-[#a86e00]"
                            : ""
                      }`}
                    >
                      {rel}
                    </span>
                  )}
                </p>
                <p className="text-[13px] font-semibold text-[#827e74]">
                  Last paid {bill.lastPaid ? shortDate(bill.lastPaid) : "never"}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  {isPaid ? (
                    <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-[#2aa8a0] bg-[#2aa8a0]/10 py-2.5 text-sm font-extrabold text-[#1d7d77]">
                      <span className="animate-pop">✓</span> Paid
                    </span>
                  ) : (
                    <CandyButton
                      tone="coral"
                      size="md"
                      className="flex-1"
                      onClick={() => handleMarkPaid(bill.id)}
                    >
                      Mark paid
                    </CandyButton>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(bill.id)}
                    aria-label={`Edit ${bill.title}`}
                    className="cursor-pointer rounded-full border-2 border-[#1d1b16]/20 bg-white p-2.5 text-[#6f6b61] transition-colors hover:border-[#1d1b16]/50 hover:text-[#1d1b16]"
                  >
                    <IoCreateOutline aria-hidden="true" size="1.1em" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${bill.title}`}
                    onClick={() => handleDelete(bill)}
                    className="cursor-pointer rounded-full border-2 border-[#1d1b16]/20 bg-white p-2.5 text-[#d64522] transition-colors hover:border-[#ff6b4a] hover:bg-[#ff6b4a]/10"
                  >
                    <IoTrashOutline aria-hidden="true" size="1.1em" />
                  </button>
                </div>
              </StickerCard>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[28px] border-2 border-dashed border-[#c9c4b8] bg-white/60 p-12 text-center">
          <p className="font-display text-lg font-bold">No bills in this view</p>
          <p className="mt-1 text-sm font-semibold text-[#6f6b61]">
            Pick another day, or add something new.
          </p>
          <Link to="/addBill" className={`${candyClasses("teal", "md")} mt-4`}>
            Add a bill
          </Link>
        </div>
      )}

      {/* Running total */}
      <p className="mt-8 text-center text-sm font-semibold text-[#827e74]">
        {bills.length} bills · ${Number(calculateBillsTotal(bills)).toFixed(2)}{" "}
        per cycle
      </p>

      {/* Edit bill */}
      {editingBill && (
        <ModalShell title="Edit bill" onClose={closeEditModal}>
          <EditModal
            bill={editingBill}
            bills={bills}
            onClose={closeEditModal}
            onSave={onEditSubmit}
          />
        </ModalShell>
      )}

      {/* Missed-payment review sheet */}
      {isReviewOpen && reviewBills.length > 0 && (
        <ReviewModal
          reviewBills={reviewBills}
          onResolve={resolveMissed}
          onClose={() => setIsReviewOpen(false)}
        />
      )}
    </div>
  );
};

export default BillsOverview;
