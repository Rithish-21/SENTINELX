import React, { useState } from 'react';
import {
  Terminal,
  Search,
  Download,
  Trash2,
  Pause,
  Play,
} from 'lucide-react';
import type { AuditLogItem } from '../../types/sentinel';

export const AuditLogPanel: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [isPaused, setIsPaused] = useState(false);

  const [logs, setLogs] = useState<AuditLogItem[]>([
    {
      id: 'LOG-1094',
      timestamp: new Date(Date.now() - 1000 * 12).toISOString().replace('T', ' ').substring(0, 19),
      level: 'CRITICAL',
      category: 'AUTO_CONTAINMENT',
      action: 'TRANSACTION_FROZEN',
      actor: 'SENTINEL_ENGINE',
      ip: '185.220.101.5',
      imei: '864293041234567',
      details: 'Automated $250,000.00 SWIFT wire freeze executed. Recipient: Offshore Cayman Escrow.',
    },
    {
      id: 'LOG-1093',
      timestamp: new Date(Date.now() - 1000 * 45).toISOString().replace('T', ' ').substring(0, 19),
      level: 'CRITICAL',
      category: 'AUTHENTICATION',
      action: 'ANOMALOUS_LOGIN_DETECTED',
      actor: 'ADVERSARY_UNKNOWN',
      ip: '185.220.101.5',
      imei: '864293041234567',
      details: "New device login via Tor Exit Node (Frankfurt). Bypassed password with intercepted SMS OTP.",
    },
    {
      id: 'LOG-1092',
      timestamp: new Date(Date.now() - 1000 * 95).toISOString().replace('T', ' ').substring(0, 19),
      level: 'WARN',
      category: 'CARRIER_TELEMETRY',
      action: 'SIM_SWAP_SIGNAL_RECEIVED',
      actor: 'TELCO_SS7_GATEWAY',
      ip: '203.0.113.88',
      imei: '864293041234567',
      details: 'eSIM re-provisioned via IVR carrier update within 15 minutes of smishing interaction.',
    },
    {
      id: 'LOG-1091',
      timestamp: new Date(Date.now() - 1000 * 180).toISOString().replace('T', ' ').substring(0, 19),
      level: 'WARN',
      category: 'PHISHING_DEFENSE',
      action: 'SMISHING_CLICK_INTERCEPT',
      actor: 'USR-84920',
      ip: '198.51.100.42',
      imei: '358920194820194',
      details: "SMS link 'https://sec-bank-verify.net/auth' clicked from cellular data network.",
    },
    {
      id: 'LOG-1090',
      timestamp: new Date(Date.now() - 1000 * 320).toISOString().replace('T', ' ').substring(0, 19),
      level: 'SUCCESS',
      category: 'OTP_VERIFICATION',
      action: 'OPERATOR_REGISTERED',
      actor: 'USR-84920',
      ip: '127.0.0.1',
      imei: '449201948201948',
      details: 'Operator 2FA identity verified with cryptographic 6-digit OTP token.',
    },
    {
      id: 'LOG-1089',
      timestamp: new Date(Date.now() - 1000 * 600).toISOString().replace('T', ' ').substring(0, 19),
      level: 'INFO',
      category: 'POLICY_ENFORCEMENT',
      action: 'DYNAMIC_RULES_SYNC',
      actor: 'SOC_SUPERVISOR',
      ip: '127.0.0.1',
      details: 'Zero-Trust security policies synchronized across edge API gateways.',
    },
  ]);

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = severityFilter === 'ALL' || log.level === severityFilter;
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.imei && log.imei.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinelx_audit_log_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-4 w-full animate-fadeIn">
      {/* Top Filter and Action Bar */}
      <div className="p-4 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-[#00D2D3] absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by IP, Action, IMEI, Actor..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#080D1A] border border-[#1F3158] text-xs font-mono text-slate-100 placeholder-slate-500 outline-none focus:border-[#00D2D3]"
            />
          </div>

          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1 bg-[#080D1A] p-1 rounded-lg border border-[#1F3158] font-mono text-[11px]">
            {['ALL', 'CRITICAL', 'WARN', 'SUCCESS', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-[#182747] text-[#00D2D3] font-bold border border-[#00D2D3]/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 cursor-pointer ${
              isPaused
                ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                : 'bg-[#111C33] border-[#1F3158] text-slate-300'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume Stream' : 'Pause'}
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-[#111C33] hover:bg-[#182747] border border-[#1F3158] hover:border-[#00D2D3] text-[#00D2D3] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <button
            onClick={handleClearLogs}
            className="p-1.5 rounded-lg bg-[#111C33] hover:bg-rose-950 border border-[#1F3158] text-slate-400 hover:text-rose-400 cursor-pointer"
            title="Clear Log Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="rounded-2xl bg-[#070B14] border border-[#1F3158] shadow-card overflow-hidden font-mono text-xs">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-[#0A0F1D] border-b border-[#1F3158] flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00D2D3]" />
            <span className="font-bold text-slate-200">LIVE FORENSIC AUDIT TELEMETRY STREAM</span>
            <span className="px-1.5 py-0.5 text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded">
              BUFFER: {filteredLogs.length} EVENTS
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#00D2D3] animate-ping" />
            <span className="text-[#00D2D3]">STREAM ACTIVE</span>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="divide-y divide-[#131F38] max-h-[560px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No telemetry events match the active search criteria.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isCrit = log.level === 'CRITICAL';
              const isWarn = log.level === 'WARN';
              const isSuccess = log.level === 'SUCCESS';

              return (
                <div
                  key={log.id}
                  className={`p-3.5 hover:bg-[#0D1527] transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
                    isCrit ? 'bg-rose-950/15' : isWarn ? 'bg-amber-950/10' : ''
                  }`}
                >
                  <div className="flex items-start md:items-center gap-3">
                    <span className="text-slate-500 text-[11px] shrink-0">{log.timestamp}</span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isCrit
                          ? 'bg-[#FF2E93]/20 border border-[#FF2E93] text-[#FF2E93]'
                          : isWarn
                          ? 'bg-amber-500/20 border border-amber-500 text-amber-300'
                          : isSuccess
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                          : 'bg-[#00D2D3]/10 border border-[#00D2D3]/40 text-[#00D2D3]'
                      }`}
                    >
                      {log.level}
                    </span>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="text-slate-400 text-[10px]">[{log.category}]</span>
                      </div>
                      <p className="text-slate-300 text-xs">{log.details}</p>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0 self-end md:self-auto">
                    <span className="bg-[#111C33] px-2 py-0.5 rounded border border-[#1F3158] text-[#00D2D3]">
                      ACTOR: {log.actor}
                    </span>
                    <span className="bg-[#111C33] px-2 py-0.5 rounded border border-[#1F3158]">
                      IP: {log.ip}
                    </span>
                    {log.imei && (
                      <span className="bg-[#111C33] px-2 py-0.5 rounded border border-[#1F3158]">
                        IMEI: {log.imei}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
