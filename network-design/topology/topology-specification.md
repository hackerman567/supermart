# SuperMart — Packet Tracer Build Guide (Topology, Cabling, Addressing)

Follow this page top to bottom to build `cisco-network/pkt-files/SuperMart.pkt` in Cisco Packet Tracer 9.0.1. The design rationale and diagrams are in the report (`documentation/report/23Z510-lab-project-report.md`, Section A).

## 1. Devices

| # | Hostname | PT device | Modules to add (power off → drag → power on) | Config file |
|---|---|---|---|---|
| 1 | HQ-R1 | 2911 | HWIC-2T in slot 0 | `hq-router-01-primary.ios.cfg` |
| 2 | HQ-R2 | 2911 | HWIC-2T in slot 0 **and** HWIC-2T in slot 1 | `hq-router-02-secondary.ios.cfg` |
| 3 | BR-R | 2911 | HWIC-2T in slot 0 | `branch-router.ios.cfg` |
| 4 | WH-R1 | 2911 | HWIC-2T in slot 0 | `warehouse-router-01.ios.cfg` |
| 5 | WH-R2 | 2911 | HWIC-2T in slot 0 | `warehouse-router-02.ios.cfg` |
| 6 | ISP-R | 2911 | — | `isp-router.ios.cfg` |
| 7 | HQ-ASA | ASA 5506-X | — | `hq-asa-5506.asa.cfg` |
| 8 | HQ-CORE-SW | 3560-24PS | — | `hq-core-switch-3560.ios.cfg` |
| 9 | POS-SW | 2960-24TT | — | `pos-access-switch-2960.ios.cfg` |
| 10 | SRV-SW | 2960-24TT | — | `servers-access-switch-2960.ios.cfg` |
| 11 | FLOOR-SW | 2960-24TT | — | `floor-access-switch-2960.ios.cfg` |
| 12 | BR-SW | 2960-24TT | — | `branch-access-switch-2960.ios.cfg` |
| 13 | AP-STORE | AccessPoint-PT | — | GUI (services guide §6) |
| 14 | SRV-CENTRAL-01 | Server-PT | — | GUI (services guide §1–5) |
| 15 | INTERNET-SRV | Server-PT | — | GUI (services guide §7) |
| 16 | NMS-PC | PC-PT | — | static IP |
| 17–18 | POS-PC-01, POS-PC-02 | PC-PT | — | DHCP |
| 19 | POS-PRINTER | Printer-PT | — | static IP |
| 20 | INV-PC-01 | PC-PT | — | DHCP |
| 21 | ADMIN-PC-01 | PC-PT | — | DHCP |
| 22 | WIFI-LAPTOP | Laptop-PT | replace NIC with **WPC300N** | DHCP (wireless) |
| 23–24 | BR-POS-PC, BR-OFFICE-PC | PC-PT | — | DHCP |
| 25–26 | WH1-PC, WH2-PC | PC-PT | — | DHCP |

## 2. Cabling

**Serial (Serial DCE cable: click the DCE end first, on the router listed under "DCE end")**

| DCE end | Port | DTE end | Port | Subnet |
|---|---|---|---|---|
| HQ-R1 | S0/0/0 | BR-R | S0/0/0 | 10.0.0.0/30 (primary WAN) |
| HQ-R2 | S0/0/0 | BR-R | S0/0/1 | 10.0.0.4/30 (backup WAN) |
| HQ-R2 | S0/0/1 | WH-R1 | S0/0/0 | 10.0.0.12/30 |
| HQ-R2 | S0/1/0 | WH-R2 | S0/0/0 | 10.0.0.16/30 |
| WH-R1 | S0/0/1 | WH-R2 | S0/0/1 | 10.0.0.20/30 |

**Copper cross-over (like devices / router↔PC)**

| From | Port | To | Port | Notes |
|---|---|---|---|---|
| HQ-R1 | G0/1 | HQ-R2 | G0/1 | 10.0.0.8/30 |
| WH-R1 | G0/0 | WH1-PC | Fa0 | |
| WH-R2 | G0/0 | WH2-PC | Fa0 | |
| ISP-R | G0/1 | INTERNET-SRV | Fa0 | |

**Copper straight-through**

