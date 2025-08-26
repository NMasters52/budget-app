export function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
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