import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Sidebar from './components/Sidebar';
import NetworkHeader from './components/NetworkHeader';
import DashboardView from './components/DashboardView';
import PosView from './components/PosView';
import InventoryView from './components/InventoryView';
import SuppliersView from './components/SuppliersView';
import TransactionsView from './components/TransactionsView';
import AnalyticsView from './components/AnalyticsView';
import NetworkView from './components/NetworkView';
import ReceiptModal from './components/ReceiptModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('admin');

  // Backend state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [networkStatus, setNetworkStatus] = useState(null);
  
  // UI interaction states
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState(null);
  const [toast, setToast] = useState(null);

  // Quick Restock shortcut state from dashboard
  const [quickRestockTarget, setQuickRestockTarget] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all initial data
  const loadStoreData = async () => {
    try {
      const [prodRes, catRes, supRes, anaRes, txRes, netRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/analytics').then(r => r.json()),
        fetch('/api/sales').then(r => r.json()),
        fetch('/api/network-status').then(r => r.json())
      ]);

      setProducts(prodRes || []);
      setCategories(catRes || []);
      setSuppliers(supRes || []);
      setAnalytics(anaRes || null);
      setTransactions(txRes || []);
      setNetworkStatus(netRes || null);
    } catch (err) {
      console.error('Failed to load store data:', err);
      showToast('Could not sync with central server. Retrying...', 'error');
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  // Checkout workflow
  const handleCheckout = async (payload, onSuccess) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Checkout failed', 'error');
        setIsProcessing(false);
        return;
      }

      showToast(`Sale recorded successfully! Invoice ${data.invoiceNumber}`);
      setReceiptModalData(data);
      if (onSuccess) onSuccess();
      loadStoreData(); // Refresh stock & stats
    } catch (err) {
      showToast('Network error processing sale', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add SKU
  const handleAddProduct = async (formData, onSuccess) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to add product', 'error');
        return;
      }

      showToast('New product SKU registered in catalog');
      if (onSuccess) onSuccess();
      loadStoreData();
    } catch (err) {
      showToast('Error communicating with backend', 'error');
    }
  };

  // Restock SKU
  const handleRestockProduct = async (id, quantity, notes, onSuccess) => {
    try {
      const res = await fetch(`/api/products/${id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          quantity, 
          notes, 
          operator: currentRole === 'admin' ? 'Store Director' : 'Inventory Head' 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Restock failed', 'error');
        return;
      }

      showToast(data.message);
      if (onSuccess) onSuccess();
      loadStoreData();
    } catch (err) {
      showToast('Error communicating with backend', 'error');
    }
  };

  // Add Supplier
  const handleAddSupplier = async (formData, onSuccess) => {
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to add supplier', 'error');
        return;
      }

      showToast('New vendor partner registered');
      if (onSuccess) onSuccess();
      loadStoreData();
    } catch (err) {
      showToast('Error adding vendor', 'error');
    }
  };

  // View existing receipt from transaction history
  const handleViewReceipt = async (saleId) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      if (res.ok) {
        setReceiptModalData(data);
      } else {
        showToast('Receipt details could not be retrieved', 'error');
      }
    } catch (err) {
      showToast('Failed to load invoice receipt', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Dark Luxury Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
      />

      {/* Main Workspace Area */}
      <div className="main-wrapper">
        <NetworkHeader 
          networkStatus={networkStatus} 
          onRefresh={loadStoreData}
        />

        <main className="content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView 
                  analytics={analytics} 
                  onNavigate={setActiveTab}
                  onQuickRestock={(item) => {
                    setActiveTab('inventory');
                    setQuickRestockTarget(item);
                  }}
                />
              )}

              {activeTab === 'pos' && (
                <PosView 
                  products={products}
                  categories={categories}
                  onCheckout={handleCheckout}
                  currentRole={currentRole}
                  isProcessing={isProcessing}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView 
                  products={products}
                  categories={categories}
                  suppliers={suppliers}
                  onAddProduct={handleAddProduct}
                  onRestockProduct={handleRestockProduct}
                  currentRole={currentRole}
                  initialRestockTarget={quickRestockTarget}
                />
              )}

              {activeTab === 'suppliers' && (
                <SuppliersView 
                  suppliers={suppliers}
                  onAddSupplier={handleAddSupplier}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsView 
                  transactions={transactions}
                  onViewReceipt={handleViewReceipt}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView 
                  analytics={analytics}
                  products={products}
                  categories={categories}
                />
              )}

              {activeTab === 'network' && (
                <NetworkView 
                  networkStatus={networkStatus}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Printable Thermal Receipt Modal */}
      <AnimatePresence>
        {receiptModalData && (
          <ReceiptModal 
            saleData={receiptModalData}
            onClose={() => setReceiptModalData(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast Alert Popups */}
      <div className="toast-container">
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`toast ${toast.type === 'error' ? 'error' : ''}`}
            >
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
