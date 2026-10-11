# SuperMart Enterprise Network — IP Addressing & VLSM Specification

## 1. Executive Summary & Base Address Allocation
- **Enterprise Base Network:** `192.168.0.0/16` (Private IPv4 Class C Block)
- **HQ Store Allocation:** `192.168.10.0/24` to `192.168.50.0/24`
- **Management & Native:** `192.168.99.0/24`
- **WAN Inter-Connect Link:** `10.0.0.0/30`
- **Branch 02 Remote Store:** `192.168.60.0/24`

---

## 2. Hierarchical VLSM IP Allocation Table

| VLAN ID | VLAN Name | Department Function | Usable Host Range | Subnet Mask | CIDR | Default Gateway (VIP) | Allocation Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VLAN 10** | `POS-BILLING` | Touchscreen Billing Counters & Receipt Printers | `192.168.10.10` - `192.168.10.254` | `255.255.255.0` | `/24` | `192.168.10.1` | Cisco DHCP Server Pool |
| **VLAN 20** | `INVENTORY-OPS` | Stock Scanner PCs & Warehouse Terminals | `192.168.20.10` - `192.168.20.254` | `255.255.255.0` | `/24` | `192.168.20.1` | Cisco DHCP Server Pool |
| **VLAN 30** | `MANAGEMENT` | Store Manager, Accounts & Supervisor PCs | `192.168.30.10` - `192.168.30.254` | `255.255.255.0` | `/24` | `192.168.30.1` | Cisco DHCP Server Pool |
| **VLAN 40** | `SERVER-FARM` | SuperMart Web App, SQLite DB, DNS, Syslog/SNMP | `192.168.40.2` - `192.168.40.254` | `255.255.255.0` | `/24` | `192.168.40.1` | Static Manual Assignment |
| **VLAN 50** | `STORE-WIFI` | Customer Free Wi-Fi & Staff Handhelds | `192.168.50.10` - `192.168.50.254` | `255.255.255.0` | `/24` | `192.168.50.1` | Cisco DHCP Server Pool |
| **VLAN 99** | `NATIVE-MGMT` | Switch & Router Loopback / SSH Management | `192.168.99.2` - `192.168.99.254` | `255.255.255.0` | `/24` | `192.168.99.1` | Static Manual Assignment |
| **WAN** | `WAN-LINK` | HQ Core Router Serial <-> Branch Router Serial | `10.0.0.1` - `10.0.0.2` | `255.255.255.252` | `/30` | Point-to-Point | Static Link |
| **VLAN 60** | `BRANCH-STORE`| Branch 02 Remote Billing & Inventory Terminals | `192.168.60.10` - `192.168.60.254` | `255.255.255.0` | `/24` | `192.168.60.1` | Branch DHCP Server Pool |

---

## 3. Binary Conversion & Subnet Breakdown

### A. Subnet /24 (LAN Subnets — e.g. VLAN 10: 192.168.10.0)
- **Network Address:** `192.168.10.0`
  - Binary: `11000000 . 10101000 . 00001010 . 00000000`
- **Subnet Mask:** `255.255.255.0`
  - Binary: `11111111 . 11111111 . 11111111 . 00000000` (24 Network Bits, 8 Host Bits)
- **Total Addresses:** $2^8 = 256$
- **Usable Host Addresses:** $2^8 - 2 = 254$
- **Broadcast Address:** `192.168.10.255`
  - Binary: `11000000 . 10101000 . 00001010 . 11111111`

### B. Subnet /30 (WAN Point-to-Point Serial Link: 10.0.0.0/30)
- **Network Address:** `10.0.0.0`
  - Binary: `00001010 . 00000000 . 00000000 . 00000000`
- **Subnet Mask:** `255.255.255.252`
  - Binary: `11111111 . 11111111 . 11111111 . 11111100` (30 Network Bits, 2 Host Bits)
- **Total Addresses:** $2^2 = 4$
- **Usable Host Addresses:** $2^2 - 2 = 2$ (`10.0.0.1` on HQ R1, `10.0.0.2` on Branch R1)
- **Broadcast Address:** `10.0.0.3`
  - Binary: `00001010 . 00000000 . 00000000 . 00000011`

---

## 4. Route Summarization (CIDR Supernetting)
To minimize routing table size on the Branch Store router and WAN links, the internal HQ LAN subnets can be summarized:
- `192.168.10.0/24` -> `00001010` (3rd Octet)
- `192.168.20.0/24` -> `00010100` (3rd Octet)
- `192.168.30.0/24` -> `00011110` (3rd Octet)
- `192.168.40.0/24` -> `00101000` (3rd Octet)
- `192.168.50.0/24` -> `00110010` (3rd Octet)

**Summarized Supernet Route for Branch Store:**
- Route: `192.168.0.0/20` (Mask: `255.255.240.0`)
- Encompasses `192.168.0.0` through `192.168.15.255`
- Or summarized across OSPF Area 0 backbone as:
  ```cisco
  router ospf 1
   area 0 range 192.168.0.0 255.255.192.0
  ```
