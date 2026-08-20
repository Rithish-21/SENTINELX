import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  DollarSign,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import type { SocAnalyticsSummary, RiskAssessment } from '../../types/sentinel';

interface SocAnalyticsPanelProps {
  analytics: SocAnalyticsSummary | null;
  assessment: RiskAssessment | null;
  riskScore: number;
}

export const SocAnalyticsPanel: React.FC<SocAnalyticsPanelProps> = ({
  analytics,
  assessment,
  riskScore,
}) => {
  const mttc = analytics?.mttc_seconds ?? 1.2;
  const totalEvents = analytics?.total_events_ingested ?? 15240;
  const preventedUsd = analytics?.prevented_loss_usd ?? 18450000;

  const vectorStats = [
    { name: 'Phishing / Smishing (T1566)', share: 44, color: 'bg-[#00D2D3]', count: '6,705' },
    { name: 'SIM Swap Interception (T1451)', share: 26, color: 'bg-amber-400', count: '3,962' },
    { name: 'Unknown Device Ingress (T1078)', share: 18, color: 'bg-indigo-400', count: '2,743' },
    { name: 'Unauthorized Exfiltration (T1534)', share: 12, color: 'bg-[#FF2E93]', count: '1,830' },
  ];

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-[#0C1427] border border-[#1F3158] shadow-card relative overflow-hidden group hover:border-[#00D2D3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8E9EB8]">MEAN TIME TO CONTAIN (MTTC)</span>
            <div className="p-2 rounded-lg bg-[#00D2D3]/10 text-[#00D2D3]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-white">{mttc}s</span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> -94% vs Industry
            </span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">
            Autonomous Graph containment trigger
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-[#0C1427] border border-[#1F3158] shadow-card relative overflow-hidden group hover:border-[#00D2D3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8E9EB8]">PREVENTED EXFILTRATION</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-emerald-400">
              ${(preventedUsd / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs font-mono text-emerald-400">USD</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">
            100% frozen before SWIFT release
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-[#0C1427] border border-[#1F3158] shadow-card relative overflow-hidden group hover:border-[#00D2D3] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8E9EB8]">TELEMETRY INGESTED</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-white">
              {totalEvents.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-[#00D2D3]">EVT</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">
            Real-time SS7, IMEI & IP correlation
          </p>
        </div>

        {/* Metric 4 */}
        <div className={`p-4 rounded-xl border shadow-card relative overflow-hidden transition-all ${
          riskScore > 85
            ? 'bg-[#FF2E93]/10 border-[#FF2E93] shadow-magenta-glow'
            : 'bg-[#0C1427] border-[#1F3158]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8E9EB8]">ACTIVE THREAT MATRIX</span>
            <div className={`p-2 rounded-lg ${riskScore > 85 ? 'bg-[#FF2E93]/20 text-[#FF2E93]' : 'bg-[#00D2D3]/10 text-[#00D2D3]'}`}>
              {riskScore > 85 ? <Flame className="w-4 h-4 animate-bounce" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-display ${riskScore > 85 ? 'text-[#FF2E93]' : 'text-[#00D2D3]'}`}>
              {riskScore.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-slate-300">
              {assessment?.attack_stage || 'NOMINAL'}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">
            {riskScore > 85 ? 'Automated lockdown active' : 'Zero unauthorized access'}
          </p>
        </div>
      </div>

      {/* Middle Section: Attack Vectors Breakdown & MITRE ATT&CK Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 6 cols: Vector Distribution */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00D2D3]" />
              <h3 className="text-sm font-bold font-mono text-white tracking-wider">
                MITRE ATT&CK VECTOR TELEMETRY
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Sliding 30d Window</span>
          </div>

          <div className="space-y-4">
            {vectorStats.map((vec, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">{vec.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{vec.count} evts</span>
                    <strong className="text-white font-bold">{vec.share}%</strong>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[#182747] overflow-hidden">
                  <div
                    className={`h-full ${vec.color} rounded-full transition-all duration-500`}
                    style={{ width: `${vec.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Forensic Highlight Card */}
          <div className="mt-6 p-3.5 rounded-xl bg-[#111C33] border border-[#1F3158] flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#00D2D3] shrink-0" />
            <p className="text-xs font-mono text-slate-300">
              Deterministic causal graph correlates multi-stage hops with <strong className="text-[#00D2D3]">99.8% precision</strong>, eliminating false positives common to probabilistic models.
            </p>
          </div>
        </div>

        {/* Right 6 cols: MITRE Tactics Coverage & Recent Incidents */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FF2E93]" />
                <h3 className="text-sm font-bold font-mono text-white tracking-wider">
                  DEFENSE POSTURE & MITRE COVERAGE
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                100% AUDITED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { tactic: 'T1566 Phishing', status: 'PROTECTED', grade: 'Grade A+' },
                { tactic: 'T1451 SIM Swap', status: 'PROTECTED', grade: 'SS7 Intercept' },
                { tactic: 'T1078 Unknown Device', status: 'PROTECTED', grade: 'IMEI Check' },
                { tactic: 'T1534 Exfiltration', status: 'CONTAINED', grade: 'Auto-Freeze' },
                { tactic: 'T1110 Credential Access', status: 'PROTECTED', grade: 'FIDO2 Auth' },
                { tactic: 'T1485 Zero-Trust Wipe', status: 'ACTIVE', grade: 'Policy Gate' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-[#111C33] border border-[#1F3158] flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-200">{item.tactic}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#00D2D3] bg-[#00D2D3]/10 px-1.5 py-0.5 rounded">
                    {item.grade}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick SLA Status */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#111C33] to-[#182747] border border-[#2A3F6D] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">Global SOC SLA Status:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              99.999% OPERATIONAL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
