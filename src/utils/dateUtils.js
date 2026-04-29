export function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

export function addMonths(date, months) {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

export function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatedDate(dateOrString, useLocale = false) {
  // Handle empty/undefined/null values
  if (!dateOrString) {
    return "";
  }

  // ensure we have a Date at local midnight
  const dt =
    typeof dateOrString === "string"
      ? parseLocalDate(dateOrString)
      : new Date(dateOrString);

  // Additional check for invalid dates
  if (isNaN(dt.getTime())) {
    return "";
  }

  // Use locale format if requested
  if (useLocale) {
    return dt.toLocaleDateString();
  }

  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${m}/${d}/${y}`;
}

export function formatLocaleDate(date) {
  return new Date(date).toLocaleDateString();
}

export const toISODate = (dateInput) => {
  let dateObj;

  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (
    typeof dateInput === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
  ) {
    // parse YYYY-MM-DD as local
    const [y, m, d] = dateInput.split("-").map(Number);
    dateObj = new Date(y, m - 1, d);
  } else {
    // fallback for timestamps or other formats
    dateObj = new Date(dateInput);
  }

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

// Helper function to get today's date in YYYY-MM-DD format (local time)
// Used for date input max attributes to prevent selecting future dates
export const getTodayISODate = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Frequency validation
export const VALID_FREQUENCIES = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "biannually",
  "yearly",
];

export const isValidFrequency = (frequency) => {
  return VALID_FREQUENCIES.includes(frequency);
};

export const getDefaultFrequency = () => "monthly";

//helps calculate total bills for the year
export const calculateYearlyTotal = (bills) => {
  const invalidBills = bills.filter(
    (bill) => !isValidFrequency(bill.frequency),
  );

  if (invalidBills.length > 0) {
    const names = invalidBills
      .map((b) => b.name || b.title || "Untitled")
      .join(", ");
    throw new Error(
      `Invalid frequency in bills: ${names}. ` +
        `Valid frequencies are: ${VALID_FREQUENCIES.join(", ")}`,
    );
  }

  return bills.reduce((yearlyTotal, bill) => {
    let annualAmount;

    switch (bill.frequency) {
      case "weekly":
        annualAmount = bill.amount * 52;
        break;
      case "biweekly":
        annualAmount = bill.amount * 26;
        break;
      case "monthly":
        annualAmount = bill.amount * 12;
        break;
      case "quarterly":
        annualAmount = bill.amount * 4;
        break;
      case "biannually":
        annualAmount = bill.amount * 2;
        break;
      case "yearly":
        annualAmount = bill.amount * 1;
        break;
      default:
        annualAmount = 0;
    }
    return yearlyTotal + annualAmount;
  }, 0);
};

// Calculate how many periods have passed between two dates based on bill frequency
const calculatePeriodsPassed = (fromDate, toDate, frequency) => {
  if (!fromDate || !toDate || !frequency) {
    console.warn("calculatePeriodsPassed: Missing required parameters");
    return 0;
  }

  try {
    const from = parseLocalDate(fromDate);
    const to = parseLocalDate(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      console.warn("calculatePeriodsPassed: Invalid date provided");
      return 0;
    }

    const daysPassed = Math.floor((to - from) / (1000 * 60 * 60 * 24));

    switch (frequency) {
      case "weekly":
        return Math.floor(daysPassed / 7);
      case "biweekly":
        return Math.floor(daysPassed / 14);
      case "monthly": {
        // Calculate months passed by comparing year and month
        const monthsDiff =
          (to.getFullYear() - from.getFullYear()) * 12 +
          (to.getMonth() - from.getMonth());
        return monthsDiff;
      }
      case "quarterly": {
        const quartersDiff = Math.floor(daysPassed / 91); // Approximate quarterly
        return quartersDiff;
      }
      case "biannually": {
        const halfYearsDiff = Math.floor(daysPassed / 182); // Approximate biannually
        return halfYearsDiff;
      }
      case "yearly":
        return to.getFullYear() - from.getFullYear();
      default:
        return 0;
    }
  } catch (error) {
    console.error("calculatePeriodsPassed error:", error);
    return 0;
  }
};

// Calculate next due date from original due date, preserving the day of period
const calculateNextDueFromDate = (baseDate, periodsToAdd, frequency) => {
  if (!baseDate || !frequency) {
    console.warn("calculateNextDueFromDate: Missing required parameters");
    return baseDate;
  }

  try {
    const base = parseLocalDate(baseDate);

    if (isNaN(base.getTime())) {
      console.warn("calculateNextDueFromDate: Invalid base date");
      return baseDate;
    }

    let newDate = new Date(base);

    switch (frequency) {
      case "weekly":
        newDate.setDate(base.getDate() + periodsToAdd * 7);
        break;
      case "biweekly":
        newDate.setDate(base.getDate() + periodsToAdd * 14);
        break;
      case "monthly": {
        // Set the day of month to match the original date
        const originalDay = base.getDate();
        newDate = addMonths(base, periodsToAdd);
        // Preserve the day of month (handle edge case where day might change)
        newDate.setDate(originalDay);
        break;
      }
      case "quarterly":
        newDate = addMonths(base, periodsToAdd * 3);
        break;
      case "biannually":
        newDate = addMonths(base, periodsToAdd * 6);
        break;
      case "yearly":
        newDate = addMonths(base, periodsToAdd * 12);
        break;
      default:
        return baseDate;
    }

    return newDate;
  } catch (error) {
    console.error("calculateNextDueFromDate error:", error);
    return baseDate;
  }
};

//helps check if bill is paid and if so move to bill.paymentHistory
export const markBillAsPaid = (bills, billId, paidDate = new Date()) => {
  const paidDateString = toISODate(paidDate);

  return bills.map((bill) => {
    if (bill.id === billId) {
      // Validation: Ensure required fields exist
      if (!bill.nextDue) {
        console.error(
          `Bill ${bill.id} (${bill.name || bill.title}) has no nextDue date`,
        );
        return bill;
      }

      if (!bill.frequency) {
        console.error(
          `Bill ${bill.id} (${bill.name || bill.title}) has no frequency`,
        );
        return bill;
      }

      // Use originalDueDate if available, otherwise fall back to nextDue
      const baseDate = bill.originalDueDate || bill.nextDue;

      if (!baseDate) {
        console.error(
          `Bill ${bill.id} has no base date (originalDueDate or nextDue)`,
        );
        return bill;
      }

      try {
        // Calculate how many periods passed from the expected due date to the payment date
        const periodsPassed = calculatePeriodsPassed(
          bill.nextDue,
          paidDate,
          bill.frequency,
        );

        // Calculate new due date: baseDate + (periodsPassed + 1) periods
        // This ensures the original day is preserved (e.g., 5th of month)
        const newDueDate = calculateNextDueFromDate(
          baseDate,
          periodsPassed + 1,
          bill.frequency,
        );

        const wasLate = new Date(paidDateString) > new Date(bill.nextDue);
        const periodsMissed = wasLate ? periodsPassed : 0;

        return {
          ...bill,
          nextDue: toISODate(newDueDate),
          lastPaid: paidDateString,
          originalDueDate: baseDate, // Ensure originalDueDate is set
          previousDueDate: bill.nextDue, // Store for revert functionality
          paymentHistory: [
            ...(bill.paymentHistory || []),
            {
              date: paidDateString,
              amount: bill.amount,
              wasLate: wasLate,
              periodsMissed: periodsMissed,
              originalDueDate: bill.nextDue, // Track what the due date was when paid
            },
          ],
        };
      } catch (error) {
        console.error(`Error marking bill ${bill.id} as paid:`, error);
        // Return unchanged bill on error
        return bill;
      }
    }
    return bill;
  });
};

//helps check if the bill being passed is paid
export const isBillPaidThisPeriod = (bill, periodStart, periodEnd) => {
  if (!bill.lastPaid) return false;

  const lastPaid = parseLocalDate(bill.lastPaid);
  return lastPaid >= new Date(periodStart) && lastPaid <= new Date(periodEnd);
};

// Validate bill dates for consistency
export const validateBillDates = (bill) => {
  const errors = [];

  if (bill.lastPaid && bill.nextDue) {
    const lastPaidDate = parseLocalDate(bill.lastPaid);
    const nextDueDate = parseLocalDate(bill.nextDue);

    // Check if lastPaid is after nextDue (same day is OK - could be paying on the due date)
    if (lastPaidDate > nextDueDate) {
      const daysDiff = Math.floor(
        (lastPaidDate - nextDueDate) / (1000 * 60 * 60 * 24),
      );
      errors.push(
        `Last paid date (${formatedDate(bill.lastPaid)}) is ${daysDiff} day${daysDiff > 1 ? "s" : ""} after next due date (${formatedDate(bill.nextDue)}). ` +
          `Please check if these dates are correct.`,
      );
    }

    // Check if lastPaid is more than 2 years in the past (might be data error)
    const today = new Date();
    const twoYearsAgo = new Date(
      today.getFullYear() - 2,
      today.getMonth(),
      today.getDate(),
    );
    if (lastPaidDate < twoYearsAgo) {
      errors.push(
        `Last paid date is more than 2 years old. Please verify this is correct.`,
      );
    }

    // Check if nextDue is more than 5 years in the future (might be data error)
    const fiveYearsFromNow = new Date(
      today.getFullYear() + 5,
      today.getMonth(),
      today.getDate(),
    );
    if (nextDueDate > fiveYearsFromNow) {
      errors.push(
        `Next due date is more than 5 years in the future. Please verify this is correct.`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Migrate existing bills to include new fields (originalDueDate, previousDueDate)
export const migrateBills = (bills) => {
  return bills
    .map((bill) => {
      // Basic validation
      if (!bill || typeof bill !== "object") {
        console.warn("Skipping invalid bill during migration");
        return null;
      }

      // Ensure basic fields exist
      const migratedBill = {
        id: bill.id,
        title: bill.title || bill.name || "Untitled",
        amount: bill.amount || 0,
        frequency: bill.frequency || "monthly",
        nextDue: bill.nextDue || null,

        // Migrate optional fields
        originalDueDate: bill.originalDueDate || bill.nextDue || null,
        previousDueDate: bill.previousDueDate || bill.nextDue || null,
        lastPaid: bill.lastPaid || "",

        // Ensure paymentHistory exists and is valid
        paymentHistory: (bill.paymentHistory || [])
          .map((entry) => ({
            date: entry.date || entry.date,
            amount: entry.amount || bill.amount || 0,
            wasLate: entry.wasLate || false,
            periodsMissed: entry.periodsMissed || 0,
            originalDueDate:
              entry.originalDueDate || entry.date || bill.nextDue || null,
          }))
          .filter((entry) => entry.date), // Remove entries without dates
      };

      // Validate the migrated bill
      if (!migratedBill.nextDue) {
        console.warn(
          `Bill ${migratedBill.id} (${migratedBill.title}) has no nextDue date`,
        );
      }

      return migratedBill;
    })
    .filter((bill) => bill !== null); // Remove any bills that failed migration
};

// Data integrity check functions
export const validateBill = (bill) => {
  const errors = [];

  if (!bill.id) errors.push("Missing id");
  if (!bill.title && !bill.name) errors.push("Missing title/name");
  if (bill.amount === undefined || bill.amount === null)
    errors.push("Missing amount");
  if (!bill.frequency) errors.push("Missing frequency");
  if (!bill.nextDue) errors.push("Missing nextDue");

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateAllBills = (bills) => {
  const results = bills.map(validateBill);
  const invalidBills = results.filter((r) => !r.isValid);

  if (invalidBills.length > 0) {
    console.warn("Found invalid bills:", invalidBills);
  }

  return {
    allValid: invalidBills.length === 0,
    invalidCount: invalidBills.length,
    results,
  };
};

// Shared bill status calculation — returns one of: 'paid', 'paid_late', 'overdue', 'due_soon', 'pending'
export const getBillStatus = (bill, today = null) => {
  const todaysDate = today ? new Date(today) : new Date();
  const nextDue = parseLocalDate(bill.nextDue);

  const monthStart = new Date(
    todaysDate.getFullYear(),
    todaysDate.getMonth(),
    1,
  );
  const monthEnd = new Date(
    todaysDate.getFullYear(),
    todaysDate.getMonth() + 1,
    0,
  );

  if (isBillPaidThisPeriod(bill, monthStart, monthEnd)) {
    const lastPayment = bill.paymentHistory?.[bill.paymentHistory.length - 1];
    if (lastPayment?.wasLate) {
      return "paid_late";
    }
    return "paid";
  }

  if (nextDue < todaysDate) {
    return "overdue";
  }

  const sevenDaysFromNow = new Date(todaysDate);
  sevenDaysFromNow.setDate(todaysDate.getDate() + 7);

  if (nextDue <= sevenDaysFromNow) {
    return "due_soon";
  }

  return "pending";
};

// Calculate next due date from a last-paid date and frequency
export const calculateNextDueFromFrequency = (
  lastPaidDate,
  frequency,
  baseDate = null,
) => {
  const lastPaid =
    typeof lastPaidDate === "string"
      ? parseLocalDate(lastPaidDate)
      : new Date(lastPaidDate);
  const newDueDate = new Date(lastPaid);

  switch (frequency) {
    case "weekly":
      newDueDate.setDate(lastPaid.getDate() + 7);
      break;
    case "biweekly":
      newDueDate.setDate(lastPaid.getDate() + 14);
      break;
    case "monthly":
      newDueDate.setMonth(lastPaid.getMonth() + 1);
      if (baseDate) {
        newDueDate.setDate(parseLocalDate(baseDate).getDate());
      }
      break;
    case "quarterly":
      newDueDate.setMonth(lastPaid.getMonth() + 3);
      break;
    case "biannually":
      newDueDate.setMonth(lastPaid.getMonth() + 6);
      break;
    case "yearly":
      newDueDate.setFullYear(lastPaid.getFullYear() + 1);
      break;
    default:
      newDueDate.setMonth(lastPaid.getMonth() + 1);
  }

  return toISODate(newDueDate);
};
