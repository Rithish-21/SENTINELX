import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  X,
  Radio,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CriticalContainmentBannerProps {
  isVisible: boolean;
  riskScore: number;
  onDismiss: () => void;
  onManualOverride: () => void;
}

export const CriticalContainmentBanner: React.FC<CriticalContainmentBannerProps> = ({
  isVisible,
  riskScore,
  onDismiss,
  onManualOverride,
}) => {
  const [secondsActive, setSecondsActive] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isVisible) {
      // Trigger cyber defense particle effect
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.1 },
        colors: ['#FF2E93', '#00D2D3', '#FFFFFF'],
      });

      timer = setInterval(() => {
        setSecondsActive((prev) => prev + 1);
      }, 1000);
    } else {
      setSecondsActive(0);
    }

    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-[#1C0B1B]/95 border-y-2 border-[#FF2E93] shadow-magenta-glow-lg backdrop-blur-xl px-6 py-4 animate-alert-strobe z-40 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Alert Icon & Header */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-[#FF2E93]/20 border border-[#FF2E93] shrink-0 mt-0.5 animate-bounce">
            <AlertOctagon className="w-7 h-7 text-[#FF2E93]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#FF2E93] text-white font-mono text-xs font-black tracking-widest uppercase">
                EMERGENCY DEFENSE DISPATCH
              </span>
              <h2 className="text-base sm:text-lg font-black font-display text-white tracking-wide flex items-center gap-2">
                CRITICAL CONTAINMENT ENGAGED
              </h2>
              <span className="px-2 py-0.5 rounded bg-black/60 border border-[#FF2E93]/40 text-[#FF2E93] font-mono text-xs font-bold">
                RISK: {riskScore.toFixed(1)}%
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 mt-1 font-mono leading-relaxed">
              <strong className="text-[#00D2D3]">AUTOMATED TRANSACTION FREEZE ACTIVE:</strong> Outbound $250,000.00 SWIFT wire transfer intercepted & halted. Identity tokens purged globally.
            </p>
          </div>
        </div>

        {/* Center/Right: Containment Telemetry Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-xs w-full lg:w-auto justify-between lg:justify-end">
          {/* Active Duration Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/50 border border-[#FF2E93]/40 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-[#FF2E93] animate-pulse" />
            <span>CONTAINMENT T+:</span>
            <span className="text-white font-bold">{secondsActive}s</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onManualOverride}
              className="px-3 py-1.5 rounded-md bg-[#FF2E93]/20 hover:bg-[#FF2E93]/40 text-[#FF2E93] border border-[#FF2E93] font-bold transition-all cursor-pointer hover:shadow-magenta-glow"
            >
              MANUAL OVERRIDE
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-md bg-black/40 hover:bg-black/80 text-slate-300 hover:text-white border border-[#1F3158] cursor-pointer"
              title="Acknowledge Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
