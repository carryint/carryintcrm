import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import { 
  TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle, CreditCard, 
  Wallet, X, FileText, ExternalLink, Calendar as CalendarIcon, Download, 
  UserCheck, Users, ArrowUpRight, ArrowDownRight, Sparkles, Layers, 
  Globe, ChevronLeft, ChevronRight, Filter, BarChart3, PieChart, 
  Activity, Search, ShieldAlert, RefreshCw, Compass, Lock, AlertTriangle, CalendarCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, sortInvoicesByNewestCreated } from '../utils';
import { Invoice, Expense, AdjustmentNote, User, Customer, Vendor, MonthlySalesClosing } from '../types';
import { filterInvoicesByCycle, filterExpensesByCycle, filterAdjustmentsByCycle, formatMonthDisplay, checkClosingWindow } from '../monthlyClosingService';

interface DashboardProps {
  invoices: Invoice[];
  expenses: Expense[];
  adjustmentNotes: AdjustmentNote[];
  users?: User[];
  customers?: Customer[];
  vendors?: Vendor[];
  onInvoiceClick: (invoice: Invoice) => void;
  closings?: MonthlySalesClosing[];
  onOpenClosingModal?: (month?: string, editMode?: boolean) => void;
  onNavigate?: (tab: string) => void;
}

