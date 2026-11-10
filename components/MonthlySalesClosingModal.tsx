import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Truck,
  Users,
  Wallet,
  ArrowRight,
  FileText,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Printer
} from 'lucide-react';
import { Invoice, Expense, AdjustmentNote, User, MonthlySalesClosing } from '../types';
import { formatCurrency } from '../utils';
import {
  calculateClosingPreview,
  saveMonthlyClosingToStorage,
  reopenMonthlyClosingInStorage,
  formatMonthDisplay,
  getNextMonthStr,
  getPrevMonthStr
} from '../monthlyClosingService';

interface MonthlySalesClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  expenses: Expense[];
  adjustmentNotes: AdjustmentNote[];
  closings: MonthlySalesClosing[];
  currentUser: User;
  onClosingsUpdated: (updated: MonthlySalesClosing[]) => void;
  defaultMonth?: string; // e.g. "2026-11"
}

export const MonthlySalesClosingModal: React.FC<MonthlySalesClosingModalProps> = ({
  isOpen,
  onClose,
  invoices,
  expenses,
  adjustmentNotes,
  closings,
  currentUser,
  onClosingsUpdated,
  defaultMonth
}) => {
  // Determine initial month to close (defaults to current calendar month or passed defaultMonth)
  const initialMonth = useMemo(() => {
    if (defaultMonth) return defaultMonth;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [defaultMonth]);

  const [activeTab, setActiveTab] = useState<'close-month' | 'closing-history'>('close-month');
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);

  // Default cutoff date to today or end of the selected month
  const defaultCutoff = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (selectedMonth === currentMonthStr) {
      // For current month, default cutoff to today's date
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // For past or other months, default to last day of that month
    const [yStr, mStr] = selectedMonth.split('-');
    const lastDay = new Date(parseInt(yStr, 10), parseInt(mStr, 10), 0).getDate();
    return `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
  }, [selectedMonth]);

  const [cutoffDate, setCutoffDate] = useState<string>(defaultCutoff);

  // Sync cutoff date when month changes
  useEffect(() => {
    setCutoffDate(defaultCutoff);
  }, [defaultCutoff]);

  // Existing closing record for selected month if already finalized
  const existingClosing = useMemo(() => {
    return closings.find(c => c.month === selectedMonth && c.isClosed) || null;
  }, [closings, selectedMonth]);

  // Auto-calculated preview figures based on eligible records up to cutoff date
  const preview = useMemo(() => {
    return calculateClosingPreview(selectedMonth, cutoffDate, invoices, expenses, adjustmentNotes, closings);
  }, [selectedMonth, cutoffDate, invoices, expenses, adjustmentNotes, closings]);

  // Form states for showing & updating monthly figures
  const [revenue, setRevenue] = useState<number>(0);
  const [grossProfit, setGrossProfit] = useState<number>(0);
  const [vendorPayments, setVendorPayments] = useState<number>(0);
  const [commissionPayments, setCommissionPayments] = useState<number>(0);
  const [companyExpenses, setCompanyExpenses] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [showInvoicesList, setShowInvoicesList] = useState<boolean>(false);
  const [confirmPrompt, setConfirmPrompt] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Populate form fields with auto-calculated values (or existing closed values)
  useEffect(() => {
    if (existingClosing) {
      setRevenue(existingClosing.totalRevenue);
      setGrossProfit(existingClosing.grossProfit);
      setVendorPayments(existingClosing.vendorPayments);
      setCommissionPayments(existingClosing.commissionPayments);
      setCompanyExpenses(existingClosing.companyExpenses);
      setClosingBalance(existingClosing.closingBalance);
      setNotes(existingClosing.notes || '');
      setCutoffDate(existingClosing.cutoffDate);
      setIsManualOverride(true);
    } else {
      setRevenue(preview.totalRevenue);
      setGrossProfit(preview.grossProfit);
      setVendorPayments(preview.vendorPayments);
      setCommissionPayments(preview.commissionPayments);
      setCompanyExpenses(preview.companyExpenses);
      setClosingBalance(preview.defaultClosingBalance);
      setNotes('');
      setIsManualOverride(false);
    }
  }, [existingClosing, preview]);

  // Dynamic calculated net profit from current form inputs
  const dynamicNetProfit = useMemo(() => {
    return grossProfit - companyExpenses;
  }, [grossProfit, companyExpenses]);

  // Days remaining calculation
  const daysRemainingInMonth = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (selectedMonth !== currentMonthStr) return 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return daysInMonth - now.getDate();
  }, [selectedMonth]);

  if (!isOpen) return null;

  const handleResetToAuto = () => {
    setRevenue(preview.totalRevenue);
    setGrossProfit(preview.grossProfit);
    setVendorPayments(preview.vendorPayments);
    setCommissionPayments(preview.commissionPayments);
    setCompanyExpenses(preview.companyExpenses);
    setClosingBalance(preview.defaultClosingBalance);
    setIsManualOverride(false);
  };

  const handleFinalizeClosing = () => {
    const newClosing: MonthlySalesClosing = {
      id: existingClosing?.id || `MSC-${selectedMonth}`,
      month: selectedMonth,
      monthName: formatMonthDisplay(selectedMonth),
      startDate: preview.startDate,
      cutoffDate: cutoffDate,
      closedAt: new Date().toISOString(),
      closedBy: currentUser.id,
      closedByName: currentUser.name,
      totalRevenue: Number(revenue) || 0,
      grossProfit: Number(grossProfit) || 0,
      vendorPayments: Number(vendorPayments) || 0,
      commissionPayments: Number(commissionPayments) || 0,
      companyExpenses: Number(companyExpenses) || 0,
      netProfit: Number(dynamicNetProfit) || 0,
      closingBalance: Number(closingBalance) || 0,
      notes: notes.trim(),
      isClosed: true,
      includedInvoiceIds: preview.eligibleInvoices.map(i => i.id)
    };

    const updatedClosings = saveMonthlyClosingToStorage(newClosing);
    onClosingsUpdated(updatedClosings);
    setConfirmPrompt(false);
    setSuccessToast(`${formatMonthDisplay(selectedMonth)} sales closing finalized! Post-cutoff sales roll forward to next month.`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleReopenClosing = (monthToReopen: string) => {
    if (window.confirm(`Are you sure you want to re-open ${formatMonthDisplay(monthToReopen)} sales closing? This will restore standard date-based attribution until re-closed.`)) {
      const updated = reopenMonthlyClosingInStorage(monthToReopen);
      onClosingsUpdated(updated);
      setSuccessToast(`${formatMonthDisplay(monthToReopen)} sales closing re-opened successfully.`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const nextMonthDisplay = formatMonthDisplay(getNextMonthStr(selectedMonth));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
      {/* Dark Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl glass-ultra rounded-3xl border border-orange-500/50 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(234,88,12,0.3)] overflow-hidden my-auto card-3d text-white max-h-[92vh] flex flex-col">
        {/* Scrawling Laser Beam Accent */}
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        {/* Ambient Top Glow Orbs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-600/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between relative z-10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-400 flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/40 card-3d">
              <Lock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">
                  Monthly Sales Closing & Revenue Finalization
                </h2>
                {existingClosing ? (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                    FINALIZED & CLOSED
                  </span>
                ) : daysRemainingInMonth <= 3 ? (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-500 text-black shadow-md shadow-orange-500/40 animate-pulse">
                    CLOSING WINDOW ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/50">
                    OPEN SALES CYCLE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 font-medium mt-0.5">
                Review and finalize monthly revenue, profit, vendor obligations, expenses, and confirm month closing balance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all card-3d active:scale-95 border border-white/10"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toast Alert */}
        {successToast && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-white/10 flex items-center justify-between text-xs font-bold bg-black/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('close-month')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'close-month'
                  ? 'border-orange-500 text-orange-400 font-black'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock size={14} />
              <span>Finalize & Update Monthly Sales</span>
            </button>
            <button
              onClick={() => setActiveTab('closing-history')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'closing-history'
                  ? 'border-orange-500 text-orange-400 font-black'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar size={14} />
              <span>Past Closings & Audit History ({closings.filter(c => c.isClosed).length})</span>
            </button>
          </div>

          {activeTab === 'close-month' && (
            <div className="flex items-center gap-2 pb-2">
              <span className="text-[11px] text-zinc-400">Target Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none focus:border-orange-500"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'close-month' ? (
            <>
              {/* Notification Banner / Explanation */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/70 via-black/80 to-amber-950/50 border border-orange-500/40 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 mt-0.5 shrink-0 border border-orange-500/30">
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <span className="text-white font-black block">
                      Monthly Accounting Rule: Post-Cutoff Sales Roll-Forward
                    </span>
                    <span className="text-zinc-300 font-medium">
                      Finalizing <strong>{formatMonthDisplay(selectedMonth)}</strong> up to <strong>{cutoffDate}</strong> will permanently finalize this month's totals.
                      Any sales entered with dates after {cutoffDate} will automatically be attributed to <strong>{nextMonthDisplay}</strong>'s sales report, while keeping original invoice dates untouched.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 text-[11px]">
                    <Clock size={12} className="text-orange-400" />
                    <span className="text-zinc-400">Cutoff Date:</span>
                    <input
                      type="date"
                      value={cutoffDate}
                      disabled={!!existingClosing}
                      onChange={(e) => setCutoffDate(e.target.value)}
                      className="bg-transparent text-white font-black outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Status Banner if Already Closed */}
              {existingClosing && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>
                      This month was finalized and closed on <strong>{new Date(existingClosing.closedAt).toLocaleString()}</strong> by <strong>{existingClosing.closedByName}</strong>.
                    </span>
                  </div>
                  {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
                    <button
                      onClick={() => handleReopenClosing(selectedMonth)}
                      className="px-3 py-1 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                    >
                      <RotateCcw size={12} />
                      <span>Re-open Month</span>
                    </button>
                  )}
                </div>
              )}

              {/* Metrics Grid with Show & Update Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Monthly Revenue */}
                <div className="p-4 rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      <DollarSign size={16} />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">Auto: {formatCurrency(preview.totalRevenue)}</span>
                  </div>
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                    Monthly Revenue (AED)
                  </label>
                  <p className="text-[10px] text-zinc-400 mb-2">Total eligible invoice amounts & net notes</p>
                  <input
                    type="number"
                    value={revenue}
                    disabled={!!existingClosing}
                    onChange={(e) => {
                      setRevenue(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-white focus:border-orange-500 outline-none shadow-inner"
                  />
                </div>

                {/* 2. Gross Profit Details */}
                <div className="p-4 rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <TrendingUp size={16} />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">Auto: {formatCurrency(preview.grossProfit)}</span>
                  </div>
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                    Gross Profit (AED)
                  </label>
                  <p className="text-[10px] text-zinc-400 mb-2">Revenue minus direct shipment costs</p>
                  <input
                    type="number"
                    value={grossProfit}
                    disabled={!!existingClosing}
                    onChange={(e) => {
                      setGrossProfit(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-emerald-400 focus:border-orange-500 outline-none shadow-inner"
                  />
                </div>

                {/* 3. Vendor Payments of the Month */}
                <div className="p-4 rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      <Truck size={16} />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">Auto: {formatCurrency(preview.vendorPayments)}</span>
                  </div>
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                    Vendor Payments (AED)
                  </label>
                  <p className="text-[10px] text-zinc-400 mb-2">Carrier & vendor bills paid this month</p>
                  <input
                    type="number"
                    value={vendorPayments}
                    disabled={!!existingClosing}
                    onChange={(e) => {
                      setVendorPayments(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-blue-300 focus:border-orange-500 outline-none shadow-inner"
                  />
                </div>

                {/* 4. Commission Payments of the Month */}
                <div className="p-4 rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <Users size={16} />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">Auto: {formatCurrency(preview.commissionPayments)}</span>
                  </div>
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                    Commission Payments (AED)
                  </label>
                  <p className="text-[10px] text-zinc-400 mb-2">Broker & agent commissions disbursed</p>
                  <input
                    type="number"
                    value={commissionPayments}
                    disabled={!!existingClosing}
                    onChange={(e) => {
                      setCommissionPayments(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-purple-300 focus:border-orange-500 outline-none shadow-inner"
                  />
                </div>

                {/* 5. Company Expenses of the Month */}
                <div className="p-4 rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Wallet size={16} />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">Auto: {formatCurrency(preview.companyExpenses)}</span>
                  </div>
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                    Company Expenses (AED)
                  </label>
                  <p className="text-[10px] text-zinc-400 mb-2">Rent, utilities, salaries, and office overhead</p>
                  <input
                    type="number"
                    value={companyExpenses}
                    disabled={!!existingClosing}
                    onChange={(e) => {
                      setCompanyExpenses(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-amber-300 focus:border-orange-500 outline-none shadow-inner"
                  />
                </div>

                {/* 6. Dynamic Calculated Net Profit */}
                <div className="p-4 rounded-2xl glass-ultra border border-orange-500/30 bg-gradient-to-br from-orange-950/40 via-black to-zinc-950 card-3d relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
                      <Sparkles size={16} />
                    </div>
                    <span className="text-[10px] text-orange-400 font-black">FORMULA RESULT</span>
                  </div>
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                    Calculated Net Profit
                  </label>
                  <p className="text-[10px] text-zinc-400 mb-2">Gross Profit − Company Expenses</p>
                  <div className="text-2xl font-black text-white mt-2">
                    {formatCurrency(dynamicNetProfit)}
                  </div>
                </div>

              </div>

              {/* 7. Confirmed Month Closing Balance / Profit Balance (Highlight Box) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/80 via-black to-amber-950/80 border-2 border-orange-500/70 shadow-[0_10px_35px_rgba(234,88,12,0.25)] relative overflow-hidden card-3d">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,1)]"></span>
                      <h4 className="text-base font-black text-white uppercase tracking-wider">
                        Confirmed Profit Balance / Month Closing Balance (AED)
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-300 font-medium">
                      Enter or confirm the final profit balance in hand/bank to officially seal {formatMonthDisplay(selectedMonth)}.
                    </p>
                  </div>

                  <div className="w-full sm:w-64">
                    <input
                      type="number"
                      value={closingBalance}
                      disabled={!!existingClosing}
                      onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/90 border-2 border-orange-400 rounded-xl px-4 py-2.5 text-2xl font-black text-orange-400 outline-none focus:ring-2 focus:ring-orange-500 shadow-inner text-right"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {isManualOverride && !existingClosing && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-medium">
                      * You have customized figures. Click reset to restore auto-calculated values from CRM database.
                    </span>
                    <button
                      onClick={handleResetToAuto}
                      className="text-orange-400 hover:underline font-bold"
                    >
                      Reset to Auto Values
                    </button>
                  </div>
                )}
              </div>

              {/* Notes & Auditor Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                  Closing Remarks & Auditor Notes
                </label>
                <textarea
                  value={notes}
                  disabled={!!existingClosing}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bank statement reconciled, VAT audited, November sales finalized as of Nov 28th."
                  rows={2}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500 font-medium"
                />
              </div>

              {/* Invoice Drilldown & Roll-forward Preview */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
                <button
                  onClick={() => setShowInvoicesList(!showInvoicesList)}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-orange-400" />
                    <span>
                      Included Invoices ({preview.eligibleInvoices.length} consignments • {formatCurrency(preview.totalRevenue)})
                    </span>
                    {preview.rolledForwardInvoices.length > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {preview.rolledForwardInvoices.length} roll forward to {nextMonthDisplay}
                      </span>
                    )}
                  </div>
                  {showInvoicesList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showInvoicesList && (
                  <div className="p-3 border-t border-white/10 max-h-56 overflow-y-auto space-y-2">
                    {preview.eligibleInvoices.length === 0 ? (
                      <p className="text-zinc-500 text-xs py-4 text-center">No invoices dated in this period.</p>
                    ) : (
                      preview.eligibleInvoices.map(inv => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-white">{inv.invoiceNumber}</span>
                            <span className="text-zinc-400">|</span>
                            <span className="text-zinc-300 truncate max-w-[140px]">{inv.customerName}</span>
                            <span className="text-[10px] text-zinc-500">({inv.date?.slice(0, 10)})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold">{formatCurrency(inv.totalAmount)}</span>
                            <span className="text-emerald-400 font-bold text-[11px]">(Profit: {formatCurrency(inv.profit || 0)})</span>
                          </div>
                        </div>
                      ))
                    )}

                    {preview.rolledForwardInvoices.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-amber-500/30">
                        <p className="text-[11px] font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                          <ArrowRight size={13} />
                          Post-Cutoff Invoices (Will be reported under {nextMonthDisplay} sales):
                        </p>
                        {preview.rolledForwardInvoices.map(inv => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs my-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-200">{inv.invoiceNumber}</span>
                              <span className="text-zinc-400">({inv.date?.slice(0, 10)})</span>
                              <span className="text-zinc-300 truncate max-w-[120px]">{inv.customerName}</span>
                            </div>
                            <span className="text-amber-300 font-bold">{formatCurrency(inv.totalAmount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Historical Closings View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-300">
                  Audit log of all finalized sales closings and their locked financial reports.
                </p>
              </div>

              {closings.filter(c => c.isClosed).length === 0 ? (
                <div className="text-center py-16 text-zinc-500 glass-ultra rounded-2xl border border-white/10">
                  <Calendar size={36} className="mx-auto mb-2 text-zinc-600" />
                  <p className="text-sm font-bold text-zinc-300">No Monthly Sales Closings Finalized Yet</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    When you close a month, its finalized revenue, profit, and audit logs will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {closings
                    .filter(c => c.isClosed)
                    .map(closing => (
                      <div
                        key={closing.id}
                        className="p-5 rounded-2xl glass-ultra border border-white/15 card-3d space-y-3 relative overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <Lock size={16} />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-white">{closing.monthName}</h3>
                              <p className="text-[11px] text-zinc-400">
                                Cutoff Date: <strong className="text-white">{closing.cutoffDate}</strong> • Closed on {new Date(closing.closedAt).toLocaleDateString()} by {closing.closedByName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                              Closing Balance: {formatCurrency(closing.closingBalance)}
                            </span>
                            {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
                              <button
                                onClick={() => handleReopenClosing(closing.month)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 transition-colors"
                                title="Re-open Closing"
                              >
                                <Unlock size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Breakdown Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] text-zinc-400 uppercase block font-bold">Revenue</span>
                            <span className="text-sm font-black text-white">{formatCurrency(closing.totalRevenue)}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] text-zinc-400 uppercase block font-bold">Gross Profit</span>
                            <span className="text-sm font-black text-emerald-400">{formatCurrency(closing.grossProfit)}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] text-zinc-400 uppercase block font-bold">Vendor Paid</span>
                            <span className="text-sm font-black text-blue-300">{formatCurrency(closing.vendorPayments)}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] text-zinc-400 uppercase block font-bold">Expenses</span>
                            <span className="text-sm font-black text-amber-300">{formatCurrency(closing.companyExpenses)}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[10px] text-zinc-400 uppercase block font-bold">Net Profit</span>
                            <span className="text-sm font-black text-orange-400">{formatCurrency(closing.netProfit)}</span>
                          </div>
                        </div>

                        {closing.notes && (
                          <div className="text-[11px] text-zinc-400 italic bg-white/5 p-2 rounded-lg border border-white/5">
                            "{closing.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-between bg-black/50 relative z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-bold transition-all card-3d active:scale-95 border border-white/10"
          >
            Cancel / Remind Later
          </button>

          {activeTab === 'close-month' && !existingClosing && (
            <div className="flex items-center gap-3">
              {confirmPrompt ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-orange-400 font-bold hidden sm:inline">
                    Confirm closing {formatMonthDisplay(selectedMonth)}?
                  </span>
                  <button
                    onClick={() => setConfirmPrompt(false)}
                    className="px-3 py-2 rounded-xl bg-white/10 text-zinc-300 text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalizeClosing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-black font-black text-xs shadow-lg shadow-orange-500/50 card-3d active:scale-95 flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>Confirm & Seal Closing</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmPrompt(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-black font-black text-xs shadow-lg shadow-orange-500/40 card-3d active:scale-95 flex items-center gap-1.5 transition-all"
                >
                  <Lock size={15} />
                  <span>Finalize & Save {formatMonthDisplay(selectedMonth)} Sales Closing</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
