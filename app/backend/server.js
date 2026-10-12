/**
 * SuperMart - Enterprise Express REST API Server
 * Integrated with SQLite via node:sqlite
 */
const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database schema & seeds
initDatabase();

// --- NETWORK TELEMETRY (Connects Web App to Cisco Packet Tracer Network Design) ---
const NETWORK_CONFIG = {
    serverHostname: 'SRV-CENTRAL-01',
    serverIp: '192.168.11.230',
    subnetMask: '255.255.255.240',
    gatewayIp: '192.168.11.225',
    dnsServer: '192.168.11.230',
    vlan: 40,
    vlanName: 'SERVERS',
    ospfArea: '0 (Backbone Core)',
    hsrpState: 'ACTIVE on HQ-R2 for VLAN 40 (HQ-R1 standby)',
    vpnStatus: 'IPsec Tunnel UP (HQ <-> Branch 02)',
    branchSubnet: '192.168.20.0/24'
};

// Network status endpoint
app.get('/api/network-status', (req, res) => {
    res.json({
        status: 'ONLINE',
        latencyMs: Math.floor(Math.random() * 4) + 1, // 1-4ms local switched LAN
        packetLossPercent: 0,
        ...NETWORK_CONFIG,
        timestamp: new Date().toISOString()
    });
});

