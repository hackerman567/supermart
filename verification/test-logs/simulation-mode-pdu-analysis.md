# Simulation Mode — PDU Capture & Analysis (Checklist D5 and F)

General procedure in Packet Tracer:
1. Switch to **Simulation** mode (bottom-right, or Shift+S).
2. **Edit Filters** → untick everything (Show All/None), then tick only the protocols named in each section below.
3. Trigger the traffic, then press **Capture/Forward** repeatedly.
4. Click a coloured envelope in the Event List → **PDU Information**: tab *OSI Model* (In/Out layers + the decision text), *Inbound PDU Details* and *Outbound PDU Details* (every header field). Screenshot each one.

---

## 1. DHCP — Discover, Offer, Request, Acknowledge

**Filters:** DHCP. **Trigger:** ADMIN-PC-01 → Desktop → IP Configuration → Static → then **DHCP** (or `ipconfig /release` + `ipconfig /renew` in the Command Prompt).

```
ADMIN-PC-01 (VLAN 30)                      HQ-R1 G0/0.30 (DHCP server)
      |--- 1 DISCOVER  0.0.0.0:68 -> 255.255.255.255:67  ----->|
      |<-- 2 OFFER     192.168.11.194:67 -> 255.255.255.255:68 -|   yiaddr 192.168.11.200
      |--- 3 REQUEST   0.0.0.0:68 -> 255.255.255.255:67  ----->|   "I take .200 from server .194"
      |<-- 4 ACK       192.168.11.194:67 -> 255.255.255.255:68 -|   lease confirmed + options
```

| Field | Discover | Offer | Request | Ack |
|---|---|---|---|---|
| Ethernet dst | FFFF.FFFF.FFFF | FFFF.FFFF.FFFF (client has no IP yet) | FFFF.FFFF.FFFF | FFFF.FFFF.FFFF |
| 802.1Q (on trunk) | VLAN 30 | VLAN 30 | VLAN 30 | VLAN 30 |
| IP src → dst | 0.0.0.0 → 255.255.255.255 | 192.168.11.194 → 255.255.255.255 | 0.0.0.0 → 255.255.255.255 | 192.168.11.194 → 255.255.255.255 |
| UDP | 68 → 67 | 67 → 68 | 68 → 67 | 67 → 68 |
| op | 1 BOOTREQUEST | 2 BOOTREPLY | 1 | 2 |
| ciaddr / yiaddr | 0.0.0.0 / 0.0.0.0 | 0.0.0.0 / **192.168.11.200** | 0.0.0.0 / 0.0.0.0 | 0.0.0.0 / **192.168.11.200** |
| chaddr | client MAC | client MAC | client MAC | client MAC |
| Options | 53=Discover | 53=Offer, 1=255.255.255.224, 3=192.168.11.193, 6=192.168.11.230, 15=supermart.local, 51=lease, 54=server id | 53=Request, 50=requested IP, 54=server id | 53=Ack + same options as the Offer |

Notes for the viva:
- The Request is still **broadcast** so any other DHCP server that made an offer learns that it was not chosen.
- The server is HQ-R1 (.194) even though HQ-R2 is HSRP active for VLAN 30: DHCP is a broadcast, both routers hear it, and only HQ-R1 has a pool.
- The gateway handed out (option 3) is the **HSRP virtual IP** .193, not either router's real address.

Screenshots: `D5-dhcp-discover.png`, `D5-dhcp-offer.png`, `D5-dhcp-request.png`, `D5-dhcp-ack.png`.

---

## 2. SMTP — sending mail

**Filters:** DNS, TCP, SMTP. **Trigger:** POS-PC-01 → Email → Compose → To `manager@supermart.local` → Send.

| # | PDU | Key fields |
|---|---|---|
| 1 | DNS query/response | UDP → 192.168.11.230:53, `mail.supermart.local` A? → 192.168.11.230 |
| 2–4 | TCP 3-way handshake | SYN → SYN+ACK → ACK, dst port **25**, src port ephemeral (1025+) |
| 5 | SMTP data | Inbound PDU Details shows the SMTP layer: sender `cashier1@supermart.local`, recipient `manager@supermart.local`, the message body |
| 6 | Server reply | SMTP reply code (250 OK → the client shows **Send Success**) |
| 7 | TCP FIN/ACK | connection teardown |

