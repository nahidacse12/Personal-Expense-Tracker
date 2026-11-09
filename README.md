# Personal Expense Tracker

A responsive browser-based application for recording and reviewing personal income and expenses.

## Features
- Dashboard: total income, total expenses, and current balance
- Add income and expense transactions
- Transaction history with title, amount, category, type, and date
- Edit and delete transactions
- Filter by all transactions, income, or expenses
- Search transactions by title
- LocalStorage persistence
- Form validation and success notifications
- Empty-state message
- Monthly expense summary
- Responsive desktop, tablet, and mobile layout

## Technologies
- HTML5
- CSS3
- Vanilla JavaScript
- Browser LocalStorage

## How to Run
1. Download or clone this repository.
2. Open the project folder.
3. Open `index.html` in a modern web browser.
4. Add your income and expense transactions.

No package installation or build step is required.

## Data Storage
Transactions are stored in the browser's LocalStorage. Data remains available after refreshing or reopening the same browser profile. LocalStorage is browser- and device-specific and does not synchronize between devices.

## Project Structure
```text
personal-expense-tracker/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Currency
Amounts are displayed in Bangladeshi Taka (BDT).
