# Macctant (Modern Accountant)

Macctant is a full-stack accounting app for a small cosmetics business selling **Lip Balm** and **Solid Perfume**. It is designed to be ultra-simple, mobile-friendly, and easy for non-accountants.

## Features

- Simple login (`owner` / `1234` by default)
- Dashboard with:
  - Total sales
  - Total expenses
  - Profit/Loss auto-calculation
  - Daily/weekly/monthly chart view
- Sales entry with:
  - Big product buttons with icons
  - Auto-total
  - Optional customer and phone
  - **Quick Sale mode** (only quantity + price)
  - Voice input support (browser speech recognition)
- Expenses with category and auto-suggestions from frequent entries
- Inventory tracking with low-stock alerts
- Profit and loss calculations
- Report downloads:
  - PDF summary
  - CSV export
- Recent customer auto-fill

## Tech Stack

- Frontend: React + Vite + Tailwind CSS + Chart.js
- Backend: Node.js + Express
- Database: SQLite

## Folder Structure

```txt
macctant/
├── backend/
│   ├── db.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
├── package.json
└── README.md
```

## Run Locally

1. Install dependencies

```bash
npm run install:all
```

2. Start backend + frontend

```bash
npm run dev
```

3. Open app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

## Default Login

- Username: `owner`
- Password: `1234`

> You can change these in `backend/db.js`.
