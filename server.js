// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies from requests
app.use(express.json());

// Serve static files (your frontend) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Database file path
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database if it doesn't exist
function initDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            products: [
                {
                    id: 1,
                    name: "HCG",
                    strength: "5,000 IU per vial",
                    price: 49.99,
                    quantity: 0,
                    lowStockThreshold: 5
                },
                {
                    id: 2,
                    name: "Tesamorelin",
                    strength: "10 mg per vial",
                    price: 131.99,
                    quantity: 0,
                    lowStockThreshold: 3
                },
                {
                    id: 3,
                    name: "Retatrutide",
                    strength: "10 mg per vial",
                    price: 131.99,
                    quantity: 0,
                    lowStockThreshold: 3
                },
                {
                    id: 4,
                    name: "Semaglutide",
                    strength: "5 mg per vial",
                    price: 109.99,
                    quantity: 0,
                    lowStockThreshold: 4
                },
                {
                    id: 5,
                    name: "Semaglutide",
                    strength: "10 mg per vial",
                    price: 197.99,
                    quantity: 0,
                    lowStockThreshold: 4
                }
            ]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        console.log('Database initialized with initial data.');
    }
}

// Read database
function readDatabase() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading database:', err);
        return { products: [] };
    }
}

// Write to database
function writeDatabase(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing to database:', err);
        return false;
    }
}

// Initialize database
initDatabase();

// API endpoints
app.get('/api/products', (req, res) => {
    try {
        const data = readDatabase();
        res.json({ products: data.products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const { quantity } = req.body;
    
    if (quantity == null || quantity < 0) {
        res.status(400).json({ error: "Invalid quantity" });
        return;
    }
    
    try {
        const data = readDatabase();
        const productIndex = data.products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            res.status(404).json({ error: "Product not found" });
            return;
        }
        
        data.products[productIndex].quantity = quantity;
        
        if (writeDatabase(data)) {
            res.json({ updatedID: productId, changes: 1 });
        } else {
            res.status(500).json({ error: "Failed to update database" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
