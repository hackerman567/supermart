# SECTION B: IP Addressing & VLSM Subnetting

## 1. Definition of an IP Address & Binary Conversion
An **Internet Protocol (IPv4) Address** is a 32-bit logical numerical identifier assigned to every network interface communicating via the TCP/IP protocol suite. It is divided into four 8-bit octets separated by decimal dots (dotted-decimal notation). An IP address consists of two components: the **Network Portion** (identifying the specific network/subnet) and the **Host Portion** (identifying the unique device within that subnet).

### Binary Conversion Breakdown (Example: Server IP `192.168.40.10 / 24`)

| Octet | Decimal Value | Binary Representation ($2^7$ to $2^0$) | Bit Expansion Breakdown |
| :--- | :--- | :--- | :--- |
| **1st Octet** | `192` | `11000000` | $128 + 64 + 0 + 0 + 0 + 0 + 0 + 0$ |
| **2nd Octet** | `168` | `10101000` | $128 + 0 + 32 + 0 + 8 + 0 + 0 + 0$ |
| **3rd Octet** | `40` | `00101000` | $0 + 0 + 32 + 0 + 8 + 0 + 0 + 0$ |
| **4th Octet** | `10` | `00001010` | $0 + 0 + 0 + 0 + 8 + 0 + 2 + 0$ |

**Full 32-Bit Binary Stream:**
`11000000.10101000.00101000.00001010`

### Subnet Mask Breakdown (`255.255.255.0` or `/24` Prefix)
- **Binary Mask:** `11111111.11111111.11111111.00000000`
- **Network Bits:** 24 bits (all 1s)
- **Host Bits:** $32 - 24 = 8$ bits (all 0s)
- **Total Addresses in Subnet:** $2^8 = 256$ addresses
- **Usable Host Addresses:** $2^8 - 2 = 254$ addresses (excluding Network ID and Broadcast Address)
- **Usable Host Range:** `192.168.40.1` through `192.168.40.254`
- **Directed Broadcast Address:** `192.168.40.255` (`11000000.10101000.00101000.11111111`)

---

## 2. Comprehensive Subnetting Plan Table

| Department / Network | Network Address | Subnet Mask | CIDR | Usable Host IP Range | Broadcast Address | Total Hosts | Usable Hosts |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **POS Billing (VLAN 10)** | `192.168.10.0` | `255.255.255.0` | `/24` | `192.168.10.1` - `192.168.10.254` | `192.168.10.255` | 256 | 254 |
| **Inventory Ops (VLAN 20)**| `192.168.20.0` | `255.255.255.0` | `/24` | `192.168.20.1` - `192.168.20.254` | `192.168.20.255` | 256 | 254 |
| **Management (VLAN 30)** | `192.168.30.0` | `255.255.255.0` | `/24` | `192.168.30.1` - `192.168.30.254` | `192.168.30.255` | 256 | 254 |
| **Server Farm (VLAN 40)** | `192.168.40.0` | `255.255.255.0` | `/24` | `192.168.40.1` - `192.168.40.254` | `192.168.40.255` | 256 | 254 |
| **Store Wi-Fi (VLAN 50)** | `192.168.50.0` | `255.255.255.0` | `/24` | `192.168.50.1` - `192.168.50.254` | `192.168.50.255` | 256 | 254 |
| **Switch Mgmt (VLAN 99)** | `192.168.99.0` | `255.255.255.0` | `/24` | `192.168.99.1` - `192.168.99.254` | `192.168.99.255` | 256 | 254 |
| **HQ R1-R2 Heartbeat** | `172.16.1.0` | `255.255.255.252` | `/30` | `172.16.1.1` - `172.16.1.2` | `172.16.1.3` | 4 | 2 |
| **HQ-Branch Serial Link** | `10.0.0.0` | `255.255.255.252` | `/30` | `10.0.0.1` - `10.0.0.2` | `10.0.0.3` | 4 | 2 |
| **Branch Store LAN (VLAN 60)**| `192.168.60.0` | `255.255.255.0` | `/24` | `192.168.60.1` - `192.168.60.254` | `192.168.60.255` | 256 | 254 |

---

