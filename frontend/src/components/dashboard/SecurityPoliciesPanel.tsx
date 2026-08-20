import React, { useState } from 'react';
import {
  Sliders,
  Lock,
  Smartphone,
  Globe,
  Fingerprint,
  RefreshCw,
  Save,
  Flame,
} from 'lucide-react';
import type { SecurityPolicyConfig } from '../../types/sentinel';
import { sentinelApi } from '../../api/sentinel';

interface SecurityPoliciesPanelProps {
  onNotify: (msg: string) => void;
}

export const SecurityPoliciesPanel: React.FC<SecurityPoliciesPanelProps> = ({ onNotify }) => {
  const [policies, setPolicies] = useState<SecurityPolicyConfig>({
    auto_freeze_high_value: true,
    high_value_threshold: 100000.0,
    quarantine_sim_swap_hours: 48,
    block_tor_nodes: true,
    enforce_fido2_stepup: true,
    dynamic_risk_multiplier: 1.2,
    zero_trust_device_isolation: true,
    geo_velocity_threshold_mph: 600.0,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof SecurityPolicyConfig) => {
    setPolicies((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await sentinelApi.updatePolicies(policies);
      onNotify('Security Policies synchronized and enforced across active SentinelX Edge Engines.');
    } catch {
      onNotify('Failed to save security policies to backend.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#00D2D3]" />
            <h2 className="text-lg font-bold font-display text-white">
              AUTOMATED CONTAINMENT RULES & SECURITY POLICIES
            </h2>
          </div>
          <p className="text-xs text-[#8E9EB8] font-mono mt-1">
            Configure real-time deterministic thresholds and zero-trust perimeter enforcement rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D2D3] to-[#3B82F6] hover:from-[#00E5E6] hover:to-[#2563EB] text-[#0A0F1D] font-bold font-mono text-xs transition-all shadow-cyan-glow flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          SAVE & DEPLOY POLICIES
        </button>
      </div>

      {/* Rules Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rule 1: Auto-Freeze Outbound Transfers */}
        <div className="p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  AUTONOMOUS TRANSACTION FREEZE
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Halts ACH/SWIFT fund routing if risk score exceeds 85.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('auto_freeze_high_value')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                policies.auto_freeze_high_value ? 'bg-[#00D2D3]' : 'bg-[#182747]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  policies.auto_freeze_high_value ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-[#182747] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">High-Value Threshold:</span>
            <span className="text-[#00D2D3] font-bold">$100,000.00 USD</span>
          </div>
        </div>

        {/* Rule 2: SIM Swap Quarantine */}
        <div className="p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  TELCO SIM-SWAP 48H QUARANTINE
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Temporary freeze on SMS OTP authentication upon carrier SIM switch.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('zero_trust_device_isolation')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                policies.zero_trust_device_isolation ? 'bg-[#00D2D3]' : 'bg-[#182747]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  policies.zero_trust_device_isolation ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-[#182747] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Quarantine Duration:</span>
            <span className="text-amber-400 font-bold">48 Hours Cooling Period</span>
          </div>
        </div>

        {/* Rule 3: Tor & Anonymized VPN Blocker */}
        <div className="p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  TOR EXIT NODE & ANONYMIZED PROXY BLOCK
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Immediately drops TCP sessions originating from known Tor relays.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('block_tor_nodes')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                policies.block_tor_nodes ? 'bg-[#00D2D3]' : 'bg-[#182747]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  policies.block_tor_nodes ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-[#182747] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Ingress Action:</span>
            <span className="text-[#FF2E93] font-bold">DROP & DISPATCH SEC-ALERT</span>
          </div>
        </div>

        {/* Rule 4: FIDO2 Biometric Step-Up */}
        <div className="p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  FIDO2 WEBAUTHN STEP-UP ENFORCEMENT
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Requires hardware TouchID/FaceID upon sensitive vector correlation.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('enforce_fido2_stepup')}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                policies.enforce_fido2_stepup ? 'bg-[#00D2D3]' : 'bg-[#182747]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  policies.enforce_fido2_stepup ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-[#182747] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Auth Standard:</span>
            <span className="text-[#00D2D3] font-bold">W3C WebAuthn Level 3</span>
          </div>
        </div>
      </div>

      {/* Sensitivity Multiplier Slider */}
      <div className="p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#00D2D3]" />
            <h3 className="text-xs font-mono font-bold text-white tracking-wider">
              DYNAMIC RISK CORRELATION SENSITIVITY MULTIPLIER
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#00D2D3]">
            {policies.dynamic_risk_multiplier}x Sensitivity
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={policies.dynamic_risk_multiplier}
          onChange={(e) =>
            setPolicies((prev) => ({
              ...prev,
              dynamic_risk_multiplier: parseFloat(e.target.value),
            }))
          }
          className="w-full accent-[#00D2D3] cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0.5x (Permissive)</span>
          <span>1.0x (Standard MITRE ATT&CK Baseline)</span>
          <span>2.0x (Ultra-Paranoid Defense)</span>
        </div>
      </div>
    </div>
  );
};
