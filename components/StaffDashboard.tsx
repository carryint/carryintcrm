import React, { useState } from 'react';
import {
  FileCheck,
  Receipt,
  TrendingUp,
  Award,
  Calendar,
  PlusCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  User,
  Filter,
  BarChart2,
  PieChart
} from 'lucide-react';
import { Invoice, Quotation, User as UserType } from '../types';
import { formatCurrency, sortInvoicesByNewestCreated } from '../utils';

interface StaffDashboardProps {
  currentUser: UserType;
  invoices: Invoice[];
  quotations: Quotation[];
  onNavigate: (tab: string) => void;
  onInvoiceClick: (invoice: Invoice) => void;
  onQuotationClick: (quotation: Quotation) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  currentUser,
  invoices,
  quotations,
  onNavigate,
  onInvoiceClick,
  onQuotationClick,
}) => {
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'month' | 'all' | 'custom'>('30days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Filter ONLY invoices and quotations created by this staff member
  const staffInvoices = invoices.filter(inv => {
    // Match by creator ID or creator Name or fallback if creator field matches user email/id
    const isStaffOwner =
      inv.createdBy === currentUser.id ||
      inv.createdByName?.toLowerCase() === currentUser.name.toLowerCase() ||
      inv.createdBy === currentUser.email;

    if (!isStaffOwner) return false;

    if (dateFilter === 'all') return true;
    const invDate = new Date(inv.date);
    invDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      return invDate.toDateString() === now.toDateString();
    }
    if (dateFilter === '7days') {
      const limit = new Date(now);
      limit.setDate(limit.getDate() - 7);
      return invDate >= limit;
    }
    if (dateFilter === '30days') {
      const limit = new Date(now);
      limit.setDate(limit.getDate() - 30);
      return invDate >= limit;
    }
    if (dateFilter === 'month') {
      return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'custom') {
      if (customStart) {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        if (invDate < start) return false;
      }
      if (customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (invDate > end) return false;
      }
      return true;
    }
    return true;
  });

  const staffQuotations = quotations.filter(q => {
    const isStaffOwner =
      q.createdBy === currentUser.id ||
      q.createdByName?.toLowerCase() === currentUser.name.toLowerCase() ||
      q.createdBy === currentUser.email;

    if (!isStaffOwner) return false;

    if (dateFilter === 'all') return true;
    const qDate = new Date(q.date);
    qDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      return qDate.toDateString() === now.toDateString();
    }
    if (dateFilter === '7days') {
      const limit = new Date(now);
      limit.setDate(limit.getDate() - 7);
      return qDate >= limit;
    }
    if (dateFilter === '30days') {
      const limit = new Date(now);
      limit.setDate(limit.getDate() - 30);
      return qDate >= limit;
    }
    if (dateFilter === 'month') {
      return qDate.getMonth() === now.getMonth() && qDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'custom') {
      if (customStart) {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        if (qDate < start) return false;
      }
      if (customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (qDate > end) return false;
      }
      return true;
    }
    return true;
  });

  // Calculate individual staff stats
  const totalRevenue = staffInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalProfit = staffInvoices.reduce((sum, inv) => sum + (inv.profit || (inv.totalAmount - inv.vendorCost)), 0);
  const paidInvoicesCount = staffInvoices.filter(i => i.status === 'PAID').length;
  const totalQuotesCount = staffQuotations.length;
  const acceptedQuotesCount = staffQuotations.filter(q => q.status === 'ACCEPTED').length;

  const quoteConversionRate = totalQuotesCount > 0
    ? Math.round((acceptedQuotesCount / totalQuotesCount) * 100)
    : (staffInvoices.length > 0 ? 80 : 0);

  const averageDealSize = staffInvoices.length > 0 ? (totalRevenue / staffInvoices.length) : 0;
  const monthlyTarget = 50000; // Benchmark AED target
  const targetProgress = Math.min(Math.round((totalRevenue / monthlyTarget) * 100), 100);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-orange-500/30">
                Staff Sales Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Signed in as: <strong className="text-white">{currentUser.name}</strong>
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight">
              My Sales Performance Dashboard
            </h1>
            <p className="text-slate-300 text-xs mt-0.5 max-w-xl">
              Track your individual invoices generated, quotation pipeline, personal profit contribution, and sales conversion results.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('create-invoice')}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-3.5 py-2 rounded-lg shadow-md transition-all flex items-center gap-1.5 text-xs"
            >
              <PlusCircle size={15} />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={() => onNavigate('quotations')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2 rounded-lg border border-white/20 backdrop-blur-sm transition-all flex items-center gap-1.5 text-xs"
            >
              <FileCheck size={15} />
              <span>Make Quotation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={15} className="text-orange-600" />
          <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                dateFilter === tab.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-1.5 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invoices Created */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 mb-2.5 group-hover:scale-105 transition-transform">
            <Receipt size={18} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">My Invoices</p>
          <div className="flex items-baseline justify-between mt-0.5">
            <h3 className="text-2xl font-black text-gray-900">{staffInvoices.length}</h3>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {paidInvoicesCount} Paid
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Invoices generated by you</p>
        </div>

        {/* Total Personal Revenue */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-2.5 group-hover:scale-105 transition-transform">
            <DollarSign size={18} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">My Sales Revenue</p>
          <div className="flex items-baseline justify-between mt-0.5">
            <h3 className="text-xl font-black text-gray-900">{formatCurrency(totalRevenue)}</h3>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            Avg deal: {formatCurrency(averageDealSize)}
          </p>
        </div>

        {/* Personal Profit Contribution */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2.5 group-hover:scale-105 transition-transform">
            <TrendingUp size={18} />
          </div>
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">My Profit Made</p>
          <div className="flex items-baseline justify-between mt-0.5">
            <h3 className="text-xl font-black text-emerald-800">{formatCurrency(totalProfit)}</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
              {totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}%
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Direct net margin from your invoices</p>
        </div>

        {/* Quotations & Conversion */}
        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-2.5 group-hover:scale-105 transition-transform">
            <FileCheck size={18} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quotes & Conversion</p>
          <div className="flex items-baseline justify-between mt-0.5">
            <h3 className="text-2xl font-black text-gray-900">{staffQuotations.length}</h3>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">
              {quoteConversionRate}% Won
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">{acceptedQuotesCount} accepted quotations</p>
        </div>
      </div>

      {/* Target Progress Bar & Sales Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900">Personal Sales Quota Progress</h3>
              <p className="text-[11px] text-gray-500">Track your progress toward target volume</p>
            </div>
            <span className="text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
              {targetProgress}% Completed
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${targetProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 font-bold">
              <span>Achieved: {formatCurrency(totalRevenue)}</span>
              <span>Target: {formatCurrency(monthlyTarget)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
            <div className="p-2.5 bg-gray-50 rounded-lg text-center">
              <p className="text-[9.5px] font-bold text-gray-400 uppercase">Unpaid Invoices</p>
              <p className="text-sm font-black text-red-600 mt-0.5">
                {staffInvoices.filter(i => i.status === 'UNPAID').length}
              </p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg text-center">
              <p className="text-[9.5px] font-bold text-gray-400 uppercase">Active Quotes</p>
              <p className="text-sm font-black text-blue-600 mt-0.5">
                {staffQuotations.filter(q => q.status === 'DRAFT' || q.status === 'SENT').length}
              </p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg text-center">
              <p className="text-[9.5px] font-bold text-gray-400 uppercase">Paid Closed Value</p>
              <p className="text-sm font-black text-emerald-600 mt-0.5">
                {formatCurrency(staffInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Tips */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="text-orange-400" size={16} />
              <h3 className="font-black text-sm">Sales Fast Actions</h3>
            </div>
            <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
              Quickly create tax invoices or quotation offers for your clients.
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => onNavigate('create-invoice')}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-colors"
              >
                <span>➕ New Tax Invoice</span>
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => onNavigate('quotations')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-colors"
              >
                <span>📄 New Quotation</span>
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => onNavigate('customers')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-colors"
              >
                <span>👥 Customer Directory</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="pt-2.5 mt-2.5 border-t border-slate-700/60 text-[10px] text-slate-400">
            Standard Staff access active.
          </div>
        </div>
      </div>

      {/* Recent Invoices Created by this Staff Member */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">My Recent Invoices</h3>
            <p className="text-xs text-gray-500">Invoices you generated for customers</p>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
          >
            <span>View All Invoices</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Invoice No</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Destination</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-right">Profit</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {staffInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 font-medium">
                    No invoices generated by you for this period. Click "Create Invoice" to start.
                  </td>
                </tr>
              ) : (
                sortInvoicesByNewestCreated(staffInvoices).slice(0, 8).map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{inv.customerName}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        {inv.destinationCountry || 'UAE'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs font-medium">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-black text-gray-900">
                      {inv.totalAmount.toFixed(2)} AED
                    </td>
                    <td className="px-6 py-3.5 text-right font-black text-emerald-600">
                      {(inv.profit || (inv.totalAmount - inv.vendorCost)).toFixed(2)} AED
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => onInvoiceClick(inv)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Quotations created by Staff */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900">My Quotations & Offers</h3>
            <p className="text-xs text-gray-500">Quotations you generated for potential shipments</p>
          </div>
          <button
            onClick={() => onNavigate('quotations')}
            className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
          >
            <span>View All Quotations</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Quote #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Destination</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total Offer</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {staffQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 font-medium">
                    No quotations made yet for this period.
                  </td>
                </tr>
              ) : (
                staffQuotations.slice(0, 6).map(quote => (
                  <tr key={quote.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-gray-900">{quote.quotationNumber}</td>
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{quote.customerName}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 uppercase">
                        {quote.destinationCountry || 'UAE'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs font-medium">
                      {new Date(quote.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          quote.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-700'
                            : quote.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : quote.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-black text-gray-900">
                      {quote.totalAmount.toFixed(2)} AED
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => onQuotationClick(quote)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
