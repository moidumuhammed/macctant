const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify');
const { db, initDb } = require('./db');

const app = express();
const PORT = 4000;
const JWT_SECRET = 'super-simple-secret';

initDb();

app.use(cors());
app.use(express.json());

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: user.username });
  });
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
  const period = req.query.period || 'daily';
  let groupBy = "strftime('%Y-%m-%d', date)";
  if (period === 'weekly') groupBy = "strftime('%Y-W%W', date)";
  if (period === 'monthly') groupBy = "strftime('%Y-%m', date)";

  db.get('SELECT COALESCE(SUM(total), 0) as totalSales FROM sales', [], (err, salesRow) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get('SELECT COALESCE(SUM(amount), 0) as totalExpenses FROM expenses', [], (expenseErr, expenseRow) => {
      if (expenseErr) return res.status(500).json({ error: expenseErr.message });

      db.all(
        `SELECT ${groupBy} as label, COALESCE(SUM(total),0) as sales FROM sales GROUP BY label ORDER BY label`,
        [],
        (chartErr, salesPoints) => {
          if (chartErr) return res.status(500).json({ error: chartErr.message });

          db.all(
            `SELECT ${groupBy} as label, COALESCE(SUM(amount),0) as expenses FROM expenses GROUP BY label ORDER BY label`,
            [],
            (chartExpenseErr, expensePoints) => {
              if (chartExpenseErr) return res.status(500).json({ error: chartExpenseErr.message });

              const expensesByLabel = Object.fromEntries(expensePoints.map((i) => [i.label, i.expenses]));
              const labels = [...new Set([...salesPoints.map((i) => i.label), ...expensePoints.map((i) => i.label)])].sort();
              const salesSeries = labels.map((label) => (salesPoints.find((x) => x.label === label)?.sales || 0));
              const expenseSeries = labels.map((label) => (expensesByLabel[label] || 0));

              const totalSales = salesRow.totalSales;
              const totalExpenses = expenseRow.totalExpenses;

              res.json({
                totalSales,
                totalExpenses,
                profitLoss: totalSales - totalExpenses,
                chart: { labels, sales: salesSeries, expenses: expenseSeries }
              });
            }
          );
        }
      );
    });
  });
});

app.post('/api/sales', authMiddleware, (req, res) => {
  const { product_name, quantity, price, customer_name, phone, date } = req.body;
  const qty = Number(quantity);
  const unitPrice = Number(price);
  const total = qty * unitPrice;

  if (!product_name || !qty || !unitPrice || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get('SELECT stock_quantity FROM inventory WHERE product_name = ?', [product_name], (inventoryErr, inv) => {
    if (inventoryErr) return res.status(500).json({ error: inventoryErr.message });
    if (!inv || inv.stock_quantity < qty) {
      return res.status(400).json({ error: 'Not enough stock' });
    }

    db.run(
      `INSERT INTO sales (product_name, quantity, price, total, customer_name, phone, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product_name, qty, unitPrice, total, customer_name || '', phone || '', date],
      function onSaleInsert(insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });

        db.run(
          'UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_name = ?',
          [qty, product_name],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            res.json({ id: this.lastID, total, message: 'Sale saved' });
          }
        );
      }
    );
  });
});

app.post('/api/expenses', authMiddleware, (req, res) => {
  const { name, category, amount, date } = req.body;
  if (!name || !category || !amount || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO expenses (name, category, amount, date) VALUES (?, ?, ?, ?)',
    [name, category, Number(amount), date],
    function onExpenseInsert(err) {
      if (err) return res.status(500).json({ error: err.message });

      db.run(
        `INSERT INTO expense_templates(name, category, uses)
         VALUES (?, ?, 1)
         ON CONFLICT(name) DO UPDATE SET uses = uses + 1, category = excluded.category`,
        [name, category]
      );

      res.json({ id: this.lastID, message: 'Expense saved' });
    }
  );
});

app.get('/api/expense-suggestions', authMiddleware, (req, res) => {
  db.all(
    'SELECT name, category, uses FROM expense_templates ORDER BY uses DESC, name ASC LIMIT 5',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get('/api/recent-customers', authMiddleware, (req, res) => {
  db.all(
    `SELECT customer_name, phone, MAX(date) as latest
     FROM sales
     WHERE customer_name != ''
     GROUP BY customer_name, phone
     ORDER BY latest DESC
     LIMIT 8`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get('/api/inventory', authMiddleware, (req, res) => {
  db.all('SELECT * FROM inventory ORDER BY product_name ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/inventory/:product', authMiddleware, (req, res) => {
  const { stock_quantity } = req.body;
  const { product } = req.params;

  db.run(
    'UPDATE inventory SET stock_quantity = ? WHERE product_name = ?',
    [Number(stock_quantity), decodeURIComponent(product)],
    function onUpdate(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.get('/api/export/csv', authMiddleware, (req, res) => {
  db.all(
    `SELECT 'sale' as type, product_name as name, quantity, price, total, customer_name, phone, date, '' as category, '' as amount FROM sales
     UNION ALL
     SELECT 'expense' as type, name, '' as quantity, '' as price, '' as total, '' as customer_name, '' as phone, date, category, amount FROM expenses
     ORDER BY date DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      stringify(rows, { header: true }, (csvErr, output) => {
        if (csvErr) return res.status(500).json({ error: csvErr.message });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="macctant-report.csv"');
        res.send(output);
      });
    }
  );
});

app.get('/api/export/pdf', authMiddleware, (req, res) => {
  db.get('SELECT COALESCE(SUM(total),0) as totalSales FROM sales', [], (salesErr, salesRow) => {
    if (salesErr) return res.status(500).json({ error: salesErr.message });

    db.get('SELECT COALESCE(SUM(amount),0) as totalExpenses FROM expenses', [], (expensesErr, expensesRow) => {
      if (expensesErr) return res.status(500).json({ error: expensesErr.message });

      const profit = salesRow.totalSales - expensesRow.totalExpenses;
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="macctant-report.pdf"');
      doc.pipe(res);

      doc.fontSize(20).text('Macctant Report', { underline: true });
      doc.moveDown();
      doc.fontSize(13).text(`Total Sales: $${salesRow.totalSales.toFixed(2)}`);
      doc.text(`Total Expenses: $${expensesRow.totalExpenses.toFixed(2)}`);
      doc.text(`Profit/Loss: $${profit.toFixed(2)}`);
      doc.moveDown();
      doc.text(`Generated at: ${new Date().toISOString()}`);

      doc.end();
    });
  });
});

app.listen(PORT, () => {
  console.log(`Macctant backend running on http://localhost:${PORT}`);
});
