# Cisco Packet Tracer Simulation Mode: PDU Capture & Protocol Analysis
## 23Z510 Laboratory Mandatory Checklist Sections D.5 & F

This document details how to capture and inspect **DHCP (DORA)**, **SMTP (Port 25)**, **POP3 (Port 110)**, and **HTTP (Port 5000)** Protocol Data Units (PDUs) in Cisco Packet Tracer 9.0.1.

---

## 1. Capturing the DHCP DORA 4-Way Handshake in Simulation Mode

### Step-by-Step Procedure:
1. In Cisco Packet Tracer, switch to **Simulation Mode** (Click stopwatch icon bottom right or press `Shift + S`).
2. Click **Show All/None**, then click **Edit Filters**.
3. Under the **IPv4** tab, check ONLY: **DHCP** and **ARP**.
4. Click on `POS-COUNTER-01` -> **Desktop** -> **IP Configuration**.
5. Switch radio button from **Static** to **DHCP**.
6. Immediately click the **Capture / Forward** button (or press `Alt + Right Arrow`) repeatedly to step through the packets.

### Detailed PDU Breakdown of the 4 Handshake Packets:

```
+-------------------------------------------------------------------------+
|                              DHCP DORA FLOW                             |
+-------------------------------------------------------------------------+
  POS-COUNTER-01                                           HQ-RTR-01 (DHCP)
        |                                                          |
        |--- 1. DHCP DISCOVER (Broadcast 255.255.255.255:67) ------>|
        |                                                          |
        |<-- 2. DHCP OFFER (Unicast/Broadcast 192.168.10.10:68) ----|
        |                                                          |
        |--- 3. DHCP REQUEST (Broadcast "Accepting 192.168.10.10") ->|
        |                                                          |
        |<-- 4. DHCP ACK (Unicast/Broadcast Confirmed + Options) ---|
```

#### 1. DHCP DISCOVER (Client to All Servers)
- **Layer 2 (Ethernet II):**
  - Source MAC: `0001.96A2.8B10` (Client NIC)
  - Destination MAC: `FFFF.FFFF.FFFF` (Layer 2 Broadcast)
- **Layer 3 (IPv4):**
  - Source IP: `0.0.0.0` (Client does not yet possess an IP)
  - Destination IP: `255.255.255.255` (Limited Broadcast)
- **Layer 4 (UDP):**
  - Source Port: `68` (DHCP Client Port)
  - Destination Port: `67` (DHCP Server Port)
- **Layer 7 (DHCP Payload):**
  - Message Type: `Boot Request (1)`
  - Transaction ID: `0x39A2C104`
  - Client MAC: `0001.96A2.8B10`
  - Option 53: `DHCP Discover`

#### 2. DHCP OFFER (Router to Client)
- **Layer 3 (IPv4):**
  - Source IP: `192.168.10.1` (Router Gateway Interface)
  - Destination IP: `255.255.255.255` (or `192.168.10.10`)
- **Layer 4 (UDP):** Source Port `67` -> Destination Port `68`.
- **Layer 7 (DHCP Payload):**
  - Option 53: `DHCP Offer`
  - Your (Client) IP Address: `192.168.10.10`
  - Option 1 (Subnet Mask): `255.255.255.0`
  - Option 3 (Router Gateway): `192.168.10.1`
  - Option 6 (DNS Server): `192.168.40.10`
  - Option 51 (IP Address Lease Time): `86400 seconds (1 day)`

#### 3. DHCP REQUEST (Client to Router)
- Client broadcasts notifying all local networks that it has chosen the offer from server `192.168.10.1` with IP `192.168.10.10`.
- Option 53: `DHCP Request`.

#### 4. DHCP ACK (Router to Client)
- Option 53: `DHCP ACK (Acknowledge)`.
- Client accepts and enters the `BOUND` state, configuring its TCP/IP stack with `192.168.10.10`.

---

## 2. Capturing SMTP Email Transmission (Port 25)

### Step-by-Step Procedure:
1. In Simulation Mode, click **Edit Filters** -> Select: **TCP**, **SMTP**, **DNS**.
2. Open `POS-COUNTER-01` -> **Email** -> **Compose**.
   - To: `manager@supermart.local`
   - Subject: `EOD Sales Settlement`
   - Body: `Total revenue: Rs. 15,480.00`
   - Click **Send**.
3. In Simulation panel, step through with **Capture / Forward**.

