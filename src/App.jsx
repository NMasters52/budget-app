import { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";

//components
import BillsTable from "./components/BillsTable";
import BillsList from "./components/BillsList";
import AddBills from "./services/AddBills";
import Nav from "./Nav";

//utilities
import {
  addDays,
  migrateBills,
  reconcileAllBills,
  validateAllBills,
} from "./utils/dateUtils";

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

  const today = new Date();
  const weekFromToday = addDays(today, 7);

  return (
    <main className="bg-gray-100 min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <BillsTable
                bills={bills}
                setBills={setBills}
                today={today}
                weekFromToday={weekFromToday}
              />
            }
          />
          <Route path="/list" element={<BillsList bills={bills} setBills={setBills} />} />
          <Route
            path="/addBill"
            element={<AddBills bills={bills} setBills={setBills} />}
          />
        </Routes>
      </div>
      <footer className="bg-green-600 text-white text-center py-4 mt-auto">
        <p className="text-sm">Bill Buddy &copy; {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
};

export default App;
