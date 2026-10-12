# SuperMart — Viva Demonstration Guide

## 1. Demo flow (~8 minutes)

### Phase 1: Problem and design (1 min)
> "SuperMart has a hypermarket, a branch and a warehouse. Billing must never stop, card data must stay isolated, and the branch talks to the HQ server over an encrypted link. We designed a hybrid network: star access layer, partial-mesh WAN, with OSPF in the core, RIP in the warehouse, static routing at the internet edge, and an ASA firewall."

Show the full Packet Tracer topology and point out the three sites, the ISP, and the routing domains.

### Phase 2: Web application (1 min)
1. `npm run dev` in `app/` → open `http://localhost:3000`.
2. The telemetry bar shows the server as it sits in the PT design: `SRV-CENTRAL-01`, `192.168.11.230`, VLAN 40, gateway `192.168.11.225` (HSRP VIP).
3. POS Billing → add items → Complete Sale → receipt → Inventory shows the stock decrement.
4. **Network** page: the VLSM table and config snippets match the Packet Tracer configs.

### Phase 3: Packet Tracer live (5 min)
| Step | Command / action | What to say |
|---|---|---|
| 1 | HQ-R1 `show standby brief` | "R1 is active for VLANs 10, 20, 99; R2 for 30, 40, 50. Both routers carry traffic, which is the load balancing." |
| 2 | HQ-R1 `show ip route` | "O IA 192.168.20.0/24 is the branch summary from the ABR. O E2 192.168.30.0/24 is the RIP warehouse, summarised by R2. S* is the static default to the ASA." |
| 3 | BR-R `show ip ospf database` | Type 1/2 in area 0, Type 3/4 in area 1, Type 5 externals |
| 4 | WH-R1 `show ip protocols` | RIP timers 30/180/180/240 |
| 5 | BR-POS-PC ping server → BR-R `show crypto ipsec sa` | Encaps/decaps counters prove encryption |
| 6 | Convergence: HQ-R1 `shutdown` S0/0/0 during `ping -t` | OSPF moves to the backup link within seconds (compare with the RIP numbers you recorded) |
| 7 | WIFI-LAPTOP ping POS → fails; browser to intranet → works | ACL policy |
| 8 | Simulation: DHCP DORA on ADMIN-PC-01, then the F trace | Open PDU details: 802.1Q tag, TTL, ESP |

## 2. Likely viva questions

**Q: Why VLSM instead of a /24 per VLAN?**
Departments differ in size (POS 200 hosts, servers 10). VLSM gives each the smallest block that fits, largest first. HQ fits into one /23 instead of six /24s, which also makes it summarisable as a single route.

**Q: How did you get 192.168.0.0/19 as the summary?**
Write the third octets in binary: 10 = 00001010, 11 = 00001011, 20 = 00010100, 30 = 00011110. The first three bits (000) match, so 16 + 3 = 19 bits are common → 192.168.0.0/19 (255.255.224.0).

**Q: What is the difference between HSRP and load balancing?**
HSRP by itself is active/standby per group. We created one group per VLAN and gave each router the higher priority in half of them, so each router is active for some VLANs. If one fails, the other takes over all of them.

**Q: Why put both branch WAN links in area 0 and only the branch LANs in area 1?**
So the backup link is a backbone path and failover stays inside one area. BR-R becomes the ABR and can summarise the branch to a single Type-3 LSA.

**Q: Explain the LSA types you see.**
Type 1 router LSAs from every router, Type 2 from the DR on the R1–R2 Ethernet link, Type 3 summaries from BR-R (ABR), Type 4 telling area 1 where the ASBRs are, Type 5 externals from HQ-R1 (default) and HQ-R2 (RIP routes).

**Q: Why is RIP slower to converge?**
It learns only from periodic updates (30 s), and when a neighbour goes silent it waits for the invalid (180 s) and flush (240 s) timers, with hold-down blocking alternatives. OSPF floods a new LSA as soon as something changes and reruns SPF.

**Q: Why router-on-a-stick and not the Layer 3 switch?**
The 3560 could route with SVIs, but then one device would be the gateway for everything. With two routers and HSRP, a router failure does not stop billing. The trade-off is that inter-VLAN traffic shares one trunk per router.

**Q: What does the ASA add that the router ACLs don't?**
Stateful inspection: it tracks connections, so replies are allowed automatically and unsolicited inbound traffic is dropped. It also does PAT so internal addresses are never exposed.

**Q: How does the VPN protect the branch?**
IKE phase 1 authenticates the peers with a pre-shared key and builds an AES-256 channel (DH group 5). Phase 2 creates IPsec SAs. ESP then encrypts every packet matching ACL 110 (branch ↔ HQ), and on the wire only 10.0.0.2 → 10.0.0.1 ESP is visible.

**Q: Why is native VLAN 999 and not 1 or 99?**
Untagged traffic lands in the native VLAN. Making it an unused VLAN stops VLAN-hopping (double tagging) into a real VLAN, especially the management VLAN.

**Q: Explain SNMP.**
The manager (NMS-PC) polls agents (IOS) with GET/WALK on UDP 161 for MIB objects identified by OIDs. Agents send traps to UDP 162 when something happens. v2c uses a community string; v3 adds authentication and encryption.
