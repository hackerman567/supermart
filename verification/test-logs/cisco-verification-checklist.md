# Verification Checklist — commands, expected results, experiments

Run these after building the topology (`network-design/topology/topology-specification.md`). Tick each box and save the listed screenshot to `verification/screenshots/`. Where a result depends on timing in Packet Tracer, the table has an **Observed** column for you to fill in: record what you actually saw rather than copying the expected value.

## 1. Interfaces, VLANs, trunks (E1)

| ✓ | Device | Command | Expect | Screenshot |
|---|---|---|---|---|
| ☐ | HQ-R1 | `show ip interface brief` | G0/0.10–.99, G0/1, G0/2, S0/0/0 **up/up** | `E1-r1-int-brief.png` |
| ☐ | HQ-CORE-SW | `show vlan brief` | VLANs 10,20,30,40,50,99,999 | `E1-core-vlans.png` |
| ☐ | HQ-CORE-SW | `show interfaces trunk` | G0/1, G0/2, Fa0/1-3 trunking, native 999 | `E1-core-trunks.png` |
| ☐ | POS-PC-01 | `ping 192.168.11.230` | Replies (inter-VLAN 10 → 40) | |

## 2. HSRP redundancy + load balancing (E2)

`HQ-R1# show standby brief` — expected:
```
Interface   Grp  Pri P State    Active          Standby         Virtual IP
Gi0/0.10    10   110 P Active   local           192.168.10.3    192.168.10.1
Gi0/0.20    20   110 P Active   local           192.168.11.131  192.168.11.129
Gi0/0.30    30   100 P Standby  192.168.11.195  local           192.168.11.193
Gi0/0.40    40   100 P Standby  192.168.11.227  local           192.168.11.225
Gi0/0.50    50   100 P Standby  192.168.11.3    local           192.168.11.1
Gi0/0.99    99   110 P Active   local           192.168.11.243  192.168.11.241
```
HQ-R2 shows the mirror image. Screenshot both: `E2-r1-standby.png`, `E2-r2-standby.png`.

**Failover test:** POS-PC-01 `ping -t 192.168.11.230` → HQ-R1 `interface g0/0` → `shutdown` → HQ-R2 `show standby brief` (Active for all 6) → `no shutdown` on HQ-R1 → HQ-R1 pre-empts back.

| | Observed |
|---|---|
| Pings lost when HQ-R1 G0/0 shut | ___ |
| Pings lost when it came back (pre-empt) | ___ |

## 3. Static routing, CIDR summaries (B4, C1)

| ✓ | Device | Command | Expect |
|---|---|---|---|
| ☐ | HQ-R1 | `show ip route static` | `S* 0.0.0.0/0 [1/0] via 10.0.0.26` |
| ☐ | HQ-R1 | `show ip route` | `O IA 192.168.20.0/24` (branch summary) and `O E2 192.168.30.0/24` (warehouse summary) — `B4-r1-route.png` |
| ☐ | BR-R | `show ip route` | `O 192.168.20.0/24 is a summary, Null0`; `O*E2 0.0.0.0/0 via 10.0.0.1` |
| ☐ | HQ-ASA | `show route` | `S 192.168.0.0 255.255.224.0 [1/0] via 10.0.0.25, inside` — `B4-asa-route.png` |

## 4. RIP (C2)

| ✓ | Device | Command | Expect |
|---|---|---|---|
| ☐ | WH-R1 | `show ip protocols` | `Sending updates every 30 seconds`, `Invalid after 180 seconds, hold down 180, flushed after 240`, version 2 — `C2-rip-protocols.png` |
| ☐ | WH-R1 | `show ip route rip` (run twice ~15 s apart) | `R* 0.0.0.0/0 [120/1] via 10.0.0.13`, `R 192.168.30.64/27 [120/1] via 10.0.0.22`; age column resets about every 30 s |
| ☐ | WH-R1 | `debug ip rip` (then `undebug all`) | `sending v2 update to 224.0.0.9 via Serial0/0/0 …` every ~30 s — `C2-debug-rip.png` |
| ☐ | WH2-PC | `ping 192.168.11.230` | Replies (RIP → HQ-R2 → OSPF) |

## 5. OSPF (C3)

