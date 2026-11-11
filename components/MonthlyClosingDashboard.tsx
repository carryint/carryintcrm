import React, { useState, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Lock,
  Unlock,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Users,
  Wallet,
  ArrowRight,
  FileText,
  Clock,
  Sparkles,
  Download,
  Edit3,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronDown
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
  getNextMonthStr,
  calculateClosingPreview,
  reopenMonthlyClosingInStorage
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
  onOpenClosingModal: (targetMonth?: string) => void;
  onClosingsUpdated: (updated: MonthlySalesClosing[]) => void;
  onNavigate?: (tab: string) => void;
}

interface MonthColumnData {
  month: string;           // "YYYY-MM"
  monthName: string;       // "November 2026"
  isClosed: boolean;
  startDate: string;
  cutoffDate: string;
  totalRevenue: number;
  grossProfit: number;
  directTariffs: number;
  vendorPayments: number;
  commissionPayments: number;
  companyExpenses: number;
  totalOutflows: number;
  netProfit: number;
  closingBalance: number;
  invoiceCount: number;
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
  // -------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Anchor month for 6-month trailing line chart (defaults to current month or latest closed month)
  const [anchorMonth, setAnchorMonth] = useState<string>(() => {
    if (closings.length > 0 && closings[0].month) {
      return closings[0].month;
    }
    return currentMonthKey;
  });

  // Active view mode for all-months columnar showcase: 'cards' or 'chart'
  const [columnViewMode, setColumnViewMode] = useState<'cards' | 'chart'>('cards');

  // Mobile layout preference for column cards: 'carousel' (horizontal snap) vs 'stacked'
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'carousel' | 'stacked'>('carousel');

  // Search filter for months list
  const [searchQuery, setSearchQuery] = useState('');

  // Trailing line chart active metrics toggle
  const [visibleLines, setVisibleLines] = useState({
    revenue: true,
    grossProfit: true,
    outflows: true,
    netProfit: true,
    closingBalance: false
  });

  // Reference for horizontal scrolling columns
  const columnsScrollRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------
  // DISCOVER ALL RELEVANT MONTHS (Closed + Activity History)
  // -------------------------------------------------------------
  const allAvailableMonths = useMemo(() => {
    const monthSet = new Set<string>();

    // 1. Months from closed records
    closings.forEach(c => {
      if (c.month) monthSet.add(c.month);
    });

    // 2. Months from invoices
    invoices.forEach(inv => {
      if (inv.date) {
        const m = inv.date.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(m)) monthSet.add(m);
      }
    });

    // 3. Always include current month
    monthSet.add(currentMonthKey);

    // Also include at least trailing 6 months from now
    let walk = currentMonthKey;
    for (let i = 0; i < 6; i++) {
      monthSet.add(walk);
      walk = getPrevMonthStr(walk);
    }

    // Sort descending (latest month first)
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [closings, invoices, currentMonthKey]);

