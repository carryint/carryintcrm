import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import { TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle, CreditCard, Wallet, X, FileText, ExternalLink, Calendar, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../utils';
import { Invoice, Expense, AdjustmentNote } from '../types';

interface DashboardProps {
  invoices: Invoice[];
  expenses: Expense[];
  adjustmentNotes: AdjustmentNote[];
  onInvoiceClick: (invoice: Invoice) => void;
}

const RatioIndicator = ({ label, value, color, tooltip }: { label: string, value: number, color: string, tooltip: string }) => {
  const displayVal = isNaN(value) || !isFinite(value) ? 0 : value;
  return (
    <div className="space-y-1.5 group relative">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-gray-600 flex items-center gap-1">
          {label}
        </span>
        <span className="text-gray-900">{displayVal.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(Math.max(displayVal, 0), 100)}%` }}></div>
      </div>
      <p className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-1 leading-normal">{tooltip}</p>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ invoices, expenses, adjustmentNotes, onInvoiceClick }) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | '60days' | '90days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const filteredInvoices = invoices.filter(inv => {
    if (dateFilter === 'all') return true;
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

  const filteredExpenses = expenses.filter(exp => {
    if (dateFilter === 'all') return true;
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

  const filteredAdjustments = adjustmentNotes.filter(adj => {
    if (dateFilter === 'all') return true;
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

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const grossProfit = filteredInvoices.reduce((sum, inv) => sum + inv.profit, 0);
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
    .filter(inv => inv.vendorStatus === 'PAID')
    .reduce((sum, inv) => sum + (inv.vendorCost || 0), 0);

  const outstandingPayables = filteredInvoices
    .filter(inv => inv.vendorStatus !== 'PAID')
    .reduce((sum, inv) => sum + (inv.vendorCost || 0), 0);

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

  // Dynamic monthly aggregation for the last 6 calendar months
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

    filteredInvoices.forEach(inv => {
      const invDate = new Date(inv.date);
      const y = invDate.getFullYear();
      const m = invDate.getMonth();
      const target = months.find(item => item.year === y && item.month === m);
      if (target) {
        target.revenue += inv.totalAmount;
        target.profit += inv.profit;
      }
    });

    filteredExpenses.forEach(exp => {
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
  const recentShipments = filteredInvoices.slice(-5).reverse();

  const handleCardClick = (filter: string) => {
    setSelectedFilter(filter);
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
    doc.text("Dashboard Financial Snapshot Report", 15, 26);
    
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const filterText = dateFilter === 'all' ? 'All Time' :
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
    
    // Primary KPIs Table
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
      headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] }, // orange-500
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
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }, // indigo-600
      bodyStyles: { fontSize: 10 },
      margin: { left: 15, right: 15 }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Confidential - For Internal Use Only", 15, currentY);
    doc.text("This report was automatically generated from current live CRM database transactions.", 15, currentY + 5);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`CarryInt_Dashboard_Report_Snapshot_${dateStr}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Date Filter & Export Row */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <span className="text-xs font-black text-gray-500 uppercase tracking-wider mr-2 flex items-center gap-1.5">
            <Calendar size={14} className="text-orange-500" /> Period:
          </span>
          <button
            onClick={() => setDateFilter('all')}
            className={`text-xs font-black px-4 py-2 rounded-full transition-all ${
              dateFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateFilter('7days')}
            className={`text-xs font-black px-4 py-2 rounded-full transition-all ${
              dateFilter === '7days' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateFilter('30days')}
            className={`text-xs font-black px-4 py-2 rounded-full transition-all ${
              dateFilter === '30days' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateFilter('60days')}
            className={`text-xs font-black px-4 py-2 rounded-full transition-all ${
              dateFilter === '60days' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Last 60 Days
          </button>
          <button
            onClick={() => setDateFilter('90days')}
            className={`text-xs font-black px-4 py-2 rounded-full transition-all ${
              dateFilter === '90days' ? 'bg-slate-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Last 90 Days
          </button>
          <button
            onClick={() => setDateFilter('custom')}
            className={`text-xs font-black px-4 py-2 rounded-full transition-all ${
              dateFilter === 'custom' ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Custom Range
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-amber-200 bg-amber-50 text-xs font-bold text-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-gray-400 text-xs font-bold">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-amber-200 bg-amber-50 text-xs font-bold text-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-black shadow-md hover:bg-orange-700 active:scale-95 transition-all"
            title="Download PDF Snapshot"
          >
            <Download size={14} />
            Export PDF Snapshot
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Net Profit" 
          value={formatCurrency(netProfit)} 
          icon={<TrendingUp />} 
          trend={`Margin: ${netMargin.toFixed(1)}%`}
          bgColor="bg-orange-500/10"
          isHero={true}
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={<DollarSign className="text-blue-600" />} 
          trend="Total Sales" 
          bgColor="bg-blue-50"
          onClick={() => handleCardClick('Total Revenue')}
        />
        <StatCard 
          title="Gross Profit" 
          value={formatCurrency(grossProfit)} 
          icon={<TrendingUp className="text-emerald-600" />} 
          trend={`Margin: ${grossMargin.toFixed(1)}%`} 
          bgColor="bg-emerald-50"
        />
        <StatCard 
          title="Company Expenses" 
          value={formatCurrency(totalExpenses)} 
          icon={<Wallet className="text-red-600" />} 
          trend={`Ratio: ${expenseRatio.toFixed(1)}%`} 
          bgColor="bg-red-50"
          onClick={() => handleCardClick('Company Expenses')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow & Payables Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Cash flow & Receivables (Inflow)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard 
                title="Received Amount" 
                value={formatCurrency(receivedAmount)} 
                icon={<CheckCircle className="text-emerald-600" />} 
                trend={`${cashCollectionRate.toFixed(1)}% Collected`} 
                bgColor="bg-emerald-50"
                onClick={() => handleCardClick('Received Amount')}
              />
              <StatCard 
                title="Outstanding Receivables" 
                value={formatCurrency(outstandingReceivables)} 
                icon={<Clock className="text-orange-600" />} 
                trend="A/R Pending" 
                bgColor="bg-orange-50"
                onClick={() => handleCardClick('Outstanding Receivables')}
              />
              <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Collection Rate</p>
                <div className="mt-2">
                  <span className="text-xl font-black text-gray-900">{cashCollectionRate.toFixed(1)}%</span>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(cashCollectionRate, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Payables & Outlays (Outflow)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard 
                title="Paid to Vendors" 
                value={formatCurrency(paidAmount)} 
                icon={<CreditCard className="text-purple-600" />} 
                trend="Settled Cost" 
                bgColor="bg-purple-50"
                onClick={() => handleCardClick('Paid Amount (Vendors)')}
              />
              <StatCard 
                title="Outstanding Payables" 
                value={formatCurrency(outstandingPayables)} 
                icon={<AlertCircle className="text-red-600" />} 
                trend="A/P Due" 
                bgColor="bg-red-50"
                onClick={() => handleCardClick('Outstanding Payables')}
              />
              <StatCard 
                title="Paid Broker Comm." 
                value={formatCurrency(paidAgentCommission)} 
                icon={<CreditCard className="text-teal-600" />} 
                trend="Paid" 
                bgColor="bg-teal-50"
                onClick={() => handleCardClick('Paid Broker Comm.')}
              />
              <StatCard 
                title="Unpaid Broker Comm." 
                value={formatCurrency(unpaidAgentCommission)} 
                icon={<Clock className="text-pink-600" />} 
                trend="Pending" 
                bgColor="bg-pink-50"
                onClick={() => handleCardClick('Unpaid Broker Comm.')}
              />
            </div>
          </div>
        </div>

        {/* Financial Ratios & Performance Snapshot Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Financial Health Snapshot</h3>
            <div className="space-y-5">
              <RatioIndicator 
                label="Gross Profit Margin" 
                value={grossMargin} 
                color="bg-emerald-500" 
                tooltip="Shows sales profitability before operating expenses"
              />
              <RatioIndicator 
                label="Net Profit Margin" 
                value={netMargin} 
                color="bg-orange-500" 
                tooltip="Bottom-line efficiency: percentage of revenue kept as profit"
              />
              <RatioIndicator 
                label="Cash Conversion Rate" 
                value={cashCollectionRate} 
                color="bg-blue-500" 
                tooltip="Percentage of billed revenue collected as actual cash"
              />
              <RatioIndicator 
                label="Operating Expense Ratio" 
                value={expenseRatio} 
                color="bg-red-500" 
                tooltip="Percentage of revenue consumed by overhead expenses"
              />
              <RatioIndicator 
                label="Payable Margin Burden" 
                value={payableMarginBurden} 
                color="bg-purple-500" 
                tooltip="Pending vendor costs relative to gross earnings"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 mt-6 text-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Real-time Performance Metrics</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Revenue, Expenses & Net Profit Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `AED ${val/1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#f97316" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" name="Expenses" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                <Line type="monotone" name="Net Profit" dataKey="netProfit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Recent Shipments & Profits</h3>
          <div className="space-y-4">
            {recentShipments.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No shipments found.</p>
            ) : (
              recentShipments.map((inv) => (
                <div 
                  key={inv.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                  onClick={() => onInvoiceClick(inv)}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{inv.customerName}</p>
                    <p className="text-xs text-gray-500">{inv.invoiceNumber} • {inv.items[0]?.coo || 'N/A'} to {inv.destinationCountry}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{formatCurrency(inv.totalAmount)}</p>
                    <p className="text-xs font-medium text-green-600">Profit: {formatCurrency(inv.profit)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedFilter}</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredResults.items.length} {filteredResults.type === 'invoice' ? 'invoices' : 'expenses'}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {filteredResults.items.length === 0 ? (
                <div className="text-center py-20">
                  <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">No results found for this category.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0">
                      <tr>
                        {filteredResults.type === 'invoice' ? (
                          <>
                            <th className="px-4 py-3 border-b">Inv No</th>
                            <th className="px-4 py-3 border-b">Date</th>
                            <th className="px-4 py-3 border-b">Customer</th>
                            <th className="px-4 py-3 border-b">From</th>
                            <th className="px-4 py-3 border-b">To</th>
                            <th className="px-4 py-3 border-b text-right">Total Amount</th>
                            <th className="px-4 py-3 border-b text-center">Status</th>
                            {selectedFilter === 'Gross Profit' || selectedFilter === 'Net Profit' ? (
                              <th className="px-4 py-3 border-b text-right">Profit</th>
                            ) : null}
                            {selectedFilter?.includes('Broker') && (
                              <th className="px-4 py-3 border-b text-right">Broker Comm.</th>
                            )}
                            {selectedFilter?.includes('Vendor') || selectedFilter?.includes('Payables') ? (
                              <th className="px-4 py-3 border-b text-right">Vendor Cost</th>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 border-b">Date</th>
                            <th className="px-4 py-3 border-b">Details</th>
                            <th className="px-4 py-3 border-b">Payee</th>
                            <th className="px-4 py-3 border-b text-right">Amount</th>
                            <th className="px-4 py-3 border-b text-center">Method</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredResults.items.map((item: any) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-gray-50 transition-colors ${filteredResults.type === 'invoice' ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (filteredResults.type === 'invoice') {
                              onInvoiceClick(item);
                              setShowModal(false);
                            }
                          }}
                        >
                          {filteredResults.type === 'invoice' ? (
                            <>
                              <td className="px-4 py-4 font-bold text-gray-900">{item.invoiceNumber}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-sm font-medium">{item.customerName}</td>
                              <td className="px-4 py-4">
                                <span className="text-[10px] font-black px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100 uppercase">
                                  {item.items[0]?.coo || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-[10px] font-black px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                                  {item.destinationCountry}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right font-bold text-orange-600">{formatCurrency(item.totalAmount)}</td>
                              <td className="px-4 py-4 text-center">
                                <span className={`text-[10px] font-black px-2 py-1 rounded ${
                                  item.status === 'PAID' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              {selectedFilter === 'Gross Profit' || selectedFilter === 'Net Profit' ? (
                                <td className="px-4 py-4 text-right font-bold text-green-600">{formatCurrency(item.profit)}</td>
                              ) : null}
                              {selectedFilter?.includes('Broker') && (
                                <td className="px-4 py-4 text-right font-bold text-teal-600">{formatCurrency(item.agentCommission || 0)}</td>
                              )}
                              {selectedFilter?.includes('Vendor') || selectedFilter?.includes('Payables') ? (
                                <td className="px-4 py-4 text-right font-bold text-blue-600">{formatCurrency(item.vendorCost || 0)}</td>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-sm font-medium">{item.itemDetails}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{item.payeeName}</td>
                              <td className="px-4 py-4 text-right font-bold text-red-600">{formatCurrency(item.amount)}</td>
                              <td className="px-4 py-4 text-center text-xs text-gray-400 font-bold uppercase">{item.paymentMethod}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-all shadow-md"
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

const StatCard = ({ title, value, icon, trend, bgColor, onClick, isHero = false }: any) => {
  const isClickable = !!onClick;
  const CardWrapper = isClickable ? 'button' : 'div';
  
  if (isHero) {
    return (
      <div className="p-6 rounded-xl shadow-lg border border-orange-500/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white text-left transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 rounded-full bg-orange-500/10 blur-xl"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-orange-500/25 text-orange-400">
            {icon}
          </div>
          <span className="text-xs font-bold px-2 py-1 rounded-full text-orange-400 bg-orange-500/15">
            {trend}
          </span>
        </div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-xl sm:text-2xl font-black text-orange-500 mt-1 truncate" title={value}>{value}</h3>
      </div>
    );
  }

  return (
    <CardWrapper 
      onClick={onClick}
      className={`p-6 rounded-xl shadow-sm border border-gray-100 bg-white text-left transition-all ${
        isClickable 
          ? 'hover:border-orange-200 hover:shadow-md active:scale-95 group cursor-pointer' 
          : ''
      } relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          trend.includes('+') || trend.includes('%') || trend === 'Secured' || trend === 'Settled' || trend === 'Final' || trend === 'Invoices' || trend.includes('Total') || trend.includes('Paid') || trend.includes('A/R') || trend.includes('A/P') 
            ? 'text-green-600 bg-green-50' 
            : 'text-orange-600 bg-orange-50'
        }`}>
          {trend}
        </span>
      </div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-1 truncate" title={value}>{value}</h3>
        {isClickable && <ExternalLink size={14} className="text-gray-300 group-hover:text-orange-500 transition-colors mb-1" />}
      </div>
    </CardWrapper>
  );
};

export default Dashboard;
