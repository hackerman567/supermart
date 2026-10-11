import React, { useState } from 'react';
import { ReceiptText, Search, Eye } from 'lucide-react';

export default function TransactionsView({ transactions, onViewReceipt }) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');

  const filtered = transactions.filter(t => {
    const matchesSearch = search 
      ? t.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(search.toLowerCase())) ||
        t.cashier_name.toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesMode = filterMode === 'ALL' ? true : t.payment_method === filterMode;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="transactions-view">
      <div className="view-header">
        <div className="view-title-group">
          <h2>Past Bills & Invoices</h2>
          <p>Search past customer bills, check payment types, and view/reprint receipts.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input 
              type="text" 
              placeholder="Search by bill number, customer name, or cashier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: 34 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'cash', 'card', 'upi'].map(m => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`btn btn-sm ${filterMode === m ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'uppercase' }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ReceiptText size={18} color="#059669" />
            Bills Record ({filtered.length} bills)
          </div>
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
                  <th>Subtotal</th>
                  <th>GST (5%)</th>
                  <th>Total Amount</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: '#059669' }}>
                        {t.invoice_number}
                      </strong>
                    </td>
                    <td>{t.customer_name || 'Walk-in Customer'}</td>
                    <td>{t.cashier_name}</td>
                    <td>
                      <span className="badge badge-subtle" style={{ textTransform: 'uppercase' }}>
                        {t.payment_method}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{t.subtotal.toFixed(2)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>₹{t.tax_amount.toFixed(2)}</td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                        ₹{t.grand_total.toFixed(2)}
                      </strong>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => onViewReceipt(t.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <Eye size={13} /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