## 3. Variable Length Subnet Masking (VLSM)
VLSM allows network engineers to use different subnet masks across the same routing domain to prevent IP address exhaustion:
- **LAN Access Departments (50 to 200 hosts):** Allocated `/24` subnets (254 usable hosts each) providing ample room for additional cashier counters, barcode terminals, and wireless guest users.
- **WAN Point-to-Point Links (Exactly 2 hosts):** Allocated `/30` subnets (`255.255.255.252`). If a standard `/24` had been used for the Serial link, 252 host IP addresses would have been wasted. VLSM saves 99.2% of addresses on WAN links.

---

## 4. CIDR & Route Summarization
**Classless Inter-Domain Routing (CIDR)** allows collapsing multiple contiguous routing table entries into a single summarized advertisement.

### Route Summarization at Branch 02 Router:
The Branch Router does not need individual routes for all internal HQ departmental subnets (`192.168.10.0`, `192.168.20.0`, `192.168.30.0`, `192.168.40.0`, `192.168.50.0`).
- **Binary representation of 3rd octets:**
  - `10` = `00001010`
  - `20` = `00010100`
  - `30` = `00011110`
  - `40` = `00101000`
  - `50` = `00110010`
- **Common leading bits:** First 18 bits match `192.168.0.0`.
- **Summarized OSPF Area Range Advertised to Branch:**
  ```cisco
  HQ-RTR-01-PRIMARY(config-router)# area 0 range 192.168.0.0 255.255.192.0
  ```
- **Static Default Route on Branch 02 Router:**
  ```cisco
  BRANCH-02-ROUTER(config)# ip route 0.0.0.0 0.0.0.0 Serial0/0/0
  ```

---

# SECTION C: Routing Architectures

## 1. Static Routing
Configured for deterministic point-to-point and edge routing:
```cisco
! On HQ Core Router to reach Branch Store:
ip route 192.168.60.0 255.255.255.0 10.0.0.2

! On Branch Router Default Gateway of Last Resort:
ip route 0.0.0.0 0.0.0.0 10.0.0.1
```
*Administrative Distance (AD) of Static Route = 1.*

---

## 2. Routing Information Protocol (RIP v2)
RIP is a classic **Distance-Vector** protocol that uses **Hop Count** as its metric (maximum 15 hops; 16 hops is infinity/unreachable).

### RIP Timers Explained:
1. **Periodic Update Timer (30 seconds):** Every 30 seconds, the router broadcasts or multicasts (to `224.0.0.9`) its entire routing table out all RIP-enabled interfaces.
2. **Invalid / Expiration Timer (180 seconds):** If no update is received for a route within 180 seconds, the route is marked invalid (metric set to 16).
3. **Holddown Timer (180 seconds):** When an invalid notification is received, the router enters holddown and ignores any newer route updates with equal or worse metrics to prevent count-to-infinity routing loops.
4. **Flush Timer (240 seconds):** If no refreshing update arrives after 240 seconds, the route is permanently expunged from the IP routing table.

### RIP v2 Configuration Commands:
```cisco
router rip
 version 2
 no auto-summary
 network 192.168.10.0
 network 192.168.40.0
 network 10.0.0.0
```

---

## 3. Open Shortest Path First (OSPF v2 Multi-Area)
OSPF is a modern **Link-State** dynamic routing protocol using the **Dijkstra SPF (Shortest Path First)** algorithm with metric based on **Bandwidth Cost** ($Cost = \frac{10^8}{\text{Bandwidth in bps}}$). Administrative Distance = 110.

### Two-Area Topology Implementation:
- **Area 0 (Backbone Core):** Interconnects all HQ store subnets (VLAN 10, 20, 30, 40, 50, 99) and the secondary redundant core router.
- **Area 1 (Retail Branch Store):** Manages the Serial WAN link (`10.0.0.0/30`) and Branch store LAN (`192.168.60.0/24`).
- **Area Border Router (ABR):** `HQ-RTR-01-PRIMARY` terminates interfaces in both Area 0 and Area 1.

### Explanation of OSPF LSA (Link-State Advertisement) Types:
1. **Type 1 (Router LSA):** Generated by every router in an area describing its active links, interface IPs, and neighbor states. Flooded **only within the originating area**.
2. **Type 2 (Network LSA):** Generated by the **Designated Router (DR)** on multi-access broadcast networks (Ethernet) listing all attached routers. Flooded **only within the local area**.
3. **Type 3 (Summary LSA):** Generated by the **Area Border Router (ABR)**. Advertises internal routes from Area 0 into Area 1 and vice versa. Appear as `O IA` (OSPF Inter-Area) routes.
4. **Type 4 (ASBR Summary LSA):** Generated by an ABR to advertise the host route to an Autonomous System Boundary Router (ASBR) into other areas.
5. **Type 5 (AS External LSA):** Generated by an ASBR to advertise external routes redistributed into OSPF (e.g. from BGP, RIP, or external static routes). Appear as `O E2` or `O E1`.

