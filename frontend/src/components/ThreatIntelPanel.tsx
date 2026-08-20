import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Clock,
  Sparkles,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import type {
  AttackStage,
  RiskAssessment,
} from '../types/sentinel';

interface ThreatIntelPanelProps {
  assessment: RiskAssessment | null;
  riskScore: number;
  attackStage: AttackStage;
}

export const ThreatIntelPanel: React.FC<ThreatIntelPanelProps> = ({
  assessment,
  riskScore,
  attackStage,
}) => {
  const [activeTab, setActiveTab] = useState<'xai' | 'actions'>('xai');

  // Gauge calculations
  const clampedScore = Math.min(100, Math.max(0, riskScore));
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * (circumference * 0.75);

  const isCritical = clampedScore > 85;
  const isElevated = clampedScore > 30;

  const getStageColor = (stage: AttackStage) => {
    switch (stage) {
      case 'CRITICAL_BREACH':
        return '#FF2E93';
      case 'ACTIVE_ATO':
        return '#FF2E93';
      case 'COMPROMISED':
        return '#F59E0B';
      case 'RECON':
        return '#00D2D3';
      default:
        return '#10B981';
    }
  };

  const stageColor = getStageColor(attackStage);

  return (
    <div className="w-full flex flex-col gap-4 bg-[#0B1224] p-4 rounded-xl border border-[#1F3158] font-sans">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#1F3158] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#FF2E93]/10 border border-[#FF2E93]/30">
            <ShieldAlert className="w-4 h-4 text-[#FF2E93]" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold text-white tracking-wider uppercase">
              Threat Intelligence & Containment
            </h2>
            <p className="text-[11px] text-[#8E9EB8] font-mono">
              Deterministic XAI Risk & Defense Dispatch
            </p>
          </div>
        </div>

        {/* Stage Badge */}
        <span
          className="px-2.5 py-1 text-[11px] font-mono font-black rounded border flex items-center gap-1.5"
          style={{
            backgroundColor: `${stageColor}15`,
            borderColor: stageColor,
            color: stageColor,
            boxShadow: isCritical ? `0 0 15px ${stageColor}50` : undefined,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
          {attackStage}
        </span>
      </div>

      {/* Dynamic Animated Risk Gauge */}
      <div className="p-4 rounded-xl bg-[#111C33] border border-[#1F3158] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Glow ambient background */}
        <div
          className="absolute w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: stageColor }}
        />

        <div className="relative w-44 h-40 flex items-center justify-center">
          <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#1F3158"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference * 0.75}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
            {/* Animated Gauge Arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={stageColor}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference * 0.75}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${stageColor})`,
              }}
            />
          </svg>

          {/* Central Digital Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-mono tracking-widest text-[#8E9EB8] uppercase">
              THREAT INDEX
            </span>
            <div className="flex items-baseline gap-0.5">
              <span
                className="text-3xl font-black font-mono tracking-tight transition-colors duration-500"
                style={{ color: stageColor }}
              >
                {clampedScore.toFixed(1)}
              </span>
              <span className="text-sm font-mono font-bold text-slate-400">%</span>
            </div>
            <span className="text-[10px] font-mono text-slate-300 font-semibold px-2 py-0.5 rounded bg-[#0A0F1D] border border-[#1F3158] mt-0.5">
              {isCritical ? 'CRITICAL BREACH' : isElevated ? 'ELEVATED RISK' : 'NOMINAL SAFE'}
            </span>
          </div>
        </div>

        {/* Threat Level Progression Bar */}
        <div className="w-full grid grid-cols-4 gap-1.5 pt-2 border-t border-[#1F3158]/80 text-[10px] font-mono text-center">
          <div className={`py-1 rounded border ${attackStage === 'RECON' ? 'bg-[#00D2D3]/20 border-[#00D2D3] text-[#00D2D3]' : 'bg-[#0A0F1D] border-[#1F3158] text-[#8E9EB8]'}`}>
            RECON
          </div>
          <div className={`py-1 rounded border ${attackStage === 'COMPROMISED' ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]' : 'bg-[#0A0F1D] border-[#1F3158] text-[#8E9EB8]'}`}>
            COMPROMISE
          </div>
          <div className={`py-1 rounded border ${attackStage === 'ACTIVE_ATO' ? 'bg-[#FF2E93]/20 border-[#FF2E93] text-[#FF2E93]' : 'bg-[#0A0F1D] border-[#1F3158] text-[#8E9EB8]'}`}>
            ACTIVE ATO
          </div>
          <div className={`py-1 rounded border ${attackStage === 'CRITICAL_BREACH' ? 'bg-[#FF2E93]/30 border-[#FF2E93] text-white font-bold animate-pulse' : 'bg-[#0A0F1D] border-[#1F3158] text-[#8E9EB8]'}`}>
            BREACH
          </div>
        </div>
      </div>

      {/* Tabs: XAI Forensic Breadcrumbs vs. Automated Containment Actions */}
      <div className="flex rounded-lg bg-[#111C33] p-1 border border-[#1F3158] text-xs font-mono">
        <button
          onClick={() => setActiveTab('xai')}
          className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'xai'
              ? 'bg-[#00D2D3] text-[#0A0F1D] shadow-cyan-glow'
              : 'text-[#8E9EB8] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>XAI BREADCRUMBS ({assessment?.xai_breadcrumbs?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'actions'
              ? 'bg-[#FF2E93] text-white shadow-magenta-glow'
              : 'text-[#8E9EB8] hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>ACTIONS ({assessment?.automated_actions?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: XAI Breadcrumbs & Summary Feed */}
      {activeTab === 'xai' && (
        <div className="space-y-3">
          {/* Natural Language Explainability Summary */}
          <div className="p-3 rounded-lg bg-[#111C33] border border-[#1F3158] text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#00D2D3] font-bold mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>XAI FORENSIC EXPLANATION</span>
            </div>
            <p className="text-[#8E9EB8] leading-relaxed text-[11px]">
              {assessment?.explainability_summary ||
                'No telemetry ingested. SentinelX correlation engine is monitoring session traffic in passive standby.'}
            </p>
          </div>

          {/* Forensic Breadcrumbs List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {assessment?.xai_breadcrumbs && assessment.xai_breadcrumbs.length > 0 ? (
              assessment.xai_breadcrumbs.map((crumb, idx) => (
                <div
                  key={crumb.event_id || idx}
                  className="p-2.5 rounded-lg bg-[#0A0F1D] border border-[#1F3158] hover:border-[#00D2D3]/40 transition-all font-mono space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#111C33] border border-[#1F3158] flex items-center justify-center text-[10px] text-[#00D2D3] font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white text-[11px]">
                        {crumb.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#FF2E93] bg-[#FF2E93]/15 px-1.5 py-0.5 rounded border border-[#FF2E93]/30">
                      +{crumb.risk_contribution}%
                    </span>
                  </div>

                  <p className="text-[11px] text-[#8E9EB8] leading-snug">
                    {crumb.causal_link}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1F3158]/50">
                    <span className="flex items-center gap-1 text-[#8E9EB8]">
                      <Clock className="w-2.5 h-2.5" />
                      {crumb.formatted_time}
                    </span>
                    <span className="text-[#00D2D3]">
                      Conf: {(crumb.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs font-mono text-[#8E9EB8] bg-[#0A0F1D] rounded-lg border border-[#1F3158]">
                No forensic breadcrumbs recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Automated Containment Actions Checklist */}
      {activeTab === 'actions' && (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {assessment?.action_details && assessment.action_details.length > 0 ? (
            assessment.action_details.map((action) => (
              <div
                key={action.action_id}
                className="p-2.5 rounded-lg bg-[#0A0F1D] border border-[#1F3158] hover:border-[#FF2E93]/40 transition-all font-mono space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="font-bold text-white text-[11px]">
                      {action.name}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                    {action.status}
                  </span>
                </div>
                <p className="text-[10px] text-[#8E9EB8] leading-tight">
                  {action.description}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs font-mono text-[#8E9EB8] bg-[#0A0F1D] rounded-lg border border-[#1F3158]">
              No containment actions triggered. Defense matrix nominal.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
