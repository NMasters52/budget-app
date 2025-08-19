const bills = [
    {
        title: 'rent',
        amount: '$1800',
        dueDate: {
            reacouring: false,
            dayOfMonthDue: 1,
            multipleDays: null
        }
    },
    {
        title: 'grocceries',
        amount: '$200',
        dueDate: {
            reacouring: true,
            dayOfMonthDue: null,
            multipleDays: [1,7,14,21,28]
        }
    },
    {
        title: 'water',
        amount: '$120',
        dueDate: {
            reacouring: false,
            dayOfMonthDue: 1,
            multipleDays: null
        }
    },
    {
        title: 'electric',
        amount: '$100',
        dueDate: {
            reacouring: false,
            dayOfMonthDue: 1,
            multipleDays: null
        }
    },
    
];

export default bills;