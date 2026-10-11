# SuperMart Enterprise Network — Topology & Hardware Specification

## 1. Cisco Hardware Bill of Materials (BOM)

| Device Role | Device Label | Packet Tracer Model | Installed Modules / Cards | Subnet / VLAN |
| :--- | :--- | :--- | :--- | :--- |
| **HQ Primary Core Router** | `HQ-RTR-01-PRIMARY` | Cisco 2911 ISR | `HWIC-2T` (in Slot 0) | All HQ VLANs + WAN |
| **HQ Secondary Router** | `HQ-RTR-02-SECONDARY` | Cisco 2911 ISR | None (Integrated GigE) | All HQ VLANs + Heartbeat |
| **Branch Store Router** | `BRANCH-02-ROUTER` | Cisco 2911 ISR | `HWIC-2T` (in Slot 0) | VLAN 60 + WAN |
| **HQ Core Multilayer Switch** | `HQ-CORE-SW-3560` | Cisco 3560-24PS | Built-in 24 FE + 2 GigE | 802.1Q Aggregation & STP Root |
| **POS Counters Access Switch** | `POS-ACCESS-SW-2960` | Cisco 2960-24TT | Built-in 24 FE + 2 GigE | VLAN 10 (Access Ports Fa0/1-10) |
| **Server Farm Access Switch** | `SERVERS-SW-2960` | Cisco 2960-24TT | Built-in 24 FE + 2 GigE | VLAN 40 (Access Ports Fa0/1-10) |
| **Floor & Admin Access Switch**| `FLOOR-SW-2960` | Cisco 2960-24TT | Built-in 24 FE + 2 GigE | VLAN 20, 30, 50 |
| **Branch Store Access Switch** | `BRANCH-SW-2960` | Cisco 2960-24TT | Built-in 24 FE + 2 GigE | VLAN 60 |
| **Store Wi-Fi Access Point** | `AP-STORE-WIFI` | AccessPoint-PT | Standard Ethernet | VLAN 50 (SSID: `SuperMart-Guest`) |
| **Central Enterprise Server** | `SRV-CENTRAL-01` | Server-PT | FastEthernet (Static IP) | VLAN 40 (`192.168.40.10`) |
| **Cashier Terminal 01** | `POS-COUNTER-01` | PC-PT | FastEthernet (DHCP) | VLAN 10 (`192.168.10.10`) |
| **Cashier Terminal 02** | `POS-COUNTER-02` | PC-PT | FastEthernet (DHCP) | VLAN 10 (`192.168.10.11`) |
| **Receipt Printer 01** | `POS-PRINTER-01` | Printer-PT | FastEthernet (DHCP) | VLAN 10 (`192.168.10.12`) |
| **Inventory Workstation 01** | `INV-SCANNER-01` | PC-PT | FastEthernet (DHCP) | VLAN 20 (`192.168.20.10`) |
| **Store Director Admin PC** | `ADMIN-PC-01` | PC-PT | FastEthernet (DHCP) | VLAN 30 (`192.168.30.10`) |
| **Branch Cashier Terminal** | `BRANCH-POS-01` | PC-PT | FastEthernet (DHCP) | VLAN 60 (`192.168.60.10`) |

---

## 2. Complete Cabling & Port Allocation Matrix

### A. WAN Point-to-Point Serial Connection
| Source Device | Source Port | Destination Device | Destination Port | Cable Type | Clock Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HQ-RTR-01-PRIMARY` | `Serial0/0/0` (DCE) | `BRANCH-02-ROUTER` | `Serial0/0/0` (DTE) | Serial DCE Cable | 128000 bps |

### B. Router-to-Router Heartbeat Connection
| Source Device | Source Port | Destination Device | Destination Port | Cable Type | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HQ-RTR-01-PRIMARY` | `GigabitEthernet0/1` | `HQ-RTR-02-SECONDARY` | `GigabitEthernet0/1` | Copper Cross-Over | Subnet `172.16.1.0/30` |

### C. Router-to-Core-Switch Trunk Links (802.1Q)
| Source Device | Source Port | Destination Device | Destination Port | Cable Type | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HQ-RTR-01-PRIMARY` | `GigabitEthernet0/0` | `HQ-CORE-SW-3560` | `GigabitEthernet0/1` | Copper Straight-Through | 802.1Q Dot1q Trunk |
| `HQ-RTR-02-SECONDARY`| `GigabitEthernet0/0` | `HQ-CORE-SW-3560` | `GigabitEthernet0/2` | Copper Straight-Through | 802.1Q Dot1q Trunk |

### D. Core-Switch to Access Switches Trunk Links
| Source Device | Source Port | Destination Device | Destination Port | Cable Type | Trunk Allowed VLANs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `HQ-CORE-SW-3560` | `FastEthernet0/1` | `POS-ACCESS-SW-2960` | `GigabitEthernet0/1` | Copper Straight-Through | VLAN 10, 99 |
| `HQ-CORE-SW-3560` | `FastEthernet0/2` | `SERVERS-SW-2960` | `GigabitEthernet0/1` | Copper Straight-Through | VLAN 40, 99 |
| `HQ-CORE-SW-3560` | `FastEthernet0/3` | `FLOOR-SW-2960` | `GigabitEthernet0/1` | Copper Straight-Through | VLAN 20, 30, 50, 99 |

### E. Access Switch to End Workstations (Access Ports)
| Switch Device | Switch Port | End Device | Mode | VLAN Assignment |
| :--- | :--- | :--- | :--- | :--- |
| `POS-ACCESS-SW-2960` | `FastEthernet0/1` | `POS-COUNTER-01` | Access | VLAN 10 (Sticky Port Security) |
| `POS-ACCESS-SW-2960` | `FastEthernet0/2` | `POS-COUNTER-02` | Access | VLAN 10 (Sticky Port Security) |
| `POS-ACCESS-SW-2960` | `FastEthernet0/3` | `POS-PRINTER-01` | Access | VLAN 10 |
| `SERVERS-SW-2960` | `FastEthernet0/1` | `SRV-CENTRAL-01` | Access | VLAN 40 (Server Farm) |
| `FLOOR-SW-2960` | `FastEthernet0/1` | `INV-SCANNER-01` | Access | VLAN 20 (Inventory) |
| `FLOOR-SW-2960` | `FastEthernet0/2` | `ADMIN-PC-01` | Access | VLAN 30 (Management) |
| `FLOOR-SW-2960` | `FastEthernet0/3` | `AP-STORE-WIFI` | Access | VLAN 50 (Store Wi-Fi) |
| `BRANCH-SW-2960` | `FastEthernet0/1` | `BRANCH-POS-01` | Access | VLAN 60 (Branch Store) |

---

## 3. Step-by-Step Build Order in Cisco Packet Tracer

1. **Step 1:** Launch Cisco Packet Tracer (installed in `C:\Program Files\Cisco Packet Tracer 9.0.1`).
2. **Step 2:** Place the Routers from the bottom left tray: Two `2911` routers for HQ and one `2911` for Branch.
3. **Step 3:** Turn off `HQ-RTR-01` and `BRANCH-02`, drag `HWIC-2T` module into Slot 0, and turn both routers back on.
4. **Step 4:** Place Switches: One `3560-24PS` Multilayer Switch, and three `2960-24TT` switches.
5. **Step 5:** Wire devices using the cable table above (Red Serial DCE cable between Serial 0/0/0 ports).
6. **Step 6:** Paste IOS configurations into the CLI tabs of each respective device.
7. **Step 7:** Save the file into `d:\cn-lab\cisco-network\pkt-files\SuperMart_Enterprise_Network.pkt`.
