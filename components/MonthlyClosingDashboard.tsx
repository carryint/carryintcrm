import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import {
  Lock,
  Calendar,
  TrendingUp,
  DollarSign,
  Receipt,
  ShieldCheck,
  Download,
  Edit3,
  Search,
  CheckCircle2,
  Sparkles,
  Plus,
  Clock,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  Invoice,
  Expense,
  AdjustmentNote,
  MonthlySalesClosing,
  CompanyInfo,
  User
} from '../types';
import { formatCurrency } from '../utils';
import {
  formatMonthDisplay,
  getPrevMonthStr,
  calculateClosingPreview
} from '../monthlyClosingService';
import {
  downloadMonthlyClosingPDF,
  downloadAllMonthsClosingSummaryPDF
} from '../closingPdfService';

interface MonthlyClosingDashboardProps {
  invoices: Invoice[];
  expenses: Expense[];
  adjustmentNotes: AdjustmentNote[];
  closings: MonthlySalesClosing[];
  currentUser: User;
  companyInfo?: CompanyInfo;
  onOpenClosingModal: (targetMonth?: string, editMode?: boolean) => void;
  onClosingsUpdated: (updated: MonthlySalesClosing[]) => void;
  onNavigate?: (tab: string) => void;
}

interface MonthBoxData {
  month: string;           // "YYYY-MM"
  monthName: string;       // "November 2026"
  isClosed: boolean;
  startDate: string;
  cutoffDate: string;
  totalRevenue: number;
  invoiceCount: number;
  grossProfit: number;
  netProfit: number;
  closingBalance: number;
  rolledForwardCount: number;
  notes?: string;
  closedByName?: string;
  closedAt?: string;
  rawClosing?: MonthlySalesClosing;
}