// --- DASHBOARD ANALYTICS ---
app.get('/api/analytics', (req, res) => {
    try {
        // Total products & inventory valuation
        const inventoryStats = db.prepare(`
            SELECT 
                COUNT(*) as totalProducts,
                SUM(stock_quantity) as totalStockUnits,
                SUM(stock_quantity * cost_price) as totalCostValue,
                SUM(stock_quantity * selling_price) as totalRetailValue,
                SUM(CASE WHEN stock_quantity <= min_threshold THEN 1 ELSE 0 END) as lowStockCount,
                SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as outOfStockCount
            FROM products
        `).get();

        // Today's sales
        const todaySales = db.prepare(`
            SELECT 
                COUNT(*) as todayTransactionCount,
                COALESCE(SUM(grand_total), 0) as todayRevenue,
                COALESCE(SUM(tax_amount), 0) as todayTaxCollected
            FROM sales
            WHERE date(created_at, 'localtime') = date('now', 'localtime')
        `).get();

        // Top 5 selling products
        const topProducts = db.prepare(`
            SELECT 
                si.product_name,
                si.sku,
                SUM(si.quantity) as totalSold,
                SUM(si.total_price) as totalRevenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            GROUP BY si.product_id
            ORDER BY totalSold DESC
            LIMIT 5
        `).all();

        // Low stock alerts
        const lowStockItems = db.prepare(`
            SELECT p.id, p.sku, p.name, p.stock_quantity, p.min_threshold, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock_quantity <= p.min_threshold
            ORDER BY p.stock_quantity ASC
            LIMIT 6
        `).all();

        // Recent sales
        const recentSales = db.prepare(`
            SELECT id, invoice_number, cashier_name, customer_name, grand_total, payment_method, created_at
            FROM sales
            ORDER BY id DESC
            LIMIT 6
        `).all();

        res.json({
            inventory: inventoryStats,
            sales: todaySales,
            topProducts,
            lowStockItems,
            recentSales
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
    }
});

// --- PRODUCTS API ---
app.get('/api/products', (req, res) => {
    try {
        const { category_id, search, stock_status } = req.query;
        let query = `
            SELECT 
                p.*,
                c.name as category_name,
                c.code as category_code,
                s.name as supplier_name,
                CASE 
                    WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
                    WHEN p.stock_quantity <= p.min_threshold THEN 'LOW_STOCK'
                    ELSE 'IN_STOCK'
                END as stock_status
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (category_id) {
            query += ' AND p.category_id = ?';
            params.push(Number(category_id));
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (stock_status === 'LOW') {
            query += ' AND p.stock_quantity <= p.min_threshold AND p.stock_quantity > 0';
        } else if (stock_status === 'OUT') {
            query += ' AND p.stock_quantity = 0';
        } else if (stock_status === 'IN') {
            query += ' AND p.stock_quantity > p.min_threshold';
        }

        query += ' ORDER BY p.name ASC';

        const stmt = db.prepare(query);
        const rows = stmt.all(...params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create product
app.post('/api/products', (req, res) => {
    try {
        const { sku, barcode, name, category_id, cost_price, selling_price, stock_quantity, min_threshold, unit, supplier_id } = req.body;

        if (!sku || !barcode || !name || cost_price == null || selling_price == null) {
            return res.status(400).json({ error: 'SKU, Barcode, Name, Cost Price and Selling Price are required' });
        }

        const insert = db.prepare(`
            INSERT INTO products (sku, barcode, name, category_id, cost_price, selling_price, stock_quantity, min_threshold, unit, supplier_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insert.run(
            sku.trim().toUpperCase(),
            barcode.trim(),
            name.trim(),
            category_id ? Number(category_id) : null,
            Number(cost_price),
            Number(selling_price),
            Number(stock_quantity || 0),
            Number(min_threshold || 10),
            unit || 'pcs',
            supplier_id ? Number(supplier_id) : null
        );

        // Log initial stock movement
        if (stock_quantity > 0) {
            db.prepare(`
                INSERT INTO stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference, performed_by)
                VALUES (?, 'RESTOCK', ?, 0, ?, 'Initial Product Setup', 'Admin')
            `).run(result.lastInsertRowid, stock_quantity, stock_quantity);
        }

        res.status(201).json({ id: result.lastInsertRowid, message: 'Product created successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update product
app.put('/api/products/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, category_id, cost_price, selling_price, min_threshold, unit, supplier_id } = req.body;

        const update = db.prepare(`
            UPDATE products 
            SET name = ?, category_id = ?, cost_price = ?, selling_price = ?, min_threshold = ?, unit = ?, supplier_id = ?
            WHERE id = ?
        `);

        update.run(name, category_id, cost_price, selling_price, min_threshold, unit, supplier_id, id);
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Restock product
app.post('/api/products/:id/restock', (req, res) => {
    try {
        const id = Number(req.params.id);
        const { quantity, notes, operator } = req.body;

        const addQty = Number(quantity);
        if (isNaN(addQty) || addQty <= 0) {
            return res.status(400).json({ error: 'Valid positive restock quantity required' });
        }

        const product = db.prepare('SELECT stock_quantity, name FROM products WHERE id = ?').get(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const prevStock = product.stock_quantity;
        const newStock = prevStock + addQty;

        db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newStock, id);

        db.prepare(`
            INSERT INTO stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference, performed_by)
            VALUES (?, 'RESTOCK', ?, ?, ?, ?, ?)
        `).run(id, addQty, prevStock, newStock, notes || 'Warehouse Shipment Received', operator || 'Manager');

        res.json({ message: `Successfully restocked ${addQty} units. New stock: ${newStock}`, newStock });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CATEGORIES & SUPPLIERS ---
app.get('/api/categories', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/suppliers', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/suppliers', (req, res) => {
    try {
        const { name, contact_person, phone, email, lead_time_days } = req.body;
        const insert = db.prepare('INSERT INTO suppliers (name, contact_person, phone, email, lead_time_days) VALUES (?, ?, ?, ?, ?)');
        const result = insert.run(name, contact_person, phone, email, Number(lead_time_days || 3));
        res.status(201).json({ id: result.lastInsertRowid, message: 'Supplier registered successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- POINT-OF-SALE (POS) BILLING & CHECKOUT WORKFLOW ---
app.post('/api/sales', (req, res) => {
    try {
        const { items, customer_name, customer_phone, payment_method, tender_amount, discount_amount = 0, cashier_name = 'Counter 01 Cashier' } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Please add items to checkout.' });
        }

        if (!['cash', 'card', 'upi'].includes(payment_method)) {
            return res.status(400).json({ error: 'Valid payment method (cash, card, upi) is required' });
        }

        // STEP 1: Strict Inventory Validation across all cart items
        for (const item of items) {
            const product = db.prepare('SELECT id, name, sku, stock_quantity, selling_price FROM products WHERE id = ?').get(item.productId);
            if (!product) {
                return res.status(400).json({ error: `Product ID #${item.productId} does not exist in inventory` });
            }
            if (product.stock_quantity < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}. Sale rejected.` 
                });
            }
        }

        // STEP 2: Calculate financial breakdown
        let subtotal = 0;
        const validatedItems = items.map(item => {
            const product = db.prepare('SELECT id, name, sku, selling_price FROM products WHERE id = ?').get(item.productId);
            const lineTotal = product.selling_price * item.quantity;
            subtotal += lineTotal;
            return {
                productId: product.id,
                name: product.name,
                sku: product.sku,
                unitPrice: product.selling_price,
                quantity: item.quantity,
                lineTotal: Number(lineTotal.toFixed(2))
            };
        });

        const taxRate = 0.05; // 5% GST
        const taxAmount = Number((subtotal * taxRate).toFixed(2));
        const grandTotal = Number((subtotal + taxAmount - Number(discount_amount || 0)).toFixed(2));

        let changeAmount = 0;
        let tender = Number(tender_amount || grandTotal);
        if (payment_method === 'cash') {
            if (tender < grandTotal) {
                return res.status(400).json({ error: `Cash tendered (Rs. ${tender}) is less than grand total (Rs. ${grandTotal})` });
            }
            changeAmount = Number((tender - grandTotal).toFixed(2));
        }

        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

        // STEP 3: Execute Database Writes (Sale + Items + Stock Decrement + Audit Logs)
        const saleStmt = db.prepare(`
            INSERT INTO sales (invoice_number, cashier_name, customer_name, customer_phone, subtotal, tax_rate, tax_amount, discount_amount, grand_total, payment_method, tender_amount, change_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const saleResult = saleStmt.run(
            invoiceNumber,
            cashier_name,
            customer_name || 'Walk-in Customer',
            customer_phone || null,
            subtotal,
            taxRate,
            taxAmount,
            discount_amount,
            grandTotal,
            payment_method,
            tender,
            changeAmount
        );

        const saleId = saleResult.lastInsertRowid;

        const itemStmt = db.prepare(`
            INSERT INTO sale_items (sale_id, product_id, product_name, sku, unit_price, quantity, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const updateStockStmt = db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?');
        const movementStmt = db.prepare(`
            INSERT INTO stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference, performed_by)
            VALUES (?, 'SALE', ?, ?, ?, ?, ?)
        `);

        for (const item of validatedItems) {
            itemStmt.run(saleId, item.productId, item.name, item.sku, item.unitPrice, item.quantity, item.lineTotal);

            const curr = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(item.productId);
            const prevStock = curr.stock_quantity;
            const newStock = prevStock - item.quantity;

            updateStockStmt.run(newStock, item.productId);
            movementStmt.run(item.productId, -item.quantity, prevStock, newStock, `Invoice ${invoiceNumber}`, cashier_name);
        }

        // Return complete invoice payload
        res.status(201).json({
            message: 'Transaction successfully processed and recorded',
            saleId,
            invoiceNumber,
            timestamp: new Date().toISOString(),
            cashier: cashier_name,
            customerName: customer_name || 'Walk-in Customer',
            customerPhone: customer_phone,
            items: validatedItems,
            subtotal,
            taxRate: 5,
            taxAmount,
            discountAmount: discount_amount,
            grandTotal,
            paymentMethod: payment_method,
            tenderAmount: tender,
            changeAmount
        });

    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Transaction failed', details: err.message });
    }
});

// Transactions list
app.get('/api/sales', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT id, invoice_number, cashier_name, customer_name, subtotal, tax_amount, grand_total, payment_method, created_at
            FROM sales
            ORDER BY id DESC
            LIMIT 50
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Single transaction details for receipt modal
app.get('/api/sales/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
        if (!sale) return res.status(404).json({ error: 'Sale record not found' });

        const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
        res.json({ ...sale, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stock movement audit history
app.get('/api/stock-movements', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT sm.*, p.name as product_name, p.sku
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            ORDER BY sm.id DESC
            LIMIT 50
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`[SuperMart Server] Running on http://localhost:${PORT}`);
    console.log(`[SuperMart Server] Network Node: ${NETWORK_CONFIG.serverHostname} (IP: ${NETWORK_CONFIG.serverIp}, VLAN ${NETWORK_CONFIG.vlan})`);
});
