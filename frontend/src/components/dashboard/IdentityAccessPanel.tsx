import React, { useState } from 'react';
import {
  Shield,
  Smartphone,
  Laptop,
  Fingerprint,
  AlertOctagon,
  Trash2,
  MapPin,
  Globe,
} from 'lucide-react';
import type { UserProfile } from '../../types/sentinel';

interface IdentityAccessPanelProps {
  users: UserProfile[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

export const IdentityAccessPanel: React.FC<IdentityAccessPanelProps> = ({
  users,
  currentUserId,
  onSelectUser,
}) => {
  const [isBiometricEnforced, setIsBiometricEnforced] = useState(true);
  const [isEmergencyLocked, setIsEmergencyLocked] = useState(false);
  const [sessions, setSessions] = useState([
    {
      id: 'SES-9481',
      device: 'MacBook Pro 16" (macOS Sonoma)',
      type: 'laptop',
      ip: '198.51.100.42',
      location: 'Dallas, TX (United States)',
      time: 'Active Now',
      isCurrent: true,
    },
    {
      id: 'SES-9482',
      device: 'iPhone 15 Pro (iOS 18.2)',
      type: 'phone',
      ip: '203.0.113.88',
      location: 'Miami, FL (United States)',
      time: '14 mins ago',
      isCurrent: false,
    },
    {
      id: 'SES-9483',
      device: 'Linux x86_64 (Tor Exit Node)',
      type: 'suspicious',
      ip: '185.220.101.5',
      location: 'Frankfurt (Germany)',
      time: 'Blocked / Quarantined',
      isCurrent: false,
    },
  ]);

  const currentUser = users.find((u) => u.user_id === currentUserId) || users[0];

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleEmergencyLock = () => {
    const nextState = !isEmergencyLocked;
    setIsEmergencyLocked(nextState);
    if (nextState) {
      alert(`[EMERGENCY LOCKDOWN ENGAGED]\nIdentity ${currentUser?.name} (${currentUserId}) is now locked. All active credentials invalidated.`);
    } else {
      alert(`[LOCKDOWN RELEASED]\nIdentity ${currentUser?.name} returned to standard monitoring.`);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {/* Top Banner Identity Summary */}
      <div className="p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser?.avatar}
              alt={currentUser?.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#00D2D3] shadow-cyan-glow"
            />
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#00D2D3] text-[#0A0F1D]">
              <Shield className="w-3 h-3" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold font-display text-white">{currentUser?.name}</h2>
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-[#00D2D3]/15 border border-[#00D2D3] text-[#00D2D3]">
                {currentUser?.user_id}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                {currentUser?.tier}
              </span>
            </div>
            <p className="text-xs text-[#8E9EB8] font-mono mt-0.5">
              {currentUser?.role} • {currentUser?.department}
            </p>
          </div>
        </div>

        {/* Emergency Lock & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsBiometricEnforced(!isBiometricEnforced)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 cursor-pointer ${
              isBiometricEnforced
                ? 'bg-[#00D2D3]/15 border-[#00D2D3] text-[#00D2D3] shadow-cyan-glow'
                : 'bg-[#111C33] border-[#1F3158] text-slate-400'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            FIDO2 BIOMETRIC: {isBiometricEnforced ? 'ENFORCED' : 'OPTIONAL'}
          </button>

          <button
            onClick={handleToggleEmergencyLock}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 cursor-pointer ${
              isEmergencyLocked
                ? 'bg-[#FF2E93] text-[#0A0F1D] border-[#FF2E93] shadow-magenta-glow'
                : 'bg-[#FF2E93]/15 text-[#FF2E93] border-[#FF2E93]/60 hover:bg-[#FF2E93] hover:text-[#0A0F1D]'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            {isEmergencyLocked ? 'LOCKED DOWN' : 'EMERGENCY LOCK'}
          </button>
        </div>
      </div>

      {/* Grid: User Directory Selector & Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 4 cols: User Directory Switcher */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-white tracking-wider">
              SURVEILLANCE DIRECTORY
            </h3>
            <span className="text-[10px] font-mono text-[#00D2D3]">
              {users.length} Active Targets
            </span>
          </div>

          <div className="space-y-2.5">
            {users.map((u) => {
              const isSelected = u.user_id === currentUserId;
              return (
                <button
                  key={u.user_id}
                  onClick={() => onSelectUser(u.user_id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#182747] border-[#00D2D3] shadow-cyan-glow'
                      : 'bg-[#0D1527] border-[#1F3158] hover:border-[#2A3F6D]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-9 h-9 rounded-xl object-cover border border-[#00D2D3]/40"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-100">{u.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{u.role}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#00D2D3]">
                    {u.user_id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 cols: Active Authenticated Sessions & Devices */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#0C1427] border border-[#1F3158] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#00D2D3]" />
              <h3 className="text-xs font-mono font-bold text-white tracking-wider">
                ACTIVE SESSIONS & ZERO-TRUST HARDWARE FINGERPRINTS
              </h3>
            </div>
            <button
              onClick={() => setSessions([])}
              className="text-[11px] font-mono text-[#FF2E93] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Purge All Other Sessions
            </button>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 border border-dashed border-[#1F3158] rounded-xl">
                No active external sessions recorded.
              </div>
            ) : (
              sessions.map((ses) => (
                <div
                  key={ses.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono ${
                    ses.type === 'suspicious'
                      ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                      : 'bg-[#0D1527] border-[#1F3158] text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      ses.type === 'phone'
                        ? 'bg-amber-500/10 text-amber-400'
                        : ses.type === 'suspicious'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-[#00D2D3]/10 text-[#00D2D3]'
                    }`}>
                      {ses.type === 'phone' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {ses.device}
                        {ses.isCurrent && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {ses.ip}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {ses.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">{ses.time}</span>
                    {!ses.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(ses.id)}
                        className="p-1.5 rounded-lg bg-[#182747] hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                        title="Revoke Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
