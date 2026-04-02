const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./db');

const app = express();
const PORT = 4000;
const JWT_SECRET = 'macctant-jwt-secret';

initDb();

app.use(cors());
app.use(express.json());

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const passwordHash = user.password || user.password_hash;
    const isMatch = await bcrypt.compare(password, passwordHash || '');

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });

    return res.json({ token, username: user.username });
  });
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
  db.get('SELECT COALESCE(SUM(total), 0) AS totalSales FROM sales', [], (salesErr, sales) => {
    if (salesErr) return res.status(500).json({ error: 'Could not load sales summary' });

    db.get('SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses', [], (expenseErr, expenses) => {
      if (expenseErr) return res.status(500).json({ error: 'Could not load expense summary' });

      db.all(
        `SELECT date AS label, COALESCE(SUM(total), 0) AS value
         FROM sales
         GROUP BY date
         ORDER BY date ASC`,
        [],
        (dailyErr, dailySales) => {
          if (dailyErr) return res.status(500).json({ error: 'Could not load daily sales chart' });

          db.all(
            `SELECT category, COALESCE(SUM(amount), 0) AS amount
             FROM expenses
             GROUP BY category
             ORDER BY amount DESC`,
            [],
            (breakdownErr, expenseBreakdown) => {
              if (breakdownErr) return res.status(500).json({ error: 'Could not load expense breakdown' });

              db.all(
                `SELECT id, 'sale' AS type, product AS title, total AS amount, date
                 FROM sales
                 UNION ALL
                 SELECT id, 'expense' AS type, name AS title, amount, date
                 FROM expenses
                 ORDER BY date DESC, id DESC
                 LIMIT 8`,
                [],
                (recentErr, recentTransactions) => {
                  if (recentErr) return res.status(500).json({ error: 'Could not load recent transactions' });

                  const totalSales = Number(sales.totalSales || 0);
                  const totalExpenses = Number(expenses.totalExpenses || 0);

                  return res.json({
                    totalSales,
                    totalExpenses,
                    profitLoss: totalSales - totalExpenses,
                    dailySales,
                    expenseBreakdown,
                    recentTransactions
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

app.post('/api/sales', authMiddleware, (req, res) => {
  const { product, quantity, price, customer_name = '', phone = '', date } = req.body;

  const qty = Number(quantity);
  const unitPrice = Number(price);
  const total = Number((qty * unitPrice).toFixed(2));

  if (!product || !qty || !unitPrice || !date) {
    return res.status(400).json({ error: 'Product, quantity, price and date are required' });
  }

  db.get('SELECT stock FROM inventory WHERE product = ?', [product], (stockErr, item) => {
    if (stockErr) return res.status(500).json({ error: 'Could not verify inventory' });
    if (!item) return res.status(404).json({ error: 'Product not found in inventory' });
    if (item.stock < qty) return res.status(400).json({ error: `Not enough stock for ${product}` });

    db.run(
      `INSERT INTO sales (product, quantity, price, total, customer_name, phone, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [product, qty, unitPrice, total, customer_name, phone, date],
      function onInsert(insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Could not save sale' });

        db.run(
          'UPDATE inventory SET stock = stock - ? WHERE product = ?',
          [qty, product],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ error: 'Could not update stock' });
            return res.status(201).json({ id: this.lastID, total, message: 'Sale saved successfully' });
          }
        );
      }
    );
  });
});

app.get('/api/sales', authMiddleware, (req, res) => {
  db.all('SELECT * FROM sales ORDER BY date DESC, id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not load sales' });
    return res.json(rows);
  });
});

app.put('/api/sales/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { product, quantity, price, customer_name = '', phone = '', date } = req.body;
  const qty = Number(quantity);
  const unitPrice = Number(price);
  const total = Number((qty * unitPrice).toFixed(2));

  if (!product || !qty || !unitPrice || !date) {
    return res.status(400).json({ error: 'Product, quantity, price and date are required' });
  }

  db.get('SELECT * FROM sales WHERE id = ?', [id], (findErr, existingSale) => {
    if (findErr) return res.status(500).json({ error: 'Could not find sale' });
    if (!existingSale) return res.status(404).json({ error: 'Sale not found' });

    db.get('SELECT stock FROM inventory WHERE product = ?', [product], (stockErr, currentInventory) => {
      if (stockErr) return res.status(500).json({ error: 'Could not check inventory' });

      db.get('SELECT stock FROM inventory WHERE product = ?', [existingSale.product], (oldInventoryErr, oldInventory) => {
        if (oldInventoryErr) return res.status(500).json({ error: 'Could not check prior inventory' });

        const available =
          product === existingSale.product
            ? Number(currentInventory?.stock || 0) + Number(existingSale.quantity)
            : Number(currentInventory?.stock || 0);

        if (available < qty) {
          return res.status(400).json({ error: `Insufficient stock for ${product}` });
        }

        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run(
            'UPDATE inventory SET stock = stock + ? WHERE product = ?',
            [existingSale.quantity, existingSale.product],
            (revertErr) => {
              if (revertErr) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Could not revert previous stock' });
              }

              db.run(
                `UPDATE sales
                 SET product = ?, quantity = ?, price = ?, total = ?, customer_name = ?, phone = ?, date = ?
                 WHERE id = ?`,
                [product, qty, unitPrice, total, customer_name, phone, date, id],
                (updateErr) => {
                  if (updateErr) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Could not update sale' });
                  }

                  db.run('UPDATE inventory SET stock = stock - ? WHERE product = ?', [qty, product], (deductErr) => {
                    if (deductErr) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: 'Could not adjust stock' });
                    }

                    db.run('COMMIT');
                    return res.json({ message: 'Sale updated successfully' });
                  });
                }
              );
            }
          );
        });
      });
    });
  });
});

app.delete('/api/sales/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM sales WHERE id = ?', [id], (findErr, sale) => {
    if (findErr) return res.status(500).json({ error: 'Could not find sale' });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('DELETE FROM sales WHERE id = ?', [id], (deleteErr) => {
        if (deleteErr) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Could not delete sale' });
        }

        db.run('UPDATE inventory SET stock = stock + ? WHERE product = ?', [sale.quantity, sale.product], (stockErr) => {
          if (stockErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Could not restore inventory' });
          }

          db.run('COMMIT');
          return res.json({ message: 'Sale deleted successfully' });
        });
      });
    });
  });
});

app.post('/api/expenses', authMiddleware, (req, res) => {
  const { name, category, amount, date } = req.body;
  const parsedAmount = Number(amount);

  if (!name || !category || !parsedAmount || !date) {
    return res.status(400).json({ error: 'Name, category, amount and date are required' });
  }

  db.run(
    'INSERT INTO expenses (name, category, amount, date) VALUES (?, ?, ?, ?)',
    [name, category, parsedAmount, date],
    function onInsert(err) {
      if (err) return res.status(500).json({ error: 'Could not save expense' });
      return res.status(201).json({ id: this.lastID, message: 'Expense saved successfully' });
    }
  );
});

app.get('/api/expenses', authMiddleware, (req, res) => {
  db.all('SELECT * FROM expenses ORDER BY date DESC, id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not load expenses' });
    return res.json(rows);
  });
});

app.delete('/api/expenses/:id', authMiddleware, (req, res) => {
  db.run('DELETE FROM expenses WHERE id = ?', [req.params.id], function onDelete(err) {
    if (err) return res.status(500).json({ error: 'Could not delete expense' });
    if (!this.changes) return res.status(404).json({ error: 'Expense not found' });
    return res.json({ message: 'Expense deleted successfully' });
  });
});

app.get('/api/inventory', authMiddleware, (req, res) => {
  db.all('SELECT product, stock FROM inventory ORDER BY product ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not load inventory' });
    return res.json(rows);
  });
});

app.get('/api/export/sales-csv', authMiddleware, (req, res) => {
  db.all('SELECT * FROM sales ORDER BY date DESC, id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Could not export sales' });

    const header = 'id,product,quantity,price,total,customer_name,phone,date';
    const dataLines = rows.map((row) =>
      [row.id, row.product, row.quantity, row.price, row.total, row.customer_name || '', row.phone || '', row.date]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(',')
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="macctant-sales.csv"');
    return res.send([header, ...dataLines].join('\n'));
  });
});

app.listen(PORT, () => {
  console.log(`Macctant backend running on http://localhost:${PORT}`);
});
