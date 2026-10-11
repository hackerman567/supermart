import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  ReceiptText,
  BarChart3,
  Network,
  UserCheck
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'Billing Counter (POS)', icon: ShoppingCart },
  { id: 'inventory', label: 'Products & Stock', icon: Package },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'transactions', label: 'Past Invoices', icon: ReceiptText },
  { id: 'analytics', label: 'Sales Reports', icon: BarChart3 },
  { id: 'network', label: 'Network Setup (Cisco)', icon: Network, highlight: true }
];

export default function Sidebar({ activeTab, setActiveTab, currentRole, setCurrentRole }) {
  const roles = [
    { id: 'admin', label: 'Store Manager (Admin)' },
    { id: 'manager', label: 'Inventory Head' },
    { id: 'cashier', label: 'Counter Cashier' }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <motion.div
          className="brand-icon"
          whileHover={{ rotate: 10, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <ShoppingCart size={22} strokeWidth={2.5} />
        </motion.div>
        <div className="brand-text">
          <h1>SuperMart</h1>
          <div className="brand-tag">
            <span className="pulsing-dot" />
            STORE NETWORK
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="sidebar-nav">
        <div className="nav-label">Store Operations</div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Icon size={18} color={isActive ? '#34D399' : (item.highlight ? '#60A5FA' : '#94A3B8')} />
              <span>{item.label}</span>
              {item.highlight && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.65rem',
                  backgroundColor: 'rgba(96, 165, 250, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '999px',
                  fontWeight: 700
                }}>
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer User Switcher */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <UserCheck size={13} color="#10B981" /> Switch User Role:
          </label>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.78rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="user-profile-badge">
          <div className="user-avatar">
            {currentRole === 'admin' ? 'SM' : (currentRole === 'manager' ? 'IH' : 'CK')}
          </div>
          <div className="user-info">
            <div className="user-name">
              {currentRole === 'admin' ? 'Store Manager' : (currentRole === 'manager' ? 'Inventory Head' : 'Cashier Counter 01')}
            </div>
            <div className="user-role-tag">
              Logged in ({currentRole.toUpperCase()})
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
