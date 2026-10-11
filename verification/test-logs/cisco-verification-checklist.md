# Cisco Packet Tracer Verification Checklist & CLI Test Matrix

## 1. Gateway Redundancy Verification (HSRP)
Execute on `HQ-RTR-01-PRIMARY`:
```cisco
HQ-RTR-01-PRIMARY# show standby brief
```
**Expected Output:**
```text
                     P indicates configured to preempt.
                     |
Interface   Grp  Pri P State   Active          Standby         Virtual IP
Gi0/0.10    10   120 P Active  local           192.168.10.3    192.168.10.1
Gi0/0.20    20   120 P Active  local           192.168.20.3    192.168.20.1
Gi0/0.30    30   120 P Active  local           192.168.30.3    192.168.30.1
Gi0/0.40    40   120 P Active  local           192.168.40.3    192.168.40.1
Gi0/0.50    50   120 P Active  local           192.168.50.3    192.168.50.1
Gi0/0.99    99   120 P Active  local           192.168.99.3    192.168.99.1
```
*Verification Check:* Router 1 must show `State: Active`, Standby as `192.168.10.3`, and Virtual IP as `192.168.10.1`.

---

## 2. Dynamic Routing Convergence (OSPF Multi-Area)
Execute on `HQ-RTR-01-PRIMARY`:
```cisco
HQ-RTR-01-PRIMARY# show ip ospf neighbor
HQ-RTR-01-PRIMARY# show ip route ospf
```
**Expected Output:**
- Neighbor table shows `BRANCH-02-ROUTER` (2.2.2.2) in `FULL/ -` state on Serial0/0/0.
- Neighbor table shows `HQ-RTR-02-SECONDARY` (1.1.1.2) in `FULL/BDR` state on Gi0/1.
- Routing table shows route to Branch store network:
  `O IA  192.168.60.0/24 [110/65] via 10.0.0.2, Serial0/0/0` (OSPF Inter-Area route).

---

## 3. Switch Port Security Verification
Execute on `POS-ACCESS-SW-2960`:
```cisco
POS-ACCESS-SW-2960# show port-security interface FastEthernet0/1
```
**Expected Output:**
```text
Port Security              : Enabled
Port Status                : Secure-up
Violation Mode             : Restrict
Aging Time                 : 0 mins
Aging Type                 : Absolute
SecureStatic Address Aging : Disabled
Maximum MAC Addresses      : 1
Total MAC Addresses        : 1
Configured MAC Addresses   : 0
Sticky MAC Addresses       : 1
Last Source Address:Vlan   : 0001.96A2.8B10:10
Security Violation Count   : 0
```
*Verification Check:* Port Fa0/1 learns the POS PC MAC address dynamically and locks it as a `Sticky MAC Address`.

---

## 4. End-to-End Ping & Connectivity Matrix

| Source Device | Target Destination | Target IP Address | Protocol / Port | Expected Result | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POS-COUNTER-01` | Virtual Gateway | `192.168.10.1` | ICMP Echo | `Reply (0ms)` | HSRP VIP Responding |
| `POS-COUNTER-01` | SuperMart Central Web Server | `192.168.40.10` | TCP 5000 / HTTP | `SUCCESS (200 OK)` | ACL Permits POS to Server |
| `POS-COUNTER-01` | Branch Cashier Counter | `192.168.60.10` | ICMP Echo | `Reply (~15ms)` | Routed over Serial WAN Link |
| `STORE-WIFI-PC` | SuperMart Central Server | `192.168.40.10` | ICMP Echo | `Destination Unreachable` | **DENIED by ACL** (Guest Isolation) |
| `STORE-WIFI-PC` | POS Counter 01 | `192.168.10.10` | ICMP Echo | `Destination Unreachable` | **DENIED by ACL** (PCI-DSS Security) |

---

## 5. Packet Tracer Simulation Mode & PDU Inspection Walkthrough

1. Switch Packet Tracer to **Simulation Mode** (Click the stopwatch icon bottom right or press `Shift + S`).
2. Click **Show All/None**, then click **Edit Filters** and select only:
   - `ICMP`
   - `HTTP`
   - `OSPF`
   - `HSRP`
   - `ARP`
3. Click the **Add Simple PDU** (closed envelope icon or press `P`).
4. Click `POS-COUNTER-01` as the source, then click `SRV-CENTRAL-01` as the destination.
5. Click **Play / Capture Forward** (`Alt + Right Arrow`):
   - Watch the envelope move from `POS-COUNTER-01` -> `POS-ACCESS-SW-2960` (Tagged VLAN 10).
   - Up the 802.1Q trunk to `HQ-CORE-SW-3560`.
   - Up to `HQ-RTR-01-PRIMARY` on subinterface `Gi0/0.10`.
   - Router de-encapsulates the frame at Layer 3, does routing table lookup, re-encapsulates with destination MAC of `SRV-CENTRAL-01` and sends down subinterface `Gi0/0.40`.
   - Passes to `SERVERS-SW-2960` (Untagged access port) into `SRV-CENTRAL-01`.
6. Click the envelope event in the simulation list:
   - In the **OSI Model Tab**, examine In Layers vs. Out Layers (Layers 1 through 7).
   - In the **Inbound PDU Details Tab**, show the examiner the Source IP (`192.168.10.10`), Destination IP (`192.168.40.10`), TTL, and Ethernet II VLAN 802.1Q tag header!
