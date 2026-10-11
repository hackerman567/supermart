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

  const vlanTable = [
    { vlan: 10, name: 'POS-BILLING', subnet: '192.168.10.0/24', mask: '255.255.255.0', gateway: '192.168.10.1 (Backup VIP)', dhcp: '192.168.10.10 - .254', purpose: 'Cashier billing counters and thermal receipt printers' },
    { vlan: 20, name: 'INVENTORY-OPS', subnet: '192.168.20.0/24', mask: '255.255.255.0', gateway: '192.168.20.1 (Backup VIP)', dhcp: '192.168.20.10 - .254', purpose: 'Barcode scanners and warehouse computers' },
    { vlan: 30, name: 'MANAGEMENT', subnet: '192.168.30.0/24', mask: '255.255.255.0', gateway: '192.168.30.1 (Backup VIP)', dhcp: '192.168.30.10 - .254', purpose: 'Store manager and accounting office PCs' },
    { vlan: 40, name: 'SERVER-FARM', subnet: '192.168.40.0/24', mask: '255.255.255.0', gateway: '192.168.40.1 (Backup VIP)', dhcp: 'Fixed IP', purpose: 'Central database, website, email, and DNS server' },
    { vlan: 50, name: 'STORE-WIFI', subnet: '192.168.50.0/24', mask: '255.255.255.0', gateway: '192.168.50.1 (Backup VIP)', dhcp: '192.168.50.10 - .254', purpose: 'Customer free Wi-Fi and staff mobile phones' },
    { vlan: 99, name: 'NATIVE-MGMT', subnet: '192.168.99.0/24', mask: '255.255.255.0', gateway: '192.168.99.1 (Backup VIP)', dhcp: 'Fixed IP', purpose: 'Network admin login for switches and routers' },
    { vlan: 'WAN', name: 'HQ-BRANCH-LINK', subnet: '10.0.0.0/30', mask: '255.255.255.252', gateway: 'Direct Cable', dhcp: 'Fixed Link', purpose: 'Direct serial cable between Main Store and Branch 02' },
    { vlan: 60, name: 'BRANCH-STORE', subnet: '192.168.60.0/24', mask: '255.255.255.0', gateway: '192.168.60.1', dhcp: '192.168.60.10 - .254', purpose: 'Remote Branch 02 cashier counters' }
  ];

  const ripConfig = `! ===================================================
! ROUTING INFORMATION PROTOCOL (RIP v2) CONFIGURATION
! Basic distance-vector routing with 30s update timer
! ===================================================
router rip
 version 2
 no auto-summary
 network 192.168.10.0
 network 192.168.20.0
 network 192.168.30.0
 network 192.168.40.0
 network 192.168.50.0
 network 10.0.0.0
 passive-interface GigabitEthernet0/0.10
 passive-interface GigabitEthernet0/0.50
 timers basic 30 180 180 240`;

  const ospfConfig = `! ===================================================
! OSPF CONFIGURATION (FAST CONVERGENCE)
! Area 0: Main Store | Area 1: Branch Store
! ===================================================
! On Main Store Core Router:
router ospf 1
 router-id 1.1.1.1
 network 192.168.10.0 0.0.0.255 area 0
 network 192.168.20.0 0.0.0.255 area 0
 network 192.168.30.0 0.0.0.255 area 0
 network 192.168.40.0 0.0.0.255 area 0
 network 192.168.50.0 0.0.0.255 area 0
 network 10.0.0.0 0.0.0.3 area 1
 area 0 range 192.168.0.0 255.255.192.0
 passive-interface GigabitEthernet0/0.10
 passive-interface GigabitEthernet0/0.50
!
! On Branch Store Router:
router ospf 1
 router-id 2.2.2.2
 network 10.0.0.0 0.0.0.3 area 1
 network 192.168.60.0 0.0.0.255 area 1`;

  const servicesConfig = `! ===================================================
! AUTOMATIC IP ASSIGNMENT (DHCP) & DEVICE MONITORING (SNMP)
! ===================================================
! Reserve router and server IPs so they never get handed out to PCs
ip dhcp excluded-address 192.168.10.1 192.168.10.9
ip dhcp excluded-address 192.168.20.1 192.168.20.9

! Cashier counters automatically get IP, gateway, and DNS
ip dhcp pool POOL-POS-VLAN10
 network 192.168.10.0 255.255.255.0
 default-router 192.168.10.1
 dns-server 192.168.40.10
 domain-name supermart.local
 option 3 ip 192.168.10.1
 option 6 ip 192.168.40.10
 option 15 string supermart.local
!
! Monitoring agent so store IT can check CPU and bandwidth
snmp-server community SuperMartRO RO
snmp-server location "Main Store Server Rack 01"
snmp-server contact "admin@supermart.local"
snmp-server enable traps
snmp-server host 192.168.40.10 version 2c SuperMartRO`;

  const vpnConfig = `! ===================================================
! ENCRYPTED VPN TUNNEL (MAIN STORE <-> BRANCH 02)
! Keeps customer and billing data safe over the internet
! ===================================================
crypto isakmp policy 10
 encr aes 256
 hash sha256
 authentication pre-share
 group 14
 lifetime 86400

crypto isakmp key SuperMartPass2026 address 10.0.0.2

crypto ipsec transform-set TS-SUPERMART-VPN esp-aes 256 esp-sha256-hmac

ip access-list extended ACL-VPN-TRAFFIC
 permit ip 192.168.40.0 0.0.0.255 192.168.60.0 0.0.0.255
 permit ip 192.168.10.0 0.0.0.255 192.168.60.0 0.0.0.255

crypto map CMAP-HQ 10 ipsec-isakmp
 set peer 10.0.0.2
 set transform-set TS-SUPERMART-VPN
 match address ACL-VPN-TRAFFIC

interface Serial0/0/0
 crypto map CMAP-HQ`;

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
            <span className="metric-sub">If Router 1 fails, Router 2 takes over in 1s</span>
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
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Base Address: 192.168.0.0/16</span>
          </div>
          <div className="card-body">
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
              <strong>What is an IP address?</strong>
              <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4 }}>
                An IP address is like a phone number for each computer on the network. We write it in four numbers (like <code>192.168.40.10</code>), but computers read it in 1s and 0s (binary).
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginTop: 8, color: '#0F172A', background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid #CBD5E1' }}>
                192 = 11000000 | 168 = 10101000 | 40 = 00101000 | 10 = 00001010<br />
                Subnet Mask: 255.255.255.0 (First 24 bits are network name, last 8 bits are for 254 computers)
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
                  Broadcasting its full route table every 30 seconds. If a wire is cut, RIP waits for 3 to 4 minutes before realizing the path is dead. Cashiers would freeze and customers would wait.
                </p>
              </div>

              <div style={{ background: '#ECFDF5', padding: 14, borderRadius: 8, border: '1px solid #A7F3D0' }}>
                <strong style={{ color: '#059669' }}>OSPF (Modern, Fast - Recommended):</strong>
                <p style={{ fontSize: '0.8rem', color: '#065F46', marginTop: 4 }}>
                  Only sends quick updates when something changes. If a wire is cut, OSPF switches to the backup route in just <strong>1.4 seconds</strong>! Cashiers experience zero downtime.
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
                  The thermal printer has its own network IP (192.168.10.12). Any billing counter on VLAN 10 can print receipts directly over the local network.
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
                  Router 1 and Router 2 share one single virtual gateway address (192.168.10.1). All cashiers send traffic to this address. If Router 1 loses power, Router 2 immediately handles the traffic. No cashier even notices.
                </p>
              </div>

              <div style={{ padding: 12, borderRadius: 8, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                <strong style={{ color: '#92400E' }}>How Secure VPN Works:</strong>
                <p style={{ fontSize: '0.78rem', color: '#78350F', marginTop: 4 }}>
                  Sales data from Branch 02 travels across the internet to the main server. The VPN scrambles (encrypts) this data with AES-256 so outsiders cannot intercept passwords or customer card info.
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
                    <td>Cashier clicks to record a bill. The PC packages the bill data into an HTTP message addressed to server 192.168.40.10.</td>
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
                    <td>Core switch forwards the packet up to the primary router to find the server network.</td>
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
