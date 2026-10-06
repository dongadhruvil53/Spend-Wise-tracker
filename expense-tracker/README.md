# SpendWise - Modern Vanilla JS Expense Tracker

A modern, clean, responsive, and beginner-friendly personal finance and expense tracking web application built strictly with **HTML5, CSS3, and Vanilla JavaScript**.

---

## 🌟 Features

### 1. Dashboard
- **Total Balance**: Live net cash flow (Income - Expenses) with positive/deficit status indicator.
- **Total Income**: Sum of all logged income sources with green up-trend badge.
- **Total Expense**: Sum of all logged expenditures with red down-trend badge.
- **Transaction Count**: Real-time counter of total saved transactions.
- **Cash Flow Ratio & Analytics**: Visual progress bar showing Income vs. Expense ratio and top spending category breakdown bars.
- **Recent Transactions Widget**: Displays the latest 5 transactions with quick Edit and Delete actions.

### 2. Add Transaction
- Title / Description
- Amount (positive number validation with step `0.01`)
- Type selection (Income vs Expense)
- Dynamic Category selector tailored to the chosen type:
  - **Income Categories**: Salary, Freelance, Investments, Business, Rental Income, Gift, Other Income
  - **Expense Categories**: Food & Dining, Shopping, Housing & Rent, Transportation, Utilities, Entertainment, Health & Medical, Education, Personal Care, Other Expense
- Date picker (defaults automatically to today's date)
- Optional Notes field
- Instant validation and non-intrusive toast notifications

### 3. Transaction Management (`pages/transactions.html`)
- **Full History**: Tabular view of all historical entries.
- **Live Search**: Instant real-time search across titles, categories, and notes.
- **Multi-Filter**:
  - Filter by Type: All / Income / Expense
  - Filter by Category: Any specific category
- **Sorting**:
  - Date (Newest first / Oldest first)
  - Amount (Highest first / Lowest first)
- **Edit & Delete**: Full modal editing and confirmation-protected deletion.
- **Add from List**: Dedicated "+ Add Transaction" modal directly on the transactions page.
- **Summary Metrics**: Shows live count of filtered entries and filtered net sum.

### 4. LocalStorage Persistence
- Saves all transactions in browser `localStorage`.
- Data remains intact across page refreshes and browser restarts.
- Auto-initializes with realistic sample transactions on first launch.
- Provides a "Reset Samples" button for instant testing.

### 5. Responsive & Clean UI
- **Desktop**: Multi-column dashboard grid and clean data table.
- **Tablet**: Adaptive 2x2 grid and stacked cards.
- **Mobile**: Converts data table rows into native card views (`data-label` CSS mapping) for optimal readability without horizontal scrolling.

---

## 📂 Folder Structure

```
expense-tracker/
│
├── index.html                   # Dashboard Page
│
├── pages/
│   └── transactions.html        # Transactions List & Filter Page
│
├── css/
│   ├── style.css                # Base, layout, component & theme styles
│   └── responsive.css           # Tablet and mobile responsive styles
│
├── js/
│   ├── main.js                  # Dashboard logic, metrics, and storage
│   └── transactions.js          # Search, filter, sorting, and table logic
│
└── assets/
    └── images/
        ├── logo.svg             # Application logo icon
        └── empty-illustration.svg # Zero-state SVG artwork
```

---

## 🚀 How to Run

No build step or Node.js server is required! Simply open either:
- `expense-tracker/index.html` directly in any web browser (Chrome, Edge, Firefox, Safari).
- Or run a local HTTP server:
  ```bash
  # Using Python (built-in)
  python -m http.server 8000

  # Or using VS Code Live Server extension
  ```
  Then navigate to `http://localhost:8000/expense-tracker/`.
