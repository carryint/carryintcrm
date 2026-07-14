
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Search, PieChart, FileText, Download, Printer, Trash2, Edit, ChevronDown, Building2, UserCheck, LayoutList, TrendingUp, AlertCircle } from 'lucide-react';
import { Customer, Invoice, AdjustmentNote } from '../types';
import { formatCurrency, generateId } from '../utils';

interface CustomerManagementProps {
  customers: Customer[];
  invoices: Invoice[];
  adjustmentNotes: AdjustmentNote[];
  onAdd: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onUpdateInvoiceStatus: (id: string, status: 'PAID' | 'UNPAID', reference?: string) => void;
  searchQuery?: string;
  onInvoiceClick?: (invoice: Invoice) => void;
}

type FilterTab = 'ALL' | 'ONE_TIME' | 'COMMERCIAL';

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, invoices, adjustmentNotes, onAdd, onEdit, onDelete, onUpdateInvoiceStatus, searchQuery = '', onInvoiceClick }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [showAgeing, setShowAgeing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getAgeingText = (invDateStr: string, status: string, paymentDateStr?: string) => {
    const invDate = new Date(invDateStr);
    invDate.setHours(0, 0, 0, 0);
    const endDate = (status === 'PAID' && paymentDateStr) ? new Date(paymentDateStr) : new Date();
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - invDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const days = diffDays < 0 ? 0 : diffDays;

    if (status === 'PAID') {
      return paymentDateStr ? `Paid in ${days} days` : 'Paid';
    }
    return `${days} days old`;
  };

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ type: 'ONE_TIME' });

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAddDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const getCustomerStats = (customerId: string) => {
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    const customerNotes = adjustmentNotes.filter(n => n.customerId === customerId);
    const outstandingInvoices = customerInvoices
      .filter(inv => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalDebits = customerNotes
      .filter(n => n.type === 'DEBIT')
      .reduce((sum, n) => sum + n.amount, 0);
    const totalCredits = customerNotes
      .filter(n => n.type === 'CREDIT' && n.creditAction !== 'REFUND')
      .reduce((sum, n) => sum + n.amount, 0);

    const outstanding = outstandingInvoices + totalDebits - totalCredits;
    return {
      count: customerInvoices.length,
      outstanding,
      totalDebits,
      totalCredits,
      hasAdjustments: customerNotes.length > 0
    };
  };

  const getLatestInvoiceTimestamp = (customerId: string) => {
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    if (customerInvoices.length === 0) return 0;
    return Math.max(...customerInvoices.map(inv => new Date(inv.date).getTime()));
  };

  const filteredCustomers = customers
    .filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contact.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeFilter === 'ONE_TIME') return c.type === 'ONE_TIME';
      if (activeFilter === 'COMMERCIAL') return c.type === 'CREDIT';
      return true;
    })
    .sort((a, b) => {
      const aStats = getCustomerStats(a.id);
      const bStats = getCustomerStats(b.id);
      
      const aHasOutstanding = aStats.outstanding > 0;
      const bHasOutstanding = bStats.outstanding > 0;
      
      if (aHasOutstanding && !bHasOutstanding) return -1;
      if (!aHasOutstanding && bHasOutstanding) return 1;
      
      const aTime = getLatestInvoiceTimestamp(a.id);
      const bTime = getLatestInvoiceTimestamp(b.id);
      
      return bTime - aTime;
    });

  // AR Totals
  const totalAR = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0)
    + adjustmentNotes.filter(n => n.type === 'DEBIT').reduce((s, n) => s + n.amount, 0)
    - adjustmentNotes.filter(n => n.type === 'CREDIT' && n.creditAction !== 'REFUND').reduce((s, n) => s + n.amount, 0);

  const commercialCustomerIds = new Set(customers.filter(c => c.type === 'CREDIT').map(c => c.id));
  const oneTimeCustomerIds = new Set(customers.filter(c => c.type === 'ONE_TIME').map(c => c.id));

  const commercialAR = invoices.filter(i => i.status !== 'PAID' && commercialCustomerIds.has(i.customerId)).reduce((s, i) => s + i.totalAmount, 0)
    + adjustmentNotes.filter(n => n.type === 'DEBIT' && commercialCustomerIds.has(n.customerId)).reduce((s, n) => s + n.amount, 0)
    - adjustmentNotes.filter(n => n.type === 'CREDIT' && n.creditAction !== 'REFUND' && commercialCustomerIds.has(n.customerId)).reduce((s, n) => s + n.amount, 0);

  const oneTimeAR = invoices.filter(i => i.status !== 'PAID' && oneTimeCustomerIds.has(i.customerId)).reduce((s, i) => s + i.totalAmount, 0)
    + adjustmentNotes.filter(n => n.type === 'DEBIT' && oneTimeCustomerIds.has(n.customerId)).reduce((s, n) => s + n.amount, 0)
    - adjustmentNotes.filter(n => n.type === 'CREDIT' && n.creditAction !== 'REFUND' && oneTimeCustomerIds.has(n.customerId)).reduce((s, n) => s + n.amount, 0);

  const commercialCount = customers.filter(c => c.type === 'CREDIT').length;
  const oneTimeCount = customers.filter(c => c.type === 'ONE_TIME').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomer.name && newCustomer.address && newCustomer.contact) {
      if (editingCustomer) {
        onEdit({ ...editingCustomer, ...newCustomer } as Customer);
        setEditingCustomer(null);
      } else {
        onAdd({
          ...newCustomer as Customer,
          id: generateId(),
        });
      }
      setIsAdding(false);
      setNewCustomer({ type: 'ONE_TIME' });
    }
  };

  const handleEditClick = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(c);
    setNewCustomer({ ...c });
    setIsAdding(true);
  };

  const openAddForm = (type: 'ONE_TIME' | 'CREDIT') => {
    setShowAddDropdown(false);
    setEditingCustomer(null);
    setNewCustomer({ type });
    setIsAdding(true);
  };

  const inputClass = "w-full px-4 py-2 border border-amber-200 bg-amber-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all";

  // ── Customer Detail View ──────────────────────────────────────────────
  if (selectedCustomer) {
    const customerInvoices = invoices.filter(inv => inv.customerId === selectedCustomer.id);
    const displayedInvoices = showUnpaidOnly
      ? customerInvoices.filter(inv => inv.status !== 'PAID')
      : customerInvoices;
    const customerNotes = adjustmentNotes.filter(n => n.customerId === selectedCustomer.id);
    const totalDebits = customerNotes.filter(n => n.type === 'DEBIT').reduce((s, n) => s + n.amount, 0);
    const totalCredits = customerNotes.filter(n => n.type === 'CREDIT' && n.creditAction !== 'REFUND').reduce((s, n) => s + n.amount, 0);

    const totalOutstanding = (selectedInvoiceIds.length > 0
      ? displayedInvoices.filter(inv => selectedInvoiceIds.includes(inv.id)).reduce((s, i) => s + i.totalAmount, 0)
      : customerInvoices.filter(inv => inv.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0))
      + totalDebits - totalCredits;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelectedInvoiceIds(displayedInvoices.map(inv => inv.id));
      } else {
        setSelectedInvoiceIds([]);
      }
    };

    const toggleInvoiceSelection = (id: string) => {
      setSelectedInvoiceIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <button
            onClick={() => { setSelectedCustomer(null); setSelectedInvoiceIds([]); }}
            className="flex items-center gap-2 text-gray-500 hover:text-slate-900 font-bold"
          >
            <ArrowLeft size={20} /> Back to CRM
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              <Printer size={18} /> Print Statement
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 invoice-container">
          <div className="flex justify-between items-start mb-10 pb-8 border-b border-gray-100">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Statement of Account</h2>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Customer Record</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-orange-600">{formatCurrency(totalOutstanding)}</p>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Outstanding Balance</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Client Details</h4>
              <p className="font-bold text-lg text-gray-900">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-500 max-w-xs">{selectedCustomer.address}</p>
              <p className="text-sm text-gray-500 mt-1">VAT: {selectedCustomer.vatNumber || 'N/A'}</p>
            </div>
            <div className="text-right">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Statement Date</h4>
              <p className="font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mb-6 flex justify-between items-center no-print">
            <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest text-sm">
              <FileText size={18} className="text-orange-500" />
              Invoice History
            </h3>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDescriptions}
                  onChange={() => setShowDescriptions(!showDescriptions)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-xs font-bold text-gray-600">Show Descriptions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnpaidOnly}
                  onChange={() => setShowUnpaidOnly(!showUnpaidOnly)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-xs font-bold text-gray-600">Show Unpaid Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAgeing}
                  onChange={() => setShowAgeing(!showAgeing)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-xs font-bold text-gray-600">Show Ageing</span>
              </label>
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-6 py-4 no-print w-10">
                  <input
                    type="checkbox"
                    checked={displayedInvoices.length > 0 && selectedInvoiceIds.length === displayedInvoices.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Invoice No</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">From</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">To</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-b border-gray-100">
              {displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-gray-400 font-medium">No records found for this selection.</td>
                </tr>
              ) : (
                displayedInvoices.map(inv => (
                  <tr
                    key={inv.id}
                    className={`${selectedInvoiceIds.length > 0 && !selectedInvoiceIds.includes(inv.id) ? 'no-print opacity-40' : ''} hover:bg-gray-50 transition-colors`}
                  >
                    <td className="px-6 py-5 no-print">
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.includes(inv.id)}
                        onChange={() => toggleInvoiceSelection(inv.id)}
                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-5 font-bold text-gray-900">
                      {onInvoiceClick ? (
                        <button
                          onClick={() => onInvoiceClick(inv)}
                          className="text-orange-600 hover:underline font-black text-left"
                        >
                          {inv.invoiceNumber}
                        </button>
                      ) : (
                        <div>{inv.invoiceNumber}</div>
                      )}
                      {showDescriptions && inv.items && inv.items.length > 0 && (
                        <div className="text-xs text-gray-500 font-normal mt-1 space-y-0.5 max-w-xs">
                          {inv.items.map((item, idx) => (
                            <div key={idx} className="border-l-2 border-orange-200 pl-2">
                              {item.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100 uppercase">
                        {inv.items[0]?.coo || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                        {inv.destinationCountry}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-gray-600 text-sm">
                      <div>{new Date(inv.date).toLocaleDateString()}</div>
                      {showAgeing && (
                        <div className="text-[10px] text-gray-400 mt-1 font-bold">
                          {getAgeingText(inv.date, inv.status, inv.paymentDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => {
                          let reference = undefined;
                          const newStatus = inv.status === 'PAID' ? 'UNPAID' : 'PAID';
                          if (newStatus === 'PAID') {
                            const input = window.prompt("Enter Transaction Reference (Optional for Bank Transfer):", inv.transactionReference || "");
                            if (input === null) return;
                            reference = input;
                          }
                          onUpdateInvoiceStatus(inv.id, newStatus, reference);
                        }}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 no-print ${inv.status === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                      >
                        {inv.status}
                      </button>
                      <span className={`print-only text-[10px] font-black px-3 py-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-5 text-right text-xs font-black text-gray-500 uppercase">Subtotal Balance</td>
                <td className="px-6 py-5 text-right font-black text-orange-600 text-lg">{formatCurrency(totalOutstanding)}</td>
              </tr>
            </tfoot>
          </table>

          {customerNotes.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest text-sm mb-4">
                <FileText size={18} className="text-orange-500" />
                Linked Credit & Debit Notes
              </h3>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
                    <th className="px-6 py-3">Note Number</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Ref Invoice</th>
                    <th className="px-6 py-3">Reason</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 border-b">
                  {customerNotes.map(note => (
                    <tr key={note.id} className="hover:bg-gray-50 text-xs">
                      <td className="px-6 py-4 font-bold text-gray-900">{note.noteNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${
                          note.type === 'CREDIT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {note.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-bold">{new Date(note.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-orange-600 font-bold">{note.originalInvoiceNumber}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{note.reason}</td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">{formatCurrency(note.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main CRM List View ────────────────────────────────────────────────
  const arForFilter =
    activeFilter === 'COMMERCIAL' ? commercialAR :
    activeFilter === 'ONE_TIME'   ? oneTimeAR    : totalAR;

  const countForFilter =
    activeFilter === 'COMMERCIAL' ? commercialCount :
    activeFilter === 'ONE_TIME'   ? oneTimeCount    : customers.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Users className="text-orange-500" />
          Customer CRM
        </h2>

        {/* Add New Client dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="add-new-client-btn"
            onClick={() => setShowAddDropdown(prev => !prev)}
            className="bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Client
            <ChevronDown size={16} className={`transition-transform duration-200 ${showAddDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showAddDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <button
                id="add-commercial-btn"
                onClick={() => openAddForm('CREDIT')}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-purple-50 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Building2 size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Commercial Client</p>
                  <p className="text-[11px] text-gray-400">Credit / recurring account</p>
                </div>
              </button>

              <div className="h-px bg-gray-100 mx-4" />

              <button
                id="add-onetime-btn"
                onClick={() => openAddForm('ONE_TIME')}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <UserCheck size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">One-Time Customer</p>
                  <p className="text-[11px] text-gray-400">Single transaction client</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── AR Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div
          onClick={() => setActiveFilter('ALL')}
          className={`cursor-pointer rounded-xl p-5 flex items-center gap-4 transition-all duration-200 border-2 ${activeFilter === 'ALL'
            ? 'bg-slate-900 border-slate-900 shadow-lg scale-[1.02]'
            : 'bg-white border-gray-100 hover:border-orange-300 hover:shadow-md'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${activeFilter === 'ALL' ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
            <LayoutList size={22} className={activeFilter === 'ALL' ? 'text-orange-400' : 'text-orange-600'} />
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] font-black uppercase tracking-widest mb-0.5 ${activeFilter === 'ALL' ? 'text-slate-400' : 'text-gray-500'}`}>All Clients</p>
            <p className={`text-xl font-black truncate ${activeFilter === 'ALL' ? 'text-orange-400' : 'text-orange-600'}`}>{formatCurrency(totalAR)}</p>
            <p className={`text-[11px] mt-0.5 ${activeFilter === 'ALL' ? 'text-slate-500' : 'text-gray-400'}`}>{customers.length} clients</p>
          </div>
        </div>

        {/* Commercial */}
        <div
          onClick={() => setActiveFilter('COMMERCIAL')}
          className={`cursor-pointer rounded-xl p-5 flex items-center gap-4 transition-all duration-200 border-2 ${activeFilter === 'COMMERCIAL'
            ? 'bg-purple-900 border-purple-800 shadow-lg scale-[1.02]'
            : 'bg-white border-gray-100 hover:border-purple-300 hover:shadow-md'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${activeFilter === 'COMMERCIAL' ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
            <Building2 size={22} className={activeFilter === 'COMMERCIAL' ? 'text-purple-300' : 'text-purple-600'} />
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] font-black uppercase tracking-widest mb-0.5 ${activeFilter === 'COMMERCIAL' ? 'text-purple-300' : 'text-gray-500'}`}>Commercial</p>
            <p className={`text-xl font-black truncate ${activeFilter === 'COMMERCIAL' ? 'text-purple-200' : 'text-purple-700'}`}>{formatCurrency(commercialAR)}</p>
            <p className={`text-[11px] mt-0.5 ${activeFilter === 'COMMERCIAL' ? 'text-purple-400' : 'text-gray-400'}`}>{commercialCount} clients</p>
          </div>
        </div>

        {/* One-Time */}
        <div
          onClick={() => setActiveFilter('ONE_TIME')}
          className={`cursor-pointer rounded-xl p-5 flex items-center gap-4 transition-all duration-200 border-2 ${activeFilter === 'ONE_TIME'
            ? 'bg-blue-900 border-blue-800 shadow-lg scale-[1.02]'
            : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${activeFilter === 'ONE_TIME' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <UserCheck size={22} className={activeFilter === 'ONE_TIME' ? 'text-blue-300' : 'text-blue-600'} />
          </div>
          <div className="min-w-0">
            <p className={`text-[11px] font-black uppercase tracking-widest mb-0.5 ${activeFilter === 'ONE_TIME' ? 'text-blue-300' : 'text-gray-500'}`}>One-Time</p>
            <p className={`text-xl font-black truncate ${activeFilter === 'ONE_TIME' ? 'text-blue-200' : 'text-blue-700'}`}>{formatCurrency(oneTimeAR)}</p>
            <p className={`text-[11px] mt-0.5 ${activeFilter === 'ONE_TIME' ? 'text-blue-400' : 'text-gray-400'}`}>{oneTimeCount} clients</p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Table */}
        <div className="md:col-span-2 space-y-4">
          {/* Filter label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-700">
                {activeFilter === 'ALL' ? 'All Clients' : activeFilter === 'COMMERCIAL' ? 'Commercial Clients' : 'One-Time Customers'}
              </span>
              <span className="bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-0.5 rounded-full">
                {filteredCustomers.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`text-[11px] font-black px-3 py-1.5 rounded-full transition-all ${activeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >All</button>
              <button
                onClick={() => setActiveFilter('COMMERCIAL')}
                className={`text-[11px] font-black px-3 py-1.5 rounded-full transition-all ${activeFilter === 'COMMERCIAL' ? 'bg-purple-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700'}`}
              >Commercial</button>
              <button
                onClick={() => setActiveFilter('ONE_TIME')}
                className={`text-[11px] font-black px-3 py-1.5 rounded-full transition-all ${activeFilter === 'ONE_TIME' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'}`}
              >One-Time</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Client Name</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Invoices</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={32} className="text-gray-300" />
                        <p className="font-bold text-sm">No clients found</p>
                        <p className="text-xs">Try a different filter or add a new client</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map(c => {
                    const stats = getCustomerStats(c.id);
                    return (
                      <tr key={c.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${c.type === 'CREDIT' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.contact}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${c.type === 'CREDIT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {c.type === 'CREDIT' ? 'Commercial' : 'One-Time'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-gray-600">{stats.count}</td>
                        <td className="px-6 py-5 text-right font-black text-orange-600">
                          <div className="flex items-center justify-end gap-3 text-right">
                            <div>
                              <span className="block font-black">{formatCurrency(stats.outstanding)}</span>
                              {stats.hasAdjustments && (
                                <div className="text-[10px] font-bold mt-0.5 space-x-1 block whitespace-nowrap">
                                  {stats.totalCredits > 0 && <span className="text-green-600">-{formatCurrency(stats.totalCredits)} Credit</span>}
                                  {stats.totalDebits > 0 && <span className="text-red-600">+{formatCurrency(stats.totalDebits)} Debit</span>}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-orange-500 hover:text-white transition-all shadow-sm group-hover:scale-110"
                              title="View Statement"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              onClick={(e) => handleEditClick(c, e)}
                              className="bg-blue-50 p-2 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
                              title="Edit Client"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(c.id);
                              }}
                              className="bg-red-50 p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
                              title="Delete Client"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Add Form */}
          {isAdding && (
            <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-orange-500 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-4">
                {newCustomer.type === 'CREDIT'
                  ? <Building2 size={20} className="text-purple-600" />
                  : <UserCheck size={20} className="text-blue-600" />
                }
                <h3 className="text-lg font-black">
                  {editingCustomer
                    ? 'Edit Customer'
                    : newCustomer.type === 'CREDIT'
                      ? 'Add Commercial Client'
                      : 'Add One-Time Customer'
                  }
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  placeholder="Full Legal Name"
                  required
                  className={inputClass}
                  value={newCustomer.name || ''}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
                <select
                  className={inputClass}
                  value={newCustomer.type || 'ONE_TIME'}
                  onChange={e => setNewCustomer({ ...newCustomer, type: e.target.value as any })}
                >
                  <option value="ONE_TIME" className="bg-white">One-Time Customer</option>
                  <option value="CREDIT" className="bg-white">Commercial / Credit Client</option>
                </select>
                <textarea
                  placeholder="Complete Address"
                  required
                  className={`${inputClass} h-24`}
                  value={newCustomer.address || ''}
                  onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
                <input
                  placeholder="Contact Number"
                  required
                  className={inputClass}
                  value={newCustomer.contact || ''}
                  onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                />
                <input
                  placeholder="VAT/TRN Number (Optional)"
                  className={inputClass}
                  value={newCustomer.vatNumber || ''}
                  onChange={e => setNewCustomer({ ...newCustomer, vatNumber: e.target.value })}
                />
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-orange-600 text-white font-black py-3 rounded-lg hover:bg-orange-700 transition-colors">
                    {editingCustomer ? 'Update Profile' : 'Save Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAdding(false); setEditingCustomer(null); setNewCustomer({ type: 'ONE_TIME' }); }}
                    className="flex-1 bg-amber-100 text-amber-800 font-bold py-3 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active-filter AR card */}
          <div className={`p-6 rounded-xl text-white shadow-lg overflow-hidden relative ${
            activeFilter === 'COMMERCIAL' ? 'bg-gradient-to-br from-purple-900 to-purple-700' :
            activeFilter === 'ONE_TIME'   ? 'bg-gradient-to-br from-blue-900 to-blue-700'   :
                                           'bg-gradient-to-br from-slate-900 to-slate-700'
          }`}>
            <TrendingUp className="absolute -bottom-8 -right-8 opacity-10 w-32 h-32" />
            <h3 className="text-[11px] font-black text-white/50 uppercase tracking-widest mb-1">
              Account Receivables
            </h3>
            <p className="text-[11px] text-white/40 mb-4">
              {activeFilter === 'COMMERCIAL' ? 'Commercial clients only' :
               activeFilter === 'ONE_TIME'   ? 'One-time customers only' : 'Across all clients'}
            </p>
            <p className="text-3xl font-black text-orange-400 mb-1">{formatCurrency(arForFilter)}</p>
            <p className="text-xs text-white/40">{countForFilter} {countForFilter === 1 ? 'client' : 'clients'} in view</p>

            {/* Mini bar */}
            {totalAR > 0 && activeFilter !== 'ALL' && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                  <span>{Math.round((arForFilter / totalAR) * 100)}% of total AR</span>
                  <span>{formatCurrency(totalAR)} total</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((arForFilter / totalAR) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Split breakdown (always visible) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">AR Breakdown</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700">Commercial</span>
                    <span className="text-xs font-black text-purple-700">{formatCurrency(commercialAR)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: totalAR > 0 ? `${(commercialAR / totalAR) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700">One-Time</span>
                    <span className="text-xs font-black text-blue-700">{formatCurrency(oneTimeAR)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: totalAR > 0 ? `${(oneTimeAR / totalAR) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Total AR</span>
              <span className="text-base font-black text-orange-600">{formatCurrency(totalAR)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
