import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  MessageSquare,
  Smartphone,
  Laptop,
  DollarSign,
  ShieldAlert,
  Fingerprint,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import type { EventType, NodeSeverity, GraphNodeData } from '../types/sentinel';

interface CyberAttackNodeProps {
  data: GraphNodeData;
  isConnectable?: boolean;
}

const getEventIcon = (eventType: EventType, severity: NodeSeverity) => {
  const iconClass = `w-4 h-4 ${
    severity === 'ATO_ATTACK'
      ? 'text-[#FF2E93]'
      : severity === 'ELEVATED'
      ? 'text-[#F59E0B]'
      : 'text-[#00D2D3]'
  }`;

  switch (eventType) {
    case 'PHISHING_SMS_CLICKED':
      return <MessageSquare className={iconClass} />;
    case 'SIM_SWAP_DETECTED':
      return <Smartphone className={iconClass} />;
    case 'NEW_DEVICE_LOGIN':
      return <Laptop className={iconClass} />;
    case 'ABNORMAL_TRANSACTION':
      return <DollarSign className={iconClass} />;
    default:
      return <ShieldAlert className={iconClass} />;
  }
};

export const CyberAttackNode = memo(({ data }: CyberAttackNodeProps) => {
  const {
    event_type,
    label,
    stage,
    severity,
    timestamp,
    risk_contribution,
    confidence_score,
    ip,
    imei,
    details,
    is_critical,
  } = data;

  const isAtoAttack = severity === 'ATO_ATTACK';
  const isElevated = severity === 'ELEVATED';

  // Dynamic Theme Styling
  let borderClass = 'border-[#00D2D3]/40 shadow-cyan-glow';
  let headerBg = 'bg-[#00D2D3]/10';
  let badgeClass = 'bg-[#00D2D3]/20 text-[#00D2D3] border-[#00D2D3]/30';
  let glowColor = '#00D2D3';

  if (isAtoAttack) {
    borderClass = 'border-[#FF2E93] shadow-magenta-glow animate-pulse-glow';
    headerBg = 'bg-[#FF2E93]/20';
    badgeClass = 'bg-[#FF2E93]/20 text-[#FF2E93] border-[#FF2E93]/50';
    glowColor = '#FF2E93';
  } else if (isElevated) {
    borderClass = 'border-[#F59E0B] shadow-amber-glow';
    headerBg = 'bg-[#F59E0B]/15';
    badgeClass = 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40';
    glowColor = '#F59E0B';
  }

  return (
    <div
      className={`w-72 rounded-xl bg-[#111C33] border-2 ${borderClass} text-slate-100 transition-all duration-300 font-sans relative overflow-hidden backdrop-blur-md`}
      style={{
        boxShadow: isAtoAttack
          ? '0 0 25px rgba(255, 46, 147, 0.4), inset 0 0 15px rgba(255, 46, 147, 0.15)'
          : isElevated
          ? '0 0 20px rgba(245, 158, 11, 0.3)'
          : '0 0 15px rgba(0, 210, 211, 0.25)',
      }}
    >
      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-[#111C33] !bg-[#00D2D3] transition-transform hover:scale-125"
        style={{ left: -6 }}
      />

      {/* Top Telemetry Header */}
      <div className={`flex items-center justify-between px-3.5 py-2 border-b border-[#1F3158] ${headerBg}`}>
        <div className="flex items-center gap-2">
          {getEventIcon(event_type, severity)}
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300">
            {stage}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#8E9EB8]">
            {timestamp}
          </span>
          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${badgeClass}`}>
            {severity}
          </span>
        </div>
      </div>

      {/* Node Body Content */}
      <div className="p-3.5 space-y-2.5">
        {/* Event Label & Impact Delta */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold font-mono tracking-tight text-white line-clamp-1">
              {label}
            </h3>
            <p className="text-[11px] text-[#8E9EB8] leading-tight line-clamp-2 mt-0.5">
              {details || 'Ingested anomaly telemetry vector'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className={`inline-block px-2 py-0.5 text-xs font-mono font-black rounded ${
              isAtoAttack
                ? 'bg-[#FF2E93]/20 text-[#FF2E93] border border-[#FF2E93]/40'
                : isElevated
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                : 'bg-[#00D2D3]/20 text-[#00D2D3] border border-[#00D2D3]/40'
            }`}>
              +{risk_contribution}%
            </span>
          </div>
        </div>

        {/* Forensic Metadata Chips */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px]">
          {ip && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#0A0F1D]/80 border border-[#1F3158] text-[#8E9EB8] truncate">
              <Radio className="w-2.5 h-2.5 text-[#00D2D3] shrink-0" />
              <span className="truncate">{ip}</span>
            </div>
          )}
          {imei && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#0A0F1D]/80 border border-[#1F3158] text-[#8E9EB8] truncate">
              <Fingerprint className="w-2.5 h-2.5 text-[#FF2E93] shrink-0" />
              <span className="truncate">{imei.substring(0, 10)}...</span>
            </div>
          )}
        </div>

        {/* Confidence & Correlation Bar */}
        <div className="space-y-1 pt-1 border-t border-[#1F3158]/60">
          <div className="flex justify-between items-center text-[10px] font-mono text-[#8E9EB8]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-[#00D2D3]" />
              XAI Confidence
            </span>
            <span className="text-white font-semibold">
              {(confidence_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#0A0F1D] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${confidence_score * 100}%`,
                backgroundColor: glowColor,
                boxShadow: `0 0 8px ${glowColor}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Critical Indicator Accent Bar */}
      {is_critical && (
        <div className="h-1 w-full bg-gradient-to-r from-[#FF2E93] via-[#00D2D3] to-[#FF2E93] animate-pulse" />
      )}

      {/* Source Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-[#111C33] !bg-[#00D2D3] transition-transform hover:scale-125"
        style={{ right: -6 }}
      />
    </div>
  );
});