| ✓ | Device | Command | Expect |
|---|---|---|---|
| ☐ | HQ-R1 | `show ip ospf neighbor` | 2.2.2.2 FULL on Gi0/1 (DR/BDR), 3.3.3.3 FULL/- on Se0/0/0 |
| ☐ | BR-R | `show ip ospf neighbor` | 1.1.1.1 on Se0/0/0, 2.2.2.2 on Se0/0/1 |
| ☐ | BR-R | `show ip ospf database` | Router (Type 1) + Net (Type 2) in area 0; Router + Summary Net (Type 3) + Summary ASB (Type 4) in area 1; Type-5 External: 0.0.0.0, 192.168.30.0, 10.0.0.12/16/20 — `C3-lsdb.png` |
| ☐ | BR-R | `show ip ospf border-routers` | ASBRs 1.1.1.1 and 2.2.2.2 |
| ☐ | HQ-R1 | `show ip protocols` | Router ID 1.1.1.1, "It is an autonomous system boundary router" |

## 6. Convergence experiments (C4)

Use a PC Command Prompt with `ping -t <target>` (Ctrl+C to stop) in **Realtime** mode. Count the `Request timed out` lines.

**Exp 1 — OSPF, link failure**
1. BR-POS-PC: `ping -t 192.168.11.230`
2. BR-R: `show ip route 192.168.11.224` → via 10.0.0.1, Serial0/0/0
3. HQ-R1: `configure terminal` → `interface s0/0/0` → `shutdown`
4. BR-R: `show ip route 192.168.11.224` → now via 10.0.0.5, Serial0/0/1 (cost 201)
5. HQ-R1: `no shutdown` → traffic returns to the primary path.

**Exp 2 — OSPF, silent neighbour loss**
BR-R: `router ospf 1` → `passive-interface Serial0/0/0` (hellos stop, the link stays up). Watch the ping and `show ip ospf neighbor` on HQ-R1. Undo with `no passive-interface Serial0/0/0`.

**Exp 3 — RIP, link failure**
1. WH2-PC: `ping -t 192.168.11.230`
2. WH-R2: `show ip route rip` → `R* 0.0.0.0/0 via 10.0.0.17`
3. HQ-R2: `interface s0/1/0` → `shutdown`
4. WH-R2: repeat `show ip route rip` until the default is learned `via 10.0.0.21` (2 hops through WH-R1). Optionally run `debug ip rip` to see when WH-R1's update arrives.
5. HQ-R2: `no shutdown`.

**Exp 4 — RIP, silent neighbour loss (timer demo)**
1. WH-R1: `router rip` → `passive-interface Serial0/0/1` (WH-R1 stops sending to WH-R2, link stays up).
2. WH-R2: run `show ip route rip` every ~30 s. The route `192.168.30.0/26 via 10.0.0.21` keeps ageing (no refresh); after ~180 s it shows `is possibly down`, after ~240 s it is flushed, and then the 2-hop path via HQ-R2 is installed.
3. WH-R1: `no passive-interface Serial0/0/1`.

| Exp | Expected | Observed (pings lost / seconds) |
|---|---|---|
| 1 OSPF link down | few seconds (+ new IPsec SA on backup) | |
| 2 OSPF silent | few seconds (new LSA), worst case 40 s dead timer | |
| 3 RIP link down | up to ~30 s (next periodic update) | |
| 4 RIP silent | 180–240 s (invalid → flush) | |

## 7. IPsec VPN (E3)

| ✓ | Device | Command | Expect |
|---|---|---|---|
| ☐ | BR-POS-PC | `ping 192.168.11.230` | first reply may time out, then replies |
| ☐ | BR-R | `show crypto isakmp sa` | `10.0.0.1  10.0.0.2  QM_IDLE` — `E3-isakmp.png` |
| ☐ | BR-R | `show crypto ipsec sa` | `#pkts encaps` / `#pkts decaps` > 0 and rising, peer 10.0.0.1 — `E3-ipsec-sa.png` |
| ☐ | HQ-R1 | `show crypto map` | VPN-MAP peer 10.0.0.2, ACL 110, Serial0/0/0 |
| ☐ | Simulation | ping BR-POS-PC → server, open the packet on the serial link | outer IP 10.0.0.2 → 10.0.0.1, ESP header |

## 8. Security (E4)

