const initialBills = [
    {
        id: 1,
        title: 'Rent',
        amount: 1800,
        frequency: "monthly",
        nextDue: "2025-08-23",
        lastPaid: "2025-08-01",
        originalDueDate: "2025-08-23",
        previousDueDate: "2025-08-23",
        paymentHistory: []
    },
    {
        id: 2,
        title: 'Grocceries',
        amount: 200,
        frequency: "weekly",
        nextDue: "2025-08-26",
        lastPaid: "2025-08-03",
        originalDueDate: "2025-08-26",
        previousDueDate: "2025-08-26",
        paymentHistory: []
    },
    {
        id: 3,
        title: 'Dog Food',
        amount: 50,
        frequency: "biweekly",
        nextDue: "2025-08-28",
        lastPaid: "2025-08-08",
        originalDueDate: "2025-08-28",
        previousDueDate: "2025-08-28",
        paymentHistory: []
    },
];

export default initialBills;