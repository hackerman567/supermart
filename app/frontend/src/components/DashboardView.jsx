import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  TrendingUp, 
  PlusCircle, 
  Package, 
  CheckCircle2,
  Receipt
} from 'lucide-react';

export default function DashboardView({ analytics, onNavigate, onQuickRestock }) {
  const inv = analytics?.inventory || {};
  const sales = analytics?.sales || {};
  const lowStock = analytics?.lowStockItems || [];
  const topProducts = analytics?.topProducts || [];
  const recentSales = analytics?.recentSales || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="dashboard-view"
    >
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h2>Store Overview</h2>
          <p>Today's sales summary, stock updates, and store alerts.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('pos')} 
            className="btn btn-primary"
          >
            <PlusCircle size={16} /> Open Billing Counter
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('inventory')} 
            className="btn btn-secondary"
          >
            <Package size={16} /> Check Stock
          </motion.button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        {/* Today's Sales */}
        <motion.div variants={itemVariants} className="metric-card primary">
          <div className="metric-info">
            <span className="metric-title">Today's Sales</span>
            <span className="metric-value">₹{(sales.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="metric-sub">
              <TrendingUp size={14} color="#059669" />
              <span>{sales.todayTransactionCount || 0} bills completed</span>
            </span>
          </div>
          <div className="metric-icon-box primary">
            <DollarSign size={22} />
          </div>
        </motion.div>

        {/* Stock Value */}
        <motion.div variants={itemVariants} className="metric-card indigo">
          <div className="metric-info">
            <span className="metric-title">Total Stock Value</span>
            <span className="metric-value">₹{(inv.totalRetailValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="metric-sub">
              <span>{inv.totalStockUnits || 0} items across {inv.totalProducts || 0} products</span>
            </span>
          </div>
          <div className="metric-icon-box indigo">
            <Package size={22} />
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div variants={itemVariants} className="metric-card warning">
          <div className="metric-info">
            <span className="metric-title">Items Running Low</span>
            <span className="metric-value">{inv.lowStockCount || 0}</span>
            <span className="metric-sub" style={{ color: inv.lowStockCount > 0 ? '#D97706' : '#64748B' }}>
              <AlertTriangle size={14} />
              <span>Products near or below reorder level</span>
            </span>
          </div>
          <div className="metric-icon-box warning">
            <AlertTriangle size={22} />
          </div>
        </motion.div>

        {/* Tax Collected Today */}
        <motion.div variants={itemVariants} className="metric-card info">
          <div className="metric-info">
            <span className="metric-title">GST Collected (5%)</span>
            <span className="metric-value">₹{(sales.todayTaxCollected || 0).toFixed(2)}</span>
            <span className="metric-sub">
              <CheckCircle2 size={14} color="#0284C7" />
              <span>Included on invoices</span>
            </span>
          </div>
          <div className="metric-icon-box info">
            <Receipt size={22} />
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Low Stock Alert Box + Top Selling Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Low Stock Alert Box */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={18} color="#D97706" />
              Items Running Low
            </div>
            <button onClick={() => onNavigate('inventory')} className="btn btn-secondary btn-sm">
              View All Products
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {lowStock.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#64748B' }}>
                <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 10px auto' }} />
                <p>All products have healthy stock levels right now.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Stock Left</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.category_name}</div>
                        </td>
                        <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{item.sku}</span></td>
                        <td>
                          <span className={`badge ${item.stock_quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                            {item.stock_quantity} remaining (Min: {item.min_threshold})
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => onQuickRestock(item)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            + Restock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Selling Leaderboard */}
        <motion.div variants={itemVariants} className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="#059669" />
              Best Selling Products
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Most items sold today</span>
          </div>
          <div className="card-body">
            {topProducts.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#64748B' }}>
                <ShoppingBag size={36} style={{ margin: '0 auto 10px auto' }} />
                <p>No sales recorded yet today.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topProducts.map((p, idx) => {
                  const maxSold = topProducts[0]?.totalSold || 1;
                  const percent = Math.round((p.totalSold / maxSold) * 100);

                  return (
                    <div key={p.sku} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>
                          #{idx + 1} {p.product_name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#059669' }}>
                          {p.totalSold} sold (₹{p.totalRevenue.toFixed(2)})
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.1 }}
                          style={{ 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
                            borderRadius: 999
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Bills */}
      <motion.div variants={itemVariants} className="card">
        <div className="card-header">
          <div className="card-title">
            <Receipt size={18} color="#4F46E5" />
            Recent Bills
          </div>
          <button onClick={() => onNavigate('transactions')} className="btn btn-secondary btn-sm">
            View All Bills
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bill Number</th>
                  <th>Customer</th>
                  <th>Cashier</th>
                  <th>Payment Type</th>
                  <th>Bill Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#059669' }}>
                        {s.invoice_number}
                      </span>
                    </td>
                    <td>{s.customer_name || 'Walk-in Customer'}</td>
                    <td>{s.cashier_name}</td>
                    <td>
                      <span className="badge badge-subtle" style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        {s.payment_method}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>₹{s.grand_total.toFixed(2)}</strong>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