---

## 4. RIP vs OSPF Observed Convergence Comparison

| Metric / Behavior | Routing Information Protocol (RIP v2) | Open Shortest Path First (OSPF v2) |
| :--- | :--- | :--- |
| **Routing Algorithm** | Bellman-Ford Distance-Vector | Dijkstra Shortest Path First (SPF) Link-State |
| **Metric** | Hop Count (Max 15 hops) | Cumulative Cost (Bandwidth based: $100/\text{BW}$) |
| **Convergence Speed** | **Very Slow (3 to 4 minutes)** | **Ultra-Fast (sub-second to 2 seconds)** |
| **Update Mechanism** | Full routing table broadcast every 30 seconds | Triggered link-state updates only on topology change |
| **Scalability** | Small networks (< 15 routers) | Unlimited with hierarchical multi-area design |
| **Observed Link Flap Recovery** | When Serial 0/0/0 is shut down, RIP waits for the 180s Holddown timer and 240s Flush timer before rerouting. Cashier screens freeze. | When link is shut down, OSPF sends immediate LSA Type 1 trigger packet; alternate path converges within **1.4 seconds**. |

---

# SECTION D: Network Services

## 1. Dynamic Host Configuration Protocol (DHCP) & Troubleshooting
Configured natively on `HQ-RTR-01-PRIMARY` for all client VLANs.

### DHCP Options Explained:
- **Option 3 (Default Router / Gateway):** Advertises the HSRP Virtual IP `192.168.x.1` to clients.
- **Option 6 (DNS Server):** Specifies central DNS server `192.168.40.10`.
- **Option 15 (Domain Name):** Appends `supermart.local` for FQDN name resolution.
- **Option 66 / 150 (TFTP Server / WLC IP):** Directs IP phones and lightweight access points to the controller.

### Troubleshooting Scenario Demo:
- **Bug Simulated:** An admin mistakenly specifies default gateway as `192.168.10.254` instead of `192.168.10.1`, or forgets `ip dhcp excluded-address 192.168.10.1 192.168.10.9`.
- **Observed Symptom:** POS-COUNTER-01 gets assigned IP `192.168.10.1`, creating an IP address conflict with the default gateway router interface. Ping fails.
- **Resolution Verification:** Run `clear ip dhcp binding *` on the router, re-add excluded addresses, and run `ipconfig /renew` on the PC. Client cleanly binds to `192.168.10.10`.

---

## 2. DNS & HTTP/HTTPS Web Portal
- **DNS Server on `SRV-CENTRAL-01` (`192.168.40.10`):**
  - Record: `supermart.local` -> `192.168.40.10` (A Record)
  - Record: `pos.supermart.local` -> `192.168.40.10` (A Record)
  - Record: `mail.supermart.local` -> `192.168.40.10` (A Record)
- **HTTP Web Server:** Hosts the SuperMart enterprise management web application accessible from any store browser at `http://supermart.local:5000` or `http://192.168.40.10:5000`.

---

## 3. Email Infrastructure (SMTP & POP3)
Configured on `SRV-CENTRAL-01` in Cisco Packet Tracer:
- **Domain Name:** `supermart.local`
- **SMTP Service (Port 25):** Handles outgoing store mail transmissions.
- **POP3 Service (Port 110):** Handles mailbox retrieval.
- **Configured User Accounts:**
  - `cashier1@supermart.local` (Counter 01 Cashier)
  - `manager@supermart.local` (Store Inventory Director)
- **Workflow:** Cashier terminal sends automatic daily sales settlement reports to `manager@supermart.local`.

---

## 4. File Sharing (FTP) & Network Printer Sharing
- **FTP Service on `SRV-CENTRAL-01` (Port 20 & 21):**
  - Username: `posadmin` / Password: `PosAdminPass2026`
  - Stores POS firmware binaries, product image catalog zip files, and barcode database backups.
