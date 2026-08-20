import React, { useState } from 'react';
import {
  Play,
  MessageSquare,
  Smartphone,
  Laptop,
  DollarSign,
  UserCheck,
  Terminal,
  Sliders,
  Send,
  Zap,
} from 'lucide-react';
import type { EventType, UserProfile } from '../types/sentinel';

interface AttackSimulatorPanelProps {
  currentUserId: string;
  users: UserProfile[];
  onSelectUser: (userId: string) => void;
  onTriggerEvent: (eventType: EventType, customMeta?: Record<string, any>) => void;
  onRunFullSimulation: () => void;
  onReset: () => void;
  isSimulating: boolean;
  activeEvents: string[];
}

export const AttackSimulatorPanel: React.FC<AttackSimulatorPanelProps> = ({
  currentUserId,
  users,
  onSelectUser,
  onTriggerEvent,
  onRunFullSimulation,
  isSimulating,
  activeEvents,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customType, setCustomType] = useState<EventType>('PHISHING_SMS_CLICKED');
  const [customIp, setCustomIp] = useState('185.220.101.5');
  const [customImei, setCustomImei] = useState('864293041234567');
  const [customDetails, setCustomDetails] = useState('Custom telemetry probe event');
  const [customConfidence] = useState(0.96);

  const currentUser = users.find((u) => u.user_id === currentUserId) || users[0];

  const attackSteps = [
    {
      step: 1,
      type: 'PHISHING_SMS_CLICKED' as EventType,
      title: 'Phishing SMS Clicked',
      subtitle: 'Smishing link clicked via SMS',
      icon: MessageSquare,
      color: '#00D2D3',
      details: "Clicked 'https://sec-bank-verify.net/auth'",
      ip: '198.51.100.42',
      imei: '358920194820194',
    },
    {
      step: 2,
      type: 'SIM_SWAP_DETECTED' as EventType,
      title: 'SIM Swap Detected',
      subtitle: 'Carrier eSIM hijacked via IVR',
      icon: Smartphone,
      color: '#F59E0B',
      details: 'Telco SS7 Carrier update: eSIM re-provisioned',
      ip: '203.0.113.88',
      imei: '864293041234567',
    },
    {
      step: 3,
      type: 'NEW_DEVICE_LOGIN' as EventType,
      title: 'New Device Login',
      subtitle: 'Tor exit node authenticated with SMS OTP',
      icon: Laptop,
      color: '#FF2E93',
      details: "Unregistered device 'Linux x86_64; Tor Exit'",
      ip: '185.220.101.5',
      imei: '864293041234567',
    },
    {
      step: 4,
      type: 'ABNORMAL_TRANSACTION' as EventType,
      title: 'Abnormal Transaction',
      subtitle: '$250k unauthorized wire transfer',
      icon: DollarSign,
      color: '#FF2E93',
      details: 'SWIFT wire transfer of $250,000.00 to offshore escrow',
      ip: '185.220.101.5',
      imei: '864293041234567',
    },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerEvent(customType, {
      ip: customIp,
      imei: customImei,
      details: customDetails,
      confidence_score: customConfidence,
    });
    setShowCustomModal(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 bg-[#0B1224] p-4 rounded-xl border border-[#1F3158] font-sans">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#1F3158] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#00D2D3]/10 border border-[#00D2D3]/30">
            <Zap className="w-4 h-4 text-[#00D2D3]" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold text-white tracking-wider uppercase">
              Attack Chain Simulator
            </h2>
            <p className="text-[11px] text-[#8E9EB8] font-mono">
              Step-by-step vector telemetry injection
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCustomModal(!showCustomModal)}
          className="p-1.5 rounded bg-[#111C33] hover:bg-[#182747] border border-[#1F3158] hover:border-[#00D2D3] text-[#8E9EB8] hover:text-[#00D2D3] transition-colors cursor-pointer"
          title="Custom Payload Injector"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Identity Selector */}
      {currentUser && (
        <div className="p-3 rounded-lg bg-[#111C33] border border-[#1F3158] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8E9EB8]">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-[#00D2D3]" />
              TARGET IDENTITY
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#0A0F1D] text-[#00D2D3] font-bold border border-[#1F3158]">
              {currentUser.tier}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full border-2 border-[#00D2D3]/60 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white truncate font-mono">
                  {currentUser.name}
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {currentUser.account_balance}
                </span>
              </div>
              <p className="text-[10px] text-[#8E9EB8] truncate font-mono">
                {currentUser.role} • {currentUser.user_id}
              </p>
            </div>
          </div>

          {/* Quick Switch User Dropdown */}
          <div className="pt-1">
            <select
              value={currentUserId}
              onChange={(e) => onSelectUser(e.target.value)}
              disabled={isSimulating}
              className="w-full bg-[#0A0F1D] border border-[#1F3158] rounded px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00D2D3] cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name} ({u.role} - {u.user_id})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 1-Click Automated Full ATO Simulation Button */}
      <div className="space-y-2">
        <button
          onClick={onRunFullSimulation}
          disabled={isSimulating}
          className="w-full relative group overflow-hidden rounded-lg p-px font-mono text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D2D3] via-[#FF2E93] to-[#00D2D3] rounded-lg animate-pulse" />
          <div className="relative px-4 py-3 rounded-[7px] bg-[#0A0F1D] group-hover:bg-[#0A0F1D]/80 transition-colors flex items-center justify-center gap-2 text-white">
            <Play className={`w-4 h-4 text-[#00D2D3] ${isSimulating ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="tracking-wider">
              {isSimulating ? 'EXECUTING ATO CHAIN...' : 'RUN FULL ATO SIMULATION'}
            </span>
          </div>
        </button>
      </div>

      {/* Step-by-Step Attack Vector Triggers */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8E9EB8]">
          <span>SEQUENTIAL VECTORS</span>
          <span>STAGE-BY-STAGE</span>
        </div>

        {attackSteps.map((step) => {
          const Icon = step.icon;
          const isTriggered = activeEvents.includes(step.type);

          return (
            <div
              key={step.step}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                isTriggered
                  ? 'bg-[#111C33] border-[#FF2E93]/60 shadow-magenta-glow'
                  : 'bg-[#0A0F1D]/70 border-[#1F3158] hover:border-[#00D2D3]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className="p-2 rounded-md shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${step.color}15`,
                      border: `1px solid ${step.color}40`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: step.color }} />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-[#8E9EB8]">
                        [0{step.step}]
                      </span>
                      <h4 className="text-xs font-bold font-mono text-white">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-[#8E9EB8] mt-0.5 font-mono">
                      {step.subtitle}
                    </p>
                    <p className="text-[9px] text-[#00D2D3]/80 font-mono mt-1 truncate max-w-[190px]">
                      IP: {step.ip}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onTriggerEvent(step.type, {
                    ip: step.ip,
                    imei: step.imei,
                    details: step.details,
                    confidence_score: 0.95 + step.step * 0.01,
                  })}
                  disabled={isSimulating || isTriggered}
                  className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded transition-all cursor-pointer ${
                    isTriggered
                      ? 'bg-[#FF2E93]/20 text-[#FF2E93] border border-[#FF2E93]/50 cursor-default'
                      : 'bg-[#00D2D3]/15 hover:bg-[#00D2D3]/30 text-[#00D2D3] border border-[#00D2D3]/50 hover:shadow-cyan-glow'
                  } disabled:opacity-50`}
                >
                  {isTriggered ? 'TRIGGERED' : 'INJECT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Event Injector Modal / Collapsible */}
      {showCustomModal && (
        <form
          onSubmit={handleCustomSubmit}
          className="p-3 rounded-lg bg-[#0A0F1D] border border-[#00D2D3]/50 space-y-2.5 font-mono text-xs"
        >
          <div className="flex items-center justify-between text-[#00D2D3] font-bold">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" /> CUSTOM TELEMETRY INJECTOR
            </span>
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="text-[#8E9EB8] hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block text-[10px] text-[#8E9EB8] mb-1">EVENT TYPE</label>
            <select
              value={customType}
              onChange={(e) => setCustomType(e.target.value as EventType)}
              className="w-full bg-[#111C33] border border-[#1F3158] rounded px-2 py-1 text-slate-200 focus:border-[#00D2D3]"
            >
              <option value="PHISHING_SMS_CLICKED">PHISHING_SMS_CLICKED</option>
              <option value="SIM_SWAP_DETECTED">SIM_SWAP_DETECTED</option>
              <option value="NEW_DEVICE_LOGIN">NEW_DEVICE_LOGIN</option>
              <option value="ABNORMAL_TRANSACTION">ABNORMAL_TRANSACTION</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-[#8E9EB8] mb-1">SOURCE IP</label>
              <input
                type="text"
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                className="w-full bg-[#111C33] border border-[#1F3158] rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#8E9EB8] mb-1">DEVICE IMEI</label>
              <input
                type="text"
                value={customImei}
                onChange={(e) => setCustomImei(e.target.value)}
                className="w-full bg-[#111C33] border border-[#1F3158] rounded px-2 py-1 text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[#8E9EB8] mb-1">DETAILS</label>
            <input
              type="text"
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              className="w-full bg-[#111C33] border border-[#1F3158] rounded px-2 py-1 text-slate-200"
            />
          </div>

          <button
            type="submit"
            className="w-full py-1.5 rounded bg-[#00D2D3] hover:bg-[#00D2D3]/80 text-[#0A0F1D] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> INJECT PAYLOAD
          </button>
        </form>
      )}
    </div>
  );
};
