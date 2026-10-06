import { useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

//components
import BillsOverview from "./components/BillsOverview";
import DebtsTable from "./components/DebtsTable";
import Seed from "./components/Seed";
import Nav from "./Nav";
import ErrorBoundary from "./components/ErrorBoundary";

//utilities
import { migrateBills, reconcileAllBills, validateAllBills } from "./utils/dateUtils";
import {
  normalizeDebts,
  validateAllDebts,
} from "./utils/debtUtils";

const App = () => {
  const [bills, setBills] = useState(() => {
    try {
      const storedBills = JSON.parse(localStorage.getItem("bills"));

      if (!storedBills) {
        return [];
      }

      // Check if bills have already been migrated (have originalDueDate)
      const isMigrated = storedBills.some(
        (bill) => bill.originalDueDate !== undefined,
      );

      let loadedBills = storedBills;

      if (!isMigrated) {
        // Need to migrate
        console.log("Migrating bills to include originalDueDate...");
        loadedBills = migrateBills(storedBills);

        // Validate migrated bills
        const validation = validateAllBills(loadedBills);
        if (!validation.allValid) {
          console.warn(
            `Found ${validation.invalidCount} invalid bills after migration`,
          );
        }
      }

      // Bring schedules current: due dates that passed while the user was
      // away move to unpaidDueDates for review instead of lurking in the past.
      const reconciledBills = reconcileAllBills(loadedBills);

      // Save only when something changed
      if (JSON.stringify(reconciledBills) !== JSON.stringify(storedBills)) {
        localStorage.setItem("bills", JSON.stringify(reconciledBills));
      }

      return reconciledBills;
    } catch (error) {
      console.error("Error reading bills from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("bills", JSON.stringify(bills));
  }, [bills]);

  // Debts are a separate domain from bills with their own storage key.
  // New debts have no stored shape to migrate, so load is just
  // normalize + warn-only validation.
  const [debts, setDebts] = useState(() => {
    try {
      const storedDebts = JSON.parse(localStorage.getItem("debts"));

      if (!storedDebts) {
        return [];
      }

      const normalizedDebts = normalizeDebts(storedDebts);

      const validation = validateAllDebts(normalizedDebts);
      if (!validation.allValid) {
        console.warn(
          `Found ${validation.invalidCount} invalid debts after load`,
        );
      }

      if (JSON.stringify(normalizedDebts) !== JSON.stringify(storedDebts)) {
        localStorage.setItem("debts", JSON.stringify(normalizedDebts));
      }

      return normalizedDebts;
    } catch (error) {
      console.error("Error reading debts from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("debts", JSON.stringify(debts));
  }, [debts]);

  const today = new Date();

  return (
    <div className="page-grid flex min-h-screen flex-col bg-white font-sans text-[#1d1b16]">
      <a
        href="#main-content"
        className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-full border-2 border-[#1d1b16] bg-white px-4 py-2 font-bold focus:translate-y-0"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main-content" className="flex-1" tabIndex="-1">
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={
                <BillsOverview
                  bills={bills}
                  setBills={setBills}
                  today={today}
                />
              }
            />
            <Route
              path="/debts"
              element={<DebtsTable debts={debts} setDebts={setDebts} />}
            />
            {/* Seed is a dev-only tool: no nav link, and production builds
                redirect /seed back home. Reachable by typing the URL in dev. */}
            <Route
              path="/seed"
              element={
                import.meta.env.DEV ? (
                  <Seed setBills={setBills} setDebts={setDebts} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/list" element={<Navigate to="/" replace />} />
            <Route path="/addBill" element={<Navigate to="/?add=1" replace />} />
            <Route
              path="/addDebt"
              element={<Navigate to="/debts?add=1" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <footer className="mt-auto border-t-2 border-[#1d1b16] bg-[#faf7ef] py-5 text-center">
        <p className="text-sm font-bold text-[#6f6b61]">
          Bill Buddy &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
