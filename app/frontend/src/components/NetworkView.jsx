import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Network, 
  Server, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Terminal, 
  Copy, 
  Check, 
  Binary
} from 'lucide-react';

export default function NetworkView({ networkStatus }) {
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('ip-plan');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Mirrors cisco-network/configs/*.cfg - keep in sync when the Packet Tracer design changes.
  const vlanTable = [
    { vlan: 10, name: 'POS-BILLING', subnet: '192.168.10.0/24', mask: '255.255.255.0', gateway: '192.168.10.1 (HSRP VIP, R1 active)', dhcp: '192.168.10.11 - .254', purpose: 'Cashier billing counters and thermal receipt printers (200 hosts)' },
    { vlan: 50, name: 'STORE-WIFI', subnet: '192.168.11.0/25', mask: '255.255.255.128', gateway: '192.168.11.1 (HSRP VIP, R2 active)', dhcp: '192.168.11.11 - .126', purpose: 'Staff handheld scanners on WPA2 Wi-Fi (100 hosts)' },
    { vlan: 20, name: 'INVENTORY', subnet: '192.168.11.128/26', mask: '255.255.255.192', gateway: '192.168.11.129 (HSRP VIP, R1 active)', dhcp: '192.168.11.136 - .190', purpose: 'Stock room PCs and barcode stations (50 hosts)' },
    { vlan: 30, name: 'ADMIN', subnet: '192.168.11.192/27', mask: '255.255.255.224', gateway: '192.168.11.193 (HSRP VIP, R2 active)', dhcp: '192.168.11.200 - .222', purpose: 'Store manager and accounting office PCs (25 hosts)' },
    { vlan: 40, name: 'SERVERS', subnet: '192.168.11.224/28', mask: '255.255.255.240', gateway: '192.168.11.225 (HSRP VIP, R2 active)', dhcp: 'Fixed IP (.230 server, .231 NMS)', purpose: 'Central database, website, email, DNS, FTP server' },
    { vlan: 99, name: 'NET-MGMT', subnet: '192.168.11.240/28', mask: '255.255.255.240', gateway: '192.168.11.241 (HSRP VIP, R1 active)', dhcp: 'Fixed IP', purpose: 'SSH/SNMP management of switches and routers' },
    { vlan: 60, name: 'BR-POS', subnet: '192.168.20.0/26', mask: '255.255.255.192', gateway: '192.168.20.1', dhcp: '192.168.20.10 - .62', purpose: 'Branch 02 cashier counters (50 hosts)' },
    { vlan: 70, name: 'BR-OFFICE', subnet: '192.168.20.64/27', mask: '255.255.255.224', gateway: '192.168.20.65', dhcp: '192.168.20.70 - .94', purpose: 'Branch 02 office PCs (20 hosts)' },
    { vlan: 'RIP', name: 'WAREHOUSE', subnet: '192.168.30.0/26 + .64/27', mask: '/26, /27', gateway: '192.168.30.1 / .65', dhcp: 'Router pools', purpose: 'Dispatch bay and cold storage (RIPv2 domain)' },
    { vlan: 'WAN', name: 'P2P LINKS', subnet: '10.0.0.0/27 → 7 × /30', mask: '255.255.255.252', gateway: 'Point-to-point', dhcp: 'Fixed Link', purpose: 'Serial WAN, router interconnect, firewall link' }
  ];

  const ripConfig = `! ===================================================
! RIPv2 - WAREHOUSE TRIANGLE (WH-R1 shown)
! Updates every 30 s to 224.0.0.9; invalid 180, holddown 180, flush 240
! ===================================================
router rip
 version 2
 no auto-summary
 network 10.0.0.0
 network 192.168.30.0
 passive-interface GigabitEthernet0/0
 timers basic 30 180 180 240
!
! On HQ-R2 (ASBR): RIP <-> OSPF
router rip
 default-information originate
router ospf 1
 redistribute rip subnets
 summary-address 192.168.30.0 255.255.255.0`;

  const ospfConfig = `! ===================================================
! OSPF - Area 0: HQ + WAN triangle | Area 1: Branch LANs
! ===================================================
! On HQ-R1 (one wildcard covers the whole HQ /23):
router ospf 1
 router-id 1.1.1.1
 passive-interface default
 no passive-interface GigabitEthernet0/1
 no passive-interface Serial0/0/0
 network 192.168.10.0 0.0.1.255 area 0
 network 10.0.0.0 0.0.0.3 area 0
 network 10.0.0.8 0.0.0.3 area 0
 default-information originate
!
! On BR-R (ABR) - summarises the branch to one route:
router ospf 1
 router-id 3.3.3.3
 network 10.0.0.0 0.0.0.3 area 0
 network 10.0.0.4 0.0.0.3 area 0
 network 192.168.20.0 0.0.0.127 area 1
 area 1 range 192.168.20.0 255.255.255.0`;

  const servicesConfig = `! ===================================================
! DHCP (HQ-R1) & SNMP AGENT
! ===================================================
! Reserve gateway, router and printer addresses
ip dhcp excluded-address 192.168.10.1 192.168.10.10

! Options: 1 mask, 3 gateway (HSRP VIP), 6 DNS, 15 domain
ip dhcp pool VLAN10-POS
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 192.168.11.230
 domain-name supermart.local
!
! SNMP agent polled by NMS-PC (192.168.11.231)
snmp-server community SuperMartRO RO
snmp-server enable traps
snmp-server host 192.168.11.231 version 2c SuperMartRO
logging 192.168.11.230`;

  const vpnConfig = `! ===================================================
! IPsec SITE-TO-SITE VPN (HQ-R1 <-> BR-R, primary link)
! Same on HQ-R2 <-> BR-R for the backup link
! ===================================================
crypto isakmp policy 10
 encryption aes 256
 hash sha
 authentication pre-share
 group 5
 lifetime 86400
crypto isakmp key SuperMartVPN2026 address 10.0.0.2
crypto ipsec transform-set TS-SUPERMART esp-aes esp-sha-hmac
access-list 110 permit ip 192.168.10.0 0.0.1.255 192.168.20.0 0.0.0.255
crypto map VPN-MAP 10 ipsec-isakmp
 set peer 10.0.0.2
 set transform-set TS-SUPERMART
 match address 110
interface Serial0/0/0
 crypto map VPN-MAP`;

  return (
    <div className="network-view">
      <div className="view-header">
        <div className="view-title-group">
          <h2>Network Setup & Packet Tracer Architecture</h2>
          <p>Plain-English breakdown of IP addresses, routers, switches, security, and failover.</p>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card primary">
          <div className="metric-info">
            <span className="metric-title">Backup Routers</span>
            <span className="metric-value">2 Routers</span>
            <span className="metric-sub">Load shared per VLAN; either takes over all if one fails</span>
          </div>
          <div className="metric-icon-box primary">
            <Cpu size={22} />
          </div>
        </div>

        <div className="metric-card indigo">
          <div className="metric-info">
            <span className="metric-title">Routing Areas</span>
            <span className="metric-value">2 Areas</span>
            <span className="metric-sub">Main Store (Area 0) & Branch Store (Area 1)</span>
          </div>
          <div className="metric-icon-box indigo">
            <Network size={22} />
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-info">
            <span className="metric-title">Department VLANs</span>
            <span className="metric-value">6 Sections</span>
            <span className="metric-sub">Guest Wi-Fi is kept separate from billing</span>
          </div>
          <div className="metric-icon-box warning">
            <Layers size={22} />
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-info">
            <span className="metric-title">Store Services</span>
            <span className="metric-value">7 Services</span>
            <span className="metric-sub">Auto IP, Website, Email, Printer, DNS, FTP</span>
          </div>
          <div className="metric-icon-box info">
            <Server size={22} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'ip-plan', label: '1. IP Addresses & Subnets' },
          { id: 'topologies', label: '2. Network Layouts (Star, Bus, Mesh)' },
          { id: 'routing', label: '3. Routing (RIP vs OSPF)' },
          { id: 'services', label: '4. Store Services (Auto IP, Mail, Printer)' },
          { id: 'vpn-hsrp', label: '5. Backup Routers & Secure VPN' },
          { id: 'pdu-trace', label: '6. Packet Trace (Step by Step)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: IP Addressing & Binary Table */}
      {activeTab === 'ip-plan' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Binary size={18} color="#059669" />
              IP Address Breakdown & Binary Example
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Company summary: 192.168.0.0/19 (VLSM)</span>
          </div>
          <div className="card-body">
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
              <strong>What is an IP address?</strong>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4 }}>
                An IP address is like a phone number for each computer on the network. We write it in four numbers (like <code>192.168.11.230</code>), but computers read it in 1s and 0s (binary).
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginTop: 8, color: '#0F172A', background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid #CBD5E1' }}>
                192 = 11000000 | 168 = 10101000 | 11 = 00001011 | 230 = 11100110<br />
                Subnet Mask: 255.255.255.240 (/28: 28 network bits, 4 host bits = 14 usable, .225 - .238)
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Section (VLAN)</th>
                    <th>Department Name</th>
                    <th>Subnet Address</th>
                    <th>Subnet Mask</th>
                    <th>Gateway (Router)</th>
                    <th>Available Addresses</th>
                    <th>What it is used for</th>
                  </tr>
                </thead>
                <tbody>
                  {vlanTable.map((row) => (
                    <tr key={row.name}>
                      <td><span className="badge badge-subtle">{row.vlan}</span></td>
                      <td><strong>{row.name}</strong></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', color: '#059669' }}>{row.subnet}</span></td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{row.mask}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{row.gateway}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{row.dhcp}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748B' }}>{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Topologies Justification */}
      {activeTab === 'topologies' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} color="#4F46E5" />
              How Devices are Connected (Star, Bus, Mesh)
            </div>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Network Layout</th>
                    <th>How It Works</th>
                    <th>Why We Used (or Did Not Use) It</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Star Layout</strong></td>
                    <td>Every computer plugs directly into a central switch with its own cable.</td>
                    <td><span className="badge badge-success">Used on Store Floors</span> If one cashier's cable is unplugged, other cashiers keep billing normally without any issue.</td>
                  </tr>
                  <tr>
                    <td><strong>Mesh Layout</strong></td>
                    <td>Devices connect to each other with extra backup cables for high reliability.</td>
                    <td><span className="badge badge-info">Used Between Core Routers</span> Router 1 and Router 2 have a cross-link so one can take over instantly if the other loses power.</td>
                  </tr>
                  <tr>
                    <td><strong>Bus Layout</strong></td>
                    <td>All devices share one single long wire. If the wire breaks anywhere, everything stops.</td>
                    <td><span className="badge badge-danger">Not Used</span> Unreliable and outdated. A single loose connector would stop all supermarket sales.</td>
                  </tr>
                  <tr>
                    <td><strong>Hybrid Layout</strong></td>
                    <td>Combines Star layout on store floors with Mesh layout in the router server room.</td>
                    <td><span className="badge badge-success">Our Overall Setup</span> Gives the best balance of speed, affordability, and protection against crashes.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Routing Comparison */}
      {activeTab === 'routing' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Network size={18} color="#059669" />
              Routing: RIP vs OSPF (Finding the Best Path)
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => copyToClipboard(ripConfig, 'rip')} className="btn btn-secondary btn-sm">
                {copiedId === 'rip' ? <Check size={14} color="#059669" /> : <Copy size={14} />} Copy RIP Code
              </button>
              <button onClick={() => copyToClipboard(ospfConfig, 'ospf')} className="btn btn-secondary btn-sm">
                {copiedId === 'ospf' ? <Check size={14} color="#059669" /> : <Copy size={14} />} Copy OSPF Code
              </button>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <strong style={{ color: '#D97706' }}>RIP (Older, Slower):</strong>
                <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                  Sends its full route table every 30 seconds. Used only in the warehouse. If a link is cut it learns the detour at the next update (up to 30 s); if a neighbour silently dies it waits for the 180 s invalid and 240 s flush timers.
                </p>
              </div>

              <div style={{ background: '#ECFDF5', padding: 14, borderRadius: 8, border: '1px solid #A7F3D0' }}>
                <strong style={{ color: '#059669' }}>OSPF (Modern, Fast - Recommended):</strong>
                <p style={{ fontSize: '0.8rem', color: '#065F46', marginTop: 4 }}>
                  Floods an update the moment something changes and recalculates the shortest path. When the primary branch link is cut, traffic moves to the backup link within <strong>a few seconds</strong> (measured in the Packet Tracer lab).
                </p>
              </div>
            </div>

            <div style={{ background: '#0F172A', color: '#38BDF8', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
              <pre style={{ margin: 0 }}>{ospfConfig}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Store Services */}
      {activeTab === 'services' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Server size={18} color="#059669" />
              Store Services: Auto IP (DHCP), Website, Email & Printer
            </div>
            <button onClick={() => copyToClipboard(servicesConfig, 'svc')} className="btn btn-secondary btn-sm">
              {copiedId === 'svc' ? <Check size={14} color="#059669" /> : <Copy size={14} />} Copy Router Setup
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 8, background: '#F1F5F9' }}>
                <strong>Automatic IP (DHCP):</strong>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                  When a cashier computer turns on, it requests an IP address automatically (Discover, Offer, Request, Acknowledge). Staff never have to type IP numbers manually.
                </p>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: '#F1F5F9' }}>
                <strong>Store Email (SMTP / POP3):</strong>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                  Cashiers use SMTP to send daily sales summaries to the store manager. The manager checks POP3 to read the reports on their computer.
                </p>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: '#F1F5F9' }}>
                <strong>Shared Receipt Printer:</strong>
                <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                  The thermal printer has its own network IP (192.168.10.5). Any billing counter on VLAN 10 can print receipts directly over the local network.
                </p>
              </div>
            </div>

            <div style={{ background: '#0F172A', color: '#A7F3D0', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
              <pre style={{ margin: 0 }}>{servicesConfig}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Dual Router Backup & VPN */}
      {activeTab === 'vpn-hsrp' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="#4F46E5" />
              Backup Router Failover (HSRP) & Secure Branch VPN
            </div>
            <button onClick={() => copyToClipboard(vpnConfig, 'vpn')} className="btn btn-secondary btn-sm">
              {copiedId === 'vpn' ? <Check size={14} color="#059669" /> : <Copy size={14} />} Copy VPN Setup
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <strong style={{ color: '#1D4ED8' }}>How Router Backup Works (HSRP):</strong>
                <p style={{ fontSize: '0.78rem', color: '#1E40AF', marginTop: 4 }}>
                  Router 1 and Router 2 share one virtual gateway per department (e.g. 192.168.10.1). Router 1 is in charge of billing, inventory and management; Router 2 of admin, servers and Wi-Fi, so both share the load. If one fails, the other takes over every department within seconds.
                </p>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                <strong style={{ color: '#92400E' }}>How Secure VPN Works:</strong>
                <p style={{ fontSize: '0.78rem', color: '#78350F', marginTop: 4 }}>
                  Sales data from Branch 02 travels over leased WAN lines to the main server. IPsec encrypts it (AES) on both the primary and backup links, so anyone tapping the line sees only scrambled ESP packets.
                </p>
              </div>
            </div>

            <div style={{ background: '#0F172A', color: '#F472B6', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
              <pre style={{ margin: 0 }}>{vpnConfig}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Simulation Hop Trace */}
      {activeTab === 'pdu-trace' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Terminal size={18} color="#059669" />
              Packet Trace: What Happens When a Cashier Clicks "Save Bill"
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>From Cashier Counter 01 to Store Server</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Device</th>
                    <th>Port</th>
                    <th>What Happens at this Step</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Step 1</strong></td>
                    <td>Cashier PC</td>
                    <td>Port Fa0</td>
                    <td>Cashier clicks to record a bill. The PC packages the bill data into an HTTP message addressed to server 192.168.11.230.</td>
                  </tr>
                  <tr>
                    <td><strong>Step 2</strong></td>
                    <td>Cashier Switch</td>
                    <td>Port Fa0/1 to Gi0/1</td>
                    <td>Switch checks security (only registered cashier PC allowed). Tags the packet as "VLAN 10" (Cashier department).</td>
                  </tr>
                  <tr>
                    <td><strong>Step 3</strong></td>
                    <td>Main Core Switch</td>
                    <td>Port Fa0/1 to Gi0/1</td>
                    <td>Core switch forwards the packet up to HQ-R1, the active gateway for VLAN 10.</td>
                  </tr>
                  <tr>
                    <td><strong>Step 4</strong></td>
                    <td>Primary Router</td>
                    <td>Subinterface Gi0/0.10 to Gi0/0.40</td>
                    <td>Router checks security rules (ACL permits billing traffic). Moves packet from Cashier VLAN 10 to Server VLAN 40.</td>
                  </tr>
                  <tr>
                    <td><strong>Step 5</strong></td>
                    <td>Server Switch</td>
                    <td>Port Gi0/1 to Fa0/1</td>
                    <td>Removes the VLAN tag and hands the clean packet directly to the server cable.</td>
                  </tr>
                  <tr>
                    <td><strong>Step 6</strong></td>
                    <td>Central Server</td>
                    <td>Server Port Fa0</td>
                    <td>Database saves the bill, reduces stock quantity, and sends back a success confirmation with invoice number!</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
