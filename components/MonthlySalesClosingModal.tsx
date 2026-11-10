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
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Edit3,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Check
} from 'lucide-react';
import { Invoice, Expense, AdjustmentNote, User, MonthlySalesClosing } from '../types';
import { formatCurrency } from '../utils';
import {
  calculateClosingPreview,
  calculateTotalsForInvoices,
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
  // Determine initial month to close
  const initialMonth = useMemo(() => {
    if (defaultMonth) return defaultMonth;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [defaultMonth]);

  const [activeTab, setActiveTab] = useState<'close-month' | 'closing-history'>('close-month');
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);

  // Default cutoff date
  const defaultCutoff = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (selectedMonth === currentMonthStr) {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const [yStr, mStr] = selectedMonth.split('-');
    const lastDay = new Date(parseInt(yStr, 10), parseInt(mStr, 10), 0).getDate();
    return `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
  }, [selectedMonth]);

  const [cutoffDate, setCutoffDate] = useState<string>(defaultCutoff);

  // Sync cutoff date when month changes
  useEffect(() => {
    setCutoffDate(defaultCutoff);
  }, [defaultCutoff]);

  // Existing closing record for selected month
  const existingClosing = useMemo(() => {
    return closings.find(c => c.month === selectedMonth && c.isClosed) || null;
  }, [closings, selectedMonth]);

  // Edit Mode state (unlocked if editing an existing closed month, or always true if month is open)
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Sync edit mode: if no closing exists, edit mode is true by default
  useEffect(() => {
    if (!existingClosing) {
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [existingClosing, selectedMonth]);

  // Auto-calculated preview figures
  const preview = useMemo(() => {
    return calculateClosingPreview(selectedMonth, cutoffDate, invoices, expenses, adjustmentNotes, closings);
  }, [selectedMonth, cutoffDate, invoices, expenses, adjustmentNotes, closings]);

  // Included Invoices Selection (IDs)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  const [invoiceDrawerTab, setInvoiceDrawerTab] = useState<'included' | 'available'>('included');

  // Populate selected invoice IDs from existing closing or auto-preview
  useEffect(() => {
    if (existingClosing && Array.isArray(existingClosing.includedInvoiceIds)) {
      setSelectedInvoiceIds(existingClosing.includedInvoiceIds);
    } else {
      setSelectedInvoiceIds(preview.eligibleInvoices.map(i => i.id));
    }
  }, [existingClosing, preview.eligibleInvoices, selectedMonth]);

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

  // Dynamic calculated net profit
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

  // Invoices currently included in this month
  const includedInvoices = useMemo(() => {
    return invoices.filter(inv => selectedInvoiceIds.includes(inv.id));
  }, [invoices, selectedInvoiceIds]);

  // Invoices available to be added to this month (not currently selected, and not in another closed month)
  const availableToAddInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Must not be already included
      if (selectedInvoiceIds.includes(inv.id)) return false;

      // Must not belong to ANOTHER closed month
      const otherClosing = closings.find(c => c.month !== selectedMonth && c.isClosed && c.includedInvoiceIds?.includes(inv.id));
      if (otherClosing) return false;

      return true;
    });
  }, [invoices, selectedInvoiceIds, closings, selectedMonth]);

  // Filtered included invoices by search query
  const filteredIncludedInvoices = useMemo(() => {
    if (!invoiceSearchQuery.trim()) return includedInvoices;
    const q = invoiceSearchQuery.toLowerCase();
    return includedInvoices.filter(i =>
      i.invoiceNumber?.toLowerCase().includes(q) ||
      i.customerName?.toLowerCase().includes(q) ||
      i.destinationCountry?.toLowerCase().includes(q)
    );
  }, [includedInvoices, invoiceSearchQuery]);

  // Filtered available invoices by search query
  const filteredAvailableInvoices = useMemo(() => {
    if (!invoiceSearchQuery.trim()) return availableToAddInvoices;
    const q = invoiceSearchQuery.toLowerCase();
    return availableToAddInvoices.filter(i =>
      i.invoiceNumber?.toLowerCase().includes(q) ||
      i.customerName?.toLowerCase().includes(q) ||
      i.destinationCountry?.toLowerCase().includes(q)
    );
  }, [availableToAddInvoices, invoiceSearchQuery]);

  // Add invoice to this month
  const handleAddInvoice = (invId: string) => {
    if (!selectedInvoiceIds.includes(invId)) {
      setSelectedInvoiceIds(prev => [...prev, invId]);
      setIsManualOverride(true);
    }
  };

  // Remove invoice from this month
  const handleRemoveInvoice = (invId: string) => {
    setSelectedInvoiceIds(prev => prev.filter(id => id !== invId));
    setIsManualOverride(true);
  };

  // Recalculate totals from currently selected invoices
  const handleRecalculateFromSelectedInvoices = () => {
    const totals = calculateTotalsForInvoices(includedInvoices, preview.eligibleAdjustments, companyExpenses);
    setRevenue(totals.totalRevenue);
    setGrossProfit(totals.grossProfit);
    setVendorPayments(totals.vendorPayments);
    setCommissionPayments(totals.commissionPayments);
    setClosingBalance(totals.netProfit);
    setIsManualOverride(true);
    setSuccessToast(`Financial totals recalculated from ${includedInvoices.length} selected invoices!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleResetToAuto = () => {
    setRevenue(preview.totalRevenue);
    setGrossProfit(preview.grossProfit);
    setVendorPayments(preview.vendorPayments);
    setCommissionPayments(preview.commissionPayments);
    setCompanyExpenses(preview.companyExpenses);
    setClosingBalance(preview.defaultClosingBalance);
    setSelectedInvoiceIds(preview.eligibleInvoices.map(i => i.id));
    setIsManualOverride(false);
  };

  const handleSaveOrUpdateClosing = () => {
    const isEditing = !!existingClosing;
    const updatedClosing: MonthlySalesClosing = {
      id: existingClosing?.id || `MSC-${selectedMonth}`,
      month: selectedMonth,
      monthName: formatMonthDisplay(selectedMonth),
      startDate: preview.startDate,
      cutoffDate: cutoffDate,
      closedAt: existingClosing?.closedAt || new Date().toISOString(),
      closedBy: existingClosing?.closedBy || currentUser.id,
      closedByName: existingClosing?.closedByName || currentUser.name,
      updatedAt: isEditing ? new Date().toISOString() : undefined,
      updatedBy: isEditing ? currentUser.id : undefined,
      updatedByName: isEditing ? currentUser.name : undefined,
      totalRevenue: Number(revenue) || 0,
      grossProfit: Number(grossProfit) || 0,
      vendorPayments: Number(vendorPayments) || 0,
      commissionPayments: Number(commissionPayments) || 0,
      companyExpenses: Number(companyExpenses) || 0,
      netProfit: Number(dynamicNetProfit) || 0,
      closingBalance: Number(closingBalance) || 0,
      notes: notes.trim(),
      isClosed: true,
      includedInvoiceIds: selectedInvoiceIds
    };

    const updatedClosings = saveMonthlyClosingToStorage(updatedClosing);
    onClosingsUpdated(updatedClosings);
    setConfirmPrompt(false);
    setIsEditMode(false);
    setSuccessToast(
      isEditing
        ? `${formatMonthDisplay(selectedMonth)} sales closing updated successfully with ${selectedInvoiceIds.length} invoices!`
        : `${formatMonthDisplay(selectedMonth)} sales closing finalized! Post-cutoff sales roll forward to next month.`
    );
    setTimeout(() => {
      setSuccessToast(null), 4000;
    });
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

  if (!isOpen) return null;

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
                  isEditMode ? (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-black shadow-md shadow-amber-500/40 animate-pulse">
                      EDITING CLOSED MONTH
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                      FINALIZED & CLOSED
                    </span>
                  )
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
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setIsEditMode(false);
                }}
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
                      disabled={existingClosing && !isEditMode}
                      onChange={(e) => setCutoffDate(e.target.value)}
                      className={`bg-transparent text-white font-black outline-none ${
                        existingClosing && !isEditMode ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status Banner if Already Closed + Edit Mode Actions */}
              {existingClosing && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                  isEditMode
                    ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                    : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isEditMode ? (
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Edit3 size={15} />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={15} />
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-white block">
                        {isEditMode
                          ? `Edit Mode Active for ${formatMonthDisplay(selectedMonth)}`
                          : `${formatMonthDisplay(selectedMonth)} Finalized & Closed`}
                      </span>
                      <span className="text-zinc-300 text-[11px]">
                        Closed on {new Date(existingClosing.closedAt).toLocaleString()} by {existingClosing.closedByName}
                        {existingClosing.updatedAt && (
                          <span className="ml-1.5 text-amber-300">
                            (Last edited {new Date(existingClosing.updatedAt).toLocaleDateString()} by {existingClosing.updatedByName})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
                      <>
                        {isEditMode ? (
                          <button
                            onClick={() => setIsEditMode(false)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 border border-white/10 text-xs font-bold transition-all active:scale-95"
                          >
                            Cancel Edit
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsEditMode(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 text-black text-xs font-black shadow-md shadow-orange-500/30 flex items-center gap-1.5 card-3d active:scale-95 transition-all hover:scale-105"
                          >
                            <Edit3 size={13} />
                            <span>Edit Closing & Invoices</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleReopenClosing(selectedMonth)}
                          className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                          title="Re-open month closing to unlock standard period reporting"
                        >
                          <RotateCcw size={12} />
                          <span>Re-open</span>
                        </button>
                      </>
                    )}
                  </div>
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
                    disabled={existingClosing && !isEditMode}
                    onChange={(e) => {
                      setRevenue(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-white focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
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
                    disabled={existingClosing && !isEditMode}
                    onChange={(e) => {
                      setGrossProfit(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-emerald-400 focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
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
                    disabled={existingClosing && !isEditMode}
                    onChange={(e) => {
                      setVendorPayments(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-blue-300 focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
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
                    disabled={existingClosing && !isEditMode}
                    onChange={(e) => {
                      setCommissionPayments(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-purple-300 focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
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
                    disabled={existingClosing && !isEditMode}
                    onChange={(e) => {
                      setCompanyExpenses(parseFloat(e.target.value) || 0);
                      setIsManualOverride(true);
                    }}
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-lg font-black text-amber-300 focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
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
                      disabled={existingClosing && !isEditMode}
                      onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
                      className={`w-full bg-black/90 border-2 border-orange-400 rounded-xl px-4 py-2.5 text-2xl font-black text-orange-400 outline-none focus:ring-2 focus:ring-orange-500 shadow-inner text-right ${
                        existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {isManualOverride && (!existingClosing || isEditMode) && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-medium">
                      * You have customized figures or invoice selections. Click reset to restore auto-calculated values.
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
                  disabled={existingClosing && !isEditMode}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bank statement reconciled, VAT audited, November sales finalized as of Nov 28th."
                  rows={2}
                  className={`w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500 font-medium ${
                    existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* INVOICE MANAGEMENT PANEL: ADD OR REMOVE INVOICES */}
              <div className="border border-white/15 rounded-2xl overflow-hidden bg-black/40 shadow-xl">
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/60 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-orange-400" />
                    <div>
                      <span className="text-xs font-black text-white block">
                        Manage Invoices in {formatMonthDisplay(selectedMonth)} ({selectedInvoiceIds.length} Included)
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Add newly created invoices or remove consignments to roll them forward to next month
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(!existingClosing || isEditMode) && (
                      <button
                        onClick={handleRecalculateFromSelectedInvoices}
                        className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-[10px] font-black flex items-center gap-1 transition-all active:scale-95"
                        title="Update Revenue, Profit, and Vendor figures from the selected invoices"
                      >
                        <RefreshCw size={11} />
                        <span>Recalculate Totals from Selection</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowInvoicesList(!showInvoicesList)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
                    >
                      {showInvoicesList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Panel */}
                {showInvoicesList && (
                  <div className="p-4 space-y-3">
                    {/* Subtabs for Included vs Available to Add + Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInvoiceDrawerTab('included')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            invoiceDrawerTab === 'included'
                              ? 'bg-orange-500 text-black font-black shadow-md shadow-orange-500/30'
                              : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          <Check size={13} />
                          <span>Included Invoices ({selectedInvoiceIds.length})</span>
                        </button>

                        {(!existingClosing || isEditMode) && (
                          <button
                            onClick={() => setInvoiceDrawerTab('available')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              invoiceDrawerTab === 'available'
                                ? 'bg-orange-500 text-black font-black shadow-md shadow-orange-500/30'
                                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            <Plus size={13} />
                            <span>Add Other Invoices ({availableToAddInvoices.length})</span>
                          </button>
                        )}
                      </div>

                      {/* Search box */}
                      <div className="relative w-full sm:w-60">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={invoiceSearchQuery}
                          onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                          placeholder="Search invoice # or client..."
                          className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Tab 1: Included Invoices */}
                    {invoiceDrawerTab === 'included' && (
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                        {filteredIncludedInvoices.length === 0 ? (
                          <div className="text-center py-8 text-zinc-500 text-xs">
                            No invoices included. Switch to "Add Other Invoices" tab to attach consignments to this month.
                          </div>
                        ) : (
                          filteredIncludedInvoices.map(inv => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs hover:border-white/15 transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-black text-white">{inv.invoiceNumber}</span>
                                <span className="text-zinc-500">|</span>
                                <span className="text-zinc-300 font-medium truncate max-w-[150px]">{inv.customerName}</span>
                                <span className="text-[10px] text-zinc-400">({inv.date?.slice(0, 10)})</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-white font-bold">{formatCurrency(inv.totalAmount)}</span>
                                <span className="text-emerald-400 font-bold text-[11px]">(Profit: {formatCurrency(inv.profit || 0)})</span>

                                {(!existingClosing || isEditMode) && (
                                  <button
                                    onClick={() => handleRemoveInvoice(inv.id)}
                                    className="p-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 ml-1"
                                    title="Remove this invoice from this month (will roll forward into next month)"
                                  >
                                    <Trash2 size={12} />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Tab 2: Available Invoices to Add */}
                    {invoiceDrawerTab === 'available' && (!existingClosing || isEditMode) && (
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                        {filteredAvailableInvoices.length === 0 ? (
                          <div className="text-center py-8 text-zinc-500 text-xs">
                            No additional unclosed invoices found. All relevant invoices are already included or in other closed periods.
                          </div>
                        ) : (
                          filteredAvailableInvoices.map(inv => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs hover:border-amber-500/40 transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-amber-200">{inv.invoiceNumber}</span>
                                <span className="text-zinc-500">|</span>
                                <span className="text-zinc-300 truncate max-w-[150px]">{inv.customerName}</span>
                                <span className="text-[10px] text-zinc-400">({inv.date?.slice(0, 10)})</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-white font-bold">{formatCurrency(inv.totalAmount)}</span>
                                <span className="text-emerald-400 font-bold text-[11px]">(Profit: {formatCurrency(inv.profit || 0)})</span>

                                <button
                                  onClick={() => handleAddInvoice(inv.id)}
                                  className="px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 text-black text-[10px] font-black flex items-center gap-1 shadow-md shadow-orange-500/20 transition-all active:scale-95 ml-1"
                                  title="Add this invoice to this monthly closing"
                                >
                                  <Plus size={12} />
                                  <span>Add to Month</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {preview.rolledForwardInvoices.length > 0 && (
                      <div className="pt-2 border-t border-amber-500/30 text-[11px] text-amber-300">
                        ⚡ <strong>{preview.rolledForwardInvoices.length}</strong> invoices entered after cutoff date {cutoffDate} will automatically be attributed to <strong>{nextMonthDisplay}</strong>'s sales report unless manually added above.
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
                                Cutoff: <strong className="text-white">{closing.cutoffDate}</strong> • Closed on {new Date(closing.closedAt).toLocaleDateString()} by {closing.closedByName}
                                {closing.includedInvoiceIds && (
                                  <span className="text-orange-400 font-bold ml-1.5">
                                    ({closing.includedInvoiceIds.length} Invoices Locked)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                              Closing Balance: {formatCurrency(closing.closingBalance)}
                            </span>

                            {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedMonth(closing.month);
                                    setActiveTab('close-month');
                                    setIsEditMode(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 border border-orange-500/30 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                                  title="Edit this closing's details and invoice selections"
                                >
                                  <Edit3 size={12} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  onClick={() => handleReopenClosing(closing.month)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 transition-colors"
                                  title="Re-open Closing"
                                >
                                  <Unlock size={14} />
                                </button>
                              </>
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

          {activeTab === 'close-month' && (!existingClosing || isEditMode) && (
            <div className="flex items-center gap-3">
              {confirmPrompt ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-orange-400 font-bold hidden sm:inline">
                    Confirm saving {formatMonthDisplay(selectedMonth)}?
                  </span>
                  <button
                    onClick={() => setConfirmPrompt(false)}
                    className="px-3 py-2 rounded-xl bg-white/10 text-zinc-300 text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveOrUpdateClosing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-black font-black text-xs shadow-lg shadow-orange-500/50 card-3d active:scale-95 flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>Confirm & Save</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmPrompt(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-black font-black text-xs shadow-lg shadow-orange-500/40 card-3d active:scale-95 flex items-center gap-1.5 transition-all"
                >
                  <Save size={15} />
                  <span>
                    {existingClosing
                      ? `Update & Save ${formatMonthDisplay(selectedMonth)} Closing (${selectedInvoiceIds.length} Invoices)`
                      : `Finalize & Save ${formatMonthDisplay(selectedMonth)} Sales Closing`}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
