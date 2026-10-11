import React from 'react';
import { motion } from 'framer-motion';
import { Printer, X, CheckCircle2 } from 'lucide-react';

export default function ReceiptModal({ saleData, onClose }) {
  if (!saleData) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = saleData.items || [];
  const invoiceNo = saleData.invoiceNumber || saleData.invoice_number;
  const cashier = saleData.cashier || saleData.cashier_name || 'Counter 01 Cashier';
  const customer = saleData.customerName || saleData.customer_name || 'Walk-in Customer';
  const subtotal = saleData.subtotal || 0;
  const taxAmount = saleData.taxAmount || saleData.tax_amount || 0;
  const grandTotal = saleData.grandTotal || saleData.grand_total || 0;
  const paymentMethod = saleData.paymentMethod || saleData.payment_method || 'cash';
  const tenderAmount = saleData.tenderAmount || saleData.tender_amount || grandTotal;
  const changeAmount = saleData.changeAmount || saleData.change_amount || 0;
  const timestamp = saleData.timestamp || saleData.created_at || new Date().toISOString();

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="modal-dialog"
        style={{ maxWidth: 440, background: 'transparent', boxShadow: 'none', border: 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, gap: 10 }}>
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={15} /> Print Thermal Receipt
          </button>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ background: '#FFFFFF' }}>
            <X size={15} /> Close
          </button>
        </div>

        {/* Printable Thermal Receipt Paper */}
        <div className="receipt-paper">
          <div className="receipt-header">
            <div className="receipt-title">SUPERMART RETAIL LTD</div>
            <div>Branch: Main Hypermarket Hub (HQ)</div>
            <div>GSTIN: 29AAAAA0000A1Z5</div>
            <div>Network Node: SRV-CENTRAL-01 (VLAN 40)</div>
            <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#64748B' }}>
              TAX INVOICE / CASH MEMO
            </div>
          </div>

          <div className="receipt-row">
            <span>Invoice No:</span>
            <strong>{invoiceNo}</strong>
          </div>
          <div className="receipt-row">
            <span>Date & Time:</span>
            <span>{new Date(timestamp).toLocaleString()}</span>
          </div>
          <div className="receipt-row">
            <span>Cashier:</span>
            <span>{cashier}</span>
          </div>
          <div className="receipt-row">
            <span>Customer:</span>
            <span>{customer}</span>
          </div>

          <div className="receipt-divider" />

          {/* Column Headers */}
          <div className="receipt-row" style={{ fontWeight: 700, marginBottom: 6 }}>
            <span style={{ flex: 2 }}>ITEM</span>
            <span style={{ width: 40, textAlign: 'center' }}>QTY</span>
            <span style={{ width: 55, textAlign: 'right' }}>RATE</span>
            <span style={{ width: 60, textAlign: 'right' }}>AMT</span>
          </div>

          {/* Line Items */}
          {items.map((it, idx) => (
            <div key={idx} className="receipt-row" style={{ alignItems: 'flex-start' }}>
              <span style={{ flex: 2 }}>{it.name || it.product_name}</span>
              <span style={{ width: 40, textAlign: 'center' }}>{it.quantity}</span>
              <span style={{ width: 55, textAlign: 'right' }}>{(it.unitPrice || it.unit_price).toFixed(2)}</span>
              <span style={{ width: 60, textAlign: 'right', fontWeight: 600 }}>
                {(it.lineTotal || it.total_price).toFixed(2)}
              </span>
            </div>
          ))}

          <div className="receipt-divider" />

          <div className="receipt-row">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>CGST (2.5%):</span>
            <span>₹{(taxAmount / 2).toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>SGST (2.5%):</span>
            <span>₹{(taxAmount / 2).toFixed(2)}</span>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-row" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
            <span>GRAND TOTAL:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>

          <div className="receipt-row" style={{ marginTop: 6 }}>
            <span>Payment Mode:</span>
            <span style={{ textTransform: 'uppercase' }}>{paymentMethod}</span>
          </div>
          {paymentMethod === 'cash' && (
            <>
              <div className="receipt-row">
                <span>Tender Amount:</span>
                <span>₹{Number(tenderAmount).toFixed(2)}</span>
              </div>
              <div className="receipt-row" style={{ fontWeight: 700 }}>
                <span>Change Returned:</span>
                <span>₹{Number(changeAmount).toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="receipt-divider" />

          <div className="barcode-strip" />
          <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748B' }}>
            {invoiceNo}
          </div>

          <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.65rem' }}>
            Thank you for shopping at SuperMart!<br />
            Items exchangeable within 7 days with original receipt.<br />
            *** ENTERPRISE BILLING COMPLETE ***
          </div>
        </div>
      </motion.div>
    </div>
  );
}
