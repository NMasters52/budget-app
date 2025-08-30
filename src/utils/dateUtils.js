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

export const toISODate = (date) => {
    const y = date.getFullYear()
  // getMonth() is zero-based; add 1, pad to 2 digits
  const m = String(date.getMonth() + 1).padStart(2, '0')
  // getDate() is the day of month, already local
  const d = String(date.getDate()).padStart(2, '0')

  // Join into “YYYY-MM-DD”
  return `${y}-${m}-${d}`
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