# Macctant (Modern Accountant)

Production-ready full-stack accounting app for a small cosmetics business.

## Stack
- Frontend: React + Vite + Tailwind + Lucide + Chart.js
- Backend: Node.js + Express
- Database: SQLite

## Project Structure

```txt
macctant/
  backend/
  frontend/
```

## Default Login
- username: `owner`
- password: `macctant123`

## Backend setup

```bash
cd backend
npm install
npm start
```

Server runs at `http://localhost:4000`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` and calls API at `http://localhost:4000`.

## Implemented Features
- JWT login + protected app shell
- Dashboard: sales, expenses, profit/loss, daily sales chart, expense breakdown chart, recent transactions
- Add Sale UI with big product buttons, auto total, optional customer/phone, save flow with toast
- Full Sales management: list, edit, delete with confirmation
- Expenses: add, list, delete
- Inventory tracking for Lip Balm and Solid Perfume with low-stock warning
- CSV export for sales
- Dark mode toggle
- Voice input button for sales entry (browser support dependent)

## REST API
- `POST /api/login`
- `GET /api/dashboard`
- `POST /api/sales`
- `GET /api/sales`
- `PUT /api/sales/:id`
- `DELETE /api/sales/:id`
- `POST /api/expenses`
- `GET /api/expenses`
- `DELETE /api/expenses/:id`

Additional:
- `GET /api/inventory`
- `GET /api/export/sales-csv`
