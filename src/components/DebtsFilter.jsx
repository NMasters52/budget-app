import { DEBT_FILTER_OPTIONS } from "../utils/debtUtils";

const DebtsFilter = ({ filter, setFilter }) => {
  return (
    <div className="bg-white mb-2 w-[300px] mx-auto flex justify-between border-2 border-gray-500 p-2 rounded-md">
      <h3 className="font-bold text-xl">Filters:</h3>
      <select
        id="filterDebts"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border-2 border-black text-sm"
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
