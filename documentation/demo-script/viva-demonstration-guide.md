# SuperMart — Project Demonstration & Viva Examination Guide

## 1. High-Impact Presentation Script (5-Minute Viva Flow)

### Phase 1: Problem Statement & System Architecture (1 Minute)
> *"Respected Examiners, modern retail hypermarkets cannot afford downtime. A single network disruption freezes billing counters, causes inventory discrepancies, and results in severe revenue loss.*
> *Our project, **SuperMart**, bridges enterprise full-stack application development with mission-critical computer networking infrastructure. We have designed an enterprise point-of-sale billing and real-time inventory management system hosted on a resilient, high-availability dual-router Cisco network simulated in Cisco Packet Tracer."*

### Phase 2: Live Web Application Demonstration (2 Minutes)
1. **Open Browser to `http://localhost:3000`:**
   - Point out the **dark luxury sidebar** and **clean workspace**.
   - Show the **Cisco Network Telemetry Bar** at the top:
     - Connected Server: `SRV-CENTRAL-01`
     - IP Address: `192.168.40.10/24` (VLAN 40 Server Farm)
     - Virtual Gateway: `192.168.40.1` (HSRP Active VIP)
     - LAN Latency: `~2 ms`
2. **Demonstrate POS Billing & Stock Decrement:**
   - Switch to **POS Billing Terminal**.
   - Scan or type barcode `890103001001` (Amul Milk) and press Enter or click products from the catalog.
   - Show how the shopping cart calculates **Subtotal, 5% GST, and Grand Total**.
   - Select **Cash Tender**, enter ₹1000, and show automatic **Change Due calculation**.
   - Click **Complete Sale & Print Tax Invoice**.
   - Point out the **Thermal Tax Receipt** modal with authentic GST details and barcode.
   - Click **Print Receipt** (triggers browser print preview).
   - Switch to **Inventory & Stock**: show that stock for the billed item has decremented immediately in the database, and an audit entry was generated!
   - Try to bill more than available stock: show that the backend strictly rejects the transaction with an informative error toast.

### Phase 3: Cisco Packet Tracer Network Demonstration (2 Minutes)
1. **Show the Topology in Cisco Packet Tracer:**
   - Point out the **HQ Hypermarket Core** and **Remote Branch Store**.
   - Explain the **VLAN Segmentation** (VLAN 10: POS, VLAN 20: Inventory, VLAN 30: Admin, VLAN 40: Servers, VLAN 50: WiFi).
2. **Execute Live CLI Verification Commands:**
   - On `HQ-RTR-01-PRIMARY`:
     ```cisco
     show standby brief
     ```
     *Explain:* "Here, HSRP Priority 120 ensures Router 1 is the Active Gateway. If Router 1's link goes down, Router 2 (Priority 100) seamlessly takes over with zero packet loss for the cashiers."
   - On `HQ-RTR-01-PRIMARY`:
     ```cisco
     show ip ospf neighbor
     show ip route ospf
     ```
     *Explain:* "OSPF Area 0 routes all high-speed store traffic, while Area 1 manages the remote retail branch over the serial WAN link."
   - On `POS-ACCESS-SW-2960`:
     ```cisco
     show port-security interface fa0/1
     ```
     *Explain:* "Port security is enabled with Sticky MAC and Violation Restrict to prevent unauthorized rogue devices or packet sniffing on the payment network."
3. **Live Packet Tracer Simulation Mode:**
   - Send a PDU from `POS-COUNTER-01` to `SRV-CENTRAL-01`.
   - Click the envelope in Simulation mode to inspect the **Layer 2 802.1Q tag**, **Layer 3 IP headers**, and **Layer 4 TCP segments**.

---

## 2. Top Viva Questions & Answers

### Q1: Why did you use HSRP instead of standard static default gateways?
> **Answer:** In a standard network, if a workstation is configured with a static gateway IP (e.g. `192.168.10.2`) and that router fails, all billing counters lose connectivity until an admin manually changes the IP. With HSRP (Hot Standby Router Protocol), both routers share a Virtual IP (`192.168.10.1`). If the primary router fails, the standby router detects hello packet timeout and assumes the active role in milliseconds with zero configuration changes on the client PCs.

### Q2: Why divide the supermarket into VLANs instead of a single flat network?
> **Answer:** A flat network exposes sensitive payment traffic to broadcast storms and security risks. By isolating POS counters (VLAN 10), Servers (VLAN 40), and Guest Wi-Fi (VLAN 50), we:
> 1. Restrict broadcast domains to preserve switch bandwidth.
> 2. Enforce strict PCI-DSS security compliance using Access Control Lists (ACLs) to prevent Wi-Fi users from reaching billing terminals or server databases.

### Q3: Why use Multi-Area OSPF instead of Single-Area OSPF or RIP?
> **Answer:** Single-area OSPF forces every router in the enterprise to store the entire link-state database (LSDB) and recalculate the Dijkstra Shortest Path First (SPF) algorithm whenever any link flaps. Multi-area OSPF confines SPF calculations within each area. Area 0 is the backbone, and Area 1 handles the remote branch store, reducing router CPU and memory overhead while scaling efficiently. RIP was avoided because of its 15-hop limit and slow periodic 30-second convergence.

### Q4: How is the remote branch store connected securely to the HQ server?
> **Answer:** Over the WAN Serial link (`10.0.0.0/30`), we configured a Site-to-Site IPsec VPN tunnel using IKE Phase 1 (AES-256 encryption, SHA-256 authentication, Diffie-Hellman Group 14) and IKE Phase 2 ESP transform sets. All retail transaction data transmitted across the WAN is cryptographically encrypted.
