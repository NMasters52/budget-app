export function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
}

export function addMonths(date, months) {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months)
    return newDate;
}

export function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatedDate(dateOrString) {
  // ensure we have a Date at local midnight
  const dt = 
    typeof dateOrString === 'string'
      ? parseLocalDate(dateOrString)
      : new Date(dateOrString);

  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${m}/${d}/${y}`;
}

export function formatLocaleDate(date) {
    return new Date(date).toLocaleDateString();
}

//replced with isBillPaidThisPeriod
export function isBillPaid(dueDate, todaysDate) {
    if (dueDate < todaysDate) {
        return true;
    }
    return false;
}

export const toISODate = dateInput => {
  let dateObj;

  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    // parse YYYY-MM-DD as local
    const [y, m, d] = dateInput.split('-').map(Number);
    dateObj = new Date(y, m - 1, d);
  } else {
    // fallback for timestamps or other formats
    dateObj = new Date(dateInput);
  }

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

//helps calculate total bills for the year
export const calculateYearlyTotal = (bills) => {
    return bills.reduce((yearlyTotal, bill) => {
        let annualAmount;

        switch (bill.frequency) {
            case 'weekly':
             annualAmount = bill.amount * 52;
                break;
            case 'biweekly':
             annualAmount = bill.amount * 26;
                break;
            case 'monthly':
             annualAmount = bill.amount * 12;
                break;
            case 'quartly':
             annualAmount = bill.amount * 4;
                break;
            case 'biannually':
             annualAmount = bill.amount * 2;
                break;
            case 'yearly':
             annualAmount = bill.amount * 1;
                break;
            default:
                console.warn(`uknown bill frequency ${bill.frequency} in bill: ${bill.name}`);
             annualAmount = 0;
        }
        return yearlyTotal + annualAmount;
    }, 0);
}

//helps check if bill is paid and if so move to bill.paymentHistory
export const markBillAsPaid = (bills, billId, paidDate = new Date()) => {
    const paidDateString = toISODate(paidDate);

    return bills.map((bill) => {
        if (bill.id === billId) {
            let newDueDate;
            switch (bill.frequency) {
            case 'weekly':
                newDueDate = addDays(bill.nextDue, 7);
                break;
            case 'biweekly':
             newDueDate = addDays(bill.nextDue, 14);
                break;
            case 'monthly':
             newDueDate = addMonths(bill.nextDue, 1);
                break;
            case 'quartly':
             newDueDate = addMonths(bill.nextDue, 3);
                break;
            case 'biannually':
             newDueDate = addMonths(bill.nextDue, 6);
                break;
            case 'yearly':
             newDueDate = addMonths(bill.nextDue, 12);
                break;
            default:
                console.warn(`uknown bill frequency ${bill.frequency} in bill: ${bill.title}`);
                return bill;
            }

            return {
                ...bill,
                nextDue: toISODate(newDueDate),
                lastPaid: paidDateString,
                paymentHistory: [...bill.paymentHistory, {
                    date: paidDateString,
                    amount: bill.amount
                }]
            };
        }
        return bill;
});
};

//helps check if the bill being passed is paid 
export const isBillPaidThisPeriod = (bill, periodStart, periodEnd) => {
    if (!bill.lastPaid) return false;

    const lastPaid = new Date(bill.lastPaid);
    return lastPaid >= new Date(periodStart) && lastPaid <= new Date(periodEnd);
}