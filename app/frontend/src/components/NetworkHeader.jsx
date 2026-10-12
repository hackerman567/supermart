import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Activity, Shield, RefreshCw } from 'lucide-react';

export default function NetworkHeader({ networkStatus, onRefresh }) {
  const [latency, setLatency] = useState(2);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="network-telemetry-bar">
      <div className="telemetry-group">
        <div className="telemetry-chip status-online">
          <span className="pulsing-dot" />
          <span>Server: <strong>Online</strong></span>
        </div>

        <div className="telemetry-chip">
          <Server size={14} color="#059669" />
          <span>Host: <strong>{networkStatus?.serverHostname || 'SRV-CENTRAL-01'}</strong></span>
        </div>

        <div className="telemetry-chip">
          <span>IP: <strong>{networkStatus?.serverIp || '192.168.11.230'}</strong></span>
        </div>

        <div className="telemetry-chip">
          <Shield size={14} color="#4F46E5" />
          <span>VLAN: <strong>40 (Servers)</strong></span>
        </div>

        <div className="telemetry-chip">
          <span>Gateway: <strong>{networkStatus?.gatewayIp || '192.168.11.225'}</strong></span>
        </div>

        <div className="telemetry-chip">
          <Activity size={14} color="#10B981" />
          <span>Ping: <strong>{latency} ms</strong></span>
        </div>
      </div>

      <div className="telemetry-actions">
        <motion.button 
          whileTap={{ rotate: 180 }}
          onClick={onRefresh}
          className="btn btn-secondary btn-sm"
          title="Refresh server status"
        >
          <RefreshCw size={13} />
          Refresh
        </motion.button>
      </div>
    </header>
  );
}