- **Network Printer Sharing (`POS-PRINTER-01`):**
  - Connected to `POS-ACCESS-SW-2960` port Fa0/3 on VLAN 10 (IP: `192.168.10.12`).
  - Cashier PCs print receipts over LPR/RAW port 9100.

---

## 5. Packet Tracer Simulation Mode: PDU Capture & Analysis

### A. DHCP DORA Flow (4-Way Handshake)
1. **DHCP DISCOVER:** Client broadcasts (`Source: 0.0.0.0:68`, `Dest: 255.255.255.255:67`, `MAC: FFFF.FFFF.FFFF`) requesting an IP address.
2. **DHCP OFFER:** Router unicasts/broadcasts (`Source: 192.168.10.1:67`, `Dest: 255.255.255.255:68`) offering `192.168.10.10`, mask `255.255.255.0`, lease time.
3. **DHCP REQUEST:** Client broadcasts accepting the offered IP and rejecting any alternative DHCP server offers.
4. **DHCP ACK (Acknowledge):** Router confirms lease binding and transmits DNS, Gateway, and Subnet Mask options.

### B. SMTP Email PDU (Port 25)
1. **TCP 3-Way Handshake:** `SYN` (Seq 0) -> `SYN-ACK` (Seq 0, Ack 1) -> `ACK` (Seq 1, Ack 1).
2. **SMTP Greeting:** Server sends `220 srv-central-01.supermart.local ESMTP Service ready`.
3. **HELO / EHLO:** Client sends `EHLO pos-counter-01.supermart.local`.
4. **MAIL FROM:** `MAIL FROM:<cashier1@supermart.local>`.
5. **RCPT TO:** `RCPT TO:<manager@supermart.local>`.
6. **DATA:** Message payload containing invoice summary text, terminated by `<CRLF>.<CRLF>`.

### C. POP3 Email Retrieval PDU (Port 110)
1. Client establishes TCP connection to port 110 on `192.168.40.10`.
2. Server responds `+OK POP3 server ready`.
3. Commands: `USER manager`, `PASS AdminPass`, `STAT` (returns count of messages), `RETR 1` (downloads raw text email).

---

# SECTION E: Advanced Network Configuration

## 1. VLANs & Inter-VLAN Routing
Configured using **Router-on-a-Stick (ROAS)** on Cisco 2911 GigabitEthernet 0/0 subinterfaces with IEEE 802.1Q dot1q encapsulation for VLANs 10, 20, 30, 40, 50, and native VLAN 99.

## 2. Dual-Router Redundancy (HSRP)
- **Primary Router (`HQ-RTR-01`):** Configured with `standby priority 120` and `standby preempt`. Tracks uplink G0/1 with decrement of 30.
- **Secondary Router (`HQ-RTR-02`):** Configured with default `standby priority 100` and `standby preempt`.
- **Failover Mechanism:** Routers exchange HSRP Hello multicast packets (`224.0.0.2` on UDP port 1985) every 3 seconds. If `HQ-RTR-01` fails to respond within 10 seconds (Holdtime), `HQ-RTR-02` transitions from `Standby` to `Active` and claims the Virtual MAC `0000.0c07.ac0a`.

## 3. Site-to-Site IPsec VPN Tunnel
Encrypted tunnel across the WAN Serial link:
- **IKE Phase 1 (ISAKMP):** AES-256 encryption, SHA-256 integrity, Diffie-Hellman Group 14 (2048-bit), Pre-Shared Key `SuperMartVPNSecret2026`.
- **IKE Phase 2 (IPsec):** Transform set `esp-aes 256 esp-sha256-hmac`.
- **Crypto Map:** Binds interesting traffic ACL (`192.168.60.0/24` <-> `192.168.40.0/24`) to interface Serial 0/0/0.

## 4. Security Hardening: ACLs & Port Security
- **Access Control Lists:** Extended ACL `ACL-STORE-SECURITY` permits POS traffic to Server Farm ports 5000 and 80, but denies all communication between Guest Wi-Fi (VLAN 50) and POS Billing (VLAN 10).
- **Switch Port Security:** Access ports Fa0/1 through Fa0/10 lock to 1 MAC address via `switchport port-security mac-address sticky`. Any intruder plugging in an unauthorized laptop triggers `violation restrict`, dropping traffic and incrementing security counters.

