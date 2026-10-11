import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart } from 'lucide-react';

export default function AnalyticsView({ analytics, products, categories }) {
  const topProducts = analytics?.topProducts || [];

  // Group products by category to show inventory distribution
  const categoryStats = categories.map(cat => {
    const items = products.filter(p => p.category_id === cat.id);
    const count = items.length;
    const totalValue = items.reduce((sum, p) => sum + (p.stock_quantity * p.selling_price), 0);
    return { name: cat.name, count, totalValue };
  }).filter(c => c.count > 0);

  const totalCatVal = categoryStats.reduce((sum, c) => sum + c.totalValue, 0) || 1;

  return (
    <div className="analytics-view">
      <div className="view-header">
        <div className="view-title-group">
          <h2>Sales Reports & Charts</h2>
          <p>See which departments have the most stock and which items make the most sales.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Category Valuation Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PieChart size={18} color="#059669" />
              Stock Value by Department
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Total worth of items on shelves</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categoryStats.map((c, idx) => {
                const pct = Math.round((c.totalValue / totalCatVal) * 100);
                return (
                  <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 600 }}>{c.name} ({c.count} items)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#059669' }}>
                        ₹{c.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 }}
                        style={{ 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #4F46E5 0%, #059669 100%)',
                          borderRadius: 999
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Product Velocity */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="#4F46E5" />
              Money Made by Top Products
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topProducts.map((p) => {
                return (
                  <div key={p.sku} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{p.product_name}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>SKU: {p.sku}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#059669' }}>
                        ₹{p.totalRevenue.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{p.totalSold} units sold</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
