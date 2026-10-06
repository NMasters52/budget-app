import { useEffect, useRef, useState } from "react";

import {
  SEED_BILLS,
  SEED_DEBTS,
  buildSeedBills,
  buildSeedDebts,
  isSeedBill,
  isSeedDebt,
} from "../utils/seedData";
import { CandyButton, PageHeading, Sticker, StickerCard } from "./ui";

// One-page seeder at /seed: demo bills and debts with a click, replacing the
// old standalone public/seed.html flow. App persists both lists on every
// state change, so no storage code lives here.
const Seed = ({ setBills, setDebts }) => {
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  };

  // Appliers return counts; handlers own the toasts so Add Both can
  // report both datasets in a single message.
  const applySeedBills = () => {
    const seeded = buildSeedBills();
    setBills((current) => [...current.filter((bill) => !isSeedBill(bill)), ...seeded]);
    return seeded.length;
  };

  const applySeedDebts = () => {
    const seeded = buildSeedDebts();
    setDebts((current) => [...current.filter((debt) => !isSeedDebt(debt)), ...seeded]);
    return seeded.length;
  };

  const handleSeedBills = () => showToast(`Added ${applySeedBills()} seed bills`);
  const handleSeedDebts = () => showToast(`Added ${applySeedDebts()} seed debts`);
  const handleSeedAll = () => {
    const billCount = applySeedBills();
    const debtCount = applySeedDebts();
    showToast(`Added ${billCount} seed bills and ${debtCount} seed debts`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <PageHeading
        kicker="Dev tools"
        title="Seed data"
        sub="Load demo bills and debts for testing. Re-seeding replaces matching titles instead of duplicating them; your other bills and debts are kept."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <StickerCard>
          <Sticker tone="teal">{SEED_BILLS.length} bills</Sticker>
          <h2 className="mt-3 font-display text-xl font-bold text-[#1d1b16]">
            Household bills
          </h2>
          <p className="mt-1 text-sm text-[#6f6b61]">
            Rent, groceries, utilities and more, with due dates 3-12 days from
            today and one paid cycle of history.
          </p>
          <CandyButton tone="coral" className="mt-4" onClick={handleSeedBills}>
            Seed Bills
          </CandyButton>
        </StickerCard>

        <StickerCard>
          <Sticker tone="mango">{SEED_DEBTS.length} debts</Sticker>
          <h2 className="mt-3 font-display text-xl font-bold text-[#1d1b16]">
            Debts (fake balances)
          </h2>
          <p className="mt-1 text-sm text-[#6f6b61]">
            Mortgage, loans and cards with made-up numbers. Real values never
            live in this file.
          </p>
          <CandyButton tone="teal" className="mt-4" onClick={handleSeedDebts}>
            Seed Debts
          </CandyButton>
        </StickerCard>
      </div>

      <CandyButton tone="ink" size="lg" className="mt-4 w-full md:w-auto" onClick={handleSeedAll}>
        Add Both
      </CandyButton>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-rise fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border-2 border-[#1d1b16] bg-[#2aa8a0] px-5 py-2.5 text-sm font-extrabold text-white shadow-[3px_4px_0_#1d1b16]"
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default Seed;
