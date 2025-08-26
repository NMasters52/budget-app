export function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
}

export function addMonths(date, months) {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + months);
    return newDate;
}

export function formatLocaleDate(date) {
    return new Date(date).toLocaleDateString();
}

export function isBillPaid(dueDate, todaysDate) {
    if (dueDate < todaysDate) {
        return true;
    }
    return false;
}

export const toISODate = (dateString) => {
    return new Date(dateString).toISOString().split('T')[0];
};

//calculate total bills for the year
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

//check if bill is paid and if so move to bill.paymentHistory
export const markBillAdPaid = (bills, billId, paidDate = new Date()) => {
    const paidDateString = toISODate(paidDate);

    bills.map((bill) => {
        if (bill.id === billId) {
            let newDueDate;
            switch (bill.frequency) {
            case 'weekly':
                newDueDate = addDays(bill.dueDate, 7);
                break;
            case 'biweekly':
             newDueDate = addDays(bill.dueDate, 14);
                break;
            case 'monthly':
             newDueDate = addMonths(bill.dueDate, 1);
                break;
            case 'quartly':
             newDueDate = addMonths(bill.dueDate, 3);
                break;
            case 'biannually':
             newDueDate = addMonths(bill.dueDate, 6);
                break;
            case 'yearly':
             newDueDate = addMonths(bill.dueDate, 12);
                break;
            default:
                console.warn(`uknown bill frequency ${bill.frequency} in bill: ${bill.name}`);
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