export const MonthlyClosingDashboard: React.FC<MonthlyClosingDashboardProps> = ({
  invoices,
  expenses,
  adjustmentNotes,
  closings,
  currentUser,
  companyInfo,
  onOpenClosingModal,
  onClosingsUpdated,
  onNavigate
}) => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // -------------------------------------------------------------
  // RANGE SELECTOR STATE: 4, 8 (2 rows default), 12, or 'all'
  // -------------------------------------------------------------
  const [rangeOption, setRangeOption] = useState<'4' | '8' | '12' | 'all' | 'custom'>('8');
  const [customFromMonth, setCustomFromMonth] = useState<string>('');
  const [customToMonth, setCustomToMonth] = useState<string>('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Currently focused / selected month for bottom Down Bar
  const [selectedDownBarMonth, setSelectedDownBarMonth] = useState<string>(() => {
    if (closings.length > 0 && closings[0].month) return closings[0].month;
    return currentMonthKey;
  });

  // Anchor month for 6-month trailing line chart
  const [anchorMonth, setAnchorMonth] = useState<string>(() => {
    if (closings.length > 0 && closings[0].month) return closings[0].month;
    return currentMonthKey;
  });

  // Trailing line chart active metrics toggle
  const [visibleLines, setVisibleLines] = useState({
    revenue: true,
    grossProfit: true,
    netProfit: true,
    closingBalance: true
  });

  // -------------------------------------------------------------
  // ALL AVAILABLE MONTHS
  // -------------------------------------------------------------
  const allAvailableMonths = useMemo(() => {
    const monthSet = new Set<string>();

    closings.forEach(c => {
      if (c.month) monthSet.add(c.month);
    });

    invoices.forEach(inv => {
      if (inv.date) {
        const m = inv.date.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) monthSet.add(m);
      }
    });

    monthSet.add(currentMonthKey);

    // Ensure at least trailing 12 months exist in set for full calendar range
    let walk = currentMonthKey;
    for (let i = 0; i < 12; i++) {
      monthSet.add(walk);
      walk = getPrevMonthStr(walk);
    }

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [closings, invoices, currentMonthKey]);

  // -------------------------------------------------------------
  // BUILD DATA FOR EACH MONTH BOX
  // -------------------------------------------------------------
  const allMonthBoxes: MonthBoxData[] = useMemo(() => {
    return allAvailableMonths.map(monthStr => {
      const closedRecord = closings.find(c => c.month === monthStr && c.isClosed);

      if (closedRecord) {
        const invCount = closedRecord.includedInvoiceIds ? closedRecord.includedInvoiceIds.length : 0;
        const rolledCount = invoices.filter(inv => {
          const invDate = (inv.date || '').slice(0, 10);
          return invDate.startsWith(monthStr) && invDate > closedRecord.cutoffDate;
        }).length;

        return {
          month: monthStr,
          monthName: closedRecord.monthName || formatMonthDisplay(monthStr),
          isClosed: true,
          startDate: closedRecord.startDate,
          cutoffDate: closedRecord.cutoffDate,
          totalRevenue: closedRecord.totalRevenue,
          invoiceCount: invCount,
          grossProfit: closedRecord.grossProfit,
          netProfit: closedRecord.netProfit,
          closingBalance: closedRecord.closingBalance,
          rolledForwardCount: rolledCount,
          notes: closedRecord.notes,
          closedByName: closedRecord.closedByName,
          closedAt: closedRecord.closedAt,
          rawClosing: closedRecord
        };
      }

      // Open / Preview Month Data
      const [y, m] = monthStr.split('-');
      const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
      const defaultCutoff = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

      const preview = calculateClosingPreview(
        monthStr,
        defaultCutoff,
        invoices,
        expenses,
        adjustmentNotes,
        closings
      );

      return {
        month: monthStr,
        monthName: formatMonthDisplay(monthStr),
        isClosed: false,
        startDate: preview.startDate,
        cutoffDate: defaultCutoff,
        totalRevenue: preview.totalRevenue,
        invoiceCount: preview.eligibleInvoices.length,
        grossProfit: preview.grossProfit,
        netProfit: preview.calculatedNetProfit,
        closingBalance: Math.max(0, preview.defaultClosingBalance),
        rolledForwardCount: preview.rolledForwardInvoices.length,
        notes: undefined,
        closedByName: undefined,
        closedAt: undefined,
        rawClosing: undefined
      };
    });
  }, [allAvailableMonths, closings, invoices, expenses, adjustmentNotes]);

  // -------------------------------------------------------------
  // FILTER MONTHS BY RANGE SELECTOR (4, 8=2 rows, 12, all, custom)
  // -------------------------------------------------------------
  const visibleMonthBoxes = useMemo(() => {
    let list = [...allMonthBoxes];

    if (rangeOption === 'custom' && customFromMonth && customToMonth) {
      list = list.filter(b => b.month >= customFromMonth && b.month <= customToMonth);
    } else if (rangeOption === '4') {
      list = list.slice(0, 4);
    } else if (rangeOption === '8') {
      list = list.slice(0, 8); // Exactly 2 rows of 4 boxes
    } else if (rangeOption === '12') {
      list = list.slice(0, 12); // Exactly 3 rows of 4 boxes
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.month.toLowerCase().includes(q) ||
        b.monthName.toLowerCase().includes(q) ||
        b.cutoffDate.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allMonthBoxes, rangeOption, customFromMonth, customToMonth, searchQuery]);

  // -------------------------------------------------------------
  // 6-MONTH TRAILING PERFORMANCE TRAJECTORY (MULTI-LINE)
  // -------------------------------------------------------------
  const sixMonthsTrailingData = useMemo(() => {
    const trailingList: string[] = [];
    let cur = anchorMonth;
    for (let i = 0; i < 6; i++) {
      trailingList.unshift(cur);
      cur = getPrevMonthStr(cur);
    }

    return trailingList.map(mStr => {
      const box = allMonthBoxes.find(b => b.month === mStr);
      const shortName = formatMonthDisplay(mStr).split(' ')[0].slice(0, 3);
      const yearShort = `'${mStr.slice(2, 4)}`;
      const label = `${shortName} ${yearShort}`;

      if (box) {
        return {
          month: mStr,
          name: label,
          fullName: box.monthName,
          isClosed: box.isClosed,
          revenue: Math.round(box.totalRevenue),
          invoices: box.invoiceCount,
          netProfit: Math.round(box.netProfit),
          closingBalance: Math.round(box.closingBalance)
        };
      }

      return {
        month: mStr,
        name: label,
        fullName: formatMonthDisplay(mStr),
        isClosed: false,
        revenue: 0,
        invoices: 0,
        netProfit: 0,
        closingBalance: 0
      };
    });
  }, [anchorMonth, allMonthBoxes]);

  // -------------------------------------------------------------
  // SELECTED DOWN BAR MONTH RECORD
  // -------------------------------------------------------------
  const selectedDownBarBox = useMemo(() => {
    return allMonthBoxes.find(b => b.month === selectedDownBarMonth) || allMonthBoxes[0];
  }, [allMonthBoxes, selectedDownBarMonth]);

  // Handle edit from Down Bar or box
  const handleEditSavedClosing = (monthToEdit?: string) => {
    const target = monthToEdit || selectedDownBarMonth;
    onOpenClosingModal(target, true); // true = edit mode
  };

  // Handle create new closing from Down Bar
  const handleCreateNewClosing = () => {
    onOpenClosingModal(undefined, false);
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in text-white">

      {/* ========================================================= */}
      {/* 1. TOP HEADER & SUMMARY STATUS                           */}
      {/* ========================================================= */}
      <div className="glass-ultra p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-40 bg-gradient-to-l from-orange-500/15 via-amber-500/5 to-transparent pointer-events-none blur-2xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 sm:p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                <Lock size={20} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Monthly Sales Closing Dashboard
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                ⚡ Active Cycle: {formatMonthDisplay(currentMonthKey)}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🔒 {closings.filter(c => c.isClosed).length} Closed Months
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 max-w-2xl font-medium">
              Review monthly sales closing records in 4-column matrix grids, analyze 6-month performance lines, and manage or edit saved cycles directly from the Down Bar.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={handleCreateNewClosing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/30 border border-orange-400/40 cursor-pointer touch-manipulation hover:brightness-110 transition-all"
            >
              <Plus size={16} />
              <span>+ Create Monthly Sales Closing</span>
            </button>
            <button
              onClick={() => downloadAllMonthsClosingSummaryPDF(closings, companyInfo, currentUser.name)}
              disabled={closings.length === 0}
              className="px-3.5 py-2.5 rounded-xl glass-pill hover:bg-white/10 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 border border-white/15 cursor-pointer touch-manipulation transition-all disabled:opacity-40"
              title="Download All Months Consolidated PDF"
            >
              <Download size={15} className="text-orange-400" />
              <span className="hidden sm:inline">Consolidated Audit PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. 6-MONTH TRAILING PERFORMANCE IN LINES                  */}
      {/* ========================================================= */}
      <div className="glass-ultra p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <TrendingUp size={16} />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                6-Month Trailing Performance Trajectory (Lines)
              </h2>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              Historical multi-line comparison for the 6 months preceding <strong className="text-orange-400">{formatMonthDisplay(anchorMonth)}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 glass-pill px-2.5 py-1 rounded-xl text-xs border border-white/10">
              <Calendar size={13} className="text-orange-400" />
              <span className="text-zinc-400 hidden sm:inline">Anchor Month:</span>
              <select
                value={anchorMonth}
                onChange={(e) => setAnchorMonth(e.target.value)}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
              >
                {allAvailableMonths.map(m => (
                  <option key={m} value={m} className="bg-zinc-900 text-white">
                    {formatMonthDisplay(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Toggles */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, revenue: !prev.revenue }))}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all border cursor-pointer touch-manipulation ${
                  visibleLines.revenue
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-black/40 text-zinc-400 border-white/5 line-through opacity-60'
                }`}
              >
                ● Revenue
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, netProfit: !prev.netProfit }))}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all border cursor-pointer touch-manipulation ${
                  visibleLines.netProfit
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-black/40 text-zinc-400 border-white/5 line-through opacity-60'
                }`}
              >
                ● Net Profit
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, closingBalance: !prev.closingBalance }))}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all border cursor-pointer touch-manipulation ${
                  visibleLines.closingBalance
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-black/40 text-zinc-400 border-white/5 line-through opacity-60'
                }`}
              >
                ● Closing Balance
              </button>
            </div>
          </div>
        </div>

        {/* The Recharts Multi-Line Visualization */}
        <div className="mt-4 w-full h-[220px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sixMonthsTrailingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff12" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} axisLine={false} tickLine={false} />
              <YAxis
                stroke="#a1a1aa"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `AED ${Math.round(val / 1000)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0d14',
                  borderColor: '#ea580c40',
                  borderRadius: '1rem',
                  boxShadow: '0 20px 50px 0 rgba(0,0,0,0.95), 0 0 20px rgba(234,88,12,0.3)',
                  color: '#ffffff',
                  fontSize: '11px',
                  padding: '10px'
                }}
                formatter={(value: any, name: any) => [`AED ${formatCurrency(Number(value))}`, name]}
              />

              {visibleLines.revenue && (
                <Line
                  type="monotone"
                  name="Revenue"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#f97316' }}
                />
              )}

              {visibleLines.netProfit && (
                <Line
                  type="monotone"
                  name="Net Profit"
                  dataKey="netProfit"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#06b6d4', stroke: '#fff', strokeWidth: 1 }}
                />
              )}

              {visibleLines.closingBalance && (
                <Line
                  type="monotone"
                  name="Month Closing Balance"
                  dataKey="closingBalance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MONTHS RANGE SELECTOR & 4-BOXES-PER-ROW GRID           */}
      {/* (2 Rows of Boxes Default = 8 Boxes)                       */}
      {/* ========================================================= */}
      <div className="space-y-4">
        {/* Months Range Selector Header */}
        <div className="glass-ultra p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Layers size={16} />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Monthly Sales Closing Reports (4 Boxes Per Row)
              </h2>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              Showing short summary of <strong className="text-orange-400">Revenue</strong>, <strong className="text-orange-400">Invoices</strong>, <strong className="text-emerald-400">Net Profit</strong>, and <strong className="text-amber-400">Closing Amount</strong>.
            </p>
          </div>

          {/* Range Options & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Range Pills */}
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-orange-500/30 text-xs backdrop-blur-md">
              <button
                onClick={() => setRangeOption('4')}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer touch-manipulation ${
                  rangeOption === '4' ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-md' : 'text-zinc-200 hover:text-white'
                }`}
                title="1 Row of 4 Boxes"
              >
                4 Mo (1 Row)
              </button>
              <button
                onClick={() => setRangeOption('8')}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer touch-manipulation ${
                  rangeOption === '8' ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-md' : 'text-zinc-200 hover:text-white'
                }`}
                title="2 Rows of 4 Boxes (Default)"
              >
                8 Mo (2 Rows)
              </button>
              <button
                onClick={() => setRangeOption('12')}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer touch-manipulation ${
                  rangeOption === '12' ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-md' : 'text-zinc-200 hover:text-white'
                }`}
                title="3 Rows of 4 Boxes (1 Year)"
              >
                12 Mo (3 Rows)
              </button>
              <button
                onClick={() => setRangeOption('all')}
                className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer touch-manipulation ${
                  rangeOption === 'all' ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-md' : 'text-zinc-200 hover:text-white'
                }`}
                title="All Recorded Months"
              >
                All
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search month..."
                className="pl-7 pr-2.5 py-1.5 rounded-xl bg-black/40 border border-orange-500/30 text-xs text-white placeholder-zinc-300 outline-none focus:border-orange-400 w-32 sm:w-36 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* 4 BOXES IN A ROW (e.g. 2 Rows = 8 Boxes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleMonthBoxes.length === 0 ? (
            <div className="col-span-full glass-ultra p-8 rounded-2xl border border-white/10 text-center text-zinc-400">
              No sales closing reports found matching the selected range or filter.
            </div>
          ) : (
            visibleMonthBoxes.map((box) => {
              const isSelectedInDownBar = selectedDownBarMonth === box.month;

              return (
                <div
                  key={box.month}
                  onClick={() => setSelectedDownBarMonth(box.month)}
                  className={`
                    glass-ultra rounded-2xl border p-4 sm:p-4.5 flex flex-col justify-between relative overflow-hidden transition-all duration-200 cursor-pointer touch-manipulation ${
                      isSelectedInDownBar
                        ? 'border-orange-400/80 ring-2 ring-orange-400/40 shadow-[0_0_35px_rgba(249,115,22,0.35)] scale-[1.01]'
                        : box.isClosed
                        ? 'border-white/15 hover:border-white/30 hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.04)]'
                        : 'border-orange-400/40 hover:border-orange-400 hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.5),0_0_25px_rgba(249,115,22,0.25)]'
                    }
                  `}
                >
                  {/* Top Color Accent Line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      box.isClosed
                        ? 'bg-gradient-to-r from-emerald-400 via-orange-400 to-amber-400'
                        : 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 animate-pulse'
                    }`}
                  />

                  <div>
                    {/* Header: Month Name + Status + Cutoff */}
                    <div className="flex items-start justify-between gap-1.5 pb-2.5 border-b border-white/10">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                          {box.monthName}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-200 font-semibold">
                          <Clock size={11} className="text-orange-400" />
                          <span>Cutoff: <span className="text-orange-300 font-bold">{box.cutoffDate}</span></span>
                        </div>
                      </div>

                      {box.isClosed ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                          <CheckCircle2 size={10} />
                          <span>Closed</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/25 text-orange-300 border border-orange-500/50 flex items-center gap-1 shrink-0 animate-pulse">
                          <Sparkles size={10} />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    {/* SHORT DATA: REVENUE, INVOICES, NET PROFIT, CLOSING AMOUNT */}
                    <div className="mt-3 space-y-2">
                      {/* 1. Revenue */}
                      <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between backdrop-blur-sm">
                        <span className="text-[11px] text-zinc-100 font-bold flex items-center gap-1.5">
                          <DollarSign size={13} className="text-orange-400" />
                          <span>Revenue</span>
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white">
                          AED {formatCurrency(box.totalRevenue)}
                        </span>
                      </div>

                      {/* 2. Total Invoices */}
                      <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between backdrop-blur-sm">
                        <span className="text-[11px] text-zinc-100 font-bold flex items-center gap-1.5">
                          <Receipt size={13} className="text-amber-400" />
                          <span>Total Invoices</span>
                        </span>
                        <span className="text-xs sm:text-sm font-black text-amber-300">
                          {box.invoiceCount} Invoices
                        </span>
                      </div>

                      {/* 3. Net Profit */}
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between backdrop-blur-sm">
                        <span className="text-[11px] text-emerald-200 font-bold flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-emerald-400" />
                          <span>Net Profit</span>
                        </span>
                        <span className="text-xs sm:text-sm font-black text-emerald-300">
                          AED {formatCurrency(box.netProfit)}
                        </span>
                      </div>

                      {/* 4. Month Closing Amount */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between backdrop-blur-sm">
                        <span className="text-[11px] text-amber-100 font-black flex items-center gap-1.5">
                          <ShieldCheck size={13} className="text-amber-400" />
                          <span>Closing Balance</span>
                        </span>
                        <span className="text-xs sm:text-sm font-black text-amber-300">
                          AED {formatCurrency(box.closingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Box Bottom Action Buttons */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (box.rawClosing) {
                          downloadMonthlyClosingPDF({
                            closing: box.rawClosing,
                            invoices,
                            companyInfo,
                            authorizedByName: currentUser.name
                          });
                        } else {
                          downloadMonthlyClosingPDF({
                            closing: {
                              month: box.month,
                              monthName: box.monthName,
                              startDate: box.startDate,
                              cutoffDate: box.cutoffDate,
                              totalRevenue: box.totalRevenue,
                              grossProfit: box.grossProfit,
                              vendorPayments: 0,
                              commissionPayments: 0,
                              companyExpenses: 0,
                              netProfit: box.netProfit,
                              closingBalance: box.closingBalance,
                              isClosed: false
                            },
                            invoices,
                            companyInfo,
                            authorizedByName: currentUser.name,
                            isDraft: true
                          });
                        }
                      }}
                      className="flex-1 py-1.5 rounded-xl glass-pill hover:bg-white/15 text-zinc-200 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-white/10 cursor-pointer touch-manipulation transition-all"
                      title="Download PDF Statement"
                    >
                      <Download size={12} className="text-orange-400" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSavedClosing(box.month);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 border cursor-pointer touch-manipulation transition-all ${
                        box.isClosed
                          ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/30'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500 text-black border-orange-400/50 shadow-md'
                      }`}
                      title={box.isClosed ? 'Edit saved sales closing' : 'Finalize & Close month'}
                    >
                      <Edit3 size={12} />
                      <span>{box.isClosed ? 'Edit' : 'Close'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PERSISTENT DASHBOARD DOWN BAR (BOTTOM DOCK BAR)        */}
      {/* Allows Editing Saved Sales Data & Creating New Closing    */}
      {/* ========================================================= */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 glass-ultra border-t border-white/20 p-3 sm:px-6 shadow-[0_-15px_45px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Selected Month Quick Chooser */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Clock size={15} />
              </span>
              <div>
                <span className="text-[10px] text-zinc-300 uppercase tracking-wider block font-black leading-tight">
                  Selected Month (Down Bar)
                </span>
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedDownBarMonth}
                    onChange={(e) => setSelectedDownBarMonth(e.target.value)}
                    className="bg-white/[0.08] border border-white/20 text-white font-black text-xs sm:text-sm rounded-lg px-2 py-0.5 outline-none cursor-pointer focus:border-orange-400 shadow-md backdrop-blur-md"
                  >
                    {allAvailableMonths.map(m => {
                      const isClosed = closings.some(c => c.month === m && c.isClosed);
                      return (
                        <option key={m} value={m} className="bg-zinc-950 text-white">
                          {isClosed ? '🔒' : '⚡'} {formatMonthDisplay(m)}
                        </option>
                      );
                    })}
                  </select>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    selectedDownBarBox?.isClosed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  }`}>
                    {selectedDownBarBox?.isClosed ? 'Saved / Closed' : 'Open / Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Balance Preview in Down Bar */}
            <div className="hidden md:block pl-3 border-l border-white/20 text-right">
              <span className="text-[10px] text-zinc-300 block font-bold">Month Closing Balance</span>
              <span className="text-xs sm:text-sm font-black text-amber-300">
                AED {formatCurrency(selectedDownBarBox?.closingBalance || 0)}
              </span>
            </div>
          </div>

          {/* Right: Down Bar Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {/* Button 1: Edit Saved Sales Closing */}
            <button
              onClick={() => handleEditSavedClosing(selectedDownBarMonth)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl glass-pill hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation hover:brightness-110 transition-all shadow-md"
              title="Edit Saved Sales Closing (Invoices, Cutoff & Financials)"
            >
              <Edit3 size={15} className="text-orange-400" />
              <span>Edit Saved Closing</span>
            </button>

            {/* Button 2: Create Monthly Sales Closing */}
            <button
              onClick={handleCreateNewClosing}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 text-black text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation hover:brightness-110 transition-all shadow-lg shadow-orange-500/40 border border-orange-300"
              title="Open Monthly Sales Closing Popup"
            >
              <Plus size={16} />
              <span>+ Create Closing</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
