import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Receipt, 
  ShoppingBag
} from 'lucide-react';

export default function PosView({ 
  products, 
  categories, 
  onCheckout, 
  currentRole,
  isProcessing 
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tenderAmount, setTenderAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Barcode quick scan handler
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const trimmed = barcodeInput.trim();
    const match = products.find(p => p.barcode === trimmed || p.sku.toLowerCase() === trimmed.toLowerCase());
    
    if (match) {
      addToCart(match);
      setBarcodeInput('');
    } else {
      alert(`No product found with barcode or SKU: "${trimmed}"`);
    }
  };

  // Add to cart with stock check
  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      alert(`Sorry, "${product.name}" is currently Out of Stock.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Only ${product.stock_quantity} units available for "${product.name}".`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unitPrice: product.selling_price,
          unit: product.unit,
          quantity: 1,
          maxStock: product.stock_quantity,
          lineTotal: product.selling_price
        }];
      }
    });
  };

  // Adjust item quantity
  const updateQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxStock) {
            alert(`Only ${item.maxStock} units available in stock.`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            lineTotal: newQty * item.unitPrice
          };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Remove single line item
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Clear all items from this bill?')) {
      setCart([]);
    }
  };

  // Financial calculations
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxRate = 0.05; // 5% GST
  const taxAmount = Number((subtotal * taxRate).toFixed(2));
  const finalDiscount = Number(discountAmount) || 0;
  const grandTotal = Math.max(0, Number((subtotal + taxAmount - finalDiscount).toFixed(2)));

  const parsedTender = parseFloat(tenderAmount) || 0;
  const changeDue = paymentMethod === 'cash' && parsedTender >= grandTotal 
    ? Number((parsedTender - grandTotal).toFixed(2)) 
    : 0;

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory ? p.category_id === selectedCategory : true;
    const matchesSearch = searchQuery 
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery)
      : true;
    return matchesCat && matchesSearch;
  });

  // Handle final checkout submission
  const handleFinalCheckout = () => {
    if (cart.length === 0) {
      alert('The cart is empty. Please select or scan items to bill.');
      return;
    }

    if (paymentMethod === 'cash' && parsedTender < grandTotal && parsedTender > 0) {
      alert(`Cash given (₹${parsedTender}) is less than the bill amount (₹${grandTotal}).`);
      return;
    }

    const payload = {
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
      customer_name: customerName,
      customer_phone: customerPhone,
      payment_method: paymentMethod,
      tender_amount: paymentMethod === 'cash' ? (parsedTender || grandTotal) : grandTotal,
      discount_amount: finalDiscount,
      cashier_name: currentRole === 'admin' ? 'Store Manager' : 'Cashier Counter 01'
    };

    onCheckout(payload, () => {
      setCart([]);
      setTenderAmount('');
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setDiscountAmount(0);
    });
  };

  return (
    <div className="pos-view">
      <div className="view-header" style={{ marginBottom: 16 }}>
        <div className="view-title-group">
          <h2>Billing Counter 01</h2>
          <p>Scan barcode, select items from departments, and print customer receipt.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="badge badge-success" style={{ padding: '6px 12px' }}>
            <span className="pulsing-dot" /> Counter Connected (VLAN 10)
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="btn btn-secondary btn-sm" style={{ color: '#EF4444' }}>
              <Trash2 size={14} /> Clear Bill
            </button>
          )}
        </div>
      </div>

      <div className="pos-layout">
        {/* Left Side: Product Catalog & Barcode Scanner */}
        <div className="pos-catalog-panel">
          <div className="pos-search-header">
            {/* Barcode scanner input */}
            <form onSubmit={handleBarcodeSubmit} className="barcode-scanner-bar">
              <Barcode size={20} color="#059669" />
              <input 
                type="text" 
                placeholder="Scan or type barcode (e.g. 890103001001) and press Enter..." 
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '4px 10px' }}>
                Add Item
              </button>
            </form>

            {/* Keyword Search & Category Filter Pills */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 10 }} />
                <input 
                  type="text" 
                  placeholder="Search by product name or brand..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div className="category-filter-pills">
              <button 
                className={`pill-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Departments
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  className={`pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="products-grid">
            {filteredProducts.map(product => {
              const isOutOfStock = product.stock_quantity <= 0;
              const isLowStock = product.stock_quantity <= product.min_threshold && !isOutOfStock;

              return (
                <motion.div
                  key={product.id}
                  whileHover={!isOutOfStock ? { y: -3, scale: 1.02 } : {}}
                  whileTap={!isOutOfStock ? { scale: 0.97 } : {}}
                  className={`pos-item-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                  onClick={() => addToCart(product)}
                >
                  <div className="pos-item-header">
                    <span className="pos-item-sku">{product.sku}</span>
                    {isOutOfStock ? (
                      <span className="badge badge-danger">Out of Stock</span>
                    ) : isLowStock ? (
                      <span className="badge badge-warning">{product.stock_quantity} left</span>
                    ) : (
                      <span className="badge badge-success">{product.stock_quantity} in stock</span>
                    )}
                  </div>

                  <div className="pos-item-name">{product.name}</div>

                  <div className="pos-item-footer">
                    <span className="pos-item-price">₹{product.selling_price.toFixed(2)}</span>
                    <span className="pos-item-stock">per {product.unit}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Shopping Cart & Checkout */}
        <div className="pos-cart-panel">
          <div className="cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} color="#059669" />
              <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>Current Customer Bill</strong>
            </div>
            <span className="badge badge-subtle">{cart.length} items</span>
          </div>

          {/* Cart Item Rows */}
          <div className="cart-items-list">
            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="cart-empty-state"
                >
                  <Barcode size={44} strokeWidth={1.5} />
                  <p style={{ fontWeight: 600, color: '#475569' }}>No items in bill yet</p>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    Click products from the shelf or type/scan a barcode above.
                  </span>
                </motion.div>
              ) : (
                cart.map(item => (
                  <motion.div 
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="cart-item-row"
                  >
                    <div className="cart-item-info">
                      <div className="cart-item-title">{item.name}</div>
                      <div className="cart-item-unit-price">
                        ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                      </div>
                    </div>

                    <div className="cart-qty-controls">
                      <button 
                        onClick={() => updateQty(item.productId, -1)} 
                        className="cart-qty-btn"
                        title="Reduce quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="cart-qty-number">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty(item.productId, 1)} 
                        className="cart-qty-btn"
                        title="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="cart-item-total">
                      ₹{item.lineTotal.toFixed(2)}
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                      title="Remove from bill"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Checkout Breakdown Footer */}
          <div className="cart-checkout-footer">
            {/* Customer Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input 
                type="text" 
                placeholder="Customer Name" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
              />
              <input 
                type="text" 
                placeholder="Mobile Number" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
              />
            </div>

            {/* Calculations Breakdown */}
            <div className="cart-summary-line">
              <span>Subtotal ({cart.reduce((c, i) => c + i.quantity, 0)} units):</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{subtotal.toFixed(2)}</strong>
            </div>

            <div className="cart-summary-line">
              <span>GST Tax (5% Included):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>+ ₹{taxAmount.toFixed(2)}</span>
            </div>

            {/* Discount field */}
            <div className="cart-summary-line">
              <span>Discount / Coupon:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>- ₹</span>
                <input 
                  type="number" 
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  style={{ width: 60, padding: '2px 4px', fontSize: '0.78rem', textAlign: 'right', border: '1px solid #CBD5E1', borderRadius: 4 }}
                />
              </div>
            </div>

            <div className="cart-summary-line grand-total">
              <span>Total Bill:</span>
              <strong>₹{grandTotal.toFixed(2)}</strong>
            </div>

            {/* Payment Mode Selection */}
            <div className="tender-tabs">
              <button 
                type="button"
                className={`tender-tab-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote size={16} /> Cash
              </button>
              <button 
                type="button"
                className={`tender-tab-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={16} /> Card
              </button>
              <button 
                type="button"
                className={`tender-tab-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <QrCode size={16} /> UPI / QR
              </button>
            </div>

            {/* Cash Tender Calculation Helpers */}
            {paymentMethod === 'cash' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#FFFFFF', padding: 8, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span>Cash Given by Customer:</span>
                  <input 
                    type="number" 
                    placeholder={`₹${Math.ceil(grandTotal / 100) * 100}`}
                    value={tenderAmount}
                    onChange={(e) => setTenderAmount(e.target.value)}
                    style={{ width: 90, padding: '4px 6px', fontSize: '0.8rem', textAlign: 'right', border: '1px solid #CBD5E1', borderRadius: 4, fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                {changeDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                    <span>Change to Return:</span>
                    <span>₹{changeDue.toFixed(2)}</span>
                  </div>
                )}
                {/* Quick cash shortcut buttons */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {[100, 500, 1000, 2000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTenderAmount(amt)}
                      style={{ flex: 1, padding: '2px', fontSize: '0.7rem', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 4, cursor: 'pointer' }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTenderAmount(grandTotal)}
                    style={{ flex: 1, padding: '2px', fontSize: '0.7rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Exact
                  </button>
                </div>
              </div>
            )}

            {/* Complete Transaction & Print Invoice */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={cart.length === 0 || isProcessing}
              onClick={handleFinalCheckout}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 4 }}
            >
              {isProcessing ? (
                <span>Saving bill and updating stock...</span>
              ) : (
                <>
                  <Receipt size={18} /> Complete Bill & Print Receipt
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
