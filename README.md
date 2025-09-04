# Bill Buddy

A free, lightweight budgeting app built for flexible bill tracking.  
My wife and I couldn’t find a budgeting tool we loved—so we made our own.  
Add bills, see upcoming due dates, mark them paid, and preview your week’s cash needs.

**Live Demo:** [Bill Buddy on Vercel](https://budget-app-woad-one.vercel.app/)  
**Repository:** [GitHub Repo](https://github.com/NMasters52/budget-app)

---

## ✨ Features

- **Add / Edit / Delete Bills**  
  Recurring bills can be weekly, biweekly, monthly, quarterly, biannual, or yearly.

- **Bills Overview**
  - Table of all bills with cost, frequency, next due date, last paid date, and status
  - Mark bills as paid; next due and payment history update automatically
  - Sort and filter by amount or date

- **Bills Preview**
  - Choose a start date to see bills due over the next 7 days
  - Calculates total amount needed in that window

- **Data Persistence**  
  Stored in `localStorage` — no account or signup required

---

## 🛠 Tech Stack

- [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [React Icons](https://react-icons.github.io/react-icons/) for SVG icons
- [uuid](https://www.npmjs.com/package/uuid) for unique IDs
- Hosted on [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/NMasters52/budget-app.git
   cd budget-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

---

## 📂 Project Structure

```text
src/
  App.jsx            # Main router & layout
  components/
    Nav.jsx
    BillsTable.jsx
    BillsList.jsx
    BillsFilter.jsx
    BillsTotal.jsx
    EditModal.jsx
  services/
    AddBills.js      # localStorage write
    DeleteBills.js   # localStorage delete
  utils/
    dateUtils.js     # formatting, parsing, calculations

public/
  budget-buddy.png   # mascot image
  favicon.ico
```

---

## 🌍 Deployment

Deployed via **Vercel**.  
Pushing to `main` auto-redeploys.  

Live at: [https://budget-app-woad-one.vercel.app/](https://budget-app-woad-one.vercel.app/)

---

## 🔮 Future Improvements

1. **Add a backend**  
   Planning on Supabase for real-time, cross-device data sync
2. **Build payment reminders**  
   Email or push notifications for upcoming due dates
3. **Implement authentication**  
   Signup, sign-in, and per-user profiles

---

## 📜 License

MIT © [Nicholas Masters](https://github.com/NMasters52)
