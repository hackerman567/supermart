# Packet Tracer GUI Configuration — Servers, Wireless, Printer, NMS

The router/switch side of these services (DHCP pools, ACLs, SNMP agents) is in `cisco-network/configs/`. This page covers what must be set in the Packet Tracer GUI. Theory is in the report, Sections D and E.

## 1. SRV-CENTRAL-01 — IP settings
Desktop → IP Configuration → Static: IP `192.168.11.230`, mask `255.255.255.240`, gateway `192.168.11.225`, DNS `192.168.11.230`.

## 2. DNS
Services → DNS → **On**. Add **A records**:

| Name | Address |
|---|---|
| supermart.local | 192.168.11.230 |
| www.supermart.local | 192.168.11.230 |
| mail.supermart.local | 192.168.11.230 |
| ftp.supermart.local | 192.168.11.230 |
| www.isp.example | 198.51.100.10 |

Test (any PC): `nslookup www.supermart.local` → `192.168.11.230`.

## 3. HTTP / HTTPS
Services → HTTP → HTTP **On**, HTTPS **On**. Edit `index.html`:
```html
<html><body>
<h1>SuperMart Intranet</h1>
<p>SRV-CENTRAL-01 | 192.168.11.230 | VLAN 40 Servers</p>
<p>Billing and inventory portal</p>
</body></html>
```
Test: Web Browser → `http://www.supermart.local` and `https://www.supermart.local`.

## 4. E-mail (SMTP + POP3)
Services → EMAIL → SMTP **On**, POP3 **On**, Domain Name `supermart.local` → **Set**. Users:

| User | Password |
|---|---|
| cashier1 | PosPassword123 |
| manager | ManagerPass123 |

Clients (Desktop → Email → Configure):

| PC | Your name | Address | Incoming/Outgoing server | User / password |
|---|---|---|---|---|
| POS-PC-01 | Counter 01 | cashier1@supermart.local | mail.supermart.local | cashier1 / PosPassword123 |
| ADMIN-PC-01 | Store Manager | manager@supermart.local | mail.supermart.local | manager / ManagerPass123 |

Test: POS-PC-01 → Compose → To `manager@supermart.local`, subject `EOD settlement counter 01` → Send. ADMIN-PC-01 → Receive.
(Packet Tracer's mail server supports SMTP and POP3; IMAP is explained in the report but cannot be enabled in PT.)

## 5. FTP and syslog
Services → FTP → **On**. Add users: `posadmin` / `PosAdmin@2026` with Write, Read, Delete, Rename, List; `branch` / `Branch@2026` with Read, List.
Test (POS-PC-01 or BR-POS-PC Command Prompt):
```
ftp 192.168.11.230
Username: posadmin
Password: PosAdmin@2026
ftp> dir
ftp> put sampleFile.txt
ftp> quit
```
Services → SYSLOG → **On**. Router log messages (e.g. interface down) appear here because of `logging 192.168.11.230`.

## 6. Wireless — AP-STORE (WPA2) and WIFI-LAPTOP
1. AP-STORE → Config → **Port 1**: SSID `SuperMart-Staff`, Authentication **WPA2-PSK**, PSK Pass Phrase `StoreWiFi@2026`, Encryption **AES**.
2. WIFI-LAPTOP → Physical: power off, remove the wired NIC, insert **WPC300N**, power on.
3. WIFI-LAPTOP → Config → Wireless0: SSID `SuperMart-Staff`, **WPA2-PSK**, same pass phrase, AES. IP Configuration → **DHCP**.
4. A dotted line appears from the AP to the laptop. The laptop gets 192.168.11.11, gateway 192.168.11.1.

Tests (show the ACL-WIFI-IN policy):

| From WIFI-LAPTOP | Expected |
|---|---|
| Browser `http://www.supermart.local` | page loads (DNS + HTTP permitted) |
| `ping 192.168.11.1` | replies (gateway) |
| `ping 198.51.100.10` | replies (internet via ASA) |
| `ping 192.168.10.11` (POS) | **fails** (denied by ACL) |
| `ping 192.168.11.230` (server, ICMP) | **fails** (only DNS/HTTP/HTTPS are allowed to the server) |

## 7. INTERNET-SRV (simulated internet site)
IP `198.51.100.10`, mask `255.255.255.0`, gateway `198.51.100.1`. Services → HTTP **On** (edit `index.html` to say "Internet site"). Services → FTP **On** (so the ASA FTP block can be demonstrated).

## 8. Printer sharing — POS-PRINTER
Config → FastEthernet0 → Static: `192.168.10.5`, `255.255.255.0`, gateway `192.168.10.1`. Every counter in VLAN 10 reaches it without a router hop. Test: POS-PC-01 `ping 192.168.10.5`. (PT models the printer as a network node; print jobs are not simulated.)

## 9. NMS-PC — SNMP manager
IP `192.168.11.231 / 255.255.255.240`, gateway `192.168.11.225`.
Desktop → **MIB Browser** → Advanced: Address `192.168.11.242` (HQ-R1), Read Community `SuperMartRO`, SNMP version v2 → OK. Select `.iso.org.dod.internet.mgmt.mib-2.system` → Operation **Walk** → **GO**: sysDescr, sysUpTime, sysName `HQ-R1` are returned. Repeat for `192.168.11.243` (HQ-R2) and `192.168.11.244` (core switch).
