import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DEBT_OWNERS,
  DEBT_TYPES,
  DEBT_TYPE_LABELS,
  createDebt,
  validateDebtInput,
} from "../utils/debtUtils";

const AddDebt = ({ debts, setDebts }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    owner: "Nick",
    type: "credit-card",
    startingBalance: "",
    currentBalance: "",
    minimumPayment: "",
    minimumPaymentDueDay: "",
    apr: "",
    includeInPayoffGoal: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });
    setError("");
  };

  const submitNewDebt = (e) => {
    e.preventDefault();

    const validation = validateDebtInput(formData);

    if (!validation.isValid) {
      setError(validation.errors.join(" "));
      return;
    }

    const newDebt = createDebt(formData);
    setDebts([...debts, newDebt]);
    navigate("/debts");
  };

  return (
    <form
      className="w-xs sm:w-lg md:w-xl p-4 border-2 border-gray-500 rounded-lg shadow-md mx-auto"
      onSubmit={submitNewDebt}
    >
      <h3 className="mb-4 p-2 font-bold text-2xl">Add New Debt</h3>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="name" className="block font-semibold">
          Name:
        </label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          placeholder="Chase Sapphire"
          onChange={(e) => handleChange(e)}
          className="w-full border-2 border-black rounded-sm p-2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="owner" className="block font-semibold">
          Owner:
        </label>
        <select
          id="owner"
          name="owner"
          value={formData.owner}
          onChange={(e) => handleChange(e)}
          className="w-full border-2 border-black rounded-sm p-2"
        >
          {DEBT_OWNERS.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="type" className="block font-semibold">
          Debt Type:
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={(e) => handleChange(e)}
          className="w-full border-2 border-black rounded-sm p-2"
        >
          {DEBT_TYPES.map((type) => (
            <option key={type} value={type}>
              {DEBT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="startingBalance" className="block font-semibold">
          Starting Balance:
        </label>
        <input
          type="number"
          id="startingBalance"
          name="startingBalance"
          required
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={formData.startingBalance}
          onChange={(e) => handleChange(e)}
          onWheel={(e) => e.target.blur()}
          className="w-full border-2 border-black rounded-sm p-2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="currentBalance" className="block font-semibold">
          Current Balance:
        </label>
        <input
          type="number"
          id="currentBalance"
          name="currentBalance"
          required
          min="0"
          step="0.01"
          inputMode="decimal"
          value={formData.currentBalance}
          onChange={(e) => handleChange(e)}
          onWheel={(e) => e.target.blur()}
          className="w-full border-2 border-black rounded-sm p-2"
        />
        <p className="text-sm text-gray-600 mt-1">
          Leave equal to starting balance if the debt is new to tracking.
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="minimumPayment" className="block font-semibold">
          Minimum Payment:
        </label>
        <input
          type="number"
          id="minimumPayment"
          name="minimumPayment"
          required
          min="0.01"
          step="0.01"
          inputMode="decimal"
          value={formData.minimumPayment}
          onChange={(e) => handleChange(e)}
          onWheel={(e) => e.target.blur()}
          className="w-full border-2 border-black rounded-sm p-2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="minimumPaymentDueDay" className="block font-semibold">
          Minimum Payment Due Day (optional):
        </label>
        <input
          type="number"
          id="minimumPaymentDueDay"
          name="minimumPaymentDueDay"
          min="1"
          max="31"
          step="1"
          inputMode="numeric"
          placeholder="Day of the month, e.g. 22"
          value={formData.minimumPaymentDueDay}
          onChange={(e) => handleChange(e)}
          onWheel={(e) => e.target.blur()}
          className="w-full border-2 border-black rounded-sm p-2"
        />
        <p className="text-sm text-gray-600 mt-1">
          Leave blank if you do not know the recurring due day.
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="apr" className="block font-semibold">
          APR (optional):
        </label>
        <input
          type="number"
          id="apr"
          name="apr"
          step="0.01"
          min="0"
          max="100"
          inputMode="decimal"
          placeholder="Leave blank if unknown"
          value={formData.apr}
          onChange={(e) => handleChange(e)}
          onWheel={(e) => e.target.blur()}
          className="w-full border-2 border-black rounded-sm p-2"
        />
        <p className="text-sm text-gray-600 mt-1">
          Enter the annual percentage rate when you have it.
        </p>
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="includeInPayoffGoal"
            checked={formData.includeInPayoffGoal}
            onChange={handleChange}
            className="w-5 h-5 border-2 border-black rounded"
          />
          <span className="font-semibold">Include in payoff goal</span>
        </label>
      </div>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-300 cursor-pointer w-full shadow-md rounded-lg text-white p-2"
      >
        Add New Debt
      </button>

      <p className="mt-4 text-center">
        <Link
          to="/debts"
          className="text-green-500 hover:underline hover:underline-offset-4"
        >
          Back to Debts
        </Link>
      </p>
    </form>
  );
};

export default AddDebt;
