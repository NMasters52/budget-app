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