  // -------------------------------------------------------------
  // BUILD DATA FOR EACH MONTH COLUMN
  // -------------------------------------------------------------
  const monthColumnsData: MonthColumnData[] = useMemo(() => {
    return allAvailableMonths.map(monthStr => {
      const closedRecord = closings.find(c => c.month === monthStr && c.isClosed);

      if (closedRecord) {
        // Finalized month data
        const directTariffs = Math.max(0, closedRecord.totalRevenue - closedRecord.grossProfit);
        const totalOutflows = closedRecord.vendorPayments + closedRecord.commissionPayments + closedRecord.companyExpenses;
        const invCount = closedRecord.includedInvoiceIds ? closedRecord.includedInvoiceIds.length : 0;

        // Invoices in this month after cutoff date
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
          grossProfit: closedRecord.grossProfit,
          directTariffs,
          vendorPayments: closedRecord.vendorPayments,
          commissionPayments: closedRecord.commissionPayments,
          companyExpenses: closedRecord.companyExpenses,
          totalOutflows,
          netProfit: closedRecord.netProfit,
          closingBalance: closedRecord.closingBalance,
          invoiceCount: invCount,
          rolledForwardCount: rolledCount,
          notes: closedRecord.notes,
          closedByName: closedRecord.closedByName,
          closedAt: closedRecord.closedAt,
          rawClosing: closedRecord
        };
      }

      // Open / Preview Month data
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

      const directTariffs = Math.max(0, preview.totalRevenue - preview.grossProfit);
      const totalOutflows = preview.vendorPayments + preview.commissionPayments + preview.companyExpenses;

      return {
        month: monthStr,
        monthName: formatMonthDisplay(monthStr),
        isClosed: false,
        startDate: preview.startDate,
        cutoffDate: defaultCutoff,
        totalRevenue: preview.totalRevenue,
        grossProfit: preview.grossProfit,
        directTariffs,
        vendorPayments: preview.vendorPayments,
        commissionPayments: preview.commissionPayments,
        companyExpenses: preview.companyExpenses,
        totalOutflows,
        netProfit: preview.calculatedNetProfit,
        closingBalance: Math.max(0, preview.defaultClosingBalance),
        invoiceCount: preview.eligibleInvoices.length,
        rolledForwardCount: preview.rolledForwardInvoices.length,
        notes: undefined,
        closedByName: undefined,
        closedAt: undefined,
        rawClosing: undefined
      };
    });
  }, [allAvailableMonths, closings, invoices, expenses, adjustmentNotes]);

  // Filtered month columns for search
  const filteredMonthColumns = useMemo(() => {
    if (!searchQuery.trim()) return monthColumnsData;
    const q = searchQuery.toLowerCase();
    return monthColumnsData.filter(col =>
      col.month.toLowerCase().includes(q) ||
      col.monthName.toLowerCase().includes(q) ||
      col.cutoffDate.toLowerCase().includes(q)
    );
  }, [monthColumnsData, searchQuery]);

  // -------------------------------------------------------------
  // 6-MONTH TRAILING DATA (BEFORE & INCLUDING ANCHOR MONTH)
  // "6months before reports in lines"
  // -------------------------------------------------------------
  const sixMonthsTrailingData = useMemo(() => {
    // Generate sequence of 6 months ending at anchorMonth (chronological order)
    const trailingList: string[] = [];
    let cur = anchorMonth;
    for (let i = 0; i < 6; i++) {
      trailingList.unshift(cur);
      cur = getPrevMonthStr(cur);
    }

    return trailingList.map(mStr => {
      // Find computed data for this month
      const col = monthColumnsData.find(c => c.month === mStr);
      const shortName = formatMonthDisplay(mStr).split(' ')[0].slice(0, 3);
      const yearShort = `'${mStr.slice(2, 4)}`;
      const label = `${shortName} ${yearShort}`;

      if (col) {
        const netMargin = col.totalRevenue > 0 ? ((col.netProfit / col.totalRevenue) * 100).toFixed(1) : '0';
        return {
          month: mStr,
          name: label,
          fullName: col.monthName,
          isClosed: col.isClosed,
          revenue: Math.round(col.totalRevenue),
          grossProfit: Math.round(col.grossProfit),
          outflows: Math.round(col.totalOutflows),
          netProfit: Math.round(col.netProfit),
          closingBalance: Math.round(col.closingBalance),
          invoices: col.invoiceCount,
          netMargin: parseFloat(netMargin)
        };
      }

      return {
        month: mStr,
        name: label,
        fullName: formatMonthDisplay(mStr),
        isClosed: false,
        revenue: 0,
        grossProfit: 0,
        outflows: 0,
        netProfit: 0,
        closingBalance: 0,
        invoices: 0,
        netMargin: 0
      };
    });
  }, [anchorMonth, monthColumnsData]);

  // Trailing 6-Month Aggregate Insights
  const sixMonthInsights = useMemo(() => {
    const revSum = sixMonthsTrailingData.reduce((s, d) => s + d.revenue, 0);
    const netSum = sixMonthsTrailingData.reduce((s, d) => s + d.netProfit, 0);
    const avgNet = Math.round(netSum / 6);
    const avgMargin = revSum > 0 ? ((netSum / revSum) * 100).toFixed(1) : '0.0';

    // Best month
    let best = sixMonthsTrailingData[0];
    sixMonthsTrailingData.forEach(d => {
      if (d.netProfit > (best?.netProfit || 0)) best = d;
    });

    return { revSum, netSum, avgNet, avgMargin, bestMonth: best?.name || '-' };
  }, [sixMonthsTrailingData]);

  // -------------------------------------------------------------
  // EXECUTIVE RIBBON STATS (Totals across all closed months)
  // -------------------------------------------------------------
  const summaryTotals = useMemo(() => {
    const closedList = monthColumnsData.filter(c => c.isClosed);
    const totalRev = closedList.reduce((s, c) => s + c.totalRevenue, 0);
    const totalGross = closedList.reduce((s, c) => s + c.grossProfit, 0);
    const totalOutflow = closedList.reduce((s, c) => s + c.totalOutflows, 0);
    const totalNet = closedList.reduce((s, c) => s + c.netProfit, 0);
    const totalBalance = closedList.reduce((s, c) => s + c.closingBalance, 0);
    const totalInvoices = closedList.reduce((s, c) => s + c.invoiceCount, 0);
    const overallGrossPct = totalRev > 0 ? ((totalGross / totalRev) * 100).toFixed(1) : '0.0';
    const overallNetPct = totalRev > 0 ? ((totalNet / totalRev) * 100).toFixed(1) : '0.0';

    return {
      closedCount: closedList.length,
      totalRev,
      totalGross,
      totalOutflow,
      totalNet,
      totalBalance,
      totalInvoices,
      overallGrossPct,
      overallNetPct
    };
  }, [monthColumnsData]);

  // Smooth scroll column into view
  const handleScrollToMonth = (mStr: string) => {
    const el = document.getElementById(`month-col-${mStr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Reopen a closed month
  const handleReopenMonth = (monthStr: string) => {
    if (!window.confirm(`Are you sure you want to re-open sales closing for ${formatMonthDisplay(monthStr)}? This will unlock invoices back into the active accounting pool.`)) {
      return;
    }
    const updated = reopenMonthlyClosingInStorage(monthStr);
    onClosingsUpdated(updated);
  };

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12 animate-fade-in text-white">

      {/* ========================================================= */}
      {/* 1. TOP EXECUTIVE HEADER & ACTIONS                         */}
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
                Monthly Sales Closing & Audit Dashboard
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                ⚡ Active Cycle: {formatMonthDisplay(currentMonthKey)}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🔒 {summaryTotals.closedCount} Finalized Months
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1.5 max-w-2xl font-medium">
              Multi-period sales closing showcase: inspect side-by-side columnar closing statements, edit cutoffs, and analyze 6-month trailing multi-line performance trends.
            </p>
          </div>

          {/* Quick Actions (Mobile-friendly stacked or inline) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => onOpenClosingModal()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 border border-orange-400/40 card-3d active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>+ Close / Finalize Month</span>
            </button>

            <button
              onClick={() => downloadAllMonthsClosingSummaryPDF(closings, companyInfo, currentUser.name)}
              disabled={closings.length === 0}
              title={closings.length === 0 ? 'No closed months available' : 'Download All Months Consolidated PDF'}
              className="px-3.5 py-2.5 rounded-xl glass-pill hover:bg-white/10 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/15 card-3d active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={15} className="text-orange-400" />
              <span>Consolidated Audit PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. EXECUTIVE KPI CARDS RIBBON (5 Key Indicators)          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Closed Revenue */}
        <div className="glass-ultra p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg relative overflow-hidden card-3d">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>Closed Revenue</span>
            <DollarSign size={14} className="text-orange-400" />
          </div>
          <p className="text-base sm:text-xl font-black text-white truncate">
            AED {formatCurrency(summaryTotals.totalRev)}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-zinc-300 font-medium">
            <span className="text-orange-400 font-bold">{summaryTotals.totalInvoices}</span>
            <span>finalized consignments</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="glass-ultra p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg relative overflow-hidden card-3d">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>Gross Contribution</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <p className="text-base sm:text-xl font-black text-emerald-400 truncate">
            AED {formatCurrency(summaryTotals.totalGross)}
          </p>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-300 font-bold">
            <span>{summaryTotals.overallGrossPct}%</span>
            <span className="text-zinc-400 font-normal">gross margin</span>
          </div>
        </div>

        {/* Disbursed Outflows */}
        <div className="glass-ultra p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg relative overflow-hidden card-3d">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>Disbursed Outflows</span>
            <Wallet size={14} className="text-rose-400" />
          </div>
          <p className="text-base sm:text-xl font-black text-rose-300 truncate">
            AED {formatCurrency(summaryTotals.totalOutflow)}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1.5 truncate">
            Vendors, Comm & Overhead
          </p>
        </div>

        {/* Net Operating Profit */}
        <div className="glass-ultra p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg relative overflow-hidden card-3d">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>Net Operating Profit</span>
            <Sparkles size={14} className="text-cyan-400" />
          </div>
          <p className="text-base sm:text-xl font-black text-cyan-300 truncate">
            AED {formatCurrency(summaryTotals.totalNet)}
          </p>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-cyan-300 font-bold">
            <span>{summaryTotals.overallNetPct}%</span>
            <span className="text-zinc-400 font-normal">net margin retained</span>
          </div>
        </div>

        {/* Retained Closing Balance */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 glass-ultra p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-500/30 shadow-lg relative overflow-hidden card-3d bg-gradient-to-br from-amber-950/20 to-black/80">
          <div className="flex items-center justify-between text-amber-300 text-xs font-semibold mb-1">
            <span>Certified Balance</span>
            <ShieldCheck size={14} className="text-amber-400" />
          </div>
          <p className="text-base sm:text-xl font-black text-amber-300 truncate">
            AED {formatCurrency(summaryTotals.totalBalance)}
          </p>
          <p className="text-[10px] text-amber-200/80 mt-1.5 font-medium truncate">
            Certified month-end reserves
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. "6 MONTHS BEFORE REPORTS IN LINES" SECTION             */}
      {/* Multi-line Trailing Trend Chart                           */}
      {/* ========================================================= */}
      <div className="glass-ultra p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl relative">
        {/* Section Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <TrendingUp size={16} />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                6-Month Trailing Performance Trajectory (Multi-Line)
              </h2>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              Visual multi-line trend showing the 6 months preceding and including <span className="text-orange-400 font-bold">{formatMonthDisplay(anchorMonth)}</span>.
            </p>
          </div>

          {/* Anchor Month Selector & Metric Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 glass-pill px-2.5 py-1 rounded-xl text-xs border border-white/10">
              <Calendar size={13} className="text-orange-400" />
              <span className="text-zinc-400 hidden sm:inline">Reference Month:</span>
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
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, revenue: !prev.revenue }))}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all border ${
                  visibleLines.revenue
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-black/40 text-zinc-400 border-white/5 line-through opacity-60'
                }`}
              >
                ● Revenue
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, grossProfit: !prev.grossProfit }))}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all border ${
                  visibleLines.grossProfit
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-black/40 text-zinc-400 border-white/5 line-through opacity-60'
                }`}
              >
                ● Gross
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, outflows: !prev.outflows }))}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all border ${
                  visibleLines.outflows
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-black/40 text-zinc-400 border-white/5 line-through opacity-60'
                }`}
              >
                ● Outflows
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, netProfit: !prev.netProfit }))}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all border ${
                  visibleLines.netProfit
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-black/40 text-zinc-400 border-white/5 line-through opacity-60'
                }`}
              >
                ● Net Profit
              </button>
              <button
                onClick={() => setVisibleLines(prev => ({ ...prev, closingBalance: !prev.closingBalance }))}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all border ${
                  visibleLines.closingBalance
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-black/40 text-zinc-400 border-white/5 line-through opacity-60'
                }`}
              >
                ● Balance
              </button>
            </div>
          </div>
        </div>

        {/* The Recharts Multi-Line Visualization */}
        <div className="mt-4 w-full h-[250px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sixMonthsTrailingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                fontSize={10}
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
                  padding: '12px'
                }}
                formatter={(value: any, name: any) => {
                  return [`AED ${formatCurrency(Number(value))}`, name];
                }}
                labelFormatter={(label, items) => {
                  const item = items?.[0]?.payload;
                  return `${item?.fullName || label} ${item?.isClosed ? '(🔒 Closed)' : '(⚡ Preview)'}`;
                }}
              />

              {visibleLines.revenue && (
                <Line
                  type="monotone"
                  name="Revenue"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 7, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {visibleLines.grossProfit && (
                <Line
                  type="monotone"
                  name="Gross Profit"
                  dataKey="grossProfit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#10b981', stroke: '#fff', strokeWidth: 1 }}
                />
              )}

              {visibleLines.outflows && (
                <Line
                  type="monotone"
                  name="Disbursed Outflows"
                  dataKey="outflows"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3, fill: '#f43f5e' }}
                />
              )}

              {visibleLines.netProfit && (
                <Line
                  type="monotone"
                  name="Net Profit"
                  dataKey="netProfit"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#06b6d4' }}
                />
              )}

              {visibleLines.closingBalance && (
                <Line
                  type="monotone"
                  name="Closing Balance"
                  dataKey="closingBalance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trailing 6-Month Insights Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-3 border-t border-white/10">
          <div className="p-2 sm:p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 block font-medium">6-Month Total Revenue</span>
            <span className="text-xs sm:text-sm font-bold text-orange-400">
              AED {formatCurrency(sixMonthInsights.revSum)}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 block font-medium">6-Month Avg Net Profit</span>
            <span className="text-xs sm:text-sm font-bold text-cyan-300">
              AED {formatCurrency(sixMonthInsights.avgNet)}/mo
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 block font-medium">Average Operating Margin</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400">
              {sixMonthInsights.avgMargin}%
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] text-zinc-400 block font-medium">Peak Performance Period</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300">
              {sixMonthInsights.bestMonth}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. "ALL MONTHS SALES CLOSING REPORTS IN COLUMNS"         */}
      {/* Multi-Column Showcase & Comparative Bar Chart             */}
      {/* ========================================================= */}
      <div className="space-y-4">
        {/* Section Header & View Toggles */}
        <div className="glass-ultra p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <BarChart3 size={16} />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                All Months Sales Closing Reports (Columnar Showcase)
              </h2>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              Each month displayed side-by-side in its own dedicated audit column with itemized tariffs, profits, and cutoff parameters.
            </p>
          </div>

          {/* Controls: Search + View Mode + Mobile Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter month..."
                className="pl-7 pr-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-zinc-400 outline-none focus:border-orange-500 w-32 sm:w-40"
              />
            </div>

            {/* View Mode Toggle (Cards vs Chart) */}
            <div className="flex items-center p-1 rounded-xl bg-black/60 border border-white/10 text-xs">
              <button
                onClick={() => setColumnViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  columnViewMode === 'cards'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>Columns</span>
              </button>
              <button
                onClick={() => setColumnViewMode('chart')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  columnViewMode === 'chart'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart3 size={13} />
                <span>Bar Chart</span>
              </button>
            </div>

            {/* Mobile Layout Switcher (visible only on small screens) */}
            {columnViewMode === 'cards' && (
              <button
                onClick={() => setMobileLayoutMode(prev => prev === 'carousel' ? 'stacked' : 'carousel')}
                className="sm:hidden px-2.5 py-1.5 rounded-xl glass-pill text-zinc-300 text-xs font-semibold flex items-center gap-1 border border-white/10"
              >
                <SlidersHorizontal size={12} />
                <span>{mobileLayoutMode === 'carousel' ? 'Stacked' : 'Swipe'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Horizontal Month Jump Bar (Touch Friendly) */}
        {columnViewMode === 'cards' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar px-1">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter size={11} />
              Jump to:
            </span>
            {filteredMonthColumns.map(col => (
              <button
                key={col.month}
                onClick={() => handleScrollToMonth(col.month)}
                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all card-3d active:scale-95 border ${
                  col.isClosed
                    ? 'bg-black/60 text-zinc-200 border-white/10 hover:border-orange-500/50'
                    : 'bg-orange-500/15 text-orange-300 border-orange-500/40'
                }`}
              >
                {col.isClosed ? '🔒' : '⚡'} {col.monthName.split(' ')[0]} '{col.month.slice(2, 4)}
              </button>
            ))}
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW A: MULTI-COLUMN COMPARISON CARDS                   */}
        {/* ======================================================= */}
        {columnViewMode === 'cards' && (
          <div
            ref={columnsScrollRef}
            className={`
              ${mobileLayoutMode === 'carousel'
                ? 'flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scroll-smooth'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              }
            `}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {filteredMonthColumns.length === 0 ? (
              <div className="w-full glass-ultra p-8 rounded-2xl border border-white/10 text-center text-zinc-400">
                No monthly sales closing records match your search.
              </div>
            ) : (
              filteredMonthColumns.map((col) => {
                const grossMarginPct = col.totalRevenue > 0 ? ((col.grossProfit / col.totalRevenue) * 100).toFixed(1) : '0.0';
                const netMarginPct = col.totalRevenue > 0 ? ((col.netProfit / col.totalRevenue) * 100).toFixed(1) : '0.0';

                return (
                  <div
                    key={col.month}
                    id={`month-col-${col.month}`}
                    className={`
                      ${mobileLayoutMode === 'carousel' ? 'w-[86vw] sm:w-[320px] shrink-0 snap-center' : 'w-full'}
                      glass-ultra rounded-2xl sm:rounded-3xl border ${
                        col.isClosed ? 'border-white/15' : 'border-orange-500/40 shadow-[0_0_25px_rgba(234,88,12,0.15)]'
                      } p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden card-3d transition-all hover:border-orange-500/50
                    `}
                  >
                    {/* Top Glow Accent */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        col.isClosed
                          ? 'bg-gradient-to-r from-zinc-500 via-orange-400 to-amber-500'
                          : 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 animate-pulse'
                      }`}
                    />

                    <div>
                      {/* Column Header: Month, Status Badge & Cutoff */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                            {col.monthName}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-300 font-semibold">
                            <Clock size={12} className="text-orange-400" />
                            <span>Cutoff: <span className="text-orange-300 font-bold">{col.cutoffDate}</span></span>
                          </div>
                        </div>

                        <div>
                          {col.isClosed ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              <span>Closed</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1 animate-pulse">
                              <Sparkles size={10} />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Primary Billed Revenue Block */}
                      <div className="mt-3.5 p-3 rounded-xl bg-black/60 border border-white/5">
                        <div className="flex items-center justify-between text-zinc-400 text-[11px] font-medium">
                          <span>Billed Revenue</span>
                          <span className="text-orange-400 font-bold">{col.invoiceCount} invoices</span>
                        </div>
                        <p className="text-lg sm:text-xl font-black text-white mt-0.5">
                          AED {formatCurrency(col.totalRevenue)}
                        </p>
                      </div>

                      {/* Detailed Metric Rows Inside Column */}
                      <div className="mt-3 space-y-2 text-xs">
                        {/* Direct Shipment Costs */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-zinc-300 flex items-center gap-1.5">
                            <Truck size={12} className="text-zinc-400" />
                            <span>Direct Freight Costs</span>
                          </span>
                          <span className="font-semibold text-zinc-200">
                            AED {formatCurrency(col.directTariffs)}
                          </span>
                        </div>

                        {/* Gross Profit */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                          <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                            <TrendingUp size={12} className="text-emerald-400" />
                            <span>Gross Margin ({grossMarginPct}%)</span>
                          </span>
                          <span className="font-bold text-emerald-400">
                            AED {formatCurrency(col.grossProfit)}
                          </span>
                        </div>

                        {/* Vendor Disbursements */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-zinc-300 flex items-center gap-1.5">
                            <Users size={12} className="text-zinc-400" />
                            <span>Vendor Carrier Tariffs</span>
                          </span>
                          <span className="font-semibold text-zinc-200">
                            AED {formatCurrency(col.vendorPayments)}
                          </span>
                        </div>

                        {/* Commission Payments */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-zinc-300 flex items-center gap-1.5">
                            <DollarSign size={12} className="text-zinc-400" />
                            <span>Staff Commissions</span>
                          </span>
                          <span className="font-semibold text-zinc-200">
                            AED {formatCurrency(col.commissionPayments)}
                          </span>
                        </div>

                        {/* Company Expenses */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-zinc-300 flex items-center gap-1.5">
                            <Wallet size={12} className="text-zinc-400" />
                            <span>Operating Expenses</span>
                          </span>
                          <span className="font-semibold text-rose-300">
                            AED {formatCurrency(col.companyExpenses)}
                          </span>
                        </div>

                        {/* Net Operating Profit Highlight */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-emerald-950/40 border border-cyan-500/30">
                          <div className="flex items-center justify-between text-[11px] text-cyan-300 font-bold">
                            <span>Net Profit Margin</span>
                            <span>{netMarginPct}%</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-black text-cyan-200">Net Operating Profit</span>
                            <span className="text-sm font-black text-cyan-300">
                              AED {formatCurrency(col.netProfit)}
                            </span>
                          </div>
                        </div>

                        {/* Confirmed Closing Balance */}
                        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
                          <span className="text-xs text-amber-200 font-bold flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-amber-400" />
                            <span>Confirmed Balance</span>
                          </span>
                          <span className="text-sm font-black text-amber-300">
                            AED {formatCurrency(col.closingBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Post-Cutoff Attribution Tag */}
                      {col.rolledForwardCount > 0 && (
                        <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-300 font-medium flex items-center gap-1.5">
                          <ArrowRight size={12} className="shrink-0 text-orange-400" />
                          <span>
                            <strong>{col.rolledForwardCount} invoices</strong> entered after {col.cutoffDate} rolled forward to next month's sales cycle.
                          </span>
                        </div>
                      )}

                      {/* Auditor metadata (if closed) */}
                      {col.isClosed && col.closedByName && (
                        <div className="mt-2 text-[10px] text-zinc-400 font-medium">
                          Audited by <span className="text-zinc-300 font-semibold">{col.closedByName}</span> on {(col.closedAt || '').slice(0, 10)}
                        </div>
                      )}
                    </div>

                    {/* Column Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                      {/* PDF Report Download */}
                      <button
                        onClick={() => {
                          if (col.rawClosing) {
                            downloadMonthlyClosingPDF({
                              closing: col.rawClosing,
                              invoices,
                              companyInfo,
                              authorizedByName: currentUser.name
                            });
                          } else {
                            // Download draft preview PDF
                            downloadMonthlyClosingPDF({
                              closing: {
                                month: col.month,
                                monthName: col.monthName,
                                startDate: col.startDate,
                                cutoffDate: col.cutoffDate,
                                totalRevenue: col.totalRevenue,
                                grossProfit: col.grossProfit,
                                vendorPayments: col.vendorPayments,
                                commissionPayments: col.commissionPayments,
                                companyExpenses: col.companyExpenses,
                                netProfit: col.netProfit,
                                closingBalance: col.closingBalance,
                                isClosed: false
                              },
                              invoices,
                              companyInfo,
                              authorizedByName: currentUser.name,
                              isDraft: true
                            });
                          }
                        }}
                        className="flex-1 py-2 rounded-xl glass-pill hover:bg-white/10 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 card-3d active:scale-95 transition-all"
                        title="Download Statement (PDF)"
                      >
                        <Download size={13} className="text-orange-400" />
                        <span>PDF Report</span>
                      </button>

                      {/* Edit / Finalize Month */}
                      <button
                        onClick={() => onOpenClosingModal(col.month)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border card-3d active:scale-95 transition-all ${
                          col.isClosed
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/30'
                            : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-400/50 shadow-md shadow-orange-500/20'
                        }`}
                        title={col.isClosed ? 'Edit Closed Invoices & Cutoff' : 'Finalize & Close Month'}
                      >
                        <Edit3 size={13} />
                        <span>{col.isClosed ? 'Edit' : 'Close'}</span>
                      </button>

                      {/* Reopen Month (if closed) */}
                      {col.isClosed && (
                        <button
                          onClick={() => handleReopenMonth(col.month)}
                          className="p-2 rounded-xl glass-pill hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 card-3d active:scale-95 transition-all"
                          title="Re-open Month"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW B: COMPARATIVE COLUMN BAR CHART                    */}
        {/* ======================================================= */}
        {columnViewMode === 'chart' && (
          <div className="glass-ultra p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Multi-Month Comparative Column Chart (Revenue vs Direct Costs vs Net Profit)
                </h3>
                <p className="text-xs text-zinc-400">
                  Vertical side-by-side columns comparing performance metrics across all available months.
                </p>
              </div>
            </div>

            <div className="mt-4 w-full h-[300px] sm:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...filteredMonthColumns].reverse().map(col => ({
                    name: `${formatMonthDisplay(col.month).split(' ')[0].slice(0, 3)} '${col.month.slice(2, 4)}`,
                    month: col.month,
                    revenue: Math.round(col.totalRevenue),
                    tariffs: Math.round(col.directTariffs),
                    outflows: Math.round(col.totalOutflows),
                    netProfit: Math.round(col.netProfit)
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
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
                      boxShadow: '0 20px 50px 0 rgba(0,0,0,0.95)',
                      color: '#ffffff',
                      fontSize: '11px'
                    }}
                    formatter={(val: any, name: any) => [`AED ${formatCurrency(Number(val))}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Billed Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tariffs" name="Carrier Direct Tariffs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflows" name="Disbursed Outflows" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="Net Operating Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
