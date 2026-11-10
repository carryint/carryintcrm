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
  Check,
  Download,
  Printer
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Expense, AdjustmentNote, User, MonthlySalesClosing, CompanyInfo } from '../types';
import { formatCurrency } from '../utils';
import { COMPANY_INFO as DEFAULT_COMPANY_INFO } from '../constants';
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
  companyInfo?: CompanyInfo;
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
  defaultMonth,
  companyInfo
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

  // Today formatted as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // 3 days before month-end formatted as YYYY-MM-DD (e.g. 28th for 30-day month)
  const threeDaysBeforeMonthEndStr = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const targetDay = Math.max(1, lastDay - 2);
    return `${selectedMonth}-${String(targetDay).padStart(2, '0')}`;
  }, [selectedMonth]);

  // Last day of month formatted as YYYY-MM-DD
  const monthEndStr = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const lastDay = new Date(y, m, 0).getDate();
    return `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
  }, [selectedMonth]);

  // Automatic default cutoff date for closing
  const autoDefaultCutoff = useMemo(() => {
    const currentMonthStr = todayStr.slice(0, 7);
    if (selectedMonth === currentMonthStr) {
      return todayStr;
    }
    return monthEndStr;
  }, [selectedMonth, todayStr, monthEndStr]);

  // Cutoff Date Selection Mode: 'auto' (automatic default date) | 'custom' (choose date)
  const [cutoffMode, setCutoffMode] = useState<'auto' | 'custom'>('auto');
  const [cutoffDate, setCutoffDate] = useState<string>(autoDefaultCutoff);

  // Sync cutoff date when month changes or when in auto mode
  useEffect(() => {
    if (cutoffMode === 'auto') {
      setCutoffDate(autoDefaultCutoff);
    }
  }, [autoDefaultCutoff, cutoffMode]);

  // Existing closing record for selected month
  const existingClosing = useMemo(() => {
    return closings.find(c => c.month === selectedMonth && c.isClosed) || null;
  }, [closings, selectedMonth]);

  // Edit Mode state
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
      if (existingClosing.cutoffDate === autoDefaultCutoff) {
        setCutoffMode('auto');
      } else {
        setCutoffMode('custom');
      }
      setIsManualOverride(true);
    } else {
      setRevenue(preview.totalRevenue);
      setGrossProfit(preview.grossProfit);
      setVendorPayments(preview.vendorPayments);
      setCommissionPayments(preview.commissionPayments);
      setCompanyExpenses(preview.companyExpenses);
      setClosingBalance(preview.defaultClosingBalance);
      setNotes('');
      setCutoffMode('auto');
      setCutoffDate(autoDefaultCutoff);
      setIsManualOverride(false);
    }
  }, [existingClosing, preview, autoDefaultCutoff]);

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

  // Invoices available to be added to this month
  const availableToAddInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (selectedInvoiceIds.includes(inv.id)) return false;
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
    setCutoffMode('auto');
    setCutoffDate(autoDefaultCutoff);
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

  // ---------------------------------------------------------
  // PROFESSIONAL CORPORATE CLOSING REPORT PDF EXPORT
  // ---------------------------------------------------------
  const handleDownloadPDF = (closingToDownload?: MonthlySalesClosing) => {
    try {
      const isTargetClosing = !!closingToDownload;
      const targetMonthName = isTargetClosing ? closingToDownload.monthName : formatMonthDisplay(selectedMonth);
      const targetMonthStr = isTargetClosing ? closingToDownload.month : selectedMonth;
      const targetCutoff = isTargetClosing ? closingToDownload.cutoffDate : cutoffDate;
      const targetStart = isTargetClosing ? closingToDownload.startDate : preview.startDate;
      const targetRevenue = isTargetClosing ? closingToDownload.totalRevenue : revenue;
      const targetGrossProfit = isTargetClosing ? closingToDownload.grossProfit : grossProfit;
      const targetVendorPayments = isTargetClosing ? closingToDownload.vendorPayments : vendorPayments;
      const targetCommissions = isTargetClosing ? closingToDownload.commissionPayments : commissionPayments;
      const targetExpenses = isTargetClosing ? closingToDownload.companyExpenses : companyExpenses;
      const targetNetProfit = isTargetClosing ? closingToDownload.netProfit : dynamicNetProfit;
      const targetClosingBalance = isTargetClosing ? closingToDownload.closingBalance : closingBalance;
      const targetNotes = isTargetClosing ? (closingToDownload.notes || '') : notes;
      const targetClosedByName = isTargetClosing ? closingToDownload.closedByName : currentUser.name;
      const targetClosedAt = isTargetClosing ? closingToDownload.closedAt : (existingClosing ? existingClosing.closedAt : undefined);
      const targetStatus = isTargetClosing ? 'FINALIZED & OFFICIALLY SEALED' : (existingClosing ? 'FINALIZED & OFFICIALLY SEALED' : 'CLOSING REVENUE PREVIEW');

      // Invoices list for PDF table
      const targetInvoices = isTargetClosing
        ? invoices.filter(inv => closingToDownload.includedInvoiceIds?.includes(inv.id))
        : includedInvoices;

      const doc = new jsPDF('p', 'mm', 'a4');
      const comp = companyInfo || DEFAULT_COMPANY_INFO;

      // Header Banner (Dark Charcoal / Orange accent)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 38, 'F');

      // Orange Accent Border
      doc.setFillColor(249, 115, 22); // orange-500
      doc.rect(0, 38, 210, 2, 'F');

      // Header Brand Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(comp.name.toUpperCase(), 15, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`${comp.address} | Tel: ${comp.contact} | Email: ${comp.email}`, 15, 21);
      doc.text(`TRN: ${(comp as any)?.trn || '100456209800003'} | Official Financial Statement`, 15, 27);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(251, 146, 60); // orange-400
      doc.text(`STATUS: ${targetStatus}`, 15, 33);

      // Document Title Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(`MONTHLY SALES CLOSING & REVENUE REPORT`, 15, 48);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Reporting Period: ${targetMonthName} (${targetStart} to ${targetCutoff}) | Cutoff Date: ${targetCutoff}`, 15, 54);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Authorized By: ${targetClosedByName}`, 15, 59);

      // Section 1: Executive Financial Summary Table
      const summaryHeaders = [['Financial Metric', 'Amount (AED)', 'Operational Context']];
      const grossMarginPct = targetRevenue > 0 ? ((targetGrossProfit / targetRevenue) * 100).toFixed(1) : '0.0';
      const netMarginPct = targetRevenue > 0 ? ((targetNetProfit / targetRevenue) * 100).toFixed(1) : '0.0';

      const summaryRows = [
        ['Monthly Billed Revenue', formatCurrency(targetRevenue), 'Total invoice billing & net adjustments'],
        ['Direct Shipment / Carrier Costs', formatCurrency(targetRevenue - targetGrossProfit), 'Freight line haul, air waybill, & courier tariffs'],
        ['Gross Profit Contribution', formatCurrency(targetGrossProfit), `Gross Margin: ${grossMarginPct}% on sales`],
        ['Vendor Payments Disbursed', formatCurrency(targetVendorPayments), 'Settled carrier and supplier obligations'],
        ['Broker & Commission Disbursed', formatCurrency(targetCommissions), 'Agent fees and partner commissions settled'],
        ['Company Operating Expenses', formatCurrency(targetExpenses), 'Office rent, utilities, overhead & staff costs'],
        ['Calculated Net Profit', formatCurrency(targetNetProfit), `Net Operating Margin: ${netMarginPct}% retained`],
        ['CONFIRMED MONTH CLOSING BALANCE', formatCurrency(targetClosingBalance), 'Officially certified closing profit balance in accounts']
      ];

      autoTable(doc, {
        startY: 64,
        head: summaryHeaders,
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { fontStyle: 'bold', halign: 'right', cellWidth: 45 },
          2: { fontSize: 7.5, textColor: [100, 116, 139], cellWidth: 65 }
        },
        didParseCell: (data) => {
          if (data.row.index === summaryRows.length - 1 && data.section === 'body') {
            data.cell.styles.fillColor = [254, 243, 199]; // amber-100
            data.cell.styles.textColor = [180, 83, 9];   // amber-700
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 15, right: 15 }
      });

      let nextY = (doc as any).lastAutoTable.finalY + 8;

      // Accounting Rule Notice Box
      doc.setFillColor(254, 242, 242);
      doc.rect(15, nextY, 180, 13, 'F');
      doc.setDrawColor(251, 146, 60);
      doc.rect(15, nextY, 180, 13, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(194, 65, 12);
      doc.text('POST-CUTOFF SALES ROLL-FORWARD NOTICE:', 18, nextY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(75, 85, 99);
      doc.text(`Invoices entered after cutoff date (${targetCutoff}) automatically roll forward to next month's sales report. Original dates on individual customer billing invoices remain intact.`, 18, nextY + 9.5);

      nextY += 18;

      // Section 2: Included Consignments / Invoices Schedule
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`INVOICES & SHIPMENTS FINALIZED IN THIS MONTH (${targetInvoices.length} Consignments)`, 15, nextY);

      const invoiceHeaders = [['#', 'Invoice Number', 'Date', 'Customer Name', 'Destination', 'Total (AED)', 'Profit (AED)']];
      const invoiceRows = targetInvoices.map((inv, idx) => [
        (idx + 1).toString(),
        inv.invoiceNumber || '-',
        (inv.date || '').slice(0, 10),
        (inv.customerName || '-').slice(0, 24),
        (inv.destinationCountry || '-').slice(0, 16),
        formatCurrency(inv.totalAmount || 0),
        formatCurrency(inv.profit || 0)
      ]);

      const totalBilledSum = targetInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
      const totalProfitSum = targetInvoices.reduce((s, i) => s + (i.profit || 0), 0);
      invoiceRows.push([
        '',
        `Total: ${targetInvoices.length}`,
        '',
        'Consolidated Schedule Totals',
        '',
        formatCurrency(totalBilledSum),
        formatCurrency(totalProfitSum)
      ]);

      autoTable(doc, {
        startY: nextY + 4,
        head: invoiceHeaders,
        body: invoiceRows,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { fontStyle: 'bold', cellWidth: 26 },
          2: { cellWidth: 20 },
          3: { cellWidth: 48 },
          4: { cellWidth: 26 },
          5: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
          6: { halign: 'right', cellWidth: 26 }
        },
        didParseCell: (data) => {
          if (data.row.index === invoiceRows.length - 1 && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
          }
        },
        margin: { left: 15, right: 15 }
      });

      // Section 3: Auditor Signatures & Notes
      let signY = (doc as any).lastAutoTable.finalY + 9;
      if (signY > 240) {
        doc.addPage();
        signY = 25;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('AUDITOR & MANAGEMENT SIGN-OFF:', 15, signY);

      if (targetNotes) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Notes: "${targetNotes}"`, 15, signY + 4.5);
        signY += 5;
      }

      signY += 11;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);

      // Left: Prepared By
      doc.line(15, signY, 85, signY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`Prepared By: ${targetClosedByName}`, 15, signY + 3.5);
      doc.text(`Date: ${targetClosedAt ? new Date(targetClosedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 15, signY + 7);

      // Right: Approved / Company Stamp
      doc.line(125, signY, 195, signY);
      doc.text('Managing Director / Financial Controller', 125, signY + 3.5);
      doc.text('Carryint Shipping Services L.L.C (Official Stamp)', 125, signY + 7);

      // Save PDF
      doc.save(`CarryInt_Sales_Closing_Report_${targetMonthStr}_${targetCutoff}.pdf`);
      setSuccessToast(`Closing report PDF downloaded successfully for ${targetMonthName}!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error('Error generating closing PDF:', err);
      alert('Could not generate PDF. Please try again.');
    }
  };

  const nextMonthDisplay = formatMonthDisplay(getNextMonthStr(selectedMonth));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto no-print">
      {/* Dark Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container: Full Screen Height on Mobile, Touch-Friendly */}
      <div className="relative w-full max-w-4xl glass-ultra rounded-2xl sm:rounded-3xl border border-orange-500/50 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(234,88,12,0.3)] overflow-hidden my-auto card-3d text-white h-[94vh] sm:h-auto max-h-[94vh] flex flex-col">
        {/* Scrawling Laser Beam Accent */}
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        {/* Ambient Top Glow Orbs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-600/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header: Responsive Flex */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-start sm:items-center justify-between relative z-10 bg-black/40 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-400 flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/40 card-3d shrink-0">
              <Lock size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-xl font-black text-white tracking-tight drop-shadow-sm truncate">
                  Monthly Sales Closing
                </h2>
                {existingClosing ? (
                  isEditMode ? (
                    <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-md shadow-amber-500/40 animate-pulse">
                      EDITING
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                      FINALIZED
                    </span>
                  )
                ) : daysRemainingInMonth <= 3 ? (
                  <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500 text-black shadow-md shadow-orange-500/40 animate-pulse">
                    WINDOW ACTIVE
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-500/50">
                    OPEN CYCLE
                  </span>
                )}
              </div>
              <p className="text-[10.5px] sm:text-xs text-zinc-300 font-medium truncate mt-0.5">
                Finalize revenue, profit, vendor obligations, and closing balance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Header Download PDF Button */}
            <button
              onClick={() => handleDownloadPDF()}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all card-3d active:scale-95 flex items-center gap-1.5 border border-white/15"
              title="Download Official Closing PDF Report"
            >
              <Download size={14} />
              <span className="hidden sm:inline">PDF Report</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all card-3d active:scale-95 border border-white/10"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {successToast && (
          <div className="mx-3 sm:mx-6 mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="truncate">{successToast}</span>
          </div>
        )}

        {/* Navigation Tabs: Horizontal Scrolling with Touch Support */}
        <div className="px-3 sm:px-6 pt-2.5 border-b border-white/10 flex items-center justify-between text-xs font-bold bg-black/20 overflow-x-auto no-scrollbar gap-3">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('close-month')}
              className={`pb-2.5 px-2.5 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'close-month'
                  ? 'border-orange-500 text-orange-400 font-black'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock size={13} />
              <span>Finalize & Update Sales</span>
            </button>
            <button
              onClick={() => setActiveTab('closing-history')}
              className={`pb-2.5 px-2.5 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'closing-history'
                  ? 'border-orange-500 text-orange-400 font-black'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar size={13} />
              <span>Past Closings ({closings.filter(c => c.isClosed).length})</span>
            </button>
          </div>

          {activeTab === 'close-month' && (
            <div className="flex items-center gap-1.5 pb-2 shrink-0">
              <span className="text-[10px] sm:text-[11px] text-zinc-400">Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setIsEditMode(false);
                }}
                className="bg-black/60 border border-white/20 rounded-lg px-2 py-0.5 text-xs text-white font-bold outline-none focus:border-orange-500"
              />
            </div>
          )}
        </div>

        {/* Modal Body: Touch-Friendly Scrollable Container */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 flex-1 touch-pan-y">
          {activeTab === 'close-month' ? (
            <>
              {/* Notification Banner / Explanation */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-950/70 via-black/80 to-amber-950/50 border border-orange-500/40 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 mt-0.5 shrink-0 border border-orange-500/30">
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <span className="text-white font-black block">
                      Monthly Accounting Rule: Post-Cutoff Sales Roll-Forward
                    </span>
                    <span className="text-zinc-300 font-medium text-[11px] sm:text-xs">
                      Finalizing <strong>{formatMonthDisplay(selectedMonth)}</strong> up to <strong>{cutoffDate}</strong> locks this month's totals.
                      Invoices dated after {cutoffDate} will automatically roll forward into <strong>{nextMonthDisplay}</strong>'s sales report.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 text-[11px] w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-orange-400" />
                      <span className="text-zinc-400">Cutoff:</span>
                      <span className="text-white font-black">{cutoffDate}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                      {cutoffMode === 'auto' ? 'Auto Default' : 'Custom'}
                    </span>
                  </div>
                </div>
              </div>

              {/* DEDICATED CUTOFF DATE SELECTION: AUTOMATIC DEFAULT VS CHOOSE DATE (Mobile Optimized) */}
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl glass-ultra border border-white/15 card-3d space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-black text-white block uppercase tracking-wider">
                          Cutoff Date Selection
                        </span>
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                          {cutoffMode === 'auto' ? '⚡ Automatic Default' : '🗓️ Custom Chosen Date'}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-300 font-medium block">
                        Choose whether to automatically use the current default closing date or choose a specific date.
                      </span>
                    </div>
                  </div>

                  {/* Dual Mode Switcher: Equal Grid on Mobile, Flex on Desktop */}
                  <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 bg-black/80 rounded-xl border border-white/15 shrink-0 shadow-inner w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={existingClosing && !isEditMode}
                      onClick={() => {
                        setCutoffMode('auto');
                        setCutoffDate(autoDefaultCutoff);
                      }}
                      className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        cutoffMode === 'auto'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-md shadow-orange-500/40'
                          : 'text-zinc-400 hover:text-white'
                      } ${existingClosing && !isEditMode ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                      <Sparkles size={12} />
                      <span>Automatic Default</span>
                    </button>

                    <button
                      type="button"
                      disabled={existingClosing && !isEditMode}
                      onClick={() => setCutoffMode('custom')}
                      className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        cutoffMode === 'custom'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-md shadow-orange-500/40'
                          : 'text-zinc-400 hover:text-white'
                      } ${existingClosing && !isEditMode ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                    >
                      <Calendar size={12} />
                      <span>Choose Date</span>
                    </button>
                  </div>
                </div>

                {/* Active Cutoff Status & Custom Date Picker Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2.5 border-t border-white/10 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-zinc-400 font-bold">Effective Cutoff:</span>
                    <span className="text-sm font-black text-orange-400 px-3 py-0.5 rounded-lg bg-orange-500/15 border border-orange-500/30">
                      {cutoffDate}
                    </span>
                    {cutoffMode === 'auto' ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ✓ Default ({cutoffDate === todayStr ? 'Today' : 'Month-End'})
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        ✓ Custom chosen
                      </span>
                    )}
                  </div>

                  {/* Quick Presets & Picker (Shown when in Choose Date mode) */}
                  {cutoffMode === 'custom' && (
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">Presets:</span>

                      <button
                        type="button"
                        disabled={existingClosing && !isEditMode}
                        onClick={() => setCutoffDate(todayStr)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          cutoffDate === todayStr
                            ? 'bg-orange-500 text-black border-orange-400 font-black'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        disabled={existingClosing && !isEditMode}
                        onClick={() => setCutoffDate(threeDaysBeforeMonthEndStr)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          cutoffDate === threeDaysBeforeMonthEndStr
                            ? 'bg-orange-500 text-black border-orange-400 font-black'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        3 Days Before End
                      </button>

                      <button
                        type="button"
                        disabled={existingClosing && !isEditMode}
                        onClick={() => setCutoffDate(monthEndStr)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          cutoffDate === monthEndStr
                            ? 'bg-orange-500 text-black border-orange-400 font-black'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        Month End
                      </button>

                      {/* Custom Date Input */}
                      <div className="flex items-center gap-1.5 bg-black/90 px-2.5 py-1 rounded-xl border border-orange-500/40 shadow-inner">
                        <Calendar size={13} className="text-orange-400" />
                        <input
                          type="date"
                          value={cutoffDate}
                          disabled={existingClosing && !isEditMode}
                          onChange={(e) => {
                            setCutoffDate(e.target.value);
                            setCutoffMode('custom');
                          }}
                          className={`bg-transparent text-xs text-white font-black outline-none ${
                            existingClosing && !isEditMode ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Banner if Already Closed + Edit Mode Actions */}
              {existingClosing && (
                <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                  isEditMode
                    ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                    : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isEditMode ? (
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                        <Edit3 size={15} />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
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
                        Closed on {new Date(existingClosing.closedAt).toLocaleDateString()} by {existingClosing.closedByName}
                        {existingClosing.updatedAt && (
                          <span className="ml-1.5 text-amber-300">
                            (Edited {new Date(existingClosing.updatedAt).toLocaleDateString()} by {existingClosing.updatedByName})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-center justify-end">
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
                            <span>Edit Closing</span>
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

              {/* Metrics Grid with Show & Update Form Inputs (1 column on mobile, 2/3 cols on desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                
                {/* 1. Monthly Revenue */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
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
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-base sm:text-lg font-black text-white focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* 2. Gross Profit Details */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
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
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-base sm:text-lg font-black text-emerald-400 focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* 3. Vendor Payments of the Month */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
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
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-base sm:text-lg font-black text-blue-300 focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* 4. Commission Payments of the Month */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
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
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-base sm:text-lg font-black text-purple-300 focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* 5. Company Expenses of the Month */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl glass-ultra border border-white/15 card-3d relative overflow-hidden group">
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
                    className={`w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-base sm:text-lg font-black text-amber-300 focus:border-orange-500 outline-none shadow-inner ${
                      existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* 6. Dynamic Calculated Net Profit */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl glass-ultra border border-orange-500/30 bg-gradient-to-br from-orange-950/40 via-black to-zinc-950 card-3d relative overflow-hidden">
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
                  <div className="text-xl sm:text-2xl font-black text-white mt-1 sm:mt-2">
                    {formatCurrency(dynamicNetProfit)}
                  </div>
                </div>

              </div>

              {/* 7. Confirmed Month Closing Balance (Highlighted Card, Touch-Friendly on Mobile) */}
              <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-950/80 via-black to-amber-950/80 border-2 border-orange-500/70 shadow-[0_10px_35px_rgba(234,88,12,0.25)] relative overflow-hidden card-3d">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,1)]"></span>
                      <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                        Confirmed Profit Balance / Month Closing Balance (AED)
                      </h4>
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-300 font-medium">
                      Enter or confirm the final profit balance in hand/bank to officially seal {formatMonthDisplay(selectedMonth)}.
                    </p>
                  </div>

                  <div className="w-full sm:w-64">
                    <input
                      type="number"
                      value={closingBalance}
                      disabled={existingClosing && !isEditMode}
                      onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
                      className={`w-full bg-black/90 border-2 border-orange-400 rounded-xl px-4 py-2.5 text-xl sm:text-2xl font-black text-orange-400 outline-none focus:ring-2 focus:ring-orange-500 shadow-inner text-right ${
                        existingClosing && !isEditMode ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {isManualOverride && (!existingClosing || isEditMode) && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="text-amber-400 font-medium">
                      * You have customized figures or invoice selections.
                    </span>
                    <button
                      onClick={handleResetToAuto}
                      className="text-orange-400 hover:underline font-bold self-start sm:self-auto"
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

              {/* INVOICE MANAGEMENT PANEL: ADD OR REMOVE INVOICES (Mobile Optimized) */}
              <div className="border border-white/15 rounded-xl sm:rounded-2xl overflow-hidden bg-black/40 shadow-xl">
                <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/60 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-orange-400 shrink-0" />
                    <div>
                      <span className="text-xs font-black text-white block">
                        Manage Invoices in {formatMonthDisplay(selectedMonth)} ({selectedInvoiceIds.length} Included)
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Add newly created invoices or remove consignments to roll them forward to next month
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    {(!existingClosing || isEditMode) && (
                      <button
                        onClick={handleRecalculateFromSelectedInvoices}
                        className="px-2.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 flex-1 sm:flex-initial justify-center"
                        title="Update Revenue, Profit, and Vendor figures from the selected invoices"
                      >
                        <RefreshCw size={11} />
                        <span>Recalculate from Selection</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowInvoicesList(!showInvoicesList)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
                    >
                      {showInvoicesList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Panel */}
                {showInvoicesList && (
                  <div className="p-3 sm:p-4 space-y-3">
                    {/* Subtabs for Included vs Available to Add + Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => setInvoiceDrawerTab('included')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            invoiceDrawerTab === 'included'
                              ? 'bg-orange-500 text-black font-black shadow-md shadow-orange-500/30'
                              : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          <Check size={13} />
                          <span>Included ({selectedInvoiceIds.length})</span>
                        </button>

                        {(!existingClosing || isEditMode) && (
                          <button
                            onClick={() => setInvoiceDrawerTab('available')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              invoiceDrawerTab === 'available'
                                ? 'bg-orange-500 text-black font-black shadow-md shadow-orange-500/30'
                                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            <Plus size={13} />
                            <span>Add ({availableToAddInvoices.length})</span>
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
                          className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Tab 1: Included Invoices */}
                    {invoiceDrawerTab === 'included' && (
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 touch-pan-y">
                        {filteredIncludedInvoices.length === 0 ? (
                          <div className="text-center py-8 text-zinc-500 text-xs">
                            No invoices included. Switch to "Add Other Invoices" tab to attach consignments to this month.
                          </div>
                        ) : (
                          filteredIncludedInvoices.map(inv => (
                            <div
                              key={inv.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs hover:border-white/15 transition-all gap-1.5 sm:gap-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-black text-white shrink-0">{inv.invoiceNumber}</span>
                                <span className="text-zinc-500">|</span>
                                <span className="text-zinc-300 font-medium truncate">{inv.customerName}</span>
                                <span className="text-[10px] text-zinc-400 shrink-0">({inv.date?.slice(0, 10)})</span>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-0 border-white/5">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-bold">{formatCurrency(inv.totalAmount)}</span>
                                  <span className="text-emerald-400 font-bold text-[11px]">(Profit: {formatCurrency(inv.profit || 0)})</span>
                                </div>

                                {(!existingClosing || isEditMode) && (
                                  <button
                                    onClick={() => handleRemoveInvoice(inv.id)}
                                    className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
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
                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 touch-pan-y">
                        {filteredAvailableInvoices.length === 0 ? (
                          <div className="text-center py-8 text-zinc-500 text-xs">
                            No additional unclosed invoices found. All relevant invoices are already included or in other closed periods.
                          </div>
                        ) : (
                          filteredAvailableInvoices.map(inv => (
                            <div
                              key={inv.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs hover:border-amber-500/40 transition-all gap-1.5 sm:gap-0"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-amber-200 shrink-0">{inv.invoiceNumber}</span>
                                <span className="text-zinc-500">|</span>
                                <span className="text-zinc-300 truncate">{inv.customerName}</span>
                                <span className="text-[10px] text-zinc-400 shrink-0">({inv.date?.slice(0, 10)})</span>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-0 border-white/5">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-bold">{formatCurrency(inv.totalAmount)}</span>
                                  <span className="text-emerald-400 font-bold text-[11px]">(Profit: {formatCurrency(inv.profit || 0)})</span>
                                </div>

                                <button
                                  onClick={() => handleAddInvoice(inv.id)}
                                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 text-black text-[10px] font-black flex items-center gap-1 shadow-md shadow-orange-500/20 transition-all active:scale-95"
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
                        className="p-4 sm:p-5 rounded-2xl glass-ultra border border-white/15 card-3d space-y-3 relative overflow-hidden"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
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

                          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                              Balance: {formatCurrency(closing.closingBalance)}
                            </span>

                            {/* Download PDF button on past closing card */}
                            <button
                              onClick={() => handleDownloadPDF(closing)}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                              title="Download Closing Report PDF"
                            >
                              <Download size={12} />
                              <span>PDF</span>
                            </button>

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
                                  className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 transition-colors"
                                  title="Re-open Closing"
                                >
                                  <Unlock size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Breakdown Metrics: Grid 2/3/5 */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
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
                          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
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

        {/* Modal Footer: Mobile-Friendly Flex Stacking */}
        <div className="p-3 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-black/50 relative z-10">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-bold transition-all card-3d active:scale-95 border border-white/10 flex-1 sm:flex-initial text-center"
            >
              Cancel / Close
            </button>

            {/* Download PDF button in footer */}
            <button
              onClick={() => handleDownloadPDF()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-white text-xs font-bold transition-all card-3d active:scale-95 border border-white/15 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial shadow-md"
              title="Download PDF Closing Statement"
            >
              <Download size={13} className="text-orange-400" />
              <span>Download PDF</span>
            </button>
          </div>

          {activeTab === 'close-month' && (!existingClosing || isEditMode) && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {confirmPrompt ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setConfirmPrompt(false)}
                    className="px-3 py-2 rounded-xl bg-white/10 text-zinc-300 text-xs font-bold"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveOrUpdateClosing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-black font-black text-xs shadow-lg shadow-orange-500/50 card-3d active:scale-95 flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                  >
                    <Save size={14} />
                    <span>Confirm & Save</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmPrompt(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-black font-black text-xs shadow-lg shadow-orange-500/40 card-3d active:scale-95 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Save size={15} />
                  <span>
                    {existingClosing
                      ? `Update & Save Closing (${selectedInvoiceIds.length} Invoices)`
                      : `Finalize & Save ${formatMonthDisplay(selectedMonth)} Closing`}
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
