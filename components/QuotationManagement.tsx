import React, { useState } from 'react';
import { Quotation, CustomerCategory, QuotationStatus } from '../types';
import { formatCurrency } from '../utils';
import { 
  PlusCircle, 
  Search, 
  FileText, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Edit, 
  Trash2, 
  Copy, 
  Receipt,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
  MapPin
} from 'lucide-react';

interface QuotationManagementProps {
  quotations: Quotation[];
  onAddNew: () => void;
  onView: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (id: string) => void;
  onDuplicate: (quotation: Quotation) => void;
  onConvertToInvoice: (quotation: Quotation) => void;
  searchQuery?: string;
}

export const QuotationManagement: React.FC<QuotationManagementProps> = ({
  quotations,
  onAddNew,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onConvertToInvoice,
  searchQuery = ''
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CustomerCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QuotationStatus>('ALL');
  const [validityFilter, setValidityFilter] = useState<'ALL' | 'VALID' | 'EXPIRED'>('ALL');

  const activeSearch = searchQuery || internalSearch;

  const today = new Date().setHours(0, 0, 0, 0);

  const filteredQuotations = quotations.filter((q) => {
    const query = activeSearch.toLowerCase();
    const matchesSearch = 
      q.quotationNumber.toLowerCase().includes(query) ||
      q.customerName.toLowerCase().includes(query) ||
      q.customerContact.toLowerCase().includes(query) ||
      (q.customerEmail && q.customerEmail.toLowerCase().includes(query)) ||
      (q.pickupAddress && q.pickupAddress.toLowerCase().includes(query)) ||
      (q.deliveryAddress && q.deliveryAddress.toLowerCase().includes(query));

    const matchesCategory = categoryFilter === 'ALL' || q.customerCategory === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;

    const isExpired = new Date(q.validityDate).getTime() < today;
    const matchesValidity = 
      validityFilter === 'ALL' ||
      (validityFilter === 'VALID' && !isExpired) ||
      (validityFilter === 'EXPIRED' && isExpired);

    return matchesSearch && matchesCategory && matchesStatus && matchesValidity;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Section stats
  const totalQuotationsCount = quotations.length;
  const commercialQuotesCount = quotations.filter(q => q.customerCategory === 'COMMERCIAL').length;
  const personalQuotesCount = quotations.filter(q => q.customerCategory === 'PERSONAL').length;
  const totalQuotedValue = quotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0);

  const getValidityBadge = (validityDateStr: string) => {
    const vTime = new Date(validityDateStr).getTime();
    const diffDays = Math.ceil((vTime - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          <Clock size={11} /> Expired
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <Clock size={11} /> Expires Today
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <Clock size={11} /> {diffDays} {diffDays === 1 ? 'day' : 'days'} left
        </span>
      );
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-800">Accepted</span>;
      case 'SENT':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Sent</span>;
      case 'REJECTED':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'EXPIRED':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">Expired</span>;
      case 'DRAFT':
      default:
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Draft</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="text-orange-500" />
            Quotations Management
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Commercial & Personal price quotes (5-day validity). Not included in accounting & dashboard totals.
          </p>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 text-sm"
        >
          <PlusCircle size={18} />
          Create New Quotation
        </button>
      </div>

      {/* Overview Stat Cards (Independent from financial accounting) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Quotations</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{totalQuotationsCount}</h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <Layers size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Commercial Quotes</p>
            <h3 className="text-2xl font-black text-blue-700 mt-1">{commercialQuotesCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Personal Quotes</p>
            <h3 className="text-2xl font-black text-purple-700 mt-1">{personalQuotesCount}</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <User size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Quoted Value</p>
            <h3 className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(totalQuotedValue)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by quote code, customer, phone, location..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Category Filter */}
          <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setCategoryFilter('COMMERCIAL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === 'COMMERCIAL' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600'}`}
            >
              Commercial
            </button>
            <button
              onClick={() => setCategoryFilter('PERSONAL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === 'PERSONAL' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600'}`}
            >
              Personal
            </button>
          </div>

          {/* Validity Filter */}
          <select
            value={validityFilter}
            onChange={(e) => setValidityFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Validity</option>
            <option value="VALID">Active / Valid Only</option>
            <option value="EXPIRED">Expired</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredQuotations.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-900">No Quotations Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {activeSearch || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No quotations match your current filter criteria.'
                : 'Create your first commercial or personal price quotation with 5-day validity.'}
            </p>
            <button
              onClick={onAddNew}
              className="mt-4 inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-700"
            >
              <PlusCircle size={15} /> Create Quotation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Quote No & Date</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Route (Origin → Dest)</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Weight / Qty</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Validity (5 Days)</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Total Price</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQuotations.map((q) => {
                  const totalWeight = q.items.reduce((s, i) => s + (Number(i.weight) || 0), 0);
                  const totalQty = q.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

                  return (
                    <tr key={q.id} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => onView(q)}
                          className="font-black text-sm text-slate-900 group-hover:text-orange-600 hover:underline block text-left"
                        >
                          {q.quotationNumber}
                        </button>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {new Date(q.date).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            q.customerCategory === 'COMMERCIAL'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {q.customerCategory === 'COMMERCIAL' ? <Building2 size={10} /> : <User size={10} />}
                            {q.customerCategory === 'COMMERCIAL' ? 'Commercial' : 'Personal'}
                          </span>
                        </div>
                        <p className="font-bold text-xs text-gray-900">{q.customerName}</p>
                        <p className="text-[11px] text-gray-500">{q.customerContact}</p>
                      </td>

                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-xs font-semibold text-gray-800 truncate" title={q.pickupAddress}>
                          <span className="text-emerald-600 font-bold">From:</span> {q.pickupAddress || 'Dubai, UAE'}
                        </p>
                        <p className="text-xs font-semibold text-gray-800 truncate mt-0.5" title={q.deliveryAddress}>
                          <span className="text-orange-600 font-bold">To:</span> {q.deliveryAddress || 'Destination'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="text-xs font-black text-gray-900 block">
                          {totalWeight > 0 ? `${totalWeight} kg` : '--'}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500">
                          {totalQty > 0 ? `${totalQty} pkgs` : '1 shipment'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-gray-800 mb-0.5">
                          {new Date(q.validityDate).toLocaleDateString()}
                        </p>
                        {getValidityBadge(q.validityDate)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="font-black text-sm text-slate-900 block">
                          {formatCurrency(q.totalAmount)}
                        </span>
                        {q.vatAmount > 0 && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            Incl. {formatCurrency(q.vatAmount)} VAT
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        {getStatusBadge(q.status)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onView(q)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="View & Print Quotation"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => onEdit(q)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="Edit Quotation"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => onConvertToInvoice(q)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                            title="Convert to Active Invoice"
                          >
                            <Receipt size={15} />
                          </button>
                          <button
                            onClick={() => onDuplicate(q)}
                            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors"
                            title="Duplicate Quotation"
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={() => onDelete(q.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Delete Quotation"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationManagement;
