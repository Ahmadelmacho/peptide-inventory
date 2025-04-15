// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies from requests
app.use(express.json());

// Serve static files (your frontend) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect to the SQLite database (creates inventory.db if it doesn't exist)
const db = new sqlite3.Database('./inventory.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the inventory database.');
    }
});

// Create the products table if it does not already exist
db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    strength TEXT,
    price REAL,
    quantity INTEGER,
    lowStockThreshold INTEGER
)`);

// Seed the database with initial product data only if the table is empty
db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (err) {
        console.error(err.message);
    } else if (row.count === 0) {
        const insert = db.prepare(`INSERT INTO products (id, name, strength, price, quantity, lowStockThreshold) VALUES (?, ?, ?, ?, ?, ?)`);
        const products = [
            [1, "HCG", "5,000 IU per vial", 49.99, 0, 5],
            [2, "Tesamorelin", "10 mg per vial", 131.99, 0, 3],
            [3, "Retatrutide", "10 mg per vial", 131.99, 0, 3],
            [4, "Semaglutide", "5 mg per vial", 109.99, 0, 4],
            [5, "Semaglutide", "10 mg per vial", 197.99, 0, 4]
        ];
        products.forEach(product => {
            insert.run(product, (err) => {
                if (err) console.error(err.message);
            });
        });
        insert.finalize();
        console.log('Initial data seeded into the database.');
    }
});

// API endpoint to get all products
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ products: rows });
    });
});

// API endpoint to update a product's quantity
app.put('/api/products/:id', (req, res) => {
    const productId = req.params.id;
    const { quantity } = req.body;
    if (quantity == null || quantity < 0) {
        res.status(400).json({ error: "Invalid quantity" });
        return;
    }
    db.run(
        "UPDATE products SET quantity = ? WHERE id = ?",
        [quantity, productId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ updatedID: productId, changes: this.changes });
        }
    );
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
