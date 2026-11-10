import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, ArrowRight, X, Lock, CheckCircle2 } from 'lucide-react';
import { MonthlySalesClosing } from '../types';
import { checkClosingWindow, formatMonthDisplay } from '../monthlyClosingService';

interface MonthlySalesClosingBannerProps {
  closings: MonthlySalesClosing[];
  onOpenClosingModal: (targetMonth?: string) => void;
  allowForceDisplay?: boolean;
}

export const MonthlySalesClosingBanner: React.FC<MonthlySalesClosingBannerProps> = ({
  closings,
  onOpenClosingModal,
  allowForceDisplay = false
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Check window status
  const windowStatus = checkClosingWindow(new Date(), closings);

  // Key for session dismissal
  const sessionDismissKey = `carryint_closing_banner_dismissed_${windowStatus.currentMonthStr}`;

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(sessionDismissKey);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch (e) {
      // ignore
    }
  }, [sessionDismissKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(sessionDismissKey, 'true');
    } catch (e) {
      // ignore
    }
  };

  // Determine whether to display the banner:
  // 1. Current month is within 3 days of ending and NOT yet closed
  // 2. OR previous month ended and was NOT yet closed
  // 3. OR allowForceDisplay is enabled for testing
  const shouldShow =
    !isDismissed &&
    (windowStatus.isClosingWindowActive || windowStatus.isPrevMonthUnclosed || allowForceDisplay);

  if (!shouldShow) return null;

  const targetMonthStr = windowStatus.isPrevMonthUnclosed && !windowStatus.isClosingWindowActive
    ? windowStatus.prevMonthStr
    : windowStatus.currentMonthStr;

  const targetMonthName = formatMonthDisplay(targetMonthStr);
  const daysLeft = windowStatus.daysRemaining;

  return (
    <div className="relative z-30 no-print overflow-hidden bg-gradient-to-r from-orange-950/95 via-black/90 to-amber-950/95 border-b border-orange-500/50 shadow-[0_8px_25px_rgba(234,88,12,0.25)] text-white animate-in slide-in-from-top duration-300">
      {/* Scrawling Laser Beam Accent */}
      <div className="scrawl-beam-wrapper">
        <div className="scrawl-beam"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Calendar size={16} className="animate-pulse" />
          </div>
          <div className="text-xs">
            <span className="font-black text-white mr-1.5 flex-wrap">
              🔔 Monthly Sales Closing Notice:
            </span>
            <span className="text-zinc-200 font-medium">
              {windowStatus.isClosingWindowActive ? (
                <>
                  <strong className="text-orange-400 font-black">{targetMonthName}</strong> closing window is active ({daysLeft === 0 ? 'Last day of month' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} remaining`}). Finalize monthly sales, revenue, vendor obligations, and profit balance.
                </>
              ) : (
                <>
                  <strong className="text-amber-400 font-black">{targetMonthName}</strong> has completed and is pending monthly sales finalization.
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => onOpenClosingModal(targetMonthStr)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 text-black text-xs font-black shadow-md shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 card-3d"
          >
            <Lock size={13} />
            <span>Close {targetMonthName} Sales Now</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss notice for this session"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