| From | Port | To | Port | Notes |
|---|---|---|---|---|
| HQ-R1 | G0/2 | HQ-ASA | G1/2 | inside |
| HQ-ASA | G1/1 | ISP-R | G0/0 | outside |
| HQ-R1 | G0/0 | HQ-CORE-SW | G0/1 | trunk |
| HQ-R2 | G0/0 | HQ-CORE-SW | G0/2 | trunk |
| HQ-CORE-SW | Fa0/1 | POS-SW | G0/1 | trunk |
| HQ-CORE-SW | Fa0/2 | SRV-SW | G0/1 | trunk |
| HQ-CORE-SW | Fa0/3 | FLOOR-SW | G0/1 | trunk |
| POS-SW | Fa0/1 | POS-PC-01 | Fa0 | VLAN 10 |
| POS-SW | Fa0/2 | POS-PC-02 | Fa0 | VLAN 10 |
| POS-SW | Fa0/3 | POS-PRINTER | Fa0 | VLAN 10 |
| SRV-SW | Fa0/1 | SRV-CENTRAL-01 | Fa0 | VLAN 40 |
| SRV-SW | Fa0/2 | NMS-PC | Fa0 | VLAN 40 |
| FLOOR-SW | Fa0/1 | INV-PC-01 | Fa0 | VLAN 20 |
| FLOOR-SW | Fa0/9 | ADMIN-PC-01 | Fa0 | VLAN 30 |
| FLOOR-SW | Fa0/17 | AP-STORE | Port 0 | VLAN 50 |
| BR-R | G0/0 | BR-SW | G0/1 | trunk |
| BR-SW | Fa0/1 | BR-POS-PC | Fa0 | VLAN 60 |
| BR-SW | Fa0/13 | BR-OFFICE-PC | Fa0 | VLAN 70 |

## 3. End-device addressing

| Device | IP | Mask | Gateway | DNS |
|---|---|---|---|---|
| SRV-CENTRAL-01 | 192.168.11.230 | 255.255.255.240 | 192.168.11.225 | 192.168.11.230 |
| NMS-PC | 192.168.11.231 | 255.255.255.240 | 192.168.11.225 | 192.168.11.230 |
| POS-PRINTER | 192.168.10.5 | 255.255.255.0 | 192.168.10.1 | — |
| INTERNET-SRV | 198.51.100.10 | 255.255.255.0 | 198.51.100.1 | — |
| POS-PC-01/02 | DHCP → 192.168.10.11, .12 | /24 | 192.168.10.1 | 192.168.11.230 |
| INV-PC-01 | DHCP → 192.168.11.136 | /26 | 192.168.11.129 | 192.168.11.230 |
| ADMIN-PC-01 | DHCP → 192.168.11.200 | /27 | 192.168.11.193 | 192.168.11.230 |
| WIFI-LAPTOP | DHCP → 192.168.11.11 | /25 | 192.168.11.1 | 192.168.11.230 |
| BR-POS-PC | DHCP → 192.168.20.10 | /26 | 192.168.20.1 | 192.168.11.230 |
| BR-OFFICE-PC | DHCP → 192.168.20.70 | /27 | 192.168.20.65 | 192.168.11.230 |
| WH1-PC | DHCP → 192.168.30.10 | /26 | 192.168.30.1 | 192.168.11.230 |
| WH2-PC | DHCP → 192.168.30.70 | /27 | 192.168.30.65 | 192.168.11.230 |

(DHCP addresses are the first free address after each excluded range; the exact order depends on which PC asks first.)

## 4. Build order

1. Place all devices and add the modules from §1 (router must be **powered off** to insert an HWIC-2T).
2. Rename each device (Config tab → Display Name) to the hostname in §1.
3. Cable according to §2. Wait until the switch port LEDs turn green (STP takes ~30 s).
4. **Security licence for IPsec** on HQ-R1, HQ-R2 and BR-R (CLI):
   ```
   enable
   configure terminal
   license boot module c2900 technology-package securityk9
   (type yes to accept)
   end
   write memory
   reload
   ```
   After the reload, `show version` lists `securityk9` as the technology package.
5. Paste the configs in this order: **switches** (CORE, then the access switches) → **HQ-R1, HQ-R2** → **BR-R** → **WH-R1, WH-R2** → **ISP-R** → **HQ-ASA**. Paste one file at a time into the CLI tab, from `enable` to `write memory`.
6. Configure the servers, AP, laptop, printer and static PCs (services guide).
7. Set every DHCP PC to DHCP (Desktop → IP Configuration → DHCP).
8. Run the verification checklist (`verification/test-logs/cisco-verification-checklist.md`).
9. Save as `cisco-network/pkt-files/SuperMart.pkt`.

## 5. Known Packet Tracer behaviour

| Message / behaviour | Meaning |
|---|---|
| `% Invalid input` on `snmp-server enable traps`, `snmp-server host`, `snmp-server location/contact` | PT does not implement these real-IOS SNMP features; the community string (what the MIB browser uses) still works |
| `% Invalid input` on a `crypto` command | The securityk9 licence is not active yet (step 4) |
| `clock rate` "only applies to DCE" warning | The DCE end of that cable is on the other router: harmless, or swap the cable ends |
| First ping across the VPN times out | IKE is negotiating the SA; repeat the ping |
| OSPF neighbours take ~40 s to form after paste | Normal: hello/dead timers + DR election |
| ASA still hands out 192.168.1.x | Factory `dhcpd` left on inside: `no dhcpd enable inside` |
