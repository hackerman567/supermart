# Cisco Packet Tracer Network Services & Configuration Guide
## 23Z510 Mandatory Checklist Section D

This guide provides exact configuration steps for all services hosted on `SRV-CENTRAL-01` (`192.168.40.10`) and Cisco Routers in Cisco Packet Tracer 9.0.1.

---

## 1. DHCP Configuration & Troubleshooting Demo

### A. Router IOS DHCP Configuration
On `HQ-RTR-01-PRIMARY`:
```cisco
enable
configure terminal

! 1. Exclude static management and gateway addresses
ip dhcp excluded-address 192.168.10.1 192.168.10.9
ip dhcp excluded-address 192.168.20.1 192.168.20.9
ip dhcp excluded-address 192.168.30.1 192.168.30.9
ip dhcp excluded-address 192.168.50.1 192.168.50.9

! 2. Configure POS Billing Pool (VLAN 10)
ip dhcp pool POOL-POS-VLAN10
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 192.168.40.10
 domain-name supermart.local
 option 3 ip 192.168.10.1
 option 6 ip 192.168.40.10
 option 15 string supermart.local
 lease 1 0 0
```

### B. DHCP Troubleshooting Demo (For Lab Viva)
1. **The Bug:** Temporarily misconfigure the pool with the wrong default gateway:
   ```cisco
   ip dhcp pool POOL-POS-VLAN10
    default-router 192.168.10.254
   ```
2. **The Symptom:** Open `POS-COUNTER-01` -> Command Prompt -> run `ipconfig /renew`.
   - The PC obtains IP `192.168.10.10`, but Gateway is `192.168.10.254`.
   - Try `ping 192.168.40.10` -> Fails with `Request timed out`.
3. **The Fix:** Restore correct default router:
   ```cisco
   ip dhcp pool POOL-POS-VLAN10
    default-router 192.168.10.1
   ```
   Run `ipconfig /renew` on PC -> Ping `192.168.40.10` succeeds with `Reply from 192.168.40.10: bytes=32 time=1ms`.

---

## 2. DNS Service Configuration on `SRV-CENTRAL-01`

1. Click on `SRV-CENTRAL-01` in Packet Tracer.
2. Navigate to the **Services** tab -> Click **DNS** on the left menu.
3. Turn **DNS Service: ON**.
4. Add the following resource records:

| Name | Type | IP Address | Action |
| :--- | :--- | :--- | :--- |
| `supermart.local` | `A Record` | `192.168.40.10` | Click Add |
| `pos.supermart.local` | `A Record` | `192.168.40.10` | Click Add |
| `mail.supermart.local`| `A Record` | `192.168.40.10` | Click Add |

5. **Verification:** From `POS-COUNTER-01` Command Prompt, run:
   ```cmd
   nslookup supermart.local
   ```
   Output confirms: `Address: 192.168.40.10`.

---

## 3. HTTP / HTTPS Web Server Configuration

1. In `SRV-CENTRAL-01` -> **Services** -> **HTTP**.
2. Turn **HTTP: ON** and **HTTPS: ON**.
3. Click **Edit** next to `index.html` and replace with:
   ```html
   <html>
   <head><title>SuperMart Enterprise Portal</title></head>
   <body style="font-family:sans-serif; background:#0B0F19; color:#FFFFFF; text-align:center; padding:50px;">
     <h1 style="color:#10B981;">SuperMart Retail Enterprise Intranet</h1>
     <p>Node: SRV-CENTRAL-01 | IP: 192.168.40.10 | VLAN 40</p>
     <p>Connected Cashier Terminals: Operational</p>
   </body>
   </html>
   ```
4. **Verification:** Open Web Browser on `POS-COUNTER-01` and enter `http://supermart.local` or `http://192.168.40.10`. Page renders with green header!

---

## 4. Email Server (SMTP & POP3) Configuration

1. In `SRV-CENTRAL-01` -> **Services** -> **EMAIL**.
2. Turn **SMTP Service: ON** (Port 25) and **POP3 Service: ON** (Port 110).
3. Set **Domain Name:** `supermart.local` -> Click **Set**.
4. Add User Accounts under User Setup:
   - User 1: `cashier1` | Password: `PosPassword123` -> Click `+`
   - User 2: `manager`  | Password: `ManagerPass123` -> Click `+`

### Client Email Configuration on Workstations:
1. Open `POS-COUNTER-01` -> **Desktop** tab -> Click **Email**.
   - Your Name: `Counter 01 Cashier`
   - Email Address: `cashier1@supermart.local`
   - Incoming Mail Server: `192.168.40.10`
   - Outgoing Mail Server (SMTP): `192.168.40.10`
   - Username: `cashier1` | Password: `PosPassword123`
   - Click **Save**.
2. Open `ADMIN-PC-01` (Store Manager PC) -> **Desktop** -> **Email**:
   - Your Name: `Store Manager`
   - Email Address: `manager@supermart.local`
   - Incoming & Outgoing: `192.168.40.10`
   - Username: `manager` | Password: `ManagerPass123`
   - Click **Save**.

### Email Verification Test:
- On `POS-COUNTER-01`, click **Compose**, send email to `manager@supermart.local` with Subject: `EOD Sales Settlement - Counter 01`, Body: `Gross sales today: Rs. 48,250.00. Register balanced.` Click **Send**.
- Status shows `Send Success`.
- On `ADMIN-PC-01`, click **Receive**. The message appears in inbox!

---

## 5. FTP File Sharing Configuration

1. In `SRV-CENTRAL-01` -> **Services** -> **FTP**.
2. Turn **FTP Service: ON**.
3. Create user account:
   - Username: `posadmin`
   - Password: `PosAdminPass2026`
   - Permissions: Check `Write`, `Read`, `Delete`, `Rename`, `List`.
   - Click **Add**.
4. **Verification:** From `POS-COUNTER-01` Command Prompt:
   ```cmd
   ftp 192.168.40.10
   (Username: posadmin, Password: PosAdminPass2026)
   ftp> dir
   ftp> quit
   ```

---

## 6. Network Printer Sharing Configuration

1. In Packet Tracer, place a **Printer-PT** named `POS-PRINTER-01`.
2. Connect using Copper Straight-Through cable to `POS-ACCESS-SW-2960` port `FastEthernet0/3`.
3. Click on the Printer -> **Config** tab -> **FastEthernet0**:
   - Set IP Configuration to **DHCP** (or Static: `192.168.10.12`, Subnet Mask `255.255.255.0`, Gateway `192.168.10.1`).
4. **Verification:** Cashier PC `POS-COUNTER-01` (`192.168.10.10`) pings `192.168.10.12` with 0ms latency.
