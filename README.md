# SuperMart — Supermarket Billing & Inventory Management Enterprise Network

An integrated Computer Networks Capstone & Mini-Project bridging a modern enterprise web application with mission-critical Cisco network infrastructure.

---

## 🚀 Quick Start Guide (Run the Application)

### 1. Start Both Backend & Frontend Concurrently
Open PowerShell or your terminal in `d:\cn-lab\app`:
```powershell
cd d:\cn-lab\app
npm run dev
```

This single command automatically starts:
- **Backend Express REST API & SQLite DB** on `http://localhost:5000`
- **Frontend Vite + React + Framer Motion Application** on `http://localhost:3000`

### 2. Access the Application
Open your web browser and navigate to:
👉 **`http://localhost:3000`**

---

## 📁 Repository Structure

```
d:/cn-lab/
├── app/                                # Enterprise Web Application
│   ├── backend/                        # Express API & SQLite Database
│   │   ├── server.js                   # REST API routes & network telemetry
│   │   ├── database.js                 # SQLite schema & sample data seed
│   │   └── data/supermart.db           # Persistent SQLite database file
│   ├── frontend/                       # Vite + React + Framer Motion UI
│   │   ├── src/
│   │   │   ├── components/             # Reusable UI modules
│   │   │   │   ├── Sidebar.jsx         # Dark luxury sidebar & role switcher
│   │   │   │   ├── NetworkHeader.jsx   # Live Cisco telemetry header
│   │   │   │   ├── DashboardView.jsx   # Executive metrics & low stock alerts
│   │   │   │   ├── PosView.jsx         # POS terminal & real-time cart
│   │   │   │   ├── InventoryView.jsx   # Catalog & quick restock modals
│   │   │   │   ├── SuppliersView.jsx   # Vendor directory & lead times
│   │   │   │   ├── TransactionsView.jsx# Invoice history
│   │   │   │   ├── AnalyticsView.jsx   # Revenue & category charts
│   │   │   │   ├── NetworkView.jsx     # Cisco architecture & CLI copy
│   │   │   │   └── ReceiptModal.jsx    # Printable thermal tax receipt
│   │   │   ├── App.jsx                 # Main state container & transitions
│   │   │   └── index.css               # Vanilla CSS design system tokens
│   │   └── vite.config.js              # Vite server & API proxy config
│   └── package.json                    # Full stack dependencies & dev scripts
│
├── cisco-network/                      # Cisco Packet Tracer Network Assets
│   ├── configs/                        # Cisco IOS Ready Configurations
│   │   ├── hq-router-01-primary.ios.cfg# HSRP Active (Pri 120), OSPF, ACLs, DHCP
│   │   ├── hq-router-02-secondary.ios.cfg# HSRP Standby (Pri 100), OSPF Area 0
│   │   ├── branch-router.ios.cfg       # Branch 02 Router, OSPF Area 1, IPsec VPN
│   │   ├── hq-core-switch-3560.ios.cfg # Multilayer switch, 802.1Q trunks, STP
│   │   └── pos-access-switch-2960.ios.cfg# Port Security, Sticky MAC, VLAN 10
│   └── pkt-files/                      # Save your Packet Tracer .pkt files here
│
├── network-design/                     # Engineering Calculations & Schematics
│   ├── ip-addressing/
│   │   └── vlsm-addressing-plan.md     # VLSM calculations, binary math, CIDR
│   └── topology/
│       └── topology-specification.md   # Port matrix, hardware BOM & cabling
│
├── verification/                       # Test Plans & Proof of Functionality
│   ├── test-logs/
│   │   └── cisco-verification-checklist.md # CLI verification commands & PDU guide
│   └── screenshots/                    # Store Packet Tracer pings & captures here
│
└── documentation/                      # Academic Viva & Presentation Materials
    ├── demo-script/
    │   └── viva-demonstration-guide.md # 5-minute viva demo flow & top Q&A
    ├── report/                         # Project report files
    └── viva-questions/                 # Supplementary interview questions
```

---

## 🛠️ Technology Stack & Installed Environment

- **Node.js:** v22.20.0
- **NPM:** 10.9.3
- **Frontend:** React 19 + Vite 8 + Framer Motion 14 + Lucide React
- **Styling:** Vanilla CSS Custom Property Design System
- **Backend:** Express 4 + Built-in `node:sqlite` database engine
- **Network Simulator:** Cisco Packet Tracer 9.0.1 (Detected in `C:\Program Files\Cisco Packet Tracer 9.0.1`)

---

## 🌟 Key Application Features

1. **High-Speed Point-of-Sale (POS):**
   - Barcode scanning input simulation
   - Real-time stock decrement upon checkout
   - Insufficient stock rejection
   - Cash / Card / UPI tender selection with automatic change calculation
   - Authentic printable thermal tax receipt modal (`window.print()`)
2. **Inventory Control & Management:**
   - Catalog browsing with category & stock status filters
   - Add new SKU modal
   - Quick restock modal with audit logs
3. **Executive Dashboard & Analytics:**
   - Real-time revenue today & total inventory valuation
   - Low stock alert notifications
   - Top-selling products leaderboard
4. **Cisco Network Integration:**
   - Telemetry banner tracking simulated LAN node (`SRV-CENTRAL-01`, IP `192.168.40.10`, VLAN 40, HSRP Active, ~2ms latency)
   - Interactive Cisco Network Core tab with one-click copyable Cisco IOS configurations.
