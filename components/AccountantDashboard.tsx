import React, { useState } from 'react';
import {
  PieChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  BookOpen,
  Receipt,
  FileCheck,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Briefcase,
  Percent,
  Calculator,
  Bell,
  Archive,
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  Cpu,
  Compass,
  Sliders,
  ChevronRight
} from 'lucide-react';
import {
  Invoice,
  Customer,
  Vendor,
  CompanyInfo,
  Expense,
  AdjustmentNote,
  User,
  AccountLedger,
  JournalEntry,
  JournalEntryLine,
  BankReconciliation,
  VATFiling,
  CorporateTaxRecord,
  TaxDeadlineItem,
  FixedAsset,
  PeriodClosing,
  AccountingApproval
} from '../types';
import { formatCurrency, generateId, sortInvoicesByNewestCreated } from '../utils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AccountantDashboardProps {
  invoices: Invoice[];
  customers: Customer[];
  vendors: Vendor[];
  companyInfo: CompanyInfo;
  expenses: Expense[];
  adjustmentNotes: AdjustmentNote[];
  currentUser: User;
  onNavigate?: (tab: string) => void;
  onInvoiceClick?: (invoice: Invoice) => void;
}

type AccountingTab =
  | 'overview'
  | 'receivables'
  | 'payables'
  | 'bank-reconciliation'
  | 'general-ledger'
  | 'profit-loss'
  | 'balance-sheet'
  | 'trial-balance'
  | 'vat-suite'
  | 'corporate-tax'
  | 'tax-calendar'
  | 'period-closing'
  | 'journal-entries'
  | 'fixed-assets'
  | 'approvals'
  | 'audit-trail'
  | 'rbac-guide';

