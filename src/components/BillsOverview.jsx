import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  IoAdd,
  IoClose,
  IoCreateOutline,
  IoTrashOutline,
} from "react-icons/io5";

import AddBills from "../services/AddBills";
import EditModal from "./EditModal";
import ReviewModal from "./ReviewModal";
import { CandyButton, Field, ModalShell, PageHeading, Sticker } from "./ui";
import { candyClasses, inputClass, labelClass } from "./uiClasses";
import {
  calculateDueWithinDays,
  calculateBillsTotal,
  getBillsNeedingReview,
  getBillStatus,
  markBillAsPaid,
  parseLocalDate,
  resolveBillMissedDatesInList,
  toISODate,
} from "../utils/dateUtils";

const STATUS = {
  paid: { label: "Paid", tone: "teal" },
  paid_late: { label: "Paid late", tone: "mango" },
  overdue: { label: "Overdue", tone: "coral" },
  due_soon: { label: "Due soon", tone: "mango" },
  pending: { label: "Scheduled", tone: "slate" },
};

const PAID_STATUSES = new Set(["paid", "paid_late"]);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));

const formatShortDate = (isoDate) => {
  if (!isoDate) return "Never";
  const date = parseLocalDate(isoDate);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatRangeDate = (isoDate) => {
  if (!isoDate) return "";
  const date = parseLocalDate(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const dueRelation = (isoDate, today) => {
  const due = parseLocalDate(isoDate);
  const todayStart = parseLocalDate(toISODate(today));
  const days = Math.round((due - todayStart) / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "1 day late";
  if (days < 0) return `${Math.abs(days)} days late`;
  return `In ${days} days`;
};

const billStatus = (bill, today) => {
  const missedCount = bill.unpaidDueDates?.length ?? 0;
  if (missedCount > 0) {
    return {
      key: "needs_review",
      label: "Needs review",
      tone: "coral",
      detail: `${missedCount} missed ${missedCount === 1 ? "date" : "dates"}`,
    };
  }

  const key = getBillStatus(bill, today);
  return { key, ...STATUS[key], detail: dueRelation(bill.nextDue, today) };
};

const BillsOverview = ({ bills = [], setBills, today }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [latePaymentAlert, setLatePaymentAlert] = useState(null);

  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";
  const sort = searchParams.get("sort") ?? "due";
  const addOpen = searchParams.get("add") === "1";
  const reviewOpen = searchParams.get("review") === "1";
  const editingBillId = searchParams.get("edit") ?? "";

  const reviewBills = getBillsNeedingReview(bills);
  const editingBill = bills.find((bill) => bill.id === editingBillId);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === "" || value === null || value === undefined || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    setSearchParams(next, { replace: true });
  };

  const closeOverlay = () =>
    updateParams({ add: null, edit: null, review: null });

  const visibleBills = useMemo(() => {
    const filtered = bills.filter((bill) => {
      if (fromDate && bill.nextDue < fromDate) return false;
      if (toDate && bill.nextDue > toDate) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "amount-high") return Number(b.amount) - Number(a.amount);
      if (sort === "amount-low") return Number(a.amount) - Number(b.amount);
      if (sort === "name") return a.title.localeCompare(b.title);
      return parseLocalDate(a.nextDue) - parseLocalDate(b.nextDue);
    });
  }, [bills, fromDate, sort, toDate]);

  const summary = useMemo(() => {
    return {
      dueInSevenDays: calculateDueWithinDays(bills, today, 7),
      dueInThirtyDays: calculateDueWithinDays(bills, today, 30),
      annualTotal: calculateDueWithinDays(bills, today, 365),
    };
  }, [bills, today]);

  useEffect(() => {
    if (!latePaymentAlert) return undefined;
    const timeout = window.setTimeout(() => setLatePaymentAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [latePaymentAlert]);

  useEffect(() => {
    if (!reviewOpen || reviewBills.length > 0) return;
    const next = new URLSearchParams(searchParams);
    next.delete("review");
    setSearchParams(next, { replace: true });
  }, [reviewBills.length, reviewOpen, searchParams, setSearchParams]);

  const handleMarkPaid = (billId) => {
    const bill = bills.find((candidate) => candidate.id === billId);
    if (!bill) return;

    if ((bill.unpaidDueDates?.length ?? 0) > 0) {
      updateParams({ review: 1 });
      return;
    }

    const todayCalendarDate = parseLocalDate(toISODate(new Date()));
    const wasLate =
      bill.nextDue && todayCalendarDate > parseLocalDate(bill.nextDue);
    const updatedBills = markBillAsPaid(bills, billId);
    setBills(updatedBills);

    if (wasLate && bill.nextDue) {
      const paidBill = updatedBills.find((candidate) => candidate.id === billId);
      const latestPayment = paidBill?.paymentHistory?.at(-1);
      if (latestPayment) {
        setLatePaymentAlert({
          billName: bill.title,
          daysLate: Math.floor(
            (todayCalendarDate - parseLocalDate(bill.nextDue)) / 86400000,
          ),
        });
      }
    }
  };

  const handleDelete = (bill) => {
    if (!window.confirm(`Delete "${bill.title}"? This cannot be undone.`)) return;
    setBills((currentBills) =>
      currentBills.filter((candidate) => candidate.id !== bill.id),
    );
  };

  const onEditSubmit = (updatedBill) => {
    setBills((currentBills) =>
      currentBills.map((bill) =>
        bill.id === updatedBill.id ? updatedBill : bill,
      ),
    );
    closeOverlay();
  };

  const resolveMissed = (billId, dates, resolveAs) => {
    setBills((currentBills) =>
      resolveBillMissedDatesInList(currentBills, billId, dates, resolveAs),
    );
  };

  const resetFilters = () =>
    updateParams({ from: null, to: null, sort: null, filters: null });

  const dateRangeLabel = fromDate && toDate
    ? `${formatRangeDate(fromDate)} to ${formatRangeDate(toDate)}`
    : fromDate
      ? `From ${formatRangeDate(fromDate)}`
      : toDate
        ? `Through ${formatRangeDate(toDate)}`
        : "All due dates";
  const hasDateFilters = Boolean(fromDate || toDate);

  const renderActions = (bill, compact = false) => {
    const status = billStatus(bill, today);
    const isPaid = PAID_STATUSES.has(status.key);
    const needsReview = status.key === "needs_review";

    return (
      <div className="flex items-center justify-end gap-1.5">
        <CandyButton
          tone={needsReview ? "mango" : isPaid ? "ghost" : "coral"}
          size="sm"
          onClick={() => handleMarkPaid(bill.id)}
          disabled={isPaid}
          className={compact ? "min-w-16" : ""}
        >
          {needsReview ? "Review" : isPaid ? "Paid" : "Pay"}
        </CandyButton>
        <button
          type="button"
          onClick={() => updateParams({ edit: bill.id })}
          aria-label={`Edit ${bill.title}`}
          className="touch-manipulation rounded-full border-2 border-[#1d1b16]/15 bg-white p-2 text-[#6f6b61] transition-colors hover:border-[#1d1b16]/40 hover:text-[#1d1b16] focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/20"
        >
          <IoCreateOutline aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => handleDelete(bill)}
          aria-label={`Delete ${bill.title}`}
          className="touch-manipulation rounded-full border-2 border-[#ff6b4a]/25 bg-white p-2 text-[#d64522] transition-colors hover:border-[#ff6b4a] hover:bg-[#ff6b4a]/10 focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/20"
        >
          <IoTrashOutline aria-hidden="true" />
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Bills"
          sub={
            bills.length === 0
              ? "Add your recurring bills to start a schedule."
              : undefined
          }
        />
        <button
          type="button"
          onClick={() => updateParams({ add: 1 })}
          className={candyClasses("coral", "md")}
        >
          <IoAdd aria-hidden="true" /> Add bill
        </button>
      </header>

      {bills.length === 0 ? (
        <div className="mt-8 rounded-[28px] border-2 border-dashed border-[#c9c4b8] bg-white/70 p-10 text-center">
          <p className="font-display text-xl font-bold">No bills yet</p>
          <p className="mt-1 text-sm font-semibold text-[#6f6b61]">
            Add your first bill to see due dates and payment status here.
          </p>
          <button
            type="button"
            onClick={() => updateParams({ add: 1 })}
            className={`${candyClasses("teal", "md")} mt-4`}
          >
            Add bill
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [formatCurrency(summary.dueInSevenDays), "Due in 7 days"],
              [formatCurrency(summary.dueInThirtyDays), "Due in 30 days"],
              [formatCurrency(summary.annualTotal), "Due in 1 year"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-[22px] border-2 border-[#1d1b16] bg-white px-4 py-4 shadow-[3px_4px_0_rgba(29,27,22,0.1)] sm:px-5"
              >
                <p className="font-display text-lg font-bold tabular-nums text-[#1d1b16] sm:text-2xl">
                  {value}
                </p>
                <p className="text-xs font-bold text-[#6f6b61]">{label}</p>
              </div>
            ))}
          </div>

          {reviewBills.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3">
              <div>
                <p className="font-display font-bold text-[#1d1b16]">
                  {reviewBills.length} {reviewBills.length === 1 ? "bill needs" : "bills need"} a payment decision
                </p>
                <p className="text-sm font-semibold text-[#6f6b61]">
                  Review dates that passed while Bill Buddy was closed.
                </p>
              </div>
              <CandyButton tone="mango" size="md" onClick={() => updateParams({ review: 1 })}>
                Review missed bills
              </CandyButton>
            </div>
          )}

          {latePaymentAlert && (
            <div
              role="status"
              aria-live="polite"
              className="mt-5 rounded-[22px] border-2 border-[#ff6b4a] bg-[#ff6b4a]/10 px-4 py-3 text-sm font-bold text-[#a83a1c]"
            >
              {latePaymentAlert.billName} was recorded {latePaymentAlert.daysLate} {latePaymentAlert.daysLate === 1 ? "day" : "days"} late.
            </div>
          )}

          <section className="mt-8" aria-label="Bill controls and ledger">
            <div className="rounded-[18px] border-2 border-[#1d1b16] bg-[#faf7ef] p-3.5">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
                <div>
                  <label htmlFor="bill-sort" className={`${labelClass} mb-1.5`}>Sort bills by</label>
                  <select
                    id="bill-sort"
                    name="bill-sort"
                    value={sort}
                    onChange={(event) => updateParams({ sort: event.target.value === "due" ? null : event.target.value })}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="due">Due date, soonest first</option>
                    <option value="amount-high">Amount, highest first</option>
                    <option value="amount-low">Amount, lowest first</option>
                    <option value="name">Bill name, A to Z</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bill-from-date" className={`${labelClass} mb-1.5`}>From</label>
                  <input
                    id="bill-from-date"
                    name="bill-from-date"
                    type="date"
                    value={fromDate}
                    onChange={(event) => updateParams({ from: event.target.value || null })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="bill-to-date" className={`${labelClass} mb-1.5`}>To</label>
                  <input
                    id="bill-to-date"
                    name="bill-to-date"
                    type="date"
                    value={toDate}
                    onChange={(event) => updateParams({ to: event.target.value || null })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {hasDateFilters && (
              <div
                key={`${fromDate}-${toDate}`}
                role="status"
                aria-live="polite"
                className="relative mt-3 animate-result-reveal overflow-hidden rounded-[18px] border-2 border-[#2aa8a0] bg-[#e8f7f4] px-5 py-4 text-[#1d1b16] shadow-[3px_4px_0_rgba(42,168,160,0.18)]"
              >
                <span className="absolute inset-y-0 left-0 w-2 bg-[#2aa8a0]" aria-hidden="true" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-bold tabular-nums text-[#1d1b16]">
                      {formatCurrency(calculateBillsTotal(visibleBills))} due
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#6f6b61]">
                      {visibleBills.length} of {bills.length} bills. {dateRangeLabel}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateParams({ from: null, to: null })}
                    className="inline-flex touch-manipulation items-center gap-1 rounded-full border-2 border-[#2aa8a0] bg-white px-3 py-1.5 text-sm font-extrabold text-[#176b66] transition-[background-color,border-color] hover:border-[#176b66] hover:bg-[#d7f1ed] focus-visible:ring-4 focus-visible:ring-[#2aa8a0]/30"
                  >
                    <IoClose aria-hidden="true" /> Clear dates
                  </button>
                </div>
              </div>
            )}

            {visibleBills.length === 0 ? (
              <div className="mt-4 rounded-[24px] border-2 border-dashed border-[#c9c4b8] bg-white/70 p-10 text-center">
                <p className="font-display text-lg font-bold">No bills match these dates</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`${candyClasses("ghost", "md")} mt-4`}
                >
                  Show all bills
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4 hidden overflow-hidden rounded-[24px] border-2 border-[#1d1b16] bg-white shadow-[4px_5px_0_rgba(29,27,22,0.12)] md:block">
                  <div className="max-h-[620px] overflow-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="sticky top-0 z-10 bg-[#faf7ef] text-xs text-[#6f6b61]">
                        <tr className="border-b-2 border-[#1d1b16]">
                          <th scope="col" className="px-4 py-3 font-extrabold">Bill</th>
                          <th scope="col" className="px-4 py-3 font-extrabold">Due</th>
                          <th scope="col" className="px-4 py-3 font-extrabold">Status</th>
                          <th scope="col" className="px-4 py-3 text-right font-extrabold">Amount</th>
                          <th scope="col" className="px-4 py-3 font-extrabold">Frequency</th>
                          <th scope="col" className="px-4 py-3 font-extrabold">Last paid</th>
                          <th scope="col" className="px-4 py-3 text-right font-extrabold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleBills.map((bill) => {
                          const status = billStatus(bill, today);
                          return (
                            <tr key={bill.id} className="border-b-2 border-[#1d1b16]/8 last:border-b-0 hover:bg-[#faf8f2]">
                              <th scope="row" className="max-w-48 truncate px-4 py-3.5 font-display text-base font-bold">{bill.title}</th>
                              <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold">
                                {formatShortDate(bill.nextDue)}
                                <span className={`block text-xs font-semibold ${status.key === "needs_review" ? "text-[#d64522]" : "text-[#827e74]"}`}>{status.detail}</span>
                              </td>
                              <td className="px-4 py-3.5"><Sticker tone={status.tone}>{status.label}</Sticker></td>
                              <td className="px-4 py-3.5 text-right font-display text-base font-bold tabular-nums">{formatCurrency(bill.amount)}</td>
                              <td className="px-4 py-3.5 text-sm font-semibold capitalize text-[#6f6b61]">{bill.frequency}</td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-[#6f6b61]">{formatShortDate(bill.lastPaid)}</td>
                              <td className="px-4 py-3.5">{renderActions(bill)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 space-y-2 md:hidden">
                  {visibleBills.map((bill) => {
                    const status = billStatus(bill, today);
                    return (
                      <article key={bill.id} className="rounded-[22px] border-2 border-[#1d1b16]/12 bg-white p-4 shadow-[2px_3px_0_rgba(29,27,22,0.08)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-display text-lg font-bold">{bill.title}</h3>
                            <p className="text-sm font-bold text-[#6f6b61]">{formatShortDate(bill.nextDue)}. {status.detail}.</p>
                          </div>
                          <p className="font-display text-xl font-bold tabular-nums">{formatCurrency(bill.amount)}</p>
                        </div>
                        <p className="mt-1 text-xs font-semibold capitalize text-[#827e74]">{bill.frequency}. Last paid {formatShortDate(bill.lastPaid)}.</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <Sticker tone={status.tone}>{status.label}</Sticker>
                          {renderActions(bill, true)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {addOpen && (
        <ModalShell title="Add bill" onClose={closeOverlay}>
          <AddBills setBills={setBills} onAdded={closeOverlay} onCancel={closeOverlay} />
        </ModalShell>
      )}

      {editingBill && (
        <ModalShell title="Edit bill" onClose={closeOverlay}>
          <EditModal
            bill={editingBill}
            bills={bills}
            onClose={closeOverlay}
            onSave={onEditSubmit}
          />
        </ModalShell>
      )}

      {reviewOpen && reviewBills.length > 0 && (
        <ReviewModal
          reviewBills={reviewBills}
          onResolve={resolveMissed}
          onClose={closeOverlay}
        />
      )}
    </div>
  );
};

export default BillsOverview;
