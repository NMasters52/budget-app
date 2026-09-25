import { HiTrash } from "react-icons/hi2";

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
      type="button"
      onClick={onDelete}
      aria-label={`Delete ${debt.name}`}
      className="cursor-pointer rounded-full border-2 border-[#1d1b16]/20 bg-white p-2.5 text-[#d64522] transition-colors hover:border-[#ff6b4a] hover:bg-[#ff6b4a]/10"
    >
      <HiTrash aria-hidden="true" />
    </button>
  );
};

export default DeleteDebt;