// ---------------------------------------------------------
// REALISTIC 3D LUXURY CHRONOMETER & REAL-TIME CLOCK
// ---------------------------------------------------------
const RealTimeClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  
  const displayHours = is24Hour 
    ? String(hours).padStart(2, '0') 
    : String(hours % 12 || 12).padStart(2, '0');
  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Calculate local greeting
  const greeting = hours < 12 ? 'Good Morning' : hours < 17 ? 'Good Afternoon' : 'Good Evening';

  // Chronograph Circular Progress Dial
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const secondProgress = (seconds / 60) * circumference;
  const strokeDashoffset = circumference - secondProgress;

  return (
    <div className="relative overflow-hidden rounded-3xl glass-ultra glass-sheen card-3d p-4 sm:p-5 flex flex-col justify-between group hover:border-white/30 transition-all duration-300 border border-white/14">
      
      {/* Animated Scrawling Laser Light Beam */}
      <div className="scrawl-beam-wrapper">
        <div className="scrawl-beam"></div>
      </div>

      {/* Top Subtle Ambient Glow */}
      <div className="absolute -top-14 -right-14 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

      {/* Header Info */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/30 via-orange-600/20 to-black text-orange-400 border border-orange-500/40 flex items-center justify-center shadow-inner">
            <Compass size={16} className="animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300 block">
              Precision Chronometer
            </span>
            <p className="text-xs font-bold text-orange-400 leading-none">{greeting}</p>
          </div>
        </div>

        {/* Live Synchronized Pill Badge */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIs24Hour(!is24Hour)} 
            className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-black text-zinc-300 hover:text-white transition-all active:scale-95 border border-white/10"
            title="Toggle 12h/24h format"
          >
            {is24Hour ? '24H' : '12H'}
          </button>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Live</span>
          </div>
        </div>
      </div>

      {/* Centerpiece: Real Chronograph Dial & High-Visibility LED Display */}
      <div className="my-2 flex items-center justify-between gap-3 relative z-10">
        
        {/* Circular Chronograph Second Gauge */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 110 110">
            <defs>
              <linearGradient id="chronographOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
              <radialGradient id="dialSpecular" cx="40%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.03)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
              </radialGradient>
            </defs>
            {/* Outer metallic dial track */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
              fill="rgba(5,7,12,0.85)"
            />
            {/* Ambient track glow */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="rgba(234,88,12,0.18)"
              strokeWidth="6"
              fill="none"
            />
            {/* Live Progress Ring */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="url(#chronographOrange)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-300"
              style={{ filter: 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.8))' }}
            />
            {/* Realistic Curved Glass Specular Lens Reflection */}
            <circle
              cx="55"
              cy="55"
              r="40"
              fill="url(#dialSpecular)"
              className="pointer-events-none"
            />
          </svg>

          {/* Center Seconds Reading */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">
              {displaySeconds}
            </span>
            <span className="text-[8px] font-black text-orange-400 tracking-wider uppercase">
              SEC
            </span>
          </div>
        </div>

        {/* Digital Time & Date Readout */}
        <div className="flex-1 text-right">
          <div className="flex items-baseline justify-end gap-1 font-mono text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.25)]">
            <span>{displayHours}</span>
            <span className="animate-pulse text-orange-500 font-sans">:</span>
            <span>{displayMinutes}</span>
            {!is24Hour && (
              <span className="text-xs font-black text-orange-400 ml-1.5 px-1.5 py-0.5 rounded bg-orange-500/15 border border-orange-500/30">
                {ampm}
              </span>
            )}
          </div>
          
          <p className="text-xs font-extrabold text-zinc-200 mt-1 flex items-center justify-end gap-1.5">
            <CalendarIcon size={13} className="text-orange-400" />
            {dateString}
          </p>
        </div>

      </div>

      {/* Footer Info Strip */}
      <div className="mt-2 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-zinc-300 relative z-10">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
          UAE GST • Dubai (UTC+4)
        </span>
        <span className="text-orange-400 font-extrabold uppercase tracking-wider text-[10px] bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/25">
          Atomic Sync
        </span>
      </div>

    </div>
  );
};

// ---------------------------------------------------------
// REALISTIC 3D EXECUTIVE ACRYLIC DESK CALENDAR
// ---------------------------------------------------------
interface DashboardCalendarProps {
  invoices: Invoice[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ invoices, selectedDate, onSelectDate }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Group invoices by date string (YYYY-MM-DD)
  const activityMap = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    invoices.forEach(inv => {
      if (!inv.date) return;
      const dateKey = inv.date.slice(0, 10);
      const existing = map.get(dateKey) || { count: 0, total: 0 };
      map.set(dateKey, {
        count: existing.count + 1,
        total: existing.total + (inv.totalAmount || 0),
      });
    });
    return map;
  }, [invoices]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    const getLocalDateStr = (d: Date = new Date()) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const todayStr = getLocalDateStr(today);
    onSelectDate(todayStr);
  };

  const monthLabel = currentMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const getLocalDateStr = (d: Date = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const todayStr = getLocalDateStr(new Date());

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      day: d,
      dateStr: dStr,
      isToday: dStr === todayStr,
      isSelected: selectedDate === dStr,
      activity: activityMap.get(dStr) || null,
    });
  }

  return (
    <div className="relative overflow-hidden rounded-3xl glass-ultra glass-sheen card-3d p-4 sm:p-5 transition-all duration-300">
      
      {/* Animated Scrawling Laser Light Beam */}
      <div className="scrawl-beam-wrapper">
        <div className="scrawl-beam"></div>
      </div>

      {/* Realistic Executive Binder Fastener Loops at Top */}
      <div className="flex justify-center gap-12 -mt-3 mb-2.5 relative z-10 pointer-events-none">
        <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-700 border border-white/40 shadow-[0_4px_8px_rgba(0,0,0,0.7)] flex flex-col justify-between py-1 items-center">
          <div className="w-1 h-1 rounded-full bg-black/60"></div>
          <div className="w-1 h-1 rounded-full bg-black/60"></div>
        </div>
        <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-700 border border-white/40 shadow-[0_4px_8px_rgba(0,0,0,0.7)] flex flex-col justify-between py-1 items-center">
          <div className="w-1 h-1 rounded-full bg-black/60"></div>
          <div className="w-1 h-1 rounded-full bg-black/60"></div>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-orange-500/30 to-black text-orange-400 border border-orange-500/40 shadow-inner">
            <CalendarIcon size={16} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white capitalize tracking-tight flex items-center gap-1.5 drop-shadow-[0_1px_6px_rgba(255,255,255,0.2)]">
              {monthLabel}
            </h4>
            <span className="text-[10px] font-bold text-orange-400">Logistics & Consignment Desk</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-[10px] font-black rounded-xl bg-gradient-to-r from-orange-600 to-amber-300 text-black shadow-md hover:brightness-110 transition-all active:scale-95"
            title="Jump to Today"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95 border border-white/5"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95 border border-white/5"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          {/* Mobile Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="sm:hidden p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all ml-1"
            title={isCollapsed ? 'Expand Calendar' : 'Collapse Calendar'}
          >
            <Layers size={14} />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className={`${isCollapsed ? 'hidden sm:block' : 'block'} relative z-10`}>
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dw, idx) => (
            <span key={idx} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest py-0.5">
              {dw}
            </span>
          ))}
        </div>

        {/* 3D Acrylic Day Tiles */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="h-8 sm:h-9" />;
            }

            const { day, dateStr, isToday, isSelected, activity } = cell;
            const hasActivity = activity && activity.count > 0;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (isSelected) {
                    onSelectDate(null);
                  } else {
                    onSelectDate(dateStr);
                  }
                }}
                className={`h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 card-3d active:scale-90 group/cell ${
                  isSelected
                    ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-amber-200 text-black font-black shadow-[0_6px_25px_rgba(234,88,12,0.6)] ring-2 ring-white z-20'
                    : isToday
                    ? 'bg-gradient-to-br from-orange-500/30 to-amber-500/10 text-orange-300 font-black border-2 border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                    : hasActivity
                    ? 'bg-black/60 hover:bg-zinc-800 text-white font-bold border border-orange-500/30 shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
                    : 'glass-pill text-zinc-300 font-medium'
                }`}
                title={
                  hasActivity 
                    ? `${dateStr}: ${activity.count} shipments, Total ${formatCurrency(activity.total)}` 
                    : dateStr
                }
              >
                <span className="text-xs leading-none drop-shadow-sm">{day}</span>
                
                {/* Luminous Pulsing Heat Beacons for shipments */}
                {hasActivity && !isSelected && (
                  <span className="flex items-center gap-0.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,1)] animate-pulse"></span>
                    {activity.count > 1 && (
                      <span className="text-[8px] font-black text-amber-300 leading-none">
                        {activity.count}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3D Floating Day Inspection Popover Card */}
        {selectedDate && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-orange-950/90 via-black to-zinc-950 border border-orange-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-1 card-3d">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)] animate-ping"></span>
              <span className="text-zinc-200 font-medium">
                Active Date: <strong className="text-white font-black">{selectedDate}</strong>
                {activityMap.has(selectedDate) ? (
                  <span className="text-orange-400 font-bold ml-1.5">
                    ({activityMap.get(selectedDate)!.count} consignments • {formatCurrency(activityMap.get(selectedDate)!.total)})
                  </span>
                ) : (
                  <span className="text-zinc-400 font-normal ml-1.5">(No shipments on this date)</span>
                )}
              </span>
            </div>
            <button
              onClick={() => onSelectDate(null)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-black transition-all active:scale-95 flex items-center gap-1 border border-white/10"
            >
              <X size={11} /> Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// 3D GLASS STAT CARD WITH SCRAWL BEAM
// ---------------------------------------------------------
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  isHero?: boolean;
  onClick?: () => void;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, isHero = false, onClick, subtitle }) => {
  const isClickable = !!onClick;
  const CardWrapper = isClickable ? 'button' : 'div';

  if (isHero) {
    return (
      <div className="relative overflow-hidden rounded-3xl glass-ultra glass-sheen border border-white/18 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(249,115,22,0.12)] card-3d group hover:border-white/30 transition-all duration-300 text-left">
        
        {/* Scrawling Laser Light Beam */}
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        {/* Ambient Subtle Accent Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-orange-500/18 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="p-2.5 rounded-xl bg-white/[0.06] text-orange-400 border border-white/12 shadow-inner">
            {icon}
          </div>
          {/* Vibrant Orange & Golden Pill Badge */}
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 text-black shadow-md shadow-orange-500/30 tracking-tight">
            {trend}
          </span>
        </div>

        <div className="relative z-10">
          <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight truncate drop-shadow-sm" title={value}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-zinc-400 font-medium mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <CardWrapper
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl glass-ultra glass-sheen p-5 text-left card-3d transition-all duration-300 border border-white/14 ${
        isClickable
          ? 'hover:border-white/30 hover:shadow-[0_25px_50px_-10px_rgba(0,0,0,0.85),0_0_20px_rgba(249,115,22,0.15)] active:scale-95 group cursor-pointer'
          : 'hover:border-white/22'
      }`}
    >
      {/* Scrawling Laser Light Beam */}
      <div className="scrawl-beam-wrapper">
        <div className="scrawl-beam"></div>
      </div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-300 group-hover:text-orange-400 group-hover:bg-orange-500/15 group-hover:border-orange-500/40 transition-colors shadow-inner">
          {icon}
        </div>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-200 border border-white/15 tracking-wide">
          {trend}
        </span>
      </div>

      <div className="relative z-10">
        <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline justify-between mt-1">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate drop-shadow-sm" title={value}>
            {value}
          </h3>
          {isClickable && (
            <ArrowUpRight size={17} className="text-zinc-400 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all ml-1 shrink-0" />
          )}
        </div>
        {subtitle && (
          <p className="text-[10px] text-zinc-400 font-medium mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </CardWrapper>
  );
};

// ---------------------------------------------------------
// 3D RATIO INDICATOR
// ---------------------------------------------------------
const RatioIndicator = ({ label, value, colorGradient, tooltip }: { label: string; value: number; colorGradient: string; tooltip: string }) => {
  const displayVal = isNaN(value) || !isFinite(value) ? 0 : value;
  return (
    <div className="space-y-1.5 group relative">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-zinc-200 flex items-center gap-1">
          {label}
        </span>
        <span className="text-white font-black">{displayVal.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-black/80 border border-white/10 h-2 rounded-full overflow-hidden p-0.5 shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-700 shadow-md ${colorGradient}`} 
          style={{ width: `${Math.min(Math.max(displayVal, 0), 100)}%` }}
        ></div>
      </div>
      <p className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 leading-normal">
        {tooltip}
      </p>
    </div>
  );
};

// ---------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ---------------------------------------------------------
const Dashboard: React.FC<DashboardProps> = ({ 
  invoices = [], 
  expenses = [], 
  adjustmentNotes = [], 
  users = [], 
  customers = [],
  vendors = [],
  onInvoiceClick,
  closings = [],
  onOpenClosingModal,
  onNavigate
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalSearch, setModalSearch] = useState<string>('');
  
  // Date Filters
  const [dateFilter, setDateFilter] = useState<'thisMonth' | 'all' | '7days' | '30days' | '60days' | '90days' | 'custom'>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedCreatorFilter, setSelectedCreatorFilter] = useState<string>('all');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Advanced Analytics Active View Tab
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'overview' | 'aging' | 'lanes' | 'customers'>('overview');

  // Sales Cycle Selection ('active' = new sales report only; or specific closed month e.g. '2026-11'; or 'all')
  const finalizedClosings = useMemo(() => {
    return closings.filter(c => c.isClosed).sort((a, b) => b.month.localeCompare(a.month));
  }, [closings]);

  const latestClosedMonth = finalizedClosings[0] || null;
  const [selectedCycle, setSelectedCycle] = useState<string>('active');

  // Filter items by Sales Cycle (enforces roll-forward of sales entered after cutoff date)
  const cycleInvoices = useMemo(() => {
    return filterInvoicesByCycle(invoices, selectedCycle, closings);
  }, [invoices, selectedCycle, closings]);

  const cycleExpenses = useMemo(() => {
    return filterExpensesByCycle(expenses, selectedCycle, closings);
  }, [expenses, selectedCycle, closings]);

  const cycleAdjustments = useMemo(() => {
    return filterAdjustmentsByCycle(adjustmentNotes, selectedCycle, closings);
  }, [adjustmentNotes, selectedCycle, closings]);

  // Filter Invoices (applied on cycle-filtered invoices)
  const filteredInvoices = useMemo(() => {
    return cycleInvoices.filter(inv => {
      // 1. Creator filter
      if (selectedCreatorFilter !== 'all') {
        const matchCreator = inv.createdBy === selectedCreatorFilter || 
          inv.createdByName?.toLowerCase() === selectedCreatorFilter.toLowerCase();
        if (!matchCreator) return false;
      }

      // 2. Specific calendar day filter
      if (selectedCalendarDate) {
        const invDateKey = inv.date?.slice(0, 10);
        if (invDateKey !== selectedCalendarDate) return false;
        return true;
      }

      // 3. Period filter
      if (dateFilter === 'all') return true;

      if (dateFilter === 'thisMonth') {
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (typeof inv.date === 'string' && inv.date.slice(0, 7) === currentMonthPrefix) return true;
        const itemDate = new Date(inv.date);
        return !isNaN(itemDate.getTime()) && itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      }

      const itemDate = new Date(inv.date);
      itemDate.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (dateFilter === '7days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 7);
        return itemDate >= limit;
      }
      if (dateFilter === '30days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 30);
        return itemDate >= limit;
      }
      if (dateFilter === '60days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 60);
        return itemDate >= limit;
      }
      if (dateFilter === '90days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 90);
        return itemDate >= limit;
      }
      if (dateFilter === 'custom') {
        if (customStartDate && itemDate < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
        return true;
      }
      return true;
    });
  }, [cycleInvoices, selectedCreatorFilter, selectedCalendarDate, dateFilter, customStartDate, customEndDate]);

  // Filter Expenses
  const filteredExpenses = useMemo(() => {
    return cycleExpenses.filter(exp => {
      if (selectedCreatorFilter !== 'all') {
        const matchCreator = exp.createdBy === selectedCreatorFilter ||
          exp.createdByName?.toLowerCase() === selectedCreatorFilter.toLowerCase();
        if (!matchCreator) return false;
      }

      if (selectedCalendarDate) {
        const expDateKey = exp.date?.slice(0, 10);
        if (expDateKey !== selectedCalendarDate) return false;
        return true;
      }

      if (dateFilter === 'all') return true;

      if (dateFilter === 'thisMonth') {
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (typeof exp.date === 'string' && exp.date.slice(0, 7) === currentMonthPrefix) return true;
        const itemDate = new Date(exp.date);
        return !isNaN(itemDate.getTime()) && itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      }

      const itemDate = new Date(exp.date);
      itemDate.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (dateFilter === '7days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 7);
        return itemDate >= limit;
      }
      if (dateFilter === '30days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 30);
        return itemDate >= limit;
      }
      if (dateFilter === '60days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 60);
        return itemDate >= limit;
      }
      if (dateFilter === '90days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 90);
        return itemDate >= limit;
      }
      if (dateFilter === 'custom') {
        if (customStartDate && itemDate < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
        return true;
      }
      return true;
    });
  }, [cycleExpenses, selectedCreatorFilter, selectedCalendarDate, dateFilter, customStartDate, customEndDate]);

  // Filter Adjustments
  const filteredAdjustments = useMemo(() => {
    return cycleAdjustments.filter(adj => {
      if (selectedCalendarDate) {
        const adjDateKey = adj.date?.slice(0, 10);
        if (adjDateKey !== selectedCalendarDate) return false;
        return true;
      }

      if (dateFilter === 'all') return true;

      if (dateFilter === 'thisMonth') {
        const now = new Date();
        const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const rawDate = adj.date || (adj as any).timestamp;
        if (typeof rawDate === 'string' && rawDate.slice(0, 7) === currentMonthPrefix) return true;
        const itemDate = new Date(rawDate);
        return !isNaN(itemDate.getTime()) && itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      }

      const itemDate = new Date(adj.date);
      itemDate.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (dateFilter === '7days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 7);
        return itemDate >= limit;
      }
      if (dateFilter === '30days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 30);
        return itemDate >= limit;
      }
      if (dateFilter === '60days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 60);
        return itemDate >= limit;
      }
      if (dateFilter === '90days') {
        const limit = new Date(now);
        limit.setDate(limit.getDate() - 90);
        return itemDate >= limit;
      }
      if (dateFilter === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (itemDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }
        return true;
      }
      return true;
    });
  }, [cycleAdjustments, selectedCalendarDate, dateFilter, customStartDate, customEndDate]);

  // Financial Computations
  const debitAdjustments = filteredAdjustments.filter(n => n.type === 'DEBIT').reduce((sum, n) => sum + n.amount, 0);
  const creditAdjustments = filteredAdjustments.filter(n => n.type === 'CREDIT').reduce((sum, n) => sum + n.amount, 0);
  const netAdjustments = debitAdjustments - creditAdjustments;

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) + netAdjustments;
  const grossProfit = filteredInvoices.reduce((sum, inv) => sum + inv.profit, 0) + netAdjustments;
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const receivedAmount = filteredInvoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const outstandingReceivables = filteredInvoices
    .filter(inv => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
    + filteredAdjustments.filter(n => n.type === 'DEBIT').reduce((sum, n) => sum + n.amount, 0)
    - filteredAdjustments.filter(n => n.type === 'CREDIT' && n.creditAction !== 'REFUND').reduce((sum, n) => sum + n.amount, 0);

  const paidAmount = filteredInvoices
    .reduce((sum, inv) => sum + (inv.vendorStatus === 'PAID' ? (inv.vendorCost || 0) : (inv.vendorStatus === 'PARTIAL' ? (inv.vendorPaidAmount || 0) : 0)), 0);

  const outstandingPayables = filteredInvoices
    .reduce((sum, inv) => sum + (inv.vendorStatus === 'PAID' ? 0 : (inv.vendorStatus === 'PARTIAL' ? Math.max(0, (inv.vendorCost || 0) - (inv.vendorPaidAmount || 0)) : (inv.vendorCost || 0))), 0);

  const paidAgentCommission = filteredInvoices
    .filter(inv => inv.agentStatus === 'PAID')
    .reduce((sum, inv) => sum + (inv.agentCommission || 0), 0);

  const unpaidAgentCommission = filteredInvoices
    .filter(inv => inv.agentStatus !== 'PAID')
    .reduce((sum, inv) => sum + (inv.agentCommission || 0), 0);

  // Financial ratios calculation
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
  const cashCollectionRate = totalRevenue > 0 ? (receivedAmount / totalRevenue) * 100 : 0;
  const payableMarginBurden = grossProfit > 0 ? (outstandingPayables / grossProfit) * 100 : 0;

  // Operational Velocity Metrics
  const totalShipmentsCount = filteredInvoices.length;
  const paidShipmentsCount = filteredInvoices.filter(i => i.status === 'PAID').length;
  const averageOrderValue = totalShipmentsCount > 0 ? totalRevenue / totalShipmentsCount : 0;
  const averageProfitPerShipment = totalShipmentsCount > 0 ? grossProfit / totalShipmentsCount : 0;
  const clearanceRate = totalShipmentsCount > 0 ? (paidShipmentsCount / totalShipmentsCount) * 100 : 0;

  // Aging Analysis for Receivables (A/R)
  const arAging = useMemo(() => {
    const buckets = {
      current: { amount: 0, count: 0 },
      bucket30: { amount: 0, count: 0 },
      bucket60: { amount: 0, count: 0 },
      bucket90Plus: { amount: 0, count: 0 }
    };
    const now = new Date().getTime();

    filteredInvoices.filter(i => i.status !== 'PAID').forEach(inv => {
      const invTime = new Date(inv.date).getTime();
      const diffDays = Math.max(0, Math.floor((now - invTime) / (1000 * 60 * 60 * 24)));
      const amt = inv.totalAmount || 0;

      if (diffDays <= 30) {
        buckets.current.amount += amt;
        buckets.current.count += 1;
      } else if (diffDays <= 60) {
        buckets.bucket30.amount += amt;
        buckets.bucket30.count += 1;
      } else if (diffDays <= 90) {
        buckets.bucket60.amount += amt;
        buckets.bucket60.count += 1;
      } else {
        buckets.bucket90Plus.amount += amt;
        buckets.bucket90Plus.count += 1;
      }
    });

    return buckets;
  }, [filteredInvoices]);

  // Trade Lanes Analysis
  const topDestinations = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number; profit: number }>();
    filteredInvoices.forEach(inv => {
      const dest = inv.destinationCountry?.trim() || 'Unknown';
      const existing = map.get(dest) || { count: 0, revenue: 0, profit: 0 };
      map.set(dest, {
        count: existing.count + 1,
        revenue: existing.revenue + (inv.totalAmount || 0),
        profit: existing.profit + (inv.profit || 0),
      });
    });

    return Array.from(map.entries())
      .map(([country, stats]) => ({ country, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredInvoices]);

  // Top Customers Leaderboard
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; shipments: number; revenue: number; paid: number; pending: number }>();
    filteredInvoices.forEach(inv => {
      const key = inv.customerId || inv.customerName || 'Unknown';
      const name = inv.customerName || 'Unknown';
      const existing = map.get(key) || { name, shipments: 0, revenue: 0, paid: 0, pending: 0 };
      const amt = inv.totalAmount || 0;
      const isPaid = inv.status === 'PAID';

      map.set(key, {
        name,
        shipments: existing.shipments + 1,
        revenue: existing.revenue + amt,
        paid: existing.paid + (isPaid ? amt : 0),
        pending: existing.pending + (!isPaid ? amt : 0),
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredInvoices]);

  // Dynamic monthly aggregation for last 6 calendar months (historical trend)
  const getChartData = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      months.push({
        label: `${monthLabel} ${d.getFullYear().toString().substring(2)}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0,
        profit: 0,
        expenses: 0
      });
    }

    const chartInvoices = selectedCreatorFilter === 'all'
      ? invoices
      : invoices.filter(inv => inv.createdBy === selectedCreatorFilter || inv.createdByName?.toLowerCase() === selectedCreatorFilter.toLowerCase());

    const chartAdjustments = adjustmentNotes;

    const chartExpenses = selectedCreatorFilter === 'all'
      ? expenses
      : expenses.filter(exp => exp.createdBy === selectedCreatorFilter || exp.createdByName?.toLowerCase() === selectedCreatorFilter.toLowerCase());

    chartInvoices.forEach(inv => {
      const invDate = new Date(inv.date);
      const y = invDate.getFullYear();
      const m = invDate.getMonth();
      const target = months.find(item => item.year === y && item.month === m);
      if (target) {
        target.revenue += inv.totalAmount;
        target.profit += inv.profit;
      }
    });

    chartAdjustments.forEach(adj => {
      const adjDate = new Date(adj.date);
      const y = adjDate.getFullYear();
      const m = adjDate.getMonth();
      const target = months.find(item => item.year === y && item.month === m);
      if (target) {
        if (adj.type === 'DEBIT') {
          target.revenue += adj.amount;
          target.profit += adj.amount;
        } else if (adj.type === 'CREDIT') {
          target.revenue -= adj.amount;
          target.profit -= adj.amount;
        }
      }
    });

    chartExpenses.forEach(exp => {
      const expDate = new Date(exp.date);
      const y = expDate.getFullYear();
      const m = expDate.getMonth();
      const target = months.find(item => item.year === y && item.month === m);
      if (target) {
        target.expenses += exp.amount;
      }
    });

    return months.map(m => ({
      name: m.label,
      revenue: Math.round(m.revenue),
      expenses: Math.round(m.expenses),
      netProfit: Math.round(m.profit - m.expenses)
    }));
  };

  const chartData = getChartData();
  const recentShipments = sortInvoicesByNewestCreated(filteredInvoices).slice(0, 6);

  const handleCardClick = (filter: string) => {
    setSelectedFilter(filter);
    setModalSearch('');
    setShowModal(true);
  };

  const getFilteredItems = () => {
    switch (selectedFilter) {
      case 'Total Revenue': return { type: 'invoice', items: filteredInvoices };
      case 'Received Amount': return { type: 'invoice', items: filteredInvoices.filter(inv => inv.status === 'PAID') };
      case 'Outstanding Receivables': return { type: 'invoice', items: filteredInvoices.filter(inv => inv.status !== 'PAID') };
      case 'Company Expenses': return { type: 'expense', items: filteredExpenses };
      case 'Paid Amount (Vendors)': return { type: 'invoice', items: filteredInvoices.filter(inv => inv.vendorId && inv.vendorStatus === 'PAID') };
      case 'Outstanding Payables': return { type: 'invoice', items: filteredInvoices.filter(inv => inv.vendorId && inv.vendorStatus !== 'PAID') };
      case 'Paid Broker Comm.': return { type: 'invoice', items: filteredInvoices.filter(inv => (inv.agentCommission || 0) > 0 && inv.agentStatus === 'PAID') };
      case 'Unpaid Broker Comm.': return { type: 'invoice', items: filteredInvoices.filter(inv => (inv.agentCommission || 0) > 0 && inv.agentStatus !== 'PAID') };
      default: return { type: 'invoice', items: [] };
    }
  };

  const filteredResults = getFilteredItems();

  const searchedModalItems = useMemo(() => {
    if (!modalSearch.trim()) return filteredResults.items;
    const q = modalSearch.toLowerCase();
    if (filteredResults.type === 'invoice') {
      return (filteredResults.items as Invoice[]).filter(inv => 
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.destinationCountry?.toLowerCase().includes(q) ||
        inv.createdByName?.toLowerCase().includes(q)
      );
    } else {
      return (filteredResults.items as Expense[]).filter(exp =>
        exp.itemDetails?.toLowerCase().includes(q) ||
        exp.payeeName?.toLowerCase().includes(q) ||
        exp.paymentMethod?.toLowerCase().includes(q)
      );
    }
  }, [filteredResults, modalSearch]);

  // PDF Export Snapshot
  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("CARRY INTERNATIONAL LOGISTICS", 15, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(249, 115, 22); // orange-500
    doc.text("Glassy 3D Dashboard Financial Snapshot Report", 15, 26);
    
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const filterText = selectedCalendarDate 
      ? `Exact Date: ${selectedCalendarDate}`
      : dateFilter === 'thisMonth' ? 'This Month (Current Month)' :
      dateFilter === 'all' ? 'All Time' :
      dateFilter === '7days' ? 'Last 7 Days' :
      dateFilter === '30days' ? 'Last 30 Days' :
      dateFilter === '60days' ? 'Last 60 Days' :
      dateFilter === '90days' ? 'Last 90 Days' :
      `Custom: ${customStartDate || 'N/A'} to ${customEndDate || 'N/A'}`;
    doc.text(`Generated: ${new Date().toLocaleString()} | Period: ${filterText}`, 15, 34);
    
    // Section 1: Executive Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("1. Executive Summary", 15, 52);
    
    const kpiHeaders = [['KPI Metric', 'Value', 'Details / Margin']];
    const kpiRows = [
      ['Net Profit', formatCurrency(netProfit), `Net Margin: ${netMargin.toFixed(1)}%`],
      ['Total Revenue', formatCurrency(totalRevenue), 'Total Cargo Sales'],
      ['Gross Profit', formatCurrency(grossProfit), `Gross Margin: ${grossMargin.toFixed(1)}%`],
      ['Company Expenses', formatCurrency(totalExpenses), `Expense Ratio: ${expenseRatio.toFixed(1)}%`]
    ];
    
    autoTable(doc, {
      startY: 56,
      head: kpiHeaders,
      body: kpiRows,
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 10 },
      margin: { left: 15, right: 15 }
    });
    
    // Section 2: Cash Flow & Payables Breakdown
    let currentY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Cash Flow & Ledger Breakdown", 15, currentY);
    
    const flowHeaders = [['Ledger Category', 'Amount', 'Status / Rate']];
    const flowRows = [
      ['Received Amount (Inflow)', formatCurrency(receivedAmount), `${cashCollectionRate.toFixed(1)}% Collection Rate`],
      ['Outstanding Receivables (A/R)', formatCurrency(outstandingReceivables), 'Pending Customer Payments'],
      ['Paid to Vendors (Outflow)', formatCurrency(paidAmount), 'Settled Cargo Cost'],
      ['Outstanding Payables (A/P)', formatCurrency(outstandingPayables), 'Pending Vendor Invoices'],
      ['Paid Broker Commissions', formatCurrency(paidAgentCommission), 'Settled Agent Fees'],
      ['Unpaid Broker Commissions', formatCurrency(unpaidAgentCommission), 'Pending Agent Fees']
    ];
    
    autoTable(doc, {
      startY: currentY + 4,
      head: flowHeaders,
      body: flowRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 10 },
      margin: { left: 15, right: 15 }
    });
    
    // Section 3: Financial Health Indicators
    currentY = (doc as any).lastAutoTable.finalY + 12;
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("3. Financial Ratios & Health Indicators", 15, currentY);
    
    const ratioHeaders = [['Ratio Name', 'Percentage', 'Operational Meaning']];
    const ratioRows = [
      ['Gross Profit Margin', `${grossMargin.toFixed(1)}%`, 'Sales profitability before operating overhead'],
      ['Net Profit Margin', `${netMargin.toFixed(1)}%`, 'Bottom-line efficiency: actual profit retained'],
      ['Cash Conversion Rate', `${cashCollectionRate.toFixed(1)}%`, 'Billed revenue converted to physical cash'],
      ['Operating Expense Ratio', `${expenseRatio.toFixed(1)}%`, 'Overhead cost relative to total revenue'],
      ['Payable Margin Burden', `${payableMarginBurden.toFixed(1)}%`, 'Vendor liabilities relative to gross profit']
    ];
    
    autoTable(doc, {
      startY: currentY + 4,
      head: ratioHeaders,
      body: ratioRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 10 },
      margin: { left: 15, right: 15 }
    });
    
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`CarryInt_Dashboard_Report_Snapshot_${dateStr}.pdf`);
  };

  return (
    <div className="relative -m-3 sm:-m-4 lg:-m-6 p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-3.5rem)] bg-transparent text-white overflow-hidden space-y-5">
      
      {/* Clean Ambient Space - Background lights are managed globally */}


      {/* TOP ROW: REALISTIC CHRONOMETER CLOCK, 3D CALENDAR & VELOCITY SNAPSHOT */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Real-time Luxury Chronometer Clock (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <RealTimeClock />
          
          {/* Quick Metrics Bar below Clock */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl glass-ultra card-3d flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">Active Consignments</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white">{totalShipmentsCount}</span>
                <span className="text-[9px] font-black text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded-full border border-orange-500/30">Active</span>
              </div>
            </div>
            
            <div className="p-3.5 rounded-2xl glass-ultra card-3d flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">Clearance Velocity</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-400">{clearanceRate.toFixed(0)}%</span>
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">Settled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Realistic 3D Executive Calendar (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <DashboardCalendar
            invoices={invoices}
            selectedDate={selectedCalendarDate}
            onSelectDate={setSelectedCalendarDate}
          />
        </div>

        {/* 3D Operations & Velocity Snapshot (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col justify-between rounded-3xl glass-ultra glass-sheen card-3d p-4 sm:p-5 border border-white/14">
          <div className="scrawl-beam-wrapper">
            <div className="scrawl-beam"></div>
          </div>

          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-orange-400" /> Velocity Matrix
              </span>
              <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-200 text-black shadow-md">
                3D Live
              </span>
            </div>

            <div className="space-y-3.5 mt-3">
              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-300">Avg Invoice (AOV)</span>
                  <span className="text-white font-extrabold">{formatCurrency(averageOrderValue)}</span>
                </div>
                <div className="w-full bg-black/80 h-2 rounded-full mt-1.5 overflow-hidden border border-white/10 shadow-inner">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-300 h-full rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-300">Avg Margin / Job</span>
                  <span className="text-emerald-400 font-extrabold">{formatCurrency(averageProfitPerShipment)}</span>
                </div>
                <div className="w-full bg-black/80 h-2 rounded-full mt-1.5 overflow-hidden border border-white/10 shadow-inner">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-300">Cash Flow Velocity</span>
                  <span className="text-orange-400 font-extrabold">{cashCollectionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-black/80 h-2 rounded-full mt-1.5 overflow-hidden border border-white/10 shadow-inner">
                  <div className="bg-gradient-to-r from-orange-600 via-orange-400 to-amber-200 h-full rounded-full" style={{ width: `${Math.min(cashCollectionRate, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 font-medium">Overhead Ratio</span>
            <span className="text-zinc-200 font-black">{expenseRatio.toFixed(1)}%</span>
          </div>
        </div>

      </div>

      {/* 3D SALES CYCLE & MONTHLY CLOSING STATUS BAR */}
      <div className="relative z-10 glass-ultra p-3 sm:p-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col md:flex-row gap-3 items-center justify-between card-3d no-print border border-white/14">
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto relative z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 border border-white/10 card-3d">
            <Lock size={13} className="text-orange-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">Sales Cycle:</span>
            <select
              value={selectedCycle}
              onChange={(e) => {
                const newCycle = e.target.value;
                setSelectedCycle(newCycle);
                if (newCycle !== 'active') {
                  setDateFilter('all');
                }
              }}
              className="bg-transparent text-xs font-black text-orange-400 outline-none cursor-pointer"
            >
              <option value="active" className="bg-zinc-950 text-white">
                ⚡ Active Cycle ({latestClosedMonth ? `Showing New Sales after ${latestClosedMonth.cutoffDate}` : 'Open Month'})
              </option>
              {finalizedClosings.map(c => (
                <option key={c.id} value={c.month} className="bg-zinc-950 text-white">
                  🔒 {c.monthName} (Finalized: {c.cutoffDate} • AED {c.closingBalance.toLocaleString()})
                </option>
              ))}
              <option value="all" className="bg-zinc-950 text-white">
                🌐 All Invoices (All Time Combined)
              </option>
            </select>
          </div>

          {selectedCycle === 'active' && latestClosedMonth && (
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-zinc-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                <strong>{latestClosedMonth.monthName}</strong> finalized as of {latestClosedMonth.cutoffDate}. Dashboard is displaying <strong>new sales and profit reports only</strong>.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end relative z-10 flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('monthly-closing')}
              className="px-3.5 py-1.5 rounded-xl glass-pill hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-bold border border-white/15 flex items-center gap-1.5 transition-all shadow-md cursor-pointer touch-manipulation hover:brightness-110"
            >
              <BarChart3 size={13} className="text-orange-400" />
              <span>Closing Analytics Dashboard</span>
            </button>
          )}

          {onOpenClosingModal && (
            <button
              onClick={() => onOpenClosingModal()}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 text-black text-xs font-black shadow-md shadow-orange-500/30 flex items-center gap-1.5 transition-all hover:brightness-110 cursor-pointer touch-manipulation"
            >
              <CalendarCheck size={13} />
              <span>Monthly Sales Closing</span>
              {finalizedClosings.length > 0 && (
                <span className="ml-1 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-black/30 text-white">
                  {finalizedClosings.length} Closed
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 3D FILTER & EXPORT BAR */}
      <div className="relative z-10 glass-ultra p-3 sm:p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row gap-3 items-center justify-between card-3d no-print border border-white/14">
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        {/* Period Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto relative z-10">
          <span className="text-[11px] font-black text-zinc-300 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter size={13} className="text-orange-400" /> Range:
          </span>
          {['thisMonth', 'all', '7days', '30days', '60days', '90days', 'custom'].map((f) => {
            const isActive = dateFilter === f && !selectedCalendarDate;
            const labels: Record<string, string> = {
              thisMonth: 'This Month',
              all: 'All Time',
              '7days': '7 Days',
              '30days': '30 Days',
              '60days': '60 Days',
              '90days': '90 Days',
              custom: 'Custom'
            };
            return (
              <button
                key={f}
                onClick={() => { setDateFilter(f as any); setSelectedCalendarDate(null); }}
                className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition-all duration-200 card-3d active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-200 text-black shadow-lg shadow-orange-500/35 border border-white/20'
                    : 'glass-pill text-zinc-300 hover:text-white'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Creator filter & PDF Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end relative z-10">
          {users.length > 0 && (
            <div className="flex items-center gap-1.5 bg-black/70 border border-white/10 px-3 py-1.5 rounded-xl card-3d">
              <Users size={13} className="text-orange-400" />
              <select
                value={selectedCreatorFilter}
                onChange={(e) => setSelectedCreatorFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-950 text-white">All Staff & Invoices</option>
                {users.map(u => (
                  <option key={u.id} value={u.name} className="bg-zinc-950 text-white">
                    👤 {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-white/15 bg-black/80 text-xs font-bold text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-zinc-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-white/15 bg-black/80 text-xs font-bold text-white rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-200 text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-orange-600/35 hover:brightness-110 active:scale-95 transition-all card-3d"
            title="Download PDF Financial Snapshot"
          >
            <Download size={13} />
            Export PDF Snapshot
          </button>
        </div>
      </div>

      {/* PRIMARY 3D KPI ROW */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard 
          title="Net Profit" 
          value={formatCurrency(netProfit)} 
          icon={<TrendingUp size={20} />} 
          trend={`Net Margin: ${netMargin.toFixed(1)}%`}
          isHero={true}
          subtitle={`Gross Profit minus ${formatCurrency(totalExpenses)} Overhead`}
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={<DollarSign size={20} />} 
          trend="Total Billed" 
          onClick={() => handleCardClick('Total Revenue')}
          subtitle={`${filteredInvoices.length} active invoices`}
        />
        <StatCard 
          title="Gross Profit" 
          value={formatCurrency(grossProfit)} 
          icon={<TrendingUp size={20} />} 
          trend={`Margin: ${grossMargin.toFixed(1)}%`} 
          subtitle="Revenue minus direct cargo cost"
        />
        <StatCard 
          title="Company Expenses" 
          value={formatCurrency(totalExpenses)} 
          icon={<Wallet size={20} />} 
          trend={`Ratio: ${expenseRatio.toFixed(1)}%`} 
          onClick={() => handleCardClick('Company Expenses')}
          subtitle={`${filteredExpenses.length} operating expense vouchers`}
        />
      </div>

      {/* ADVANCED ANALYTICS TABS & WORKBENCH */}
      <div className="relative z-10 glass-ultra glass-sheen rounded-3xl p-4 sm:p-6 card-3d">
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10 relative z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <BarChart3 size={19} className="text-orange-400" />
              Advanced Analytics & Intelligence Suite
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">
              Live operational metrics, aging matrix, customer analytics, and freight lane insights
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-black/90 border border-white/10 shadow-inner">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'aging', label: 'AR/AP Aging Matrix' },
              { id: 'lanes', label: 'Trade Lanes & Routes' },
              { id: 'customers', label: 'Customer Insights' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAnalyticsTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all card-3d active:scale-95 ${
                  activeAnalyticsTab === tab.id
                    ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-200 text-black shadow-md border border-white/20'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OVERVIEW & CASH FLOW VIEW */}
        {activeAnalyticsTab === 'overview' && (
          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
              
              {/* Cash Inflow & Outflow Cards */}
              <div className="lg:col-span-2 space-y-3.5 sm:space-y-4">
                
                {/* Cash Inflow */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 card-3d">
                  <h4 className="text-[11px] font-black text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ArrowDownRight size={15} className="text-emerald-400" /> Cash Inflow & Receivables (A/R)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard 
                      title="Received Amount" 
                      value={formatCurrency(receivedAmount)} 
                      icon={<CheckCircle size={18} />} 
                      trend={`${cashCollectionRate.toFixed(1)}% Collected`} 
                      onClick={() => handleCardClick('Received Amount')}
                    />
                    <StatCard 
                      title="Outstanding Receivables" 
                      value={formatCurrency(outstandingReceivables)} 
                      icon={<Clock size={18} />} 
                      trend="A/R Pending" 
                      onClick={() => handleCardClick('Outstanding Receivables')}
                    />
                    <div className="p-4 rounded-2xl bg-black/70 border border-white/10 card-3d flex flex-col justify-between">
                      <p className="text-zinc-200 text-[11px] font-bold uppercase tracking-wider">Collection Velocity</p>
                      <div className="mt-1.5">
                        <span className="text-xl font-black text-white">{cashCollectionRate.toFixed(1)}%</span>
                        <div className="w-full bg-black/80 h-2 rounded-full mt-1.5 overflow-hidden border border-white/10 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full transition-all duration-700" 
                            style={{ width: `${Math.min(cashCollectionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cash Outflow */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 card-3d">
                  <h4 className="text-[11px] font-black text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ArrowUpRight size={15} className="text-orange-400" /> Outlays, Vendors & Brokerage (Outflow)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard 
                      title="Paid to Vendors" 
                      value={formatCurrency(paidAmount)} 
                      icon={<CreditCard size={18} />} 
                      trend="Settled" 
                      onClick={() => handleCardClick('Paid Amount (Vendors)')}
                    />
                    <StatCard 
                      title="Outstanding Payables" 
                      value={formatCurrency(outstandingPayables)} 
                      icon={<AlertCircle size={18} />} 
                      trend="A/P Due" 
                      onClick={() => handleCardClick('Outstanding Payables')}
                    />
                    <StatCard 
                      title="Paid Broker Comm." 
                      value={formatCurrency(paidAgentCommission)} 
                      icon={<CreditCard size={18} />} 
                      trend="Settled" 
                      onClick={() => handleCardClick('Paid Broker Comm.')}
                    />
                    <StatCard 
                      title="Unpaid Broker Comm." 
                      value={formatCurrency(unpaidAgentCommission)} 
                      icon={<Clock size={18} />} 
                      trend="Pending" 
                      onClick={() => handleCardClick('Unpaid Broker Comm.')}
                    />
                  </div>
                </div>

              </div>

              {/* Financial Health Snapshot Card */}
              <div className="rounded-2xl bg-black/70 border border-white/10 p-5 flex flex-col justify-between card-3d">
                <div>
                  <h4 className="text-[11px] font-black text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Activity size={15} className="text-orange-400" /> Financial Health Indicators
                  </h4>
                  <div className="space-y-4">
                    <RatioIndicator 
                      label="Gross Profit Margin" 
                      value={grossMargin} 
                      colorGradient="bg-gradient-to-r from-emerald-500 to-teal-300"
                      tooltip="Shows sales profitability before operating expenses"
                    />
                    <RatioIndicator 
                      label="Net Profit Margin" 
                      value={netMargin} 
                      colorGradient="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-200"
                      tooltip="Bottom-line efficiency: percentage of revenue kept as profit"
                    />
                    <RatioIndicator 
                      label="Cash Conversion Rate" 
                      value={cashCollectionRate} 
                      colorGradient="bg-gradient-to-r from-blue-500 to-cyan-300"
                      tooltip="Percentage of billed revenue collected as actual cash"
                    />
                    <RatioIndicator 
                      label="Operating Expense Ratio" 
                      value={expenseRatio} 
                      colorGradient="bg-gradient-to-r from-red-500 to-rose-300"
                      tooltip="Percentage of revenue consumed by overhead expenses"
                    />
                    <RatioIndicator 
                      label="Payable Margin Burden" 
                      value={payableMarginBurden} 
                      colorGradient="bg-gradient-to-r from-purple-500 to-pink-300"
                      tooltip="Pending vendor costs relative to gross earnings"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 mt-6 text-center">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <Sparkles size={11} className="text-orange-400" /> Automated Ratio Calculation
                  </span>
                </div>
              </div>

            </div>

            {/* Composed Chart: 6-Month Revenue, Expenses & Net Profit */}
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10 card-3d">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    6-Month Historical Revenue, Expenses & Net Profit Trend
                  </h4>
                  <p className="text-xs text-zinc-400">Monthly trajectory calculated from live CRM ledger</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span> Expenses
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm"></span> Net Profit
                  </span>
                </div>
              </div>

              <div className="h-72 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="glassOrangeRev3D" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.45}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="glassRedExp3D" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff12" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      stroke="#a1a1aa" 
                      fontSize={11} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      stroke="#a1a1aa" 
                      fontSize={11}
                      tickFormatter={(val) => `AED ${val/1000}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#05070a', 
                        borderColor: '#ea580c40', 
                        borderRadius: '1rem',
                        boxShadow: '0 20px 50px 0 rgba(0,0,0,0.9), 0 0 20px rgba(234,88,12,0.25)',
                        color: '#ffffff'
                      }}
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    />
                    <Area 
                      type="monotone" 
                      name="Revenue" 
                      dataKey="revenue" 
                      stroke="#f97316" 
                      fillOpacity={1} 
                      fill="url(#glassOrangeRev3D)" 
                      strokeWidth={3} 
                    />
                    <Area 
                      type="monotone" 
                      name="Expenses" 
                      dataKey="expenses" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#glassRedExp3D)" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      name="Net Profit" 
                      dataKey="netProfit" 
                      stroke="#34d399" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#34d399', stroke: '#000', strokeWidth: 2 }} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AR / AP AGING MATRIX */}
        {activeAnalyticsTab === 'aging' && (
          <div className="space-y-4 relative z-10">
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 card-3d">
              <h4 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <Clock size={16} className="text-orange-400" />
                Accounts Receivable (A/R) Aging Velocity Matrix
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Identifies overdue invoices categorized by payment delay buckets to safeguard operational cash flow.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-black/70 border border-emerald-500/40 card-3d">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-emerald-400">Current (0 - 30 Days)</span>
                    <span className="text-[10px] font-bold text-zinc-400">{arAging.current.count} Invoices</span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-white">{formatCurrency(arAging.current.amount)}</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Normal credit cycle; low risk</p>
                </div>

                <div className="p-4 rounded-xl bg-black/70 border border-amber-500/40 card-3d">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-amber-400">31 - 60 Days Due</span>
                    <span className="text-[10px] font-bold text-zinc-400">{arAging.bucket30.count} Invoices</span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-white">{formatCurrency(arAging.bucket30.amount)}</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Follow up on statement of account</p>
                </div>

                <div className="p-4 rounded-xl bg-black/70 border border-orange-500/50 card-3d">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-orange-400">61 - 90 Days Due</span>
                    <span className="text-[10px] font-bold text-zinc-400">{arAging.bucket60.count} Invoices</span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-white">{formatCurrency(arAging.bucket60.amount)}</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Requires active credit control</p>
                </div>

                <div className="p-4 rounded-xl bg-black/70 border border-red-500/50 card-3d">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase text-red-400">90+ Days Critical</span>
                    <span className="text-[10px] font-bold text-zinc-400">{arAging.bucket90Plus.count} Invoices</span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-red-400">{formatCurrency(arAging.bucket90Plus.amount)}</h4>
                  <p className="text-[10px] text-red-300 mt-1">High risk aging balance</p>
                </div>
              </div>
            </div>

            {/* Liquidity Net Position Card */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card-3d">
              <div>
                <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Net Working Capital Liquidity</span>
                <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {formatCurrency(outstandingReceivables - outstandingPayables)}
                </h4>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Receivables ({formatCurrency(outstandingReceivables)}) minus Payables ({formatCurrency(outstandingPayables)})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCardClick('Outstanding Receivables')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all card-3d active:scale-95"
                >
                  View AR Invoices
                </button>
                <button
                  onClick={() => handleCardClick('Outstanding Payables')}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 transition-all card-3d active:scale-95"
                >
                  View AP Liabilities
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRADE LANES & CARGO ROUTES */}
        {activeAnalyticsTab === 'lanes' && (
          <div className="space-y-4 relative z-10">
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 card-3d">
              <h4 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <Globe size={16} className="text-orange-400" />
                Top Destination Countries & Trade Lanes
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Ranked by gross sales volume and profit generation across international shipping routes.
              </p>

              {topDestinations.length === 0 ? (
                <p className="text-center py-8 text-zinc-500 text-xs font-bold">No route data available for this range.</p>
              ) : (
                <div className="space-y-3">
                  {topDestinations.map((dest, idx) => {
                    const percent = totalRevenue > 0 ? (dest.revenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-black/70 border border-white/10 hover:border-orange-500/40 transition-all card-3d">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-300 text-black font-black text-[10px] flex items-center justify-center shadow-md">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-black text-white">{dest.country}</span>
                            <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                              {dest.count} shipments
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-orange-400">{formatCurrency(dest.revenue)}</span>
                            <span className="text-[10px] text-emerald-400 font-bold ml-2">
                              Profit: {formatCurrency(dest.profit)}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-black/80 h-2 rounded-full overflow-hidden border border-white/10 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-200 h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMER LEADERBOARD */}
        {activeAnalyticsTab === 'customers' && (
          <div className="space-y-4 relative z-10">
            <div className="p-4 rounded-xl bg-black/50 border border-white/10 card-3d">
              <h4 className="text-sm font-black text-white mb-1 flex items-center gap-2">
                <Users size={16} className="text-orange-400" />
                VIP Customers & Top Client Ledger
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Accounts with highest freight volume, settled revenue, and outstanding balance.
              </p>

              {topCustomers.length === 0 ? (
                <p className="text-center py-8 text-zinc-500 text-xs font-bold">No customer transactions found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-widest text-[10px]">
                        <th className="pb-3 px-3">Customer</th>
                        <th className="pb-3 px-3 text-center">Shipments</th>
                        <th className="pb-3 px-3 text-right">Total Revenue</th>
                        <th className="pb-3 px-3 text-right">Settled</th>
                        <th className="pb-3 px-3 text-right">Pending A/R</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {topCustomers.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors card-3d">
                          <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white/10 text-zinc-200 font-bold text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            {cust.name}
                          </td>
                          <td className="py-3 px-3 text-center text-zinc-300 font-bold">{cust.shipments}</td>
                          <td className="py-3 px-3 text-right font-black text-orange-400">{formatCurrency(cust.revenue)}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">{formatCurrency(cust.paid)}</td>
                          <td className="py-3 px-3 text-right font-bold text-rose-400">{formatCurrency(cust.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* RECENT SHIPMENTS 3D GLASS FEED */}
      <div className="relative z-10 glass-ultra glass-sheen p-5 sm:p-6 rounded-3xl card-3d">
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Layers size={19} className="text-orange-400" />
              Recent Cargo Shipments & Profit Realization
            </h3>
            <p className="text-xs text-zinc-400">Click any consignment to view or edit full invoice details</p>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/10 text-zinc-200 border border-white/15">
            Showing latest {recentShipments.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
          {recentShipments.length === 0 ? (
            <div className="col-span-full text-center py-12 text-zinc-500 font-bold text-xs">
              No recent shipments recorded.
            </div>
          ) : (
            recentShipments.map((inv) => {
              const relAdj = adjustmentNotes.filter(n => n.originalInvoiceId === inv.id);
              const netAdj = relAdj.filter(n => n.type === 'DEBIT').reduce((s, n) => s + n.amount, 0) - relAdj.filter(n => n.type === 'CREDIT').reduce((s, n) => s + n.amount, 0);
              const invoiceTotal = inv.totalAmount + netAdj;
              const invoiceProfit = inv.profit + netAdj;

              return (
                <div 
                  key={inv.id} 
                  className="p-4 rounded-xl bg-black/60 border border-white/10 hover:border-orange-500/50 hover:bg-black/85 hover:shadow-[0_15px_30px_rgba(234,88,12,0.2)] transition-all cursor-pointer group flex flex-col justify-between card-3d active:scale-95"
                  onClick={() => onInvoiceClick(inv)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/35">
                        {inv.invoiceNumber}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 drop-shadow-sm">
                      {inv.customerName}
                    </h4>

                    {/* Route badges */}
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-white/10 text-zinc-300 uppercase">
                        {inv.items[0]?.coo || 'UAE'}
                      </span>
                      <span className="text-zinc-500">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-950/70 border border-orange-500/35 text-orange-300 uppercase">
                        {inv.destinationCountry}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-medium">Billed Amount</span>
                      <span className="text-xs font-black text-white">{formatCurrency(invoiceTotal)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block font-medium">Est. Profit</span>
                      <span className="text-xs font-black text-emerald-400">{formatCurrency(invoiceProfit)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* GLASS 3D DRILL-DOWN DETAILS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="relative overflow-hidden glass-ultra glass-sheen rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.98),0_0_50px_rgba(234,88,12,0.35)] w-full max-w-5xl max-h-[90vh] flex flex-col text-white card-3d">
            
            {/* Scrawling Laser Light Beam */}
            <div className="scrawl-beam-wrapper">
              <div className="scrawl-beam"></div>
            </div>

            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/50 sticky top-0 z-10">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                  {selectedFilter}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Showing {searchedModalItems.length} of {filteredResults.items.length} records in this ledger
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white card-3d active:scale-95"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick search input within modal */}
            <div className="p-3 sm:px-6 bg-black/40 border-b border-white/10 flex items-center gap-2">
              <Search size={14} className="text-zinc-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search by invoice number, customer name, country, payee..."
                className="w-full bg-transparent text-xs font-medium text-white placeholder-zinc-500 outline-none"
              />
              {modalSearch && (
                <button onClick={() => setModalSearch('')} className="text-xs text-zinc-400 hover:text-white">
                  Clear
                </button>
              )}
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              {searchedModalItems.length === 0 ? (
                <div className="text-center py-16">
                  <FileText size={44} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-400 font-bold text-xs">No records matching your search filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-[10px] font-black text-zinc-300 uppercase tracking-widest sticky top-0">
                      <tr>
                        {filteredResults.type === 'invoice' ? (
                          <>
                            <th className="px-3 py-3 border-b border-white/10">Inv No</th>
                            <th className="px-3 py-3 border-b border-white/10">Staff</th>
                            <th className="px-3 py-3 border-b border-white/10">Date</th>
                            <th className="px-3 py-3 border-b border-white/10">Customer</th>
                            <th className="px-3 py-3 border-b border-white/10">Route</th>
                            <th className="px-3 py-3 border-b border-white/10 text-right">Total Amount</th>
                            <th className="px-3 py-3 border-b border-white/10 text-center">Status</th>
                            {selectedFilter === 'Gross Profit' || selectedFilter === 'Net Profit' ? (
                              <th className="px-3 py-3 border-b border-white/10 text-right">Profit</th>
                            ) : null}
                            {selectedFilter?.includes('Broker') && (
                              <th className="px-3 py-3 border-b border-white/10 text-right">Broker Comm.</th>
                            )}
                            {selectedFilter?.includes('Vendor') || selectedFilter?.includes('Payables') ? (
                              <th className="px-3 py-3 border-b border-white/10 text-right">Vendor Cost</th>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-3 border-b border-white/10">Date</th>
                            <th className="px-3 py-3 border-b border-white/10">Details</th>
                            <th className="px-3 py-3 border-b border-white/10">Payee</th>
                            <th className="px-3 py-3 border-b border-white/10 text-right">Amount</th>
                            <th className="px-3 py-3 border-b border-white/10 text-center">Method</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {searchedModalItems.map((item: any) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-white/5 transition-colors card-3d ${filteredResults.type === 'invoice' ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (filteredResults.type === 'invoice') {
                              onInvoiceClick(item);
                              setShowModal(false);
                            }
                          }}
                        >
                          {filteredResults.type === 'invoice' ? (
                            <>
                              <td className="px-3 py-3 font-black text-white">{item.invoiceNumber}</td>
                              <td className="px-3 py-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-200">
                                  {item.createdByName || 'Admin'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-zinc-400">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="px-3 py-3 font-bold text-zinc-200">{item.customerName}</td>
                              <td className="px-3 py-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-200">
                                  {item.items[0]?.coo || 'UAE'} → {item.destinationCountry}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right font-black text-orange-400">
                                {(() => {
                                  const relAdj = adjustmentNotes.filter(n => n.originalInvoiceId === item.id);
                                  const net = relAdj.filter(n => n.type === 'DEBIT').reduce((s, n) => s + n.amount, 0) - relAdj.filter(n => n.type === 'CREDIT').reduce((s, n) => s + n.amount, 0);
                                  return formatCurrency(item.totalAmount + net);
                                })()}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                  item.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              {selectedFilter === 'Gross Profit' || selectedFilter === 'Net Profit' ? (
                                <td className="px-3 py-3 text-right font-black text-emerald-400">
                                  {(() => {
                                    const relAdj = adjustmentNotes.filter(n => n.originalInvoiceId === item.id);
                                    const net = relAdj.filter(n => n.type === 'DEBIT').reduce((s, n) => s + n.amount, 0) - relAdj.filter(n => n.type === 'CREDIT').reduce((s, n) => s + n.amount, 0);
                                    return formatCurrency(item.profit + net);
                                  })()}
                                </td>
                              ) : null}
                              {selectedFilter?.includes('Broker') && (
                                <td className="px-3 py-3 text-right font-bold text-teal-300">{formatCurrency(item.agentCommission || 0)}</td>
                              )}
                              {selectedFilter?.includes('Vendor') || selectedFilter?.includes('Payables') ? (
                                <td className="px-3 py-3 text-right font-bold text-blue-300">{formatCurrency(item.vendorCost || 0)}</td>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-3 text-zinc-400">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="px-3 py-3 font-bold text-zinc-200">{item.itemDetails}</td>
                              <td className="px-3 py-3 text-zinc-300">{item.payeeName}</td>
                              <td className="px-3 py-3 text-right font-black text-rose-400">{formatCurrency(item.amount)}</td>
                              <td className="px-3 py-3 text-center text-[10px] font-bold text-zinc-400 uppercase">{item.paymentMethod}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/60 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-200 text-black rounded-xl font-black hover:brightness-110 transition-all shadow-md active:scale-95 text-xs card-3d"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
