import { DEBT_FILTER_OPTIONS } from "../utils/debtUtils";

//design system
import { inputClass, labelClass } from "./uiClasses";

const DebtsFilter = ({ filter, setFilter }) => {
  return (
    <div className="mt-8 mb-2 flex flex-wrap items-end justify-between gap-3">
      <label htmlFor="filterDebts" className={`${labelClass} mb-1.5`}>
        Filter debts
      </label>
      <select
        id="filterDebts"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className={`${inputClass} w-full cursor-pointer sm:w-64`}
      >
        {DEBT_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DebtsFilter;
