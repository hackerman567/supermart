/**
 * SuperMart - Enterprise SQLite Database Engine
 * Powered by Node.js 22 built-in node:sqlite module
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dbPath = path.join(__dirname, 'data', 'supermart.db');

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
    // Schema creation
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT CHECK(role IN ('admin', 'manager', 'cashier')) NOT NULL,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            code TEXT UNIQUE NOT NULL,
            icon TEXT DEFAULT 'tag'
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            lead_time_days INTEGER DEFAULT 3
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE NOT NULL,
            barcode TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category_id INTEGER,
            cost_price REAL NOT NULL,
            selling_price REAL NOT NULL,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            min_threshold INTEGER NOT NULL DEFAULT 10,
            unit TEXT DEFAULT 'pcs',
            supplier_id INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE NOT NULL,
            cashier_name TEXT NOT NULL,
            customer_name TEXT DEFAULT 'Walk-in Customer',
            customer_phone TEXT,
            subtotal REAL NOT NULL,
            tax_rate REAL DEFAULT 0.05,
            tax_amount REAL NOT NULL,
            discount_amount REAL DEFAULT 0.0,
            grand_total REAL NOT NULL,
            payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'upi')) NOT NULL,
            tender_amount REAL,
            change_amount REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            sku TEXT NOT NULL,
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            total_price REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            movement_type TEXT CHECK(movement_type IN ('SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN')) NOT NULL,
            quantity_change INTEGER NOT NULL,
            previous_stock INTEGER NOT NULL,
            new_stock INTEGER NOT NULL,
            reference TEXT,
            performed_by TEXT DEFAULT 'System',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
    `);

    // Check if initial seed is needed
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        seedInitialData();
    }
}

function seedInitialData() {
    console.log('[SuperMart DB] Seeding initial enterprise catalog & network data...');

    // Seed users
    const insertUser = db.prepare('INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', 'admin123', 'Rajesh Sharma (Store Director)', 'admin');
    insertUser.run('manager', 'mgr123', 'Priya Patel (Inventory Head)', 'manager');
    insertUser.run('cashier1', 'pos123', 'Arun Kumar (Counter 01 Cashier)', 'cashier');
    insertUser.run('cashier2', 'pos123', 'Sneha Roy (Counter 02 Cashier)', 'cashier');

    // Seed categories
    const insertCat = db.prepare('INSERT INTO categories (name, code, icon) VALUES (?, ?, ?)');
    insertCat.run('Dairy & Eggs', 'DAIRY', 'egg');
    insertCat.run('Beverages & Drinks', 'BEV', 'coffee');
    insertCat.run('Bakery & Snacks', 'BAKE', 'croissant');
    insertCat.run('Groceries & Staples', 'GROC', 'shopping-bag');
    insertCat.run('Fresh Produce', 'PROD', 'apple');
    insertCat.run('Household & Cleaning', 'HOUSE', 'home');
    insertCat.run('Personal Care', 'CARE', 'heart');

    // Seed suppliers
    const insertSupplier = db.prepare('INSERT INTO suppliers (name, contact_person, phone, email, lead_time_days) VALUES (?, ?, ?, ?, ?)');
    insertSupplier.run('Apex FMCG Distributors', 'Vikram Mehta', '+91 98230 11223', 'orders@apexfmcg.in', 2);
    insertSupplier.run('Heritage Agro Farms', 'Kavita Singh', '+91 97110 44556', 'supply@heritageagro.com', 1);
    insertSupplier.run('Pinnacle Essentials Ltd', 'Rohan Verma', '+91 98990 77889', 'sales@pinnacle.co.in', 3);
    insertSupplier.run('Daily Fresh Dairy Co.', 'Sunil Jadhav', '+91 96550 33441', 'fresh@dailydairy.in', 1);

    // Seed products with realistic items, barcodes, prices & stock levels
    const products = [
        // Dairy
        { sku: 'DRY-001', barcode: '890103001001', name: 'Amul Taaza Toned Milk 1L', category_id: 1, cost: 58.00, price: 68.00, stock: 45, min: 15, unit: 'packet', supplier_id: 4 },
        { sku: 'DRY-002', barcode: '890103001002', name: 'Amul Salted Butter 500g', category_id: 1, cost: 240.00, price: 285.00, stock: 24, min: 8, unit: 'block', supplier_id: 4 },
        { sku: 'DRY-003', barcode: '890103001003', name: 'Farm Fresh Brown Eggs (Pack of 12)', category_id: 1, cost: 85.00, price: 110.00, stock: 35, min: 10, unit: 'pack', supplier_id: 2 },
        { sku: 'DRY-004', barcode: '890103001004', name: 'Mother Dairy Paneer 200g', category_id: 1, cost: 80.00, price: 95.00, stock: 6, min: 12, unit: 'pack', supplier_id: 4 }, // Low stock sample

        // Beverages
        { sku: 'BEV-001', barcode: '890103002001', name: 'Nescafe Classic Instant Coffee 100g', category_id: 2, cost: 260.00, price: 310.00, stock: 28, min: 10, unit: 'jar', supplier_id: 1 },
        { sku: 'BEV-002', barcode: '890103002002', name: 'Red Label Tea Leaf 500g', category_id: 2, cost: 210.00, price: 260.00, stock: 40, min: 15, unit: 'box', supplier_id: 1 },
        { sku: 'BEV-003', barcode: '890103002003', name: 'Tropicana 100% Orange Juice 1L', category_id: 2, cost: 115.00, price: 145.00, stock: 18, min: 10, unit: 'carton', supplier_id: 1 },
        { sku: 'BEV-004', barcode: '890103002004', name: 'Bisleri Mineral Water 1L', category_id: 2, cost: 12.00, price: 20.00, stock: 120, min: 30, unit: 'bottle', supplier_id: 1 },

        // Bakery
        { sku: 'BAK-001', barcode: '890103003001', name: 'Britannia Whole Wheat Bread 400g', category_id: 3, cost: 38.00, price: 50.00, stock: 22, min: 10, unit: 'loaf', supplier_id: 1 },
        { sku: 'BAK-002', barcode: '890103003002', name: 'Oreo Choco Creme Biscuit 300g', category_id: 3, cost: 65.00, price: 85.00, stock: 55, min: 20, unit: 'pack', supplier_id: 1 },
        { sku: 'BAK-003', barcode: '890103003003', name: 'Haldiram Aloo Bhujia 400g', category_id: 3, cost: 85.00, price: 110.00, stock: 3, min: 15, unit: 'pouch', supplier_id: 1 }, // Critical low stock

        // Groceries & Staples
        { sku: 'GRC-001', barcode: '890103004001', name: 'India Gate Basmati Rice 5kg', category_id: 4, cost: 480.00, price: 599.00, stock: 32, min: 10, unit: 'bag', supplier_id: 2 },
        { sku: 'GRC-002', barcode: '890103004002', name: 'Fortune Sunlite Sunflower Oil 1L', category_id: 4, cost: 125.00, price: 155.00, stock: 50, min: 15, unit: 'pouch', supplier_id: 1 },
        { sku: 'GRC-003', barcode: '890103004003', name: 'Tata Salt Vacuum Evaporated 1kg', category_id: 4, cost: 20.00, price: 28.00, stock: 85, min: 25, unit: 'pack', supplier_id: 1 },
        { sku: 'GRC-004', barcode: '890103004004', name: 'Aashirvaad Superior Sharbati Atta 5kg', category_id: 4, cost: 255.00, price: 320.00, stock: 40, min: 15, unit: 'bag', supplier_id: 2 },
        { sku: 'GRC-005', barcode: '890103004005', name: 'Tata Sampann Toor Dal 1kg', category_id: 4, cost: 140.00, price: 175.00, stock: 26, min: 10, unit: 'pack', supplier_id: 2 },

        // Household & Cleaning
        { sku: 'HSD-001', barcode: '890103005001', name: 'Surf Excel Quick Wash Detergent 2kg', category_id: 6, cost: 310.00, price: 399.00, stock: 30, min: 10, unit: 'bag', supplier_id: 3 },
        { sku: 'HSD-002', barcode: '890103005002', name: 'Vim Dishwash Gel Lemon 750ml', category_id: 6, cost: 135.00, price: 170.00, stock: 42, min: 15, unit: 'bottle', supplier_id: 3 },
        { sku: 'HSD-003', barcode: '890103005003', name: 'Dettol Disinfectant Liquid 550ml', category_id: 6, cost: 165.00, price: 215.00, stock: 20, min: 8, unit: 'bottle', supplier_id: 3 },

        // Personal Care
        { sku: 'PER-001', barcode: '890103006001', name: 'Dove Cream Beauty Bathing Bar 125g', category_id: 7, cost: 55.00, price: 72.00, stock: 65, min: 20, unit: 'bar', supplier_id: 3 },
        { sku: 'PER-002', barcode: '890103006002', name: 'Colgate Total Dental Cream 150g', category_id: 7, cost: 110.00, price: 140.00, stock: 48, min: 15, unit: 'tube', supplier_id: 3 }
    ];

    const insertProd = db.prepare(`
        INSERT INTO products (sku, barcode, name, category_id, cost_price, selling_price, stock_quantity, min_threshold, unit, supplier_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of products) {
        insertProd.run(p.sku, p.barcode, p.name, p.category_id, p.cost, p.price, p.stock, p.min, p.unit, p.supplier_id);
    }

    // Seed sample sales to show analytics immediately
    seedSampleSales();
    console.log('[SuperMart DB] Database initialization completed successfully.');
}

function seedSampleSales() {
    const saleInsert = db.prepare(`
        INSERT INTO sales (invoice_number, cashier_name, customer_name, customer_phone, subtotal, tax_rate, tax_amount, discount_amount, grand_total, payment_method, tender_amount, change_amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    const itemInsert = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, product_name, sku, unit_price, quantity, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Sample transaction 1
    const s1 = saleInsert.run('INV-2026-1001', 'Arun Kumar', 'Vikas Rao', '9845012345', 1014.00, 0.05, 50.70, 0, 1064.70, 'upi', 1064.70, 0, '-2 hours');
    itemInsert.run(s1.lastInsertRowid, 1, 'Amul Taaza Toned Milk 1L', 'DRY-001', 68.00, 2, 136.00);
    itemInsert.run(s1.lastInsertRowid, 11, 'India Gate Basmati Rice 5kg', 'GRC-001', 599.00, 1, 599.00);
    itemInsert.run(s1.lastInsertRowid, 13, 'Tata Salt Vacuum Evaporated 1kg', 'GRC-003', 28.00, 1, 28.00);
    itemInsert.run(s1.lastInsertRowid, 6, 'Red Label Tea Leaf 500g', 'BEV-002', 260.00, 1, 260.00);

    // Sample transaction 2
    const s2 = saleInsert.run('INV-2026-1002', 'Sneha Roy', 'Meera Nair', '9988223311', 484.00, 0.05, 24.20, 0, 508.20, 'card', 508.20, 0, '-1 hours');
    itemInsert.run(s2.lastInsertRowid, 2, 'Amul Salted Butter 500g', 'DRY-002', 285.00, 1, 285.00);
    itemInsert.run(s2.lastInsertRowid, 9, 'Britannia Whole Wheat Bread 400g', 'BAK-001', 50.00, 2, 100.00);
    itemInsert.run(s2.lastInsertRowid, 3, 'Farm Fresh Brown Eggs (Pack of 12)', 'DRY-003', 110.00, 1, 110.00);

    // Sample transaction 3
    const s3 = saleInsert.run('INV-2026-1003', 'Arun Kumar', 'Walk-in Customer', null, 369.00, 0.05, 18.45, 0, 387.45, 'cash', 500.00, 112.55, '-30 minutes');
    itemInsert.run(s3.lastInsertRowid, 17, 'Vim Dishwash Gel Lemon 750ml', 'HSD-002', 170.00, 1, 170.00);
    itemInsert.run(s3.lastInsertRowid, 19, 'Dove Cream Beauty Bathing Bar 125g', 'PER-001', 72.00, 2, 144.00);
    itemInsert.run(s3.lastInsertRowid, 20, 'Colgate Total Dental Cream 150g', 'PER-002', 140.00, 1, 140.00);
}

module.exports = {
    db,
    initDatabase
};