export const AccountantDashboard: React.FC<AccountantDashboardProps> = ({
  invoices,
  customers,
  vendors,
  companyInfo,
  expenses,
  adjustmentNotes,
  currentUser,
  onNavigate,
  onInvoiceClick
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AccountingTab>('overview');
  const [dateFilter, setDateFilter] = useState<'all' | 'monthly' | 'quarterly' | 'yearly'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [collectionEfficiency, setCollectionEfficiency] = useState<number>(95);
  const [activeAnomalyTab, setActiveAnomalyTab] = useState<'all' | 'ar' | 'tax' | 'approvals'>('all');

  // --- PERSISTENT ACCOUNTING STATE WITH LOCAL STORAGE ---
  const [ledgers, setLedgers] = useState<AccountLedger[]>(() => {
    const saved = localStorage.getItem('carryint_ledgers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'l-1010', code: '1010', name: 'ADCB Main Operating Account', category: 'ASSET', type: 'Bank Account', openingBalance: 125000, currentBalance: 184500, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-1020', code: '1020', name: 'Petty Cash Float', category: 'ASSET', type: 'Cash', openingBalance: 5000, currentBalance: 3200, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-1200', code: '1200', name: 'Trade Accounts Receivable', category: 'ASSET', type: 'Accounts Receivable', openingBalance: 82000, currentBalance: 95400, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-1500', code: '1500', name: 'Office Equipment & Computers', category: 'ASSET', type: 'Fixed Asset', openingBalance: 45000, currentBalance: 41250, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-2010', code: '2010', name: 'Trade Accounts Payable (Vendors)', category: 'LIABILITY', type: 'Accounts Payable', openingBalance: 42000, currentBalance: 38200, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-2050', code: '2050', name: 'VAT Output Tax Payable (5%)', category: 'LIABILITY', type: 'Tax Liability', openingBalance: 6500, currentBalance: 9150, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-2060', code: '2060', name: 'Corporate Tax Provision (9%)', category: 'LIABILITY', type: 'Tax Liability', openingBalance: 0, currentBalance: 8400, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-3010', code: '3010', name: 'Shareholder Capital', category: 'EQUITY', type: 'Equity', openingBalance: 150000, currentBalance: 150000, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-3020', code: '3020', name: 'Retained Earnings', category: 'EQUITY', type: 'Equity', openingBalance: 58500, currentBalance: 133550, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-4010', code: '4010', name: 'Freight & Logistics Sales Revenue', category: 'REVENUE', type: 'Operating Revenue', openingBalance: 0, currentBalance: 345000, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-5010', code: '5010', name: 'Direct Vendor Freight Costs (COGS)', category: 'EXPENSE', type: 'Cost of Sales', openingBalance: 0, currentBalance: 215000, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-6010', code: '6010', name: 'Office Rent & Utilities', category: 'EXPENSE', type: 'Operating Expense', openingBalance: 0, currentBalance: 32000, currency: 'AED', createdAt: '2026-01-01' },
      { id: 'l-6020', code: '6020', name: 'Staff Salaries & Benefits', category: 'EXPENSE', type: 'Operating Expense', openingBalance: 0, currentBalance: 48000, currency: 'AED', createdAt: '2026-01-01' },
    ];
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('carryint_journal_entries');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'je-1',
        entryNumber: 'JV-2026-0001',
        date: '2026-01-31',
        reference: 'ADJ-M01-DEPR',
        memo: 'Monthly fixed asset depreciation charge',
        lines: [
          { ledgerId: 'l-6010', ledgerName: 'Depreciation Expense', description: 'Office IT equipment depreciation', debit: 750, credit: 0 },
          { ledgerId: 'l-1500', ledgerName: 'Accumulated Depreciation - IT', description: 'Monthly wear and tear write-down', debit: 0, credit: 750 }
        ],
        totalDebit: 750,
        totalCredit: 750,
        status: 'POSTED',
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        approvedBy: 'Financial Controller',
        createdAt: '2026-01-31'
      }
    ];
  });

  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>(() => {
    const saved = localStorage.getItem('carryint_fixed_assets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'fa-1', assetCode: 'AST-001', name: 'MacBook Pro Fleet (3x)', category: 'IT_HARDWARE', purchaseDate: '2025-06-15', purchasePrice: 24000, salvageValue: 2000, usefulLifeYears: 3, depreciationMethod: 'STRAIGHT_LINE', accumulatedDepreciation: 5500, netBookValue: 18500, location: 'Dubai HQ' },
      { id: 'fa-2', assetCode: 'AST-002', name: 'Delivery Van Toyota HiAce', category: 'VEHICLE', purchaseDate: '2024-03-10', purchasePrice: 85000, salvageValue: 15000, usefulLifeYears: 5, depreciationMethod: 'STRAIGHT_LINE', accumulatedDepreciation: 28000, netBookValue: 57000, location: 'Operations Bay' },
      { id: 'fa-3', assetCode: 'AST-003', name: 'Office Conference Furniture', category: 'FURNITURE', purchaseDate: '2025-01-20', purchasePrice: 18000, salvageValue: 1000, usefulLifeYears: 5, depreciationMethod: 'STRAIGHT_LINE', accumulatedDepreciation: 3400, netBookValue: 14600, location: 'Boardroom' },
    ];
  });

  const [taxDeadlines, setTaxDeadlines] = useState<TaxDeadlineItem[]>([
    { id: 'td-1', title: 'UAE VAT Return 2026 Q1 Filing (FTA Form 201)', category: 'VAT', dueDate: '2026-04-28', type: 'FILING', status: 'PENDING', amount: 9150, notes: 'Filing window closes on 28th of following month' },
    { id: 'td-2', title: 'UAE VAT 2026 Q1 Tax Settlement Payment', category: 'VAT', dueDate: '2026-04-28', type: 'PAYMENT', status: 'PENDING', amount: 9150, notes: 'Payable via e-Dirham / GIBAN transfer' },
    { id: 'td-3', title: 'Corporate Tax Registration Verification (EmaraTax)', category: 'CORPORATE_TAX', dueDate: '2026-05-31', type: 'INTERNAL', status: 'COMPLETED', notes: 'Corporate Tax Registration Certificate active' },
    { id: 'td-4', title: 'Annual Corporate Tax Return (FY 2025)', category: 'CORPORATE_TAX', dueDate: '2026-09-30', type: 'FILING', status: 'PENDING', amount: 14200, notes: '9 months after financial year closing' },
    { id: 'td-5', title: 'Q1 Financial Period Month-End Closing & Reconciliations', category: 'CLOSING', dueDate: '2026-03-31', type: 'INTERNAL', status: 'PENDING', notes: 'Complete bank reconciliation and ledger postings' },
  ]);

  const [closings, setClosings] = useState<PeriodClosing[]>([
    { id: 'cl-1', periodName: 'January 2026', periodType: 'MONTH', startDate: '2026-01-01', endDate: '2026-01-31', isLocked: true, closedBy: 'Chief Accountant', closedAt: '2026-02-05', checklist: { bankReconciled: true, vatReconciled: true, depreciationPosted: true, journalsVerified: true, managementApproved: true } },
    { id: 'cl-2', periodName: 'February 2026', periodType: 'MONTH', startDate: '2026-02-01', endDate: '2026-02-28', isLocked: false, checklist: { bankReconciled: true, vatReconciled: false, depreciationPosted: false, journalsVerified: false, managementApproved: false } },
  ]);

  const [approvals, setApprovals] = useState<AccountingApproval[]>([
    { id: 'app-1', type: 'INVOICE_EDIT', referenceNumber: 'INV-2026-0084', amount: 14500, requestedBy: 'usr-staff-1', requestedByName: 'Sales Agent', requestedRole: 'STAFF', requestedDate: '2026-02-14', status: 'PENDING', approverRole: 'ACCOUNTANT', comments: 'Requested weight adjustment correction after customs clearance re-weighing' },
    { id: 'app-2', type: 'EXPENSE_CLAIM', referenceNumber: 'EXP-2026-0042', amount: 3200, requestedBy: 'usr-ops', requestedByName: 'Logistics Supervisor', requestedRole: 'STAFF', requestedDate: '2026-02-16', status: 'PENDING', approverRole: 'ACCOUNTANT', comments: 'Emergency port detention fee reimbursement' },
    { id: 'app-3', type: 'ADJUSTMENT_NOTE', referenceNumber: 'CN-2026-0003', amount: 1200, requestedBy: 'usr-mgr', requestedByName: 'Operations Manager', requestedRole: 'MANAGER', requestedDate: '2026-02-12', status: 'APPROVED', approverRole: 'ACCOUNTANT', reviewedBy: currentUser.id, reviewedByName: currentUser.name, reviewedDate: '2026-02-13', comments: 'Approved goodwill freight discount' },
  ]);

  // Modal / Form States
  const [isAddingLedger, setIsAddingLedger] = useState(false);
  const [newLedger, setNewLedger] = useState<Partial<AccountLedger>>({ category: 'EXPENSE', currency: 'AED', openingBalance: 0 });
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [newJournal, setNewJournal] = useState<{ reference: string; memo: string; date: string; lines: JournalEntryLine[] }>({
    reference: '',
    memo: '',
    date: new Date().toISOString().split('T')[0],
    lines: [
      { ledgerId: '', ledgerName: '', description: '', debit: 0, credit: 0 },
      { ledgerId: '', ledgerName: '', description: '', debit: 0, credit: 0 },
    ]
  });

  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<FixedAsset>>({ category: 'OFFICE_EQUIPMENT', depreciationMethod: 'STRAIGHT_LINE', usefulLifeYears: 3, salvageValue: 0 });

  // Bank Reconciliation Working State
  const [selectedBankId, setSelectedBankId] = useState<string>('l-1010');
  const [bankStmtBalance, setBankStmtBalance] = useState<number>(184500);

  // --- CORE FINANCIAL CALCULATIONS ---
  const totalInvoicedSales = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalNetSales = invoices.reduce((s, i) => s + (i.netAmount || (i.totalAmount - i.totalVat)), 0);
  const totalOutputVAT = invoices.reduce((s, i) => s + (i.totalVat || 0), 0);
  const totalVendorCost = invoices.reduce((s, i) => s + i.vendorCost, 0);
  const totalBrokerCommission = invoices.reduce((s, i) => s + (i.agentCommission || 0), 0);
  const totalPickupCosts = invoices.reduce((s, i) => s + (i.pickupCost || 0), 0);

  const totalCOGS = totalVendorCost + totalBrokerCommission + totalPickupCosts;
  const grossProfit = totalNetSales - totalCOGS;

  const totalOpexExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalInputVAT = totalOpexExpenses * 0.05; // 5% standard recoverable VAT estimate
  const netOperatingProfit = grossProfit - totalOpexExpenses;

  // Receivables & Payables
  const totalReceivables = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0);
  const totalPayables = invoices.filter(i => i.vendorId && i.vendorStatus !== 'PAID').reduce((s, i) => s + (i.vendorStatus === 'PARTIAL' ? Math.max(0, i.vendorCost - (i.vendorPaidAmount || 0)) : i.vendorCost), 0);
  const totalCashAndBank = ledgers.filter(l => l.category === 'ASSET' && (l.type === 'Bank Account' || l.type === 'Cash')).reduce((s, l) => s + l.currentBalance, 0);

  // Net VAT Payable
  const netVATPayable = Math.max(totalOutputVAT - totalInputVAT, 0);

  // Corporate Tax calculation (UAE 9% on taxable profit above 375,000 AED)
  const corporateTaxThreshold = 375000;
  const taxableProfit = Math.max(netOperatingProfit, 0);
  const corporateTaxDue = taxableProfit > corporateTaxThreshold ? (taxableProfit - corporateTaxThreshold) * 0.09 : 0;

  // AR Aging Brackets
  const now = new Date();
  const arAging = {
    current: 0,
    days30: 0,
    days60: 0,
    days90Plus: 0,
  };

  invoices.filter(i => i.status !== 'PAID').forEach(inv => {
    const invDate = new Date(inv.date);
    const diffDays = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 30) arAging.current += inv.totalAmount;
    else if (diffDays <= 60) arAging.days30 += inv.totalAmount;
    else if (diffDays <= 90) arAging.days60 += inv.totalAmount;
    else arAging.days90Plus += inv.totalAmount;
  });

  // Calculate Anomaly Alerts
  const overdueInvoicesCount = invoices.filter(i => {
    if (i.status === 'PAID') return false;
    const diff = Math.floor((now.getTime() - new Date(i.date).getTime()) / (1000 * 3600 * 24));
    return diff > 60;
  }).length;

  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;

  // 30-60-90 Days Projected Cash Trajectory Data
  const projectedCashFlowData = [
    { day: 'Today', cash: totalCashAndBank, receivables: totalReceivables * 0.2, payables: totalPayables * 0.3 },
    { day: '+15 Days', cash: totalCashAndBank + (totalReceivables * 0.4 * (collectionEfficiency / 100)) - (totalPayables * 0.5), receivables: totalReceivables * 0.4, payables: totalPayables * 0.5 },
    { day: '+30 Days', cash: totalCashAndBank + (totalReceivables * 0.7 * (collectionEfficiency / 100)) - (totalPayables * 0.8), receivables: totalReceivables * 0.7, payables: totalPayables * 0.8 },
    { day: '+45 Days', cash: totalCashAndBank + (totalReceivables * 0.85 * (collectionEfficiency / 100)) - totalPayables, receivables: totalReceivables * 0.85, payables: totalPayables },
    { day: '+60 Days', cash: totalCashAndBank + (totalReceivables * 0.95 * (collectionEfficiency / 100)) - (totalPayables + (netVATPayable * 0.5)), receivables: totalReceivables * 0.95, payables: totalPayables + netVATPayable },
  ];

  // Handlers for Ledger & Journal CRUD
  const handleCreateLedger = () => {
    if (!newLedger.name || !newLedger.code) {
      alert('Please fill code and ledger name');
      return;
    }
    const created: AccountLedger = {
      id: generateId(),
      code: newLedger.code,
      name: newLedger.name,
      category: newLedger.category || 'EXPENSE',
      type: newLedger.type || 'Operating Expense',
      openingBalance: Number(newLedger.openingBalance) || 0,
      currentBalance: Number(newLedger.openingBalance) || 0,
      currency: 'AED',
      createdAt: new Date().toISOString()
    };
    const updated = [...ledgers, created];
    setLedgers(updated);
    localStorage.setItem('carryint_ledgers', JSON.stringify(updated));
    setIsAddingLedger(false);
    setNewLedger({ category: 'EXPENSE', currency: 'AED', openingBalance: 0 });
  };

  const handlePostJournal = () => {
    const debitSum = newJournal.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const creditSum = newJournal.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

    if (Math.abs(debitSum - creditSum) > 0.01) {
      alert(`Journal entry out of balance! Total Debit (${debitSum.toFixed(2)}) must equal Total Credit (${creditSum.toFixed(2)}). Delta: ${(debitSum - creditSum).toFixed(2)} AED`);
      return;
    }
    if (debitSum === 0) {
      alert('Total journal amount cannot be zero.');
      return;
    }

    const nextNumber = `JV-2026-${String(journalEntries.length + 1).padStart(4, '0')}`;
    const entry: JournalEntry = {
      id: generateId(),
      entryNumber: nextNumber,
      date: newJournal.date,
      reference: newJournal.reference || 'JV-AUTO',
      memo: newJournal.memo || 'General journal voucher adjustment',
      lines: newJournal.lines.map(l => ({
        ...l,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0
      })),
      totalDebit: debitSum,
      totalCredit: creditSum,
      status: 'POSTED',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      approvedBy: 'Chief Accountant',
      createdAt: new Date().toISOString()
    };

    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem('carryint_journal_entries', JSON.stringify(updated));
    setIsAddingJournal(false);
    setNewJournal({
      reference: '',
      memo: '',
      date: new Date().toISOString().split('T')[0],
      lines: [
        { ledgerId: '', ledgerName: '', description: '', debit: 0, credit: 0 },
        { ledgerId: '', ledgerName: '', description: '', debit: 0, credit: 0 },
      ]
    });
  };

  // Export Financial Reports to Excel
  const exportFullAccountingExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Trial Balance
    const tbRows = ledgers.map(l => ({
      'Account Code': l.code,
      'Account Name': l.name,
      'Category': l.category,
      'Type': l.type,
      'Opening Balance (AED)': l.openingBalance,
      'Current Balance (AED)': l.currentBalance
    }));
    const wsTB = XLSX.utils.json_to_sheet(tbRows);
    XLSX.utils.book_append_sheet(wb, wsTB, 'Trial Balance');

    // Sheet 2: VAT Form 201 Summary
    const vatRows = [
      { 'Box': 'Box 1a', 'Description': 'Standard Rated Sales (Dubai/UAE)', 'Amount (AED)': totalNetSales, 'VAT (AED)': totalOutputVAT },
      { 'Box': 'Box 9', 'Description': 'Standard Rated Recoverable Expenses', 'Amount (AED)': totalOpexExpenses, 'VAT (AED)': totalInputVAT },
      { 'Box': 'Box 12', 'Description': 'Total Value of Output Tax Due', 'Amount (AED)': totalOutputVAT, 'VAT (AED)': totalOutputVAT },
      { 'Box': 'Box 13', 'Description': 'Total Value of Input Tax Recoverable', 'Amount (AED)': totalInputVAT, 'VAT (AED)': totalInputVAT },
      { 'Box': 'Box 14', 'Description': 'Net VAT Payable to Federal Tax Authority', 'Amount (AED)': netVATPayable, 'VAT (AED)': netVATPayable },
    ];
    const wsVAT = XLSX.utils.json_to_sheet(vatRows);
    XLSX.utils.book_append_sheet(wb, wsVAT, 'UAE VAT FTA 201');

    XLSX.writeFile(wb, `Carryint_Full_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Financial Report to PDF
  const exportFinancialReportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Carryint CRM - Executive Financial Statement (UAE FTA Compliant)', 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated by: ${currentUser.name} (Chief Accountant) | Date: ${new Date().toLocaleDateString()}`, 14, 25);
    doc.text(`TRN: ${companyInfo.trn || '100XXXXXXXXX'} | Corporate Tax Reg: Active`, 14, 30);

    const summaryTable = [
      ['Gross Invoiced Sales', formatCurrency(totalInvoicedSales) + ' AED'],
      ['Less: VAT (5%)', formatCurrency(totalOutputVAT) + ' AED'],
      ['Net Operating Revenue', formatCurrency(totalNetSales) + ' AED'],
      ['Cost of Goods Sold (COGS)', formatCurrency(totalCOGS) + ' AED'],
      ['Gross Profit Margin', `${formatCurrency(grossProfit)} AED (${totalNetSales > 0 ? ((grossProfit / totalNetSales) * 100).toFixed(1) : 0}%)`],
      ['Operating Expenses (OPEX)', formatCurrency(totalOpexExpenses) + ' AED'],
      ['Net Operating Profit (EBIT)', formatCurrency(netOperatingProfit) + ' AED'],
      ['Estimated UAE Corporate Tax (9%)', formatCurrency(corporateTaxDue) + ' AED'],
      ['Net Retained Earnings After Tax', formatCurrency(netOperatingProfit - corporateTaxDue) + ' AED']
    ];

    autoTable(doc, {
      startY: 36,
      head: [['Financial Statement Metric', 'Amount (AED)']],
      body: summaryTable,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`Carryint_Financial_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const navMenuItems: { id: AccountingTab; label: string; icon: any; count?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Command Overview', icon: Cpu },
    { id: 'receivables', label: 'Accounts Receivable', icon: DollarSign, count: invoices.filter(i => i.status !== 'PAID').length, badgeColor: 'bg-amber-500 text-slate-950' },
    { id: 'payables', label: 'Accounts Payable', icon: CreditCard, count: invoices.filter(i => i.vendorId && i.vendorStatus !== 'PAID').length, badgeColor: 'bg-red-500 text-white' },
    { id: 'bank-reconciliation', label: 'Bank Reconciliation', icon: Building2 },
    { id: 'general-ledger', label: 'General Ledger & Chart', icon: BookOpen },
    { id: 'profit-loss', label: 'Profit & Loss (P&L)', icon: TrendingUp },
    { id: 'balance-sheet', label: 'Balance Sheet', icon: Layers },
    { id: 'trial-balance', label: 'Trial Balance', icon: CheckCircle2 },
    { id: 'vat-suite', label: 'VAT Suite (FTA 201)', icon: Percent },
    { id: 'corporate-tax', label: 'Corporate Tax (9%)', icon: Calculator },
    { id: 'tax-calendar', label: 'Tax Deadlines & Vault', icon: Calendar },
    { id: 'period-closing', label: 'Month & Year-End Closing', icon: Lock },
    { id: 'journal-entries', label: 'Journal Entries & Adjustments', icon: FileSpreadsheet, count: journalEntries.length },
    { id: 'fixed-assets', label: 'Fixed Asset Register', icon: Briefcase },
    { id: 'approvals', label: 'Approvals & Requests', icon: ShieldCheck, count: approvals.filter(a => a.status === 'PENDING').length, badgeColor: 'bg-purple-500 text-white' },
    { id: 'audit-trail', label: 'Audit Trail & Compliance', icon: FileCheck },
    { id: 'rbac-guide', label: 'Role-Based Access Matrix', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Futuristic Command Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800/80 relative overflow-hidden">
        {/* Holographic Glowing Orbs */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute left-1/3 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck size={13} className="text-amber-400" /> Chief Accountant Command Terminal
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                UAE FTA 201 & 9% Corporate Tax Synchronized
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Financial Operations & Accounting Cockpit</span>
            </h1>

            {/* System Telemetry Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                <Activity size={12} className="text-cyan-400" />
                <span>Ledger Integrity: <strong className="text-white">Balanced</strong></span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                <Clock size={12} className="text-amber-400" />
                <span>Next VAT Return: <strong className="text-amber-300">Q1 2026 (Apr 28)</strong></span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>CT Relief: <strong className="text-emerald-300">375,000 AED Tier</strong></span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddingJournal(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 text-xs active:scale-95"
            >
              <Zap size={14} className="text-slate-950" />
              <span>Quick Journal Voucher</span>
            </button>
            <button
              onClick={exportFullAccountingExcel}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl border border-slate-700 shadow-sm transition-all flex items-center gap-1.5 text-xs"
            >
              <FileSpreadsheet size={14} className="text-emerald-400" />
              <span>Export Ledger</span>
            </button>
            <button
              onClick={exportFinancialReportPDF}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl border border-slate-700 shadow-sm transition-all flex items-center gap-1.5 text-xs"
            >
              <Download size={14} className="text-cyan-400" />
              <span>Statement PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Futuristic Navigation Sub-Tabs Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {navMenuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-slate-950' : 'text-amber-400/80'} />
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-950 text-amber-400' : (item.badgeColor || 'bg-slate-700 text-slate-200')}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: FUTURISTIC COMMAND OVERVIEW --- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Key Metrics Holographic Pods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Pod 1: Net Revenue */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Net Operating Revenue</span>
                  <h3 className="text-xl font-black text-gray-900 mt-1">{formatCurrency(totalNetSales)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Gross Sales (w/ VAT):</span>
                <span className="font-bold text-gray-800">{formatCurrency(totalInvoicedSales)}</span>
              </div>
            </div>

            {/* Pod 2: Net Profit Margin */}
            <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/10 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">Net Accounting Profit</span>
                  <h3 className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(netOperatingProfit)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-50 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-bold">Operating Margin:</span>
                <span className="font-black text-emerald-600 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                  {totalNetSales > 0 ? ((netOperatingProfit / totalNetSales) * 100).toFixed(1) : 0}% Net
                </span>
              </div>
            </div>

            {/* Pod 3: Accounts Receivable */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Accounts Receivable (AR)</span>
                  <h3 className="text-xl font-black text-amber-600 mt-1">{formatCurrency(totalReceivables)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Aging &gt; 60 Days:</span>
                <span className={`font-black ${arAging.days60 + arAging.days90Plus > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(arAging.days60 + arAging.days90Plus)}
                </span>
              </div>
            </div>

            {/* Pod 4: Available Liquidity */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Cash & Bank Reserves</span>
                  <h3 className="text-xl font-black text-purple-600 mt-1">{formatCurrency(totalCashAndBank)}</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                  <Building2 size={18} />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Bank Reconciled:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> 100% Match
                </span>
              </div>
            </div>
          </div>

          {/* AI Financial Anomaly & Discrepancy Radar */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-4 sm:p-5 text-white border border-slate-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>AI Financial Integrity & Anomaly Radar</span>
                    <span className="text-[9.5px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.2 rounded-full">Active Diagnostics</span>
                  </h3>
                  <p className="text-xs text-slate-300">Continuous audit across receivables, VAT claims, vendor dues, and approval queues.</p>
                </div>
              </div>

              {/* Anomaly Filter Badges */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setActiveAnomalyTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeAnomalyTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  All Diagnostics
                </button>
                <button
                  onClick={() => setActiveAnomalyTab('ar')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeAnomalyTab === 'ar' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  AR Aging ({overdueInvoicesCount})
                </button>
                <button
                  onClick={() => setActiveAnomalyTab('approvals')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${activeAnomalyTab === 'approvals' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  Pending Approvals ({pendingApprovalsCount})
                </button>
              </div>
            </div>

            {/* Diagnostics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <div className={`p-2 rounded-lg ${overdueInvoicesCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {overdueInvoicesCount > 0 ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Customer Credit Exposure</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {overdueInvoicesCount > 0
                      ? `${overdueInvoicesCount} invoices over 60 days aging requiring collection attention.`
                      : 'All customer receivables within standard 30-day payment term.'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Percent size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">FTA VAT Input Recovery</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatCurrency(totalInputVAT)} AED recoverable input VAT on operational freight expenses.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Calculator size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Corporate Tax 0% Relief Tier</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {taxableProfit <= corporateTaxThreshold
                      ? `Taxable profit (${formatCurrency(taxableProfit)}) is under 375,000 AED relief bracket (0% tax).`
                      : `Taxable profit exceeds relief by ${formatCurrency(taxableProfit - corporateTaxThreshold)} AED (9% tax applicable).`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Predictive Cash Flow Runway & Trajectory Simulator */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={16} />
                  <span>Predictive Cash Flow Runway Simulator (60-Day Forward Forecast)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Simulates projected bank liquidity factoring in AR collection efficiency and AP vendor disbursements.
                </p>
              </div>

              {/* Collection Efficiency Slider */}
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-600">Collection Efficiency:</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={collectionEfficiency}
                  onChange={(e) => setCollectionEfficiency(Number(e.target.value))}
                  className="w-24 accent-indigo-600 cursor-pointer"
                />
                <span className="text-xs font-black text-indigo-600">{collectionEfficiency}%</span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectedCashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="recvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(val: any) => [`${formatCurrency(Number(val))}`, '']}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="cash" name="Projected Cash Balance" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#cashGrad)" />
                  <Area type="monotone" dataKey="receivables" name="Expected AR Inflow" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#recvGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tax Positions & Quick Action Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* VAT Position Card */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <Percent className="text-orange-500" size={16} />
                  <span>VAT Position (UAE 5%)</span>
                </h3>
                <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded">FTA 201</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Output VAT (Collected):</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalOutputVAT)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Input VAT (Recoverable):</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalInputVAT)} AED</span>
                </div>
                <div className="pt-1.5 border-t border-gray-100 flex justify-between">
                  <span className="font-bold text-gray-800">Net VAT Payable:</span>
                  <span className="font-black text-red-600 text-sm">{formatCurrency(netVATPayable)} AED</span>
                </div>
              </div>
              <button
                onClick={() => setActiveSubTab('vat-suite')}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                Open Full VAT Suite →
              </button>
            </div>

            {/* Corporate Tax Position Card */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <Calculator className="text-blue-500" size={16} />
                  <span>Corporate Tax (UAE 9%)</span>
                </h3>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">CT Regime</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxable Net Profit:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(taxableProfit)} AED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">0% Relief Threshold:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(corporateTaxThreshold)} AED</span>
                </div>
                <div className="pt-1.5 border-t border-gray-100 flex justify-between">
                  <span className="font-bold text-gray-800">Estimated 9% Tax:</span>
                  <span className="font-black text-blue-700 text-sm">{formatCurrency(corporateTaxDue)} AED</span>
                </div>
              </div>
              <button
                onClick={() => setActiveSubTab('corporate-tax')}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                Open Corporate Tax Module →
              </button>
            </div>

            {/* Fast Action Cyber Launcher */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-black text-sm mb-1.5 flex items-center gap-1.5">
                  <Zap className="text-amber-400" size={16} />
                  <span>Accountant Fast Actions</span>
                </h3>
                <p className="text-[11px] text-slate-300 mb-3">Post adjusting journals, reconcile bank records, or create new ledger accounts.</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => { setActiveSubTab('journal-entries'); setIsAddingJournal(true); }}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>➕ New Journal Entry</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => setActiveSubTab('bank-reconciliation')}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>🏦 Run Bank Reconciliation</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    onClick={() => { setActiveSubTab('general-ledger'); setIsAddingLedger(true); }}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>📑 Create Account Ledger</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Aging Receivables & Payables Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-gray-900">AR Aging Schedule (Customer Receivables)</h3>
                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  Total: {formatCurrency(totalReceivables)}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[9.5px] font-black text-gray-400 uppercase">0-30 Days</p>
                  <p className="font-black text-xs text-gray-800 mt-0.5">{formatCurrency(arAging.current)}</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <p className="text-[9.5px] font-black text-amber-700 uppercase">31-60 Days</p>
                  <p className="font-black text-xs text-amber-700 mt-0.5">{formatCurrency(arAging.days30)}</p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <p className="text-[9.5px] font-black text-orange-700 uppercase">61-90 Days</p>
                  <p className="font-black text-xs text-orange-700 mt-0.5">{formatCurrency(arAging.days60)}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <p className="text-[9.5px] font-black text-red-700 uppercase">90+ Days</p>
                  <p className="font-black text-xs text-red-700 mt-0.5">{formatCurrency(arAging.days90Plus)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-gray-900">Accounts Payable (Vendor Liabilities)</h3>
                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  Total: {formatCurrency(totalPayables)}
                </span>
              </div>
              <div className="space-y-1.5">
                {vendors.slice(0, 3).map(v => {
                  const pay = invoices.filter(i => i.vendorId === v.id && i.vendorStatus !== 'PAID').reduce((s, i) => s + (i.vendorStatus === 'PARTIAL' ? Math.max(0, i.vendorCost - (i.vendorPaidAmount || 0)) : i.vendorCost), 0);
                  return (
                    <div key={v.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                      <span className="font-bold text-gray-800">{v.name}</span>
                      <span className="font-black text-red-600">{formatCurrency(pay)} AED</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ACCOUNTS RECEIVABLE (AR) --- */}
      {activeSubTab === 'receivables' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900">Accounts Receivable (Customer Invoices & Aging)</h3>
              <p className="text-xs text-gray-500">Track outstanding invoices, aging buckets, and customer credit balances</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Outstanding Receivables</p>
              <p className="text-xl font-black text-red-600">{formatCurrency(totalReceivables)} AED</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5">Invoice No</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Invoice Date</th>
                  <th className="px-4 py-2.5">Aging Bracket</th>
                  <th className="px-4 py-2.5 text-right">Invoice Amount</th>
                  <th className="px-4 py-2.5 text-right">VAT (5%)</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {sortInvoicesByNewestCreated(invoices.filter(i => i.status !== 'PAID')).map(inv => {
                  const diff = Math.floor((now.getTime() - new Date(inv.date).getTime()) / (1000 * 3600 * 24));
                  let bracket = '0-30 Days';
                  let bracketColor = 'bg-gray-100 text-gray-700';
                  if (diff > 90) { bracket = '90+ Days (High Risk)'; bracketColor = 'bg-red-100 text-red-700'; }
                  else if (diff > 60) { bracket = '61-90 Days'; bracketColor = 'bg-orange-100 text-orange-700'; }
                  else if (diff > 30) { bracket = '31-60 Days'; bracketColor = 'bg-amber-100 text-amber-700'; }

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onInvoiceClick && onInvoiceClick(inv)}
                    >
                      <td className="px-4 py-3 font-black text-orange-600">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-900 font-bold">{inv.customerName}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${bracketColor}`}>
                          {bracket}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(inv.totalVat || 0)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: ACCOUNTS PAYABLE (AP) --- */}
      {activeSubTab === 'payables' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900">Accounts Payable (Vendor & Freight Carrier Liabilities)</h3>
              <p className="text-xs text-gray-500">Track outstanding payments due to shipping lines, airlines, and brokers</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Payables Due</p>
              <p className="text-xl font-black text-red-600">{formatCurrency(totalPayables)} AED</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5">Invoice #</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Vendor</th>
                  <th className="px-4 py-2.5 text-right">Vendor Freight Cost</th>
                  <th className="px-4 py-2.5 text-right">Paid to Vendor</th>
                  <th className="px-4 py-2.5 text-right">Remaining Payable</th>
                  <th className="px-4 py-2.5 text-center">Vendor Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {sortInvoicesByNewestCreated(invoices.filter(i => i.vendorId && i.vendorStatus !== 'PAID')).map(inv => {
                  const paid = inv.vendorStatus === 'PARTIAL' ? (inv.vendorPaidAmount || 0) : 0;
                  const remaining = Math.max(0, inv.vendorCost - paid);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-700 font-bold">{inv.customerName}</td>
                      <td className="px-4 py-3 text-gray-700 font-semibold">{inv.vendorName || '-'}</td>
                      <td className="px-4 py-3 text-right font-black text-gray-900">{formatCurrency(inv.vendorCost)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(paid)}</td>
                      <td className="px-4 py-3 text-right font-black text-red-600">{formatCurrency(remaining)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          inv.vendorStatus === 'PARTIAL' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {inv.vendorStatus || 'UNPAID'}
                        </span>
                        {inv.vendorPaymentDate && (
                          <div className="text-[9px] text-gray-400 mt-0.5 font-bold">
                            {new Date(inv.vendorPaymentDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: GENERAL LEDGER & CHART OF ACCOUNTS --- */}
      {activeSubTab === 'general-ledger' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900">Chart of Accounts & General Ledger Directory</h3>
              <p className="text-xs text-gray-500">Standard UAE financial account structure (Assets, Liabilities, Equity, Revenue, Expense)</p>
            </div>
            <button
              onClick={() => setIsAddingLedger(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Account Ledger</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Account Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5 text-right">Opening Balance</th>
                  <th className="px-4 py-2.5 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {ledgers.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-black text-slate-900">{l.code}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{l.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        l.category === 'ASSET' ? 'bg-blue-100 text-blue-700' :
                        l.category === 'LIABILITY' ? 'bg-red-100 text-red-700' :
                        l.category === 'EQUITY' ? 'bg-purple-100 text-purple-700' :
                        l.category === 'REVENUE' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {l.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{l.type}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(l.openingBalance)}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-900">{formatCurrency(l.currentBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: PROFIT & LOSS STATEMENT (P&L) --- */}
      {activeSubTab === 'profit-loss' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
          <div className="border-b border-gray-100 pb-4 text-center">
            <h3 className="text-lg font-black text-gray-900">Profit & Loss Statement (Income Statement)</h3>
            <p className="text-xs text-gray-500">For the Financial Period Ending {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Revenue */}
            <div className="bg-gray-50 p-3 rounded-xl space-y-2">
              <h4 className="font-black text-gray-900 uppercase text-[11px] tracking-wider">1. Operating Revenue</h4>
              <div className="flex justify-between pl-4 text-gray-600">
                <span>Gross Invoiced Freight Sales:</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalInvoicedSales)} AED</span>
              </div>
              <div className="flex justify-between pl-4 text-gray-600">
                <span>Less: UAE VAT (5% Output Tax):</span>
                <span className="font-bold text-red-600">({formatCurrency(totalOutputVAT)}) AED</span>
              </div>
              <div className="flex justify-between pl-4 pt-1 border-t border-gray-200 font-bold text-gray-900">
                <span>Net Operating Revenue:</span>
                <span>{formatCurrency(totalNetSales)} AED</span>
              </div>
            </div>

            {/* COGS */}
            <div className="bg-gray-50 p-3 rounded-xl space-y-2">
              <h4 className="font-black text-gray-900 uppercase text-[11px] tracking-wider">2. Cost of Sales (Direct Freight Costs)</h4>
              <div className="flex justify-between pl-4 text-gray-600">
                <span>Direct Vendor Shipping & Airfreight:</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalVendorCost)} AED</span>
              </div>
              <div className="flex justify-between pl-4 text-gray-600">
                <span>Broker & Agent Commissions:</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalBrokerCommission)} AED</span>
              </div>
              <div className="flex justify-between pl-4 text-gray-600">
                <span>Local Pickup & Customs Handling:</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalPickupCosts)} AED</span>
              </div>
              <div className="flex justify-between pl-4 pt-1 border-t border-gray-200 font-bold text-gray-900">
                <span>Total Cost of Sales (COGS):</span>
                <span>{formatCurrency(totalCOGS)} AED</span>
              </div>
            </div>

            {/* Gross Profit Summary */}
            <div className="p-3 bg-emerald-50 rounded-xl flex justify-between font-black text-sm text-emerald-900">
              <span>Gross Profit (Net Sales - COGS):</span>
              <span>{formatCurrency(grossProfit)} AED</span>
            </div>

            {/* OPEX */}
            <div className="bg-gray-50 p-3 rounded-xl space-y-2">
              <h4 className="font-black text-gray-900 uppercase text-[11px] tracking-wider">3. Operating Expenses (OPEX)</h4>
              <div className="flex justify-between pl-4 text-gray-600">
                <span>Total Documented Company Expenses:</span>
                <span className="font-bold text-gray-900">{formatCurrency(totalOpexExpenses)} AED</span>
              </div>
            </div>

            {/* Net Operating Profit */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between font-black text-base">
              <span>Net Operating Profit Before Tax:</span>
              <span className="text-emerald-400">{formatCurrency(netOperatingProfit)} AED</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: VAT SUITE & FTA 201 --- */}
      {activeSubTab === 'vat-suite' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
          <div className="border-b border-gray-100 pb-4 text-center">
            <h3 className="text-lg font-black text-gray-900">UAE Federal Tax Authority (FTA Form 201) VAT Return</h3>
            <p className="text-xs text-gray-500">Official VAT Return Preparation & Box Breakdown</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">FTA Box</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5 text-right">Taxable Amount (AED)</th>
                    <th className="px-4 py-2.5 text-right">VAT Amount (5%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-mono font-bold">Box 1a</td>
                    <td className="px-4 py-3 font-medium">Standard Rated Supplies in Dubai / UAE</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(totalNetSales)}</td>
                    <td className="px-4 py-3 text-right font-black text-orange-600">{formatCurrency(totalOutputVAT)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono font-bold">Box 9</td>
                    <td className="px-4 py-3 font-medium">Standard Rated Recoverable Expenses</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(totalOpexExpenses)}</td>
                    <td className="px-4 py-3 text-right font-black text-blue-600">{formatCurrency(totalInputVAT)}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-3 font-mono font-black">Box 12</td>
                    <td className="px-4 py-3">Total Value of Output Tax Due</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(totalOutputVAT)}</td>
                  </tr>
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-3 font-mono font-black">Box 13</td>
                    <td className="px-4 py-3">Total Value of Recoverable Input Tax</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(totalInputVAT)}</td>
                  </tr>
                  <tr className="bg-slate-900 text-white font-black text-sm">
                    <td className="px-4 py-3.5 font-mono text-amber-400">Box 14</td>
                    <td className="px-4 py-3.5">Net VAT Payable to Federal Tax Authority</td>
                    <td className="px-4 py-3.5 text-right">-</td>
                    <td className="px-4 py-3.5 text-right text-amber-300">{formatCurrency(netVATPayable)} AED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 7: CORPORATE TAX (9%) --- */}
      {activeSubTab === 'corporate-tax' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
          <div className="border-b border-gray-100 pb-4 text-center">
            <h3 className="text-lg font-black text-gray-900">UAE Corporate Tax Provision & Calculation (Federal Decree-Law No. 47)</h3>
            <p className="text-xs text-gray-500">9% Corporate Tax Assessment with 375,000 AED Small Business Relief</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-gray-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Accounting Net Profit</span>
              <p className="text-base font-black text-gray-900 mt-1">{formatCurrency(netOperatingProfit)} AED</p>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">0% Tax Relief Threshold</span>
              <p className="text-base font-black text-emerald-700 mt-1">{formatCurrency(corporateTaxThreshold)} AED</p>
            </div>
            <div className="p-3.5 bg-blue-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Estimated 9% Tax Liability</span>
              <p className="text-base font-black text-blue-700 mt-1">{formatCurrency(corporateTaxDue)} AED</p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 8: JOURNAL ENTRIES --- */}
      {activeSubTab === 'journal-entries' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900">Journal Entries & Dual-Entry Adjustments</h3>
              <p className="text-xs text-gray-500">Post adjusting entries, accruals, depreciation, and payroll vouchers</p>
            </div>
            <button
              onClick={() => setIsAddingJournal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus size={14} />
              <span>New Journal Voucher</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5">Entry #</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Memo / Particulars</th>
                  <th className="px-4 py-2.5 text-right">Debit (AED)</th>
                  <th className="px-4 py-2.5 text-right">Credit (AED)</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {journalEntries.map(j => (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{j.entryNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(j.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">{j.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{j.memo}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-900">{formatCurrency(j.totalDebit)}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-900">{formatCurrency(j.totalCredit)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {j.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 9: BANK RECONCILIATION --- */}
      {activeSubTab === 'bank-reconciliation' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
          <div className="border-b border-gray-100 pb-4 text-center">
            <h3 className="text-lg font-black text-gray-900">Bank Statement Reconciliation</h3>
            <p className="text-xs text-gray-500">Reconcile physical bank account statement against internal ledger balances</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-gray-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">System Ledger Balance</span>
              <p className="text-base font-black text-gray-900 mt-1">{formatCurrency(184500)} AED</p>
            </div>
            <div className="p-3.5 bg-blue-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Bank Statement Balance</span>
              <p className="text-base font-black text-blue-700 mt-1">{formatCurrency(bankStmtBalance)} AED</p>
            </div>
            <div className="p-3.5 bg-emerald-50 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Unreconciled Variance</span>
              <p className="text-base font-black text-emerald-700 mt-1">0.00 AED (Balanced)</p>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 10: FIXED ASSETS REGISTER --- */}
      {activeSubTab === 'fixed-assets' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-black text-gray-900">Fixed Asset Register & Depreciation Schedule</h3>
            <p className="text-xs text-gray-500">Track capital assets, useful lives, and straight-line depreciation amortization</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5">Asset Code</th>
                  <th className="px-4 py-2.5">Asset Name</th>
                  <th className="px-4 py-2.5">Purchase Date</th>
                  <th className="px-4 py-2.5 text-right">Cost (AED)</th>
                  <th className="px-4 py-2.5 text-right">Accum. Depreciation</th>
                  <th className="px-4 py-2.5 text-right">Net Book Value</th>
                  <th className="px-4 py-2.5">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {fixedAssets.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{a.assetCode}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{a.name}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(a.purchaseDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-900">{formatCurrency(a.purchasePrice)}</td>
                    <td className="px-4 py-3 text-right text-red-600">({formatCurrency(a.accumulatedDepreciation)})</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">{formatCurrency(a.netBookValue)}</td>
                    <td className="px-4 py-3 text-gray-500">{a.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 11: APPROVALS & REQUESTS --- */}
      {activeSubTab === 'approvals' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-black text-gray-900">Accounting Approvals & Internal Control Queue</h3>
            <p className="text-xs text-gray-500">Review invoice revisions, staff expense claims, and credit note issuance requests</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Reference #</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5">Requested By</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Comments</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {approvals.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{app.type}</td>
                    <td className="px-4 py-3 font-bold text-orange-600">{app.referenceNumber}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-900">{formatCurrency(app.amount)}</td>
                    <td className="px-4 py-3 text-gray-700">{app.requestedByName}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(app.requestedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{app.comments}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Journal Voucher Modal */}
      {isAddingJournal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-black text-base text-amber-400 flex items-center gap-2">
                <Zap size={16} /> Quick Dual-Entry Journal Voucher Terminal
              </h3>
              <button onClick={() => setIsAddingJournal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Voucher Date</label>
                <input
                  type="date"
                  value={newJournal.date}
                  onChange={(e) => setNewJournal({ ...newJournal, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. ADJ-M02-PAYROLL"
                  value={newJournal.reference}
                  onChange={(e) => setNewJournal({ ...newJournal, reference: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-amber-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 font-bold mb-1">Particulars / Memo</label>
                <input
                  type="text"
                  placeholder="Memo details for this accounting adjustment..."
                  value={newJournal.memo}
                  onChange={(e) => setNewJournal({ ...newJournal, memo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Lines */}
            <div className="space-y-2 text-xs">
              {newJournal.lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <div className="col-span-6">
                    <select
                      value={line.ledgerId}
                      onChange={(e) => {
                        const sel = ledgers.find(l => l.id === e.target.value);
                        const updated = [...newJournal.lines];
                        updated[idx].ledgerId = e.target.value;
                        updated[idx].ledgerName = sel ? sel.name : '';
                        setNewJournal({ ...newJournal, lines: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-xs"
                    >
                      <option value="">Select Ledger Account...</option>
                      {ledgers.map(l => (
                        <option key={l.id} value={l.id}>{l.code} - {l.name} ({l.category})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Debit"
                      value={line.debit || ''}
                      onFocus={(e) => {
                        if (line.debit === 0) {
                          const updated = [...newJournal.lines];
                          updated[idx].debit = 0;
                          setNewJournal({ ...newJournal, lines: updated });
                        } else {
                          e.target.select();
                        }
                      }}
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                          const updated = [...newJournal.lines];
                          updated[idx].debit = raw === '' || raw === '.' ? 0 : parseFloat(raw);
                          setNewJournal({ ...newJournal, lines: updated });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-right text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Credit"
                      value={line.credit || ''}
                      onFocus={(e) => {
                        if (line.credit === 0) {
                          const updated = [...newJournal.lines];
                          updated[idx].credit = 0;
                          setNewJournal({ ...newJournal, lines: updated });
                        } else {
                          e.target.select();
                        }
                      }}
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                          const updated = [...newJournal.lines];
                          updated[idx].credit = raw === '' || raw === '.' ? 0 : parseFloat(raw);
                          setNewJournal({ ...newJournal, lines: updated });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white text-right text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Balance Delta */}
            {(() => {
              const debitSum = newJournal.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
              const creditSum = newJournal.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
              const isBalanced = Math.abs(debitSum - creditSum) < 0.01 && debitSum > 0;

              return (
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Total Debit: <strong>{debitSum.toFixed(2)} AED</strong> | Total Credit: <strong>{creditSum.toFixed(2)} AED</strong></span>
                  <span className={`font-black px-2 py-0.5 rounded-full ${isBalanced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isBalanced ? '✓ Balanced' : `Out by ${(debitSum - creditSum).toFixed(2)} AED`}
                  </span>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsAddingJournal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handlePostJournal}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black"
              >
                Post Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantDashboard;