## 5. Wireless Infrastructure (WPA2)
- **Access Point (`AP-STORE-WIFI`):** Connected to VLAN 50 access port on `FLOOR-SW-2960`.
- **SSID:** `SuperMart-Guest-WiFi`
- **Security:** WPA2-PSK with AES cipher encryption and pre-shared passphrase `SuperMartPass2026`.

## 6. Network Management & Monitoring (SNMP)
- **SNMP Engine Configured:**
  ```cisco
  snmp-server community SuperMartRO RO
  snmp-server location "HQ Server Rack 01"
  snmp-server contact "netadmin@supermart.local"
  snmp-server enable traps
  snmp-server host 192.168.40.10 version 2c SuperMartRO
  ```
- **SNMP in Plain English:**
  - **SNMP Manager:** The central monitoring computer in the store IT room (`192.168.40.10`) that checks whether routers and switches are healthy.
  - **SNMP Agent:** A background service running inside Cisco IOS on each router and switch that tracks CPU usage, memory, and port traffic.
  - **MIB (Management Information Base):** A standardized list of items (like "CPU percentage", "port status", "errors count") identified by unique numbers called OIDs so any monitoring tool can understand the router's answers.
  - **Traps vs. Informs:** 
    - A **Trap** is an instant one-way alert sent over UDP port 162 (for example, "Port Fa0/1 is down!"). The router does not wait for a reply.
    - An **Inform** is an alert that demands a confirmation reply back from the manager so the router knows the alert was received.
- **Common Store Network Monitoring Tools:**
  1. **PRTG Network Monitor:** Windows-based tool with visual dials showing bandwidth, ping latency, and server uptime.
  2. **Zabbix:** Open-source monitoring tool with custom alert rules (e.g., sends SMS if router CPU exceeds 80%).
  3. **SolarWinds NPM:** Enterprise dashboard used in large retail chains to monitor multi-site store routers.
  4. **Wireshark:** Packet analyzer used to inspect individual frames during network troubleshooting.

---

# SECTION F: Simulation Mode Packet Tracing

## Complete Hop-by-Hop Trace: POS-COUNTER-01 (`192.168.10.10`) to Central Web Server (`192.168.40.10`)

| Hop | Device | Interface In | Interface Out | Layer Details & Routing Decisions |
| :--- | :--- | :--- | :--- | :--- |
| **Hop 1** | `POS-COUNTER-01` | Internal | FastEthernet 0 | Originates HTTP GET request on TCP port 5000. Compares destination IP (`192.168.40.10`) against local subnet mask (`255.255.255.0`); determines destination is off-subnet; resolves ARP for Default Gateway `192.168.10.1`. |
| **Hop 2** | `POS-ACCESS-SW-2960` | Fa0/1 | Gig0/1 | Ingresses on Access Port VLAN 10. Checks Port Security table (source MAC matches sticky entry). Forwards frame out Trunk port Gig0/1 with IEEE 802.1Q header tag `VLAN ID: 10`. |
| **Hop 3** | `HQ-CORE-SW-3560` | Fa0/1 | Gig0/1 | Core switch inspects MAC table; forwards tagged 802.1Q frame out Trunk link Gig0/1 to Primary Core Router. |
| **Hop 4** | `HQ-RTR-01-PRIMARY` | Gi0/0.10 | Gi0/0.40 | Router de-encapsulates 802.1Q frame at Layer 2. Reads IP Destination `192.168.40.10` in Layer 3 header. Performs routing table lookup; matches direct route `192.168.40.0/24 via Gi0/0.40`. Checks ACL `ACL-STORE-SECURITY` (permits TCP port 5000). Decrements TTL by 1. Re-encapsulates frame with 802.1Q tag `VLAN ID: 40`. |
| **Hop 5** | `HQ-CORE-SW-3560` | Gig0/1 | Fa0/2 | Receives frame tagged VLAN 40; forwards down Trunk Fa0/2 to Server Switch. |
| **Hop 6** | `SERVERS-SW-2960` | Gig0/1 | Fa0/1 | Strips 802.1Q tag and forwards untagged Ethernet II frame out Access port Fa0/1 (VLAN 40) into Server. |
| **Hop 7** | `SRV-CENTRAL-01` | FastEthernet 0 | Internal | Network card receives frame; Layer 2 MAC matches; Layer 3 IP matches; Layer 4 TCP delivers HTTP request to Express.js application listening on port 5000. Web app responds with HTTP 200 OK. |
