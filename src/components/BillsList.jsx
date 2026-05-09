import { useMemo, useState } from "react";
import { IoChevronDown, IoChevronUp, IoFilter } from "react-icons/io5";
import { formatLocaleDate, toISODate, addDays } from "../utils/dateUtils";
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

  const totalCost = filteredBills.reduce((acc, bill) => acc + bill.amount, 0);

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/60 -mx-4 px-4 rounded-2xl">
        {/* Row 1: Title + filter toggle */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Bills Preview
          </h2>

          <button
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full cursor-pointer transition-all duration-200 ${
              filtersOpen
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            aria-label="Toggle filters"
          >
            <IoFilter size={14} />
            <span className="hidden sm:inline">Filter</span>
            {filtersOpen ? (
              <IoChevronUp size={14} />
            ) : (
              <IoChevronDown size={14} />
            )}
          </button>
        </div>

        {/* Row 2: Summary + date range */}
        <div className="pb-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                ${totalCost.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                {filteredBills.length} bill{filteredBills.length !== 1 && "s"} due
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-4 text-sm text-gray-500">
            <span>
              <span className="text-gray-400">From </span>
              <span className="font-medium text-gray-700">{formatLocaleDate(fromDate)}</span>
            </span>
            <span>
              <span className="text-gray-400">to </span>
              <span className="font-medium text-gray-700">{formatLocaleDate(toDate)}</span>
            </span>
          </div>
        </div>

        {/* Collapsible filter panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            filtersOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pb-4 pt-1 px-1 flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label
                  htmlFor="fromDate"
                  className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >
                  From
                </label>
                <input
                  type="date"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="toDate"
                  className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >
                  To
                </label>
                <input
                  type="date"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                Sort
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="">Default</option>
                <option value="earliest">Date: Earliest</option>
                <option value="latest">Date: Latest</option>
                <option value="highToLow">Amount: High - Low</option>
                <option value="lowToHigh">Amount: Low - High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bill cards */}
      <div>
        {filteredBills.length > 0 ? (
          filteredBills.map((bill) => (
            <BillsListCard
              key={bill.id}
              bill={bill}
              bills={bills}
              setBills={setBills}
            />
          ))
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-12 text-center mt-4">
            <p className="text-gray-300 text-5xl mb-3">📭</p>
            <p className="text-gray-500 font-medium">No bills in this period</p>
            <p className="text-gray-400 text-sm mt-1">
              Try selecting a different date range
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsList;
