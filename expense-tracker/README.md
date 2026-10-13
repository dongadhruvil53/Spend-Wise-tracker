# SpendWise Tracker

SpendWise is a small expense tracker made with HTML, CSS, and plain JavaScript. It has no build step or extra JavaScript libraries.

## Features

- Add, edit, and delete income and expense transactions.
- Search transactions by title, note, or category. Filter by type or category and sort by date or amount.
- See income, expenses, balance, transaction count, recent transactions, and spending by category.
- Keep separate transaction lists for each local account and save them in the browser.
- Use the same responsive layout on desktop, tablet, and mobile.

## Files and folders

- `index.html` at the repository root sends the browser to the SpendWise app.
- `expense-tracker/index.html` is the dashboard page.
- `expense-tracker/login.html` and `expense-tracker/register.html` contain the sign-in and registration forms.
- `expense-tracker/pages/transactions.html` is the searchable transaction list.
- `expense-tracker/css/style.css` contains shared layout and component styles.
- `expense-tracker/css/responsive.css` adjusts the layout for smaller screens.
- `expense-tracker/css/login.css` and `expense-tracker/css/register.css` contain styles used only on those forms.
- `expense-tracker/js/main.js` loads dashboard data, calculates totals, and handles dashboard actions.
- `expense-tracker/js/transactions.js` handles the transaction list, search, filters, sorting, and its add/edit/delete forms.
- `expense-tracker/js/login.js` and `expense-tracker/js/register.js` handle the account forms.
- `expense-tracker/assets/images/` contains the logo and empty-list illustration.

Each JavaScript page file gets the elements it needs with DOM selectors, then uses event listeners to respond to form submissions and button clicks. The functions are grouped by page to make it easier to follow each feature.

## How totals are calculated

The dashboard goes through the current account's transactions and adds each income amount to **Total Income** and each expense amount to **Total Expense**. It then calculates:

```text
Balance = Total Income - Total Expense
```

The transaction page uses the same rule for its filtered list, so its net total changes when the search or filters change. Category totals add together the expenses that have the same category.

## How browser storage works

The app saves JSON text in `localStorage`:

- `spendwise_users` stores the locally registered account records.
- `spendwise_current_user` stores the ID of the signed-in account.
- `spendwise_transactions` stores transactions for all accounts. Each transaction has a `userId`, so pages show and change only the signed-in user's transactions.

When a page opens, its JavaScript reads the saved text and converts it back into a JavaScript list with `JSON.parse()`. After adding, editing, deleting, or resetting transactions, it converts the list to text with `JSON.stringify()` and saves it again. The demo sample transactions and the demo login are existing conveniences in this project.

This is a browser-only learning project, not secure account storage. LocalStorage data can be viewed or changed by the person using the browser; do not use real passwords or sensitive financial data with it.

## Run the project

Open `expense-tracker/index.html` in a browser, or start a local server from the repository folder:

```text
python -m http.server 8000
```

Then visit `http://localhost:8000/expense-tracker/`.
