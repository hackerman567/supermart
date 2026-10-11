import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Search, 
  Truck, 
  X
} from 'lucide-react';

export default function InventoryView({ 
  products, 
  categories, 
  suppliers, 
  onAddProduct, 
  onRestockProduct,
  currentRole 
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNotes, setRestockNotes] = useState('');

  // New product form state
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    category_id: categories[0]?.id || 1,
    cost_price: '',
    selling_price: '',
    stock_quantity: '',
    min_threshold: 10,
    unit: 'pcs',
    supplier_id: suppliers[0]?.id || 1
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = search 
      ? p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
      : true;

    const matchesCat = selectedCategory ? p.category_id === Number(selectedCategory) : true;

    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = p.stock_quantity <= p.min_threshold && p.stock_quantity > 0;
    } else if (stockFilter === 'OUT') {
      matchesStock = p.stock_quantity === 0;
    } else if (stockFilter === 'HEALTHY') {
      matchesStock = p.stock_quantity > p.min_threshold;
    }

    return matchesSearch && matchesCat && matchesStock;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.sku || !formData.barcode || !formData.name || !formData.selling_price) {
      alert('Please fill in SKU, Barcode, Product Name and Selling Price');
      return;
    }

    onAddProduct(formData, () => {
      setIsAddModalOpen(false);
      setFormData({
        sku: '',
        barcode: '',
        name: '',
        category_id: categories[0]?.id || 1,
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        min_threshold: 10,
        unit: 'pcs',
        supplier_id: suppliers[0]?.id || 1
      });
    });
  };

  const handleRestockSubmit = (e) => {
    e.preventDefault();
    const qty = Number(restockQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a positive number of units received');
      return;
    }

    onRestockProduct(restockItem.id, qty, restockNotes, () => {
      setRestockItem(null);
      setRestockQty('');
      setRestockNotes('');
    });
  };

  return (
    <div className="inventory-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Products & Stock Management</h2>
          <p>Check available items on shelves, reorder stock, and manage supplier links.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} /> Add New Product
          </motion.button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input 
              type="text" 
              placeholder="Search by product name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: 34 }}
            />
          </div>

          {/* Department Filter */}
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
            style={{ width: 190 }}
          >
            <option value="">All Departments</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Stock Condition */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'HEALTHY', label: 'In Stock' },
              { id: 'LOW', label: 'Low Stock' },
              { id: 'OUT', label: 'Out of Stock' }
            ].map(f => (
              <button 
                key={f.id} 
                onClick={() => setStockFilter(f.id)}
                className={`btn btn-sm ${stockFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Package size={18} color="#059669" />
            Products on Shelves ({filteredProducts.length} items)
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Connected to Central Database
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU / Barcode</th>
                  <th>Product Name</th>
                  <th>Department</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Stock in Store</th>
                  <th>Stock Status</th>
                  <th>Supplier</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isOut = p.stock_quantity === 0;
                  const isLow = p.stock_quantity <= p.min_threshold && !isOut;

                  return (
                    <tr key={p.id}>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#0F172A' }}>
                          {p.sku}
                        </strong>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#64748B' }}>
                          {p.barcode}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#0F172A' }}>{p.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Pack: {p.unit}</div>
                      </td>
                      <td>
                        <span className="badge badge-subtle">{p.category_name}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>₹{p.cost_price.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#059669' }}>
                        ₹{p.selling_price.toFixed(2)}
                      </td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                          {p.stock_quantity}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B', marginLeft: 4 }}>
                          (Min: {p.min_threshold})
                        </span>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLow ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#64748B' }}>
                        {p.supplier_name || 'Wholesale Direct'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => { setRestockItem(p); setRestockQty(''); }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <Truck size={13} /> + Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New SKU Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-dialog"
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={20} color="#059669" />
                  <strong style={{ fontSize: '1.05rem' }}>Add New Product</strong>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">SKU Code *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. BEV-005" 
                        required 
                        className="form-input"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Barcode Number *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 890103002005" 
                        required 
                        className="form-input"
                        value={formData.barcode}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Britannia Whole Wheat Bread 400g" 
                      required 
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select 
                        className="form-select"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Packaging Unit</label>
                      <input 
                        type="text" 
                        placeholder="packet / bottle / kg / pack" 
                        className="form-input"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Cost Price (₹) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Cost price" 
                        required 
                        className="form-input"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Selling Price (₹) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="Selling price" 
                        required 
                        className="form-input"
                        value={formData.selling_price}
                        onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Initial Stock Quantity</label>
                      <input 
                        type="number" 
                        placeholder="Quantity" 
                        className="form-input"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Low Stock Alert Level</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 10" 
                        className="form-input"
                        value={formData.min_threshold}
                        onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <select 
                      className="form-select"
                      value={formData.supplier_id}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Shipment Modal */}
      <AnimatePresence>
        {restockItem && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-dialog"
              style={{ maxWidth: 440 }}
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={20} color="#059669" />
                  <strong style={{ fontSize: '1rem' }}>Restock: {restockItem.name}</strong>
                </div>
                <button onClick={() => setRestockItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRestockSubmit}>
                <div className="modal-body">
                  <div style={{ background: '#F1F5F9', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Current Stock in Store:</div>
                    <strong style={{ fontSize: '1.2rem', color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                      {restockItem.stock_quantity} {restockItem.unit}
                    </strong>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Units Received from Delivery *</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      placeholder="e.g. 50" 
                      className="form-input"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Delivery Note / Invoice Reference</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Delivery Order #1042" 
                      className="form-input"
                      value={restockNotes}
                      onChange={(e) => setRestockNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setRestockItem(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Stock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