| ✓ | Test | Expect | Screenshot |
|---|---|---|---|
| ☐ | HQ-R1 `show access-lists` after the tests below | match counters on ACL-POS-IN / ACL-WIFI-IN lines | `E4-acl-hits.png` |
| ☐ | POS-PC-01 `ping 192.168.11.200` (Admin PC) | **fails** (POS confined to server) | |
| ☐ | ADMIN-PC-01 `ping 192.168.10.11` | replies (echo-reply permitted) | |
| ☐ | WIFI-LAPTOP `ping 192.168.10.11` | **fails** | |
| ☐ | ADMIN-PC-01 `ssh -l admin 192.168.11.242` | password prompt → `HQ-R1#` | `E4-ssh.png` |
| ☐ | INV-PC-01 `ssh -l admin 192.168.11.242` | refused (VTY access-class) | |
| ☐ | Any PC `telnet 192.168.11.242` | refused (SSH only) | |
| ☐ | Replace POS-PC-01 on POS-SW Fa0/1 with a new PC, ping | fails; `show port-security interface fa0/1` → violation count > 0 | `E4-port-security.png` |
| ☐ | POS-SW `show port-security address` | sticky MACs for Fa0/1-3 | |
| ☐ | ADMIN-PC-01 browser `http://www.isp.example` | page loads (via PAT) | |
| ☐ | ADMIN-PC-01 `ftp 198.51.100.10` | **fails** (ASA INSIDE-OUT allows only DNS/HTTP/HTTPS/ICMP) | |
| ☐ | ISP-R `ping 192.168.11.230` | **fails** (no route + OUTSIDE-IN deny) | |
| ☐ | HQ-ASA `show xlate`, `show conn`, `show access-list` | translations to 203.0.113.2, hit counts | `E4-asa-xlate.png` |

## 9. DHCP (D1)

| ✓ | Test | Expect |
|---|---|---|
| ☐ | HQ-R1 `show ip dhcp binding` | leases for POS, INV, ADMIN, Wi-Fi clients — `D1-bindings.png` |
| ☐ | BR-R `show ip dhcp binding` | BR-POS-PC 192.168.20.10, BR-OFFICE-PC 192.168.20.70 |
| ☐ | Demo 1: remove `default-router` from VLAN30-ADMIN, renew on ADMIN-PC-01 | gateway 0.0.0.0, cannot reach server → restore → works — `D1-missing-gw.png` |
| ☐ | Demo 2: wrong `network` in VLAN20-INVENTORY, renew on INV-PC-01 | 169.254.x.x (APIPA) → restore → works — `D1-wrong-pool.png` |

## 10. Services (D2–D4)

| ✓ | From | Test | Expect |
|---|---|---|---|
| ☐ | POS-PC-01 | `nslookup www.supermart.local` | 192.168.11.230 |
| ☐ | BR-OFFICE-PC | browser `http://www.supermart.local` | intranet page (over VPN) |
| ☐ | WIFI-LAPTOP | browser `https://www.supermart.local` | intranet page |
| ☐ | POS-PC-01 → ADMIN-PC-01 | send e-mail, then Receive | message arrives |
| ☐ | POS-PC-01 | `ftp 192.168.11.230` → `dir` | file list |
| ☐ | POS-PC-02 | `ping 192.168.10.5` | printer replies |
| ☐ | NMS-PC | MIB Browser walk `system` on 192.168.11.242 | sysName HQ-R1 — `E6-mib-walk.png` |

## 11. End-to-end matrix

| From \ To | Server .230 | POS .10.x | Branch PC | Warehouse PC | Internet .100.10 |
|---|---|---|---|---|---|
| POS-PC-01 | ✅ | ✅ (same VLAN) | ❌ ACL | ❌ ACL | ❌ ACL |
| ADMIN-PC-01 | ✅ | ✅ | ✅ | ✅ | ✅ |
| WIFI-LAPTOP | web/DNS only | ❌ | ❌ | ❌ | ✅ |
| BR-POS-PC | ✅ (VPN) | ❌ (POS ACL drops the reply) | ✅ | ✅ | ✅ |
| WH1-PC | ✅ | ❌ | ✅ | ✅ | ✅ |

## 12. Screenshot list (for the report)

`E1-*`, `E2-r1-standby`, `E2-r2-standby`, `B4-r1-route`, `B4-asa-route`, `C2-rip-protocols`, `C2-debug-rip`, `C3-lsdb`, `E3-isakmp`, `E3-ipsec-sa`, `E4-*`, `D1-*`, `D5-dhcp-discover/offer/request/ack`, `D5-smtp`, `D5-pop3`, `E6-mib-walk`, `F1-*` (see `simulation-mode-pdu-analysis.md`), plus one full-topology screenshot `A1-topology.png`.
