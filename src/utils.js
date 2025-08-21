export function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
}

export function formatLocaleDate(date) {
    return date.toLocaleDateString();
}