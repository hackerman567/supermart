# SuperMart — Supermarket Billing & Inventory Management Enterprise Network

An integrated Computer Networks Capstone & Mini-Project bridging a modern enterprise web application with mission-critical Cisco network infrastructure.

---

## 🚀 Quick Start Guide (Run the Application)

### 1. Start Both Backend & Frontend Concurrently
From the repository root:
```powershell
cd app
npm install
npm --prefix frontend install
npm run dev
```

This single command automatically starts:
- **Backend Express REST API & SQLite DB** on `http://localhost:5000`
- **Frontend Vite + React + Framer Motion Application** on `http://localhost:3000`

### 2. Access the Application
Open your web browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🌐 Cisco Packet Tracer Network (23Z510 mini project)

Three sites (HQ hypermarket, Branch 02, distribution warehouse) plus an ISP:
VLSM addressing summarised to `192.168.0.0/19`, router-on-a-stick with per-VLAN HSRP load sharing,
multi-area OSPF, RIPv2 warehouse triangle, static routing at the edge, IPsec site-to-site VPN on both branch links,
ASA 5506-X firewall with PAT, ACLs, port security, SSH, WPA2 Wi-Fi and SNMP.

1. Build the topology: [`network-design/topology/topology-specification.md`](network-design/topology/topology-specification.md)
2. Paste the device configs from [`cisco-network/configs/`](cisco-network/configs/)
3. GUI services (DNS, web, mail, FTP, AP, NMS): [`cisco-network/services/packet-tracer-services-guide.md`](cisco-network/services/packet-tracer-services-guide.md)
4. Verify and capture screenshots: [`verification/test-logs/cisco-verification-checklist.md`](verification/test-logs/cisco-verification-checklist.md)
5. Save as `cisco-network/pkt-files/SuperMart.pkt`

The report [`documentation/report/23Z510-lab-project-report.md`](documentation/report/23Z510-lab-project-report.md) maps every checklist item (A1–F1) to its implementation and evidence.

---

## 📁 Repository Structure

```
supermart/
├── app/                                  # Web application (Express + SQLite backend, Vite + React frontend)
├── cisco-network/
│   ├── configs/                          # Paste-ready configs
│   │   ├── hq-router-01-primary.ios.cfg      # HQ-R1: ROAS, HSRP active 10/20/99, DHCP, OSPF, default route, IPsec
│   │   ├── hq-router-02-secondary.ios.cfg    # HQ-R2: HSRP active 30/40/50, OSPF ASBR, RIP, IPsec backup
│   │   ├── branch-router.ios.cfg             # BR-R: OSPF ABR (area 0/1), area range summary, IPsec, DHCP
│   │   ├── warehouse-router-01.ios.cfg       # WH-R1: RIPv2
│   │   ├── warehouse-router-02.ios.cfg       # WH-R2: RIPv2
│   │   ├── isp-router.ios.cfg                # ISP-R: simulated provider
│   │   ├── hq-asa-5506.asa.cfg               # HQ-ASA: firewall policy, PAT, static summary routes
│   │   ├── hq-core-switch-3560.ios.cfg       # Core: VLANs, trunks, Rapid-PVST root
│   │   ├── pos-access-switch-2960.ios.cfg    # POS-SW: port security
│   │   ├── servers-access-switch-2960.ios.cfg
│   │   ├── floor-access-switch-2960.ios.cfg
│   │   └── branch-access-switch-2960.ios.cfg
│   ├── services/packet-tracer-services-guide.md
│   └── pkt-files/                        # SuperMart.pkt goes here
├── network-design/topology/topology-specification.md   # Devices, modules, cabling, IPs, build order
├── verification/
│   ├── test-logs/cisco-verification-checklist.md       # Tests, expected output, convergence experiments
│   ├── test-logs/simulation-mode-pdu-analysis.md       # DHCP/SMTP/POP3 PDUs + Section F trace
│   └── screenshots/                                    # Packet Tracer evidence
└── documentation/
    ├── report/23Z510-lab-project-report.md             # Full report, checklist A-F
    └── demo-script/viva-demonstration-guide.md
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
   - Telemetry banner tracking simulated LAN node (`SRV-CENTRAL-01`, IP `192.168.11.230`, VLAN 40, HSRP VIP `192.168.11.225`)
   - Interactive Cisco Network Core tab with one-click copyable Cisco IOS configurations.