### PDU Inspection:
1. **DNS Query (Port 53 UDP):** `POS-COUNTER-01` resolves `mail.supermart.local` or `supermart.local` -> DNS answers `192.168.40.10`.
2. **TCP 3-Way Handshake:**
   - Packet 1: `SYN` flag set, Seq 0, Dest Port `25`.
   - Packet 2: `SYN, ACK` flags set from `192.168.40.10:25`.
   - Packet 3: `ACK` flag set from client.
3. **SMTP Application Layer PDU:**
   - Click the green SMTP envelope.
   - Click **Inbound PDU Details** / **Outbound PDU Details**.
   - Examine fields:
     - `COMMAND: MAIL FROM:<cashier1@supermart.local>`
     - `COMMAND: RCPT TO:<manager@supermart.local>`
     - `COMMAND: DATA`
     - Status: `250 2.0.0 Ok: queued as 4A8BC1002`

---

## 3. Capturing POP3 Email Retrieval (Port 110)

### Step-by-Step Procedure:
1. Keep filters set to **TCP** and **POP3**.
2. Open `ADMIN-PC-01` -> **Desktop** -> **Email** -> Click **Receive**.
3. Step through packets with **Capture / Forward**.

### PDU Inspection:
1. TCP Handshake on Destination Port `110`.
2. Server banner: `+OK POP3 server ready`.
3. Client commands transmitted in PDU data:
   - `USER manager` -> Server: `+OK password required`
   - `PASS ManagerPass123` -> Server: `+OK mailbox locked and ready`
   - `STAT` -> Server: `+OK 1 352` (1 message, 352 octets)
   - `RETR 1` -> Server streams full email body down to client.

---

## 4. Section F: Complete Layer 1 to 7 Hop-by-Hop Trace

Trace of HTTP POS Web Transaction: `POS-COUNTER-01` (`192.168.10.10`) to Central Server (`192.168.40.10`):

```
+---------------------------------------------------------------------------+
|                          OSI 7-LAYER PDU DECONSTRUCTION                   |
+---------------------------------------------------------------------------+
  Layer 7 (Application) : HTTP GET /api/products HTTP/1.1
  Layer 6 (Presentation): Plaintext ASCII / JSON encoding
  Layer 5 (Session)     : TCP Connection Handle 1042
  Layer 4 (Transport)   : TCP [Src Port: 49152, Dst Port: 5000, Seq: 1, ACK: 1]
  Layer 3 (Network)     : IP [Src: 192.168.10.10, Dst: 192.168.40.10, TTL: 128]
  Layer 2 (Data Link)   : IEEE 802.1Q Tagged Frame [VLAN: 10, EtherType: 0x0800]
  Layer 1 (Physical)    : FastEthernet Copper Cat6 Signaling
```

### Layer-by-Layer Decisions at Each Device:

1. **At `POS-COUNTER-01` (Origin):**
   - **Out Layers:** Layer 3 compares `192.168.40.10` with mask `255.255.255.0`. Network IDs differ (`192.168.40.0` vs `192.168.10.0`). Client routes packet to Default Gateway `192.168.10.1` (Virtual Gateway MAC: `0000.0c07.ac0a`).
2. **At `POS-ACCESS-SW-2960`:**
   - **In Layers:** Checks Source MAC against Sticky Port Security table (Allowed).
   - **Out Layers:** Forwarding engine looks up destination MAC; selects Trunk port `Gig0/1`; inserts 4-byte 802.1Q header tag with **VLAN ID 10**.
3. **At `HQ-RTR-01-PRIMARY` (Core Router):**
   - **In Layers:** Subinterface `Gi0/0.10` receives frame, strips 802.1Q header, validates Layer 3 IP checksum.
   - **Routing Decision:** Consults routing table (`show ip route`). Matches directly connected subnet `192.168.40.0/24 via GigabitEthernet0/0.40`.
   - **ACL Check:** Evaluates `ACL-STORE-SECURITY`; matches `permit tcp 192.168.10.0 0.0.0.255 host 192.168.40.10 eq 5000` -> **PERMITTED**.
   - **Out Layers:** Decrements TTL from 128 to 127. Recalculates IP checksum. Re-encapsulates frame with 802.1Q tag for **VLAN ID 40** and forwards out `Gi0/0.40`.
4. **At `SRV-CENTRAL-01` (Destination):**
   - Receives untagged frame on FastEthernet 0. Validates MAC. Reads IP. Passes TCP payload to port 5000. SuperMart Web application processes request and generates HTTP 200 OK response!
