import { HiTrash } from "react-icons/hi";

const DeleteDebt = ({ debt, debts, setDebts }) => {
  const onDelete = () => {
    const hasPaymentHistory =
      debt.paymentHistory && debt.paymentHistory.length > 0;

    const message = hasPaymentHistory
      ? `Delete "${debt.name}"? This debt has payment history. Delete permanently?`
      : `Delete "${debt.name}"? This cannot be undone.`;

    if (!window.confirm(message)) {
      return;
    }

    setDebts(debts.filter((d) => d.id !== debt.id));
  };

  return (
    <button
      onClick={onDelete}
      aria-label={`Delete ${debt.name}`}
      className="bg-red-500 hover:bg-red-400 text-white text-2xl p-2 rounded-md cursor-pointer"
    >
      <HiTrash />
    </button>
  );
};

export default DeleteDebt;
