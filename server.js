// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies from requests
app.use(express.json());

// Session middleware
app.use(session({
    secret: 'your-secret-key', // Change this to a secure secret
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true, // Set to true in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files (your frontend) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Database file path
const DB_FILE = path.join(__dirname, 'database.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// Initialize users database if it doesn't exist
function initUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        const initialUsers = {
            users: [
                {
                    username: 'admin',
                    // Default password: admin123
                    password: '$2a$10$X7J3z5YQ5YQ5YQ5YQ5YQ5.YQ5YQ5YQ5YQ5YQ5YQ5YQ5YQ5YQ5YQ5'
                }
            ]
        };
        fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
        console.log('Users database initialized with default admin user.');
    }
}

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

// Read users
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading users:', err);
        return { users: [] };
    }
}

// Write users
function writeUsers(data) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing users:', err);
        return false;
    }
}

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// Initialize databases
initDatabase();
initUsers();

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = { username };
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: !!req.session.user });
});

// Protected API endpoints
app.get('/api/products', isAuthenticated, (req, res) => {
    try {
        const data = readDatabase();
        res.json({ products: data.products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', isAuthenticated, (req, res) => {
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
