import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, Phone, Mail, Clock, MapPin, X } from 'lucide-react';

export default function SuppliersView({ suppliers, onAddSupplier }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    lead_time_days: 2
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    onAddSupplier(formData, () => {
      setIsModalOpen(false);
      setFormData({ name: '', contact_person: '', phone: '', email: '', lead_time_days: 2 });
    });
  };

  return (
    <div className="suppliers-view">
      <div className="view-header">
        <div className="view-title-group">
          <h2>Suppliers & Vendor Procurement</h2>
          <p>Supply chain partners, logistics SLAs & direct procurement directory.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Register New Vendor
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {suppliers.map(s => (
          <motion.div 
            key={s.id}
            whileHover={{ y: -3 }}
            className="card"
          >
            <div className="card-header">
              <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{s.name}</strong>
              <span className="badge badge-success">Active Partner</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                <Truck size={16} color="#64748B" />
                <span>Contact: <strong>{s.contact_person || 'Logistics Desk'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                <Phone size={16} color="#059669" />
                <span>{s.phone || '+91 98000 00000'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                <Mail size={16} color="#4F46E5" />
                <span>{s.email || 'orders@vendor.com'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginTop: 4 }}>
                <Clock size={16} color="#D97706" />
                <span>SLA Lead Time: <strong>{s.lead_time_days || 2} business days</strong></span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-dialog"
              style={{ maxWidth: 460 }}
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={20} color="#059669" />
                  <strong style={{ fontSize: '1rem' }}>Register Vendor Partner</strong>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Vendor Company Name *</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="e.g. Metro Beverage Logistics"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Primary Account Manager</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Ramesh Chandra"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="+91 99000 11223"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder="supply@vendor.in"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Restock Lead Time (Days)</label>
                    <input 
                      type="number" 
                      min="1" 
                      className="form-input" 
                      value={formData.lead_time_days}
                      onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Register Vendor
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
