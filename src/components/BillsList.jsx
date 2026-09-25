import { useMemo, useState } from "react";
import { IoChevronDown, IoChevronUp, IoFilter } from "react-icons/io5";
import {
  formatLocaleDate,
  toISODate,
  addDays,
  calculateBillsTotal,
} from "../utils/dateUtils";

//design system
import { Field, PageHeading } from "./ui";
import { inputClass } from "./uiClasses";
import BillsListCard from "./BillsListCard";

const BillsList = ({ bills, setBills }) => {
  const today = new Date();
  const [fromDate, setFromDate] = useState(toISODate(today));
  const [toDate, setToDate] = useState(toISODate(addDays(today, 7)));
  const [sort, setSort] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredBills = useMemo(() => {
    const list = bills.filter(
      (bill) => bill.nextDue >= fromDate && bill.nextDue <= toDate,
    );

    if (sort === "earliest") return [...list].sort((a, b) => a.nextDue.localeCompare(b.nextDue));
    if (sort === "latest") return [...list].sort((a, b) => b.nextDue.localeCompare(a.nextDue));
    if (sort === "highToLow") return [...list].sort((a, b) => b.amount - a.amount);
    if (sort === "lowToHigh") return [...list].sort((a, b) => a.amount - b.amount);
    return list;
  }, [bills, fromDate, toDate, sort]);

  const totalCost = calculateBillsTotal(filteredBills);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      {/* Sticky header bar */}
      <div className="sticky top-[84px] z-10 -mx-4 rounded-b-[28px] border-b-2 border-[#1d1b16]/10 bg-white/85 px-4 backdrop-blur-md">
        {/* Row 1: Title + filter toggle */}
        <div className="flex items-center justify-between pt-5 pb-2">
          <PageHeading title="Bills Preview" />
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`${
              filtersOpen
                ? "border-[#1d1b16] bg-[#1d1b16] text-white"
                : "border-[#1d1b16]/20 bg-white text-[#1d1b16]"
            } flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-extrabold transition-all`}
            aria-label="Toggle filters"
            aria-expanded={filtersOpen}
          >
            <IoFilter size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Filter</span>
            {filtersOpen ? (
              <IoChevronUp size={14} aria-hidden="true" />
            ) : (
              <IoChevronDown size={14} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Row 2: Summary + date range */}
        <div className="pb-4">
          <p className="font-display text-3xl font-bold tracking-tight tabular-nums text-[#ff6b4a]">
            ${totalCost.toFixed(2)}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[#6f6b61]">
            {filteredBills.length} bill{filteredBills.length !== 1 && "s"} due
          </p>

          <div className="mt-3 flex gap-4 text-sm font-semibold text-[#6f6b61]">
            <span>
              <span className="text-[#827e74]">From </span>
              <span className="font-extrabold text-[#1d1b16]">
                {formatLocaleDate(fromDate)}
              </span>
            </span>
            <span>
              <span className="text-[#827e74]">to </span>
              <span className="font-extrabold text-[#1d1b16]">
                {formatLocaleDate(toDate)}
              </span>
            </span>
          </div>
        </div>

        {/* Collapsible filter panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            filtersOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-3 px-1 pt-1 pb-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Field label="From" htmlFor="fromDate">
                  <input
                    type="date"
                    id="fromDate"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="flex-1">
                <Field label="To" htmlFor="toDate">
                  <input
                    type="date"
                    id="toDate"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <Field label="Sort" htmlFor="sortBills">
              <select
                id="sortBills"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Default</option>
                <option value="earliest">Date: Earliest</option>
                <option value="latest">Date: Latest</option>
                <option value="highToLow">Amount: High - Low</option>
                <option value="lowToHigh">Amount: Low - High</option>
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* Bill cards */}
      <div className="mt-6">
        {filteredBills.length > 0 ? (
          filteredBills.map((bill, index) => (
            <BillsListCard
              key={bill.id}
              bill={bill}
              bills={bills}
              setBills={setBills}
              style={{ animationDelay: `${index * 45}ms` }}
            />
          ))
        ) : (
          <div className="animate-rise rounded-[28px] border-2 border-dashed border-[#c9c4b8] bg-white/60 px-5 py-12 text-center">
            <p className="font-display text-lg font-bold">No bills in this period</p>
            <p className="mt-1 text-sm font-semibold text-[#6f6b61]">
              Try selecting a different date range
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsList;
