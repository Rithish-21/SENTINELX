import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Server,
  Radio,
  Clock,
  RotateCcw,
  LogOut,
  User,
  LayoutDashboard,
  BarChart3,
  Lock,
  Terminal,
  Sliders,
} from 'lucide-react';
import type { AttackStage } from '../types/sentinel';
import { useAuth } from '../context/AuthContext';

export type DashboardTab = 'graph' | 'analytics' | 'identity' | 'audit' | 'policies';

interface HeaderProps {
  attackStage: AttackStage;
  riskScore: number;
  isBackendConnected: boolean;
  nodeCount: number;
  onReset: () => void;
  isSimulating: boolean;
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  attackStage,
  riskScore,
  isBackendConnected,
  nodeCount,
  onReset,
  isSimulating,
  activeTab,
  onSelectTab,
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCritical = riskScore > 85;
  const isElevated = riskScore > 30;

  const handleLogout = async () => {
    if (window.confirm('Terminate active SOC surveillance session and log out?')) {
      await logout();
    }
  };

  return (
    <header className="w-full bg-[#080D1A]/95 border-b border-[#1F3158] backdrop-blur-md px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center justify-between w-full xl:w-auto">
          <div className="flex items-center gap-3">
            <div className={`relative p-2 rounded-xl border ${
              isCritical
                ? 'bg-[#FF2E93]/10 border-[#FF2E93] shadow-magenta-glow'
                : 'bg-[#00D2D3]/10 border-[#00D2D3] shadow-cyan-glow'
            }`}>
              {isCritical ? (
                <ShieldAlert className="w-6 h-6 text-[#FF2E93] animate-pulse" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-[#00D2D3]" />
              )}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isCritical ? 'bg-[#FF2E93]' : 'bg-[#00D2D3]'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  isCritical ? 'bg-[#FF2E93]' : 'bg-[#00D2D3]'
                }`} />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-wider text-white font-display">
                  SENTINEL<span className="text-[#00D2D3]">X</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#111C33] border border-[#1F3158] text-[#00D2D3]">
                  SOC v2.5
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                  XAI GRAPH ENGINE
                </span>
              </div>
              <p className="text-xs text-[#8E9EB8] font-mono">
                AI Cyber Defense & Digital Trust Platform
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-[#060B16] border border-[#182747] rounded-xl font-mono text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectTab('graph')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'graph'
                ? 'bg-[#182747] text-[#00D2D3] font-bold border border-[#00D2D3]/40 shadow-cyan-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>THREAT GRAPH</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-[#182747] text-[#00D2D3] font-bold border border-[#00D2D3]/40 shadow-cyan-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>SOC ANALYTICS</span>
          </button>

          <button
            onClick={() => onSelectTab('identity')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'identity'
                ? 'bg-[#182747] text-[#00D2D3] font-bold border border-[#00D2D3]/40 shadow-cyan-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>IDENTITY & ACCESS</span>
          </button>

          <button
            onClick={() => onSelectTab('audit')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-[#182747] text-[#00D2D3] font-bold border border-[#00D2D3]/40 shadow-cyan-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>AUDIT LOGS</span>
          </button>

          <button
            onClick={() => onSelectTab('policies')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'policies'
                ? 'bg-[#182747] text-[#00D2D3] font-bold border border-[#00D2D3]/40 shadow-cyan-glow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>POLICIES</span>
          </button>
        </nav>

        {/* User Profile & Telemetry Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-xs font-mono">
          {/* UTC Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111C33] border border-[#1F3158] text-[#8E9EB8]">
            <Clock className="w-3.5 h-3.5 text-[#00D2D3]" />
            <span>{timeStr || 'SYNCHRONIZING...'}</span>
          </div>

          {/* Engine Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111C33] border border-[#1F3158]">
            <Server className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-[#10B981]' : 'text-[#FF2E93]'}`} />
            <span className="text-[#8E9EB8]">ENGINE:</span>
            <span className={isBackendConnected ? 'text-[#10B981] font-semibold' : 'text-[#FF2E93] font-semibold'}>
              {isBackendConnected ? 'ONLINE' : 'CONNECTING...'}
            </span>
          </div>

          {/* Telemetry Nodes */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#111C33] border border-[#1F3158] text-[#8E9EB8]">
            <Activity className="w-3.5 h-3.5 text-[#00D2D3]" />
            <span>NODES:</span>
            <span className="text-white font-bold">{nodeCount}</span>
          </div>

          {/* Threat Matrix Stage */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-bold ${
            isCritical
              ? 'bg-[#FF2E93]/15 border-[#FF2E93] text-[#FF2E93] shadow-magenta-glow animate-pulse'
              : isElevated
              ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B]'
              : 'bg-[#00D2D3]/10 border-[#00D2D3]/40 text-[#00D2D3]'
          }`}>
            <Radio className="w-3.5 h-3.5 animate-spin" />
            <span>DEFCON:</span>
            <span>{attackStage}</span>
          </div>

          {/* Global Reset */}
          <button
            onClick={onReset}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#182747] hover:bg-[#1F3158] text-slate-200 border border-[#2A3F6D] hover:border-[#00D2D3] transition-all cursor-pointer disabled:opacity-50"
            title="Reset Session Telemetry"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#00D2D3]" />
            <span className="font-semibold hidden sm:inline">RESET</span>
          </button>

          {/* User Auth Profile Badge & Logout */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#1F3158]">
              <div
                onClick={() => openAuthModal('signin')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0E172B] border border-[#1F3158] hover:border-[#00D2D3] transition-all cursor-pointer"
                title="Switch User / Account"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-[#00D2D3]/50"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-bold text-slate-100 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[9px] text-[#00D2D3] uppercase leading-tight">
                    {user.tier.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-[#111C33] hover:bg-rose-950/80 border border-[#1F3158] hover:border-rose-500/60 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                title="Log Out & Invalidate Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-[#1F3158]">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3 py-1.5 rounded-lg bg-[#182747] hover:bg-[#1F3158] text-[#00D2D3] border border-[#00D2D3]/40 font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer hover:shadow-cyan-glow transition-all"
              >
                <User className="w-3.5 h-3.5" />
                SIGN IN
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="hidden sm:flex px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D2D3] to-[#3B82F6] hover:from-[#00E5E6] hover:to-[#2563EB] text-[#0A0F1D] font-bold font-mono text-xs items-center gap-1.5 cursor-pointer shadow-cyan-glow transition-all"
              >
                REGISTER
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