SMTP command sequence being modelled: `220` greeting → `HELO` → `250` → `MAIL FROM:<cashier1@…>` → `250` → `RCPT TO:<manager@…>` → `250` → `DATA` → `354` → message + `.` → `250` → `QUIT` → `221`.

Path note: POS-PC-01 → HQ-R1 (active for VLAN 10; ACL-POS-IN permits because the destination is the server) → VLAN 40 → server. The server's TCP replies go via HQ-R2 (active for VLAN 40).

Screenshot: `D5-smtp.png` (the SMTP envelope, Outbound PDU Details).

---

## 3. POP3 — retrieving mail

**Filters:** TCP, POP3. **Trigger:** ADMIN-PC-01 → Email → **Receive**.

| # | PDU | Key fields |
|---|---|---|
| 1–3 | TCP handshake | dst port **110** |
| 4 | POP3 request | `USER manager`, `PASS …` |
| 5 | POP3 response | `+OK`, message list (`STAT`/`LIST`), then `RETR 1` returns the message |
| 6 | TCP teardown | FIN/ACK |

POP3 sends the username and password in clear text, which is visible in the PDU. That is why real deployments use POP3S (995) or IMAPS (993).

Screenshot: `D5-pop3.png`.

---

## 4. Section F — hop-by-hop trace with headers and routing decisions

**Path:** BR-POS-PC (192.168.20.10, Branch VLAN 60) → SRV-CENTRAL-01 (192.168.11.230, HQ VLAN 40), HTTP.

**Steps**
1. Realtime mode: from BR-POS-PC `ping 192.168.11.230` until it succeeds (fills ARP caches and brings up the IPsec SA, so the trace shows only the HTTP exchange).
2. Simulation mode → filters **TCP, HTTP** (add **ICMP** if you trace a ping instead).
3. BR-POS-PC → Web Browser → `http://192.168.11.230` → Go.
4. Capture/Forward one step at a time. At each device click the envelope and record the table below.

| Hop | Device | What the OSI Model tab shows | Routing / forwarding decision |
|---|---|---|---|
| 1 | BR-POS-PC | Out: L7 HTTP GET, L4 TCP src 1025+ dst 80, L3 IP 192.168.20.10→192.168.11.230 TTL 128, L2 Ethernet II dst = BR-R G0/0 MAC | Destination is outside 192.168.20.0/26, so use default gateway 192.168.20.1 |
| 2 | BR-SW | In Fa0/1 (VLAN 60), out G0/1 with **802.1Q tag 60** | MAC address table lookup; port security permits the sticky MAC |
| 3 | BR-R | In G0/0.60 (tag removed). Out S0/0/0: L3 outer **10.0.0.2 → 10.0.0.1, ESP**; L2 **HDLC** | Route lookup: `O 192.168.11.224/28 [110/65] via 10.0.0.1` (longest match /28, cheaper than backup 201). Crypto map VPN-MAP-R1 / ACL 110 match → encrypt. TTL 128→127 |
| 4 | HQ-R1 | In S0/0/0: ESP decrypted. Out G0/0.40: L2 Ethernet + **802.1Q tag 40**, dst = server MAC | `C 192.168.11.224/28 directly connected Gi0/0.40`; ARP for .230. TTL 127→126 |
| 5 | HQ-CORE-SW | In G0/1 tag 40, out Fa0/2 tag 40 | MAC lookup in VLAN 40 |
| 6 | SRV-SW | In G0/1, out Fa0/1 untagged | Access port VLAN 40 |
| 7 | SRV-CENTRAL-01 | In: MAC matches, IP matches, TCP dst 80 → HTTP server | Builds HTTP 200 OK |
| Return | SRV-CENTRAL-01 → HQ-R2 → HQ-R1 → BR-R | Ethernet dst **0000.0c07.ac28** (HSRP virtual MAC of group 40) | HQ-R2 is HSRP active for VLAN 40; its route `O IA 192.168.20.0/24 via 10.0.0.9` (cost 66) goes through HQ-R1, which re-encrypts on S0/0/0 |

Screenshots: `F1-pdu-details-hop1-PC.png` (all headers of the original request), `F1-osi-model-hop3-BR-R.png` (the routing + encryption decision text), `F1-pdu-details-hop4-HQ-R1.png` (802.1Q VLAN 40 tag and TTL 126), `F1-return-hsrp-mac.png` (server frame to the virtual MAC).
