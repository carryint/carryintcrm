import React, { useState } from 'react';
import { 
  ArrowLeft, PlusCircle, Search, FileText, Printer, X, Plus, 
  AlertCircle, Trash2, Calendar, FileSpreadsheet, ShieldCheck, DollarSign
} from 'lucide-react';
import { Customer, Invoice, AdjustmentNote, User, CompanyInfo } from '../types';
import { formatCurrency, numberToWords, generateId } from '../utils';
import Logo from './Logo';

interface AdjustmentsManagementProps {
  invoices: Invoice[];
  customers: Customer[];
  adjustmentNotes: AdjustmentNote[];
  onAddNote: (note: AdjustmentNote) => void;
  onDeleteNote: (id: string) => void;
  currentUser: User | null;
  searchQuery?: string;
  preSelectedInvoice?: Invoice | null;
  preSelectedType?: 'CREDIT' | 'DEBIT' | null;
  companyInfo: CompanyInfo;
  onClearPreSelections?: () => void;
}

const AdjustmentsManagement: React.FC<AdjustmentsManagementProps> = ({
  invoices,
  customers,
  adjustmentNotes,
  onAddNote,
  onDeleteNote,
  currentUser,
  searchQuery: externalSearchQuery = '',
  preSelectedInvoice,
  preSelectedType,
  companyInfo,
  onClearPreSelections
}) => {
  const [activeView, setActiveView] = useState<'LIST' | 'CREATE' | 'VIEW'>('LIST');
  const [selectedNote, setSelectedNote] = useState<AdjustmentNote | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

  // Form State
  const [noteType, setNoteType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [noteAmount, setNoteAmount] = useState('');
  const [noteReason, setNoteReason] = useState('');
  const [creditAction, setCreditAction] = useState<'REFUND' | 'APPLY_AS_CREDIT' | 'REDUCE_OUTSTANDING'>('REDUCE_OUTSTANDING');
  const [formError, setFormError] = useState('');

  const filteredInvoiceOptions = invoices.filter(inv => {
    const q = invoiceSearch.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q)
    );
  });

  // Handle direct navigation to Create from invoice click
  React.useEffect(() => {
    if (preSelectedInvoice) {
      setSelectedInvoiceId(preSelectedInvoice.id);
      setInvoiceSearch(`${preSelectedInvoice.invoiceNumber} - ${preSelectedInvoice.customerName}`);
      setNoteType(preSelectedType || 'CREDIT');
      
      // Auto set credit action depending on invoice status
      if (preSelectedType === 'CREDIT' || !preSelectedType) {
        if (preSelectedInvoice.status === 'PAID') {
          setCreditAction('APPLY_AS_CREDIT');
        } else {
          setCreditAction('REDUCE_OUTSTANDING');
        }
      }
      
      setActiveView('CREATE');
      if (onClearPreSelections) onClearPreSelections();
    }
  }, [preSelectedInvoice, preSelectedType, onClearPreSelections]);

  const generateNextNoteNumber = (type: 'CREDIT' | 'DEBIT', originalInvoiceNumber?: string) => {
    const prefix = type === 'CREDIT' ? 'CN' : 'DN';
    if (!originalInvoiceNumber) return `${prefix}-PENDING`;

    const parts = originalInvoiceNumber.split('-');
    const suffix = parts.length > 1 ? parts[1] : originalInvoiceNumber;
    const baseNumber = `${prefix}-${suffix}`;
    
    let finalNumber = baseNumber;
    let counter = 1;
    while (adjustmentNotes.some(n => n.noteNumber === finalNumber)) {
      finalNumber = `${baseNumber}-${counter}`;
      counter++;
    }
    
    return finalNumber;
  };

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice) {
      if (invoice.status === 'PAID') {
        setCreditAction('APPLY_AS_CREDIT');
      } else {
        setCreditAction('REDUCE_OUTSTANDING');
      }
    }
  };

  const handleNoteTypeChange = (type: 'CREDIT' | 'DEBIT') => {
    setNoteType(type);
    if (selectedInvoice) {
      if (type === 'CREDIT') {
        if (selectedInvoice.status === 'PAID') {
          setCreditAction('APPLY_AS_CREDIT');
        } else {
          setCreditAction('REDUCE_OUTSTANDING');
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedInvoiceId) {
      setFormError('Please select a reference invoice.');
      return;
    }

    const amt = parseFloat(noteAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid positive adjustment amount.');
      return;
    }

    if (!noteReason.trim()) {
      setFormError('Please provide a reason for the adjustment.');
      return;
    }

    if (!selectedInvoice) return;

    // Check if credit note amount exceeds invoice amount
    if (noteType === 'CREDIT' && amt > selectedInvoice.totalAmount) {
      const confirmExceed = window.confirm(
        `Warning: The credit note amount (${formatCurrency(amt)}) exceeds the total invoice amount (${formatCurrency(selectedInvoice.totalAmount)}). Do you want to proceed?`
      );
      if (!confirmExceed) return;
    }

    const noteNumber = generateNextNoteNumber(noteType, selectedInvoice.invoiceNumber);
    const newNote: AdjustmentNote = {
      id: generateId(),
      type: noteType,
      noteNumber,
      date: noteDate,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      originalInvoiceId: selectedInvoice.id,
      originalInvoiceNumber: selectedInvoice.invoiceNumber,
      reason: noteReason,
      amount: amt,
      creditAction: noteType === 'CREDIT' ? creditAction : undefined,
      createdBy: currentUser?.id || 'unknown',
      createdByName: currentUser?.name || 'System User',
      timestamp: new Date().toISOString()
    };

    onAddNote(newNote);
    setSelectedNote(newNote);
    setActiveView('VIEW');

    // Reset Form
    setSelectedInvoiceId('');
    setInvoiceSearch('');
    setNoteAmount('');
    setNoteReason('');
  };

  const handleDelete = (id: string, number: string) => {
    if (window.confirm(`Are you sure you want to delete adjustment ${number}? This will revert its impact on customer balances.`)) {
      onDeleteNote(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setActiveView('LIST');
      }
    }
  };

  // Filter lists
  const filteredNotes = adjustmentNotes.filter(note => {
    const matchesSearch = 
      note.noteNumber.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      note.customerName.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      note.originalInvoiceNumber.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      note.reason.toLowerCase().includes(localSearchQuery.toLowerCase());
    
    const matchesExternalSearch = !externalSearchQuery || 
      note.customerName.toLowerCase().includes(externalSearchQuery.toLowerCase()) ||
      note.noteNumber.toLowerCase().includes(externalSearchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || note.type === filterType;

    return matchesSearch && matchesExternalSearch && matchesType;
  });

  const getCreditActionLabel = (action?: string) => {
    if (action === 'REFUND') return 'Refunded in Cash/Bank';
    if (action === 'APPLY_AS_CREDIT') return 'Applied as Credit for Next Invoice';
    if (action === 'REDUCE_OUTSTANDING') return 'Reduced Outstanding Invoice Balance';
    return 'N/A';
  };

  const getCreditActionColor = (action?: string) => {
    if (action === 'REFUND') return 'bg-orange-100 text-orange-700';
    if (action === 'APPLY_AS_CREDIT') return 'bg-purple-100 text-purple-700';
    if (action === 'REDUCE_OUTSTANDING') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  // ── VIEW NOTE DETAILS / PRINT PREVIEW ────────────────────────────────
  if (activeView === 'VIEW' && selectedNote) {
    const origInvoice = invoices.find(i => i.id === selectedNote.originalInvoiceId);
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <button
            onClick={() => { setSelectedNote(null); setActiveView('LIST'); }}
            className="flex items-center gap-2 text-gray-500 hover:text-slate-900 font-bold"
          >
            <ArrowLeft size={20} /> Back to History
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const originalTitle = document.title;
                document.title = selectedNote.noteNumber;
                window.print();
                document.title = originalTitle;
              }}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:bg-orange-700 transition-all"
            >
              <Printer size={18} /> Print / Save PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-8 max-w-4xl mx-auto shadow-2xl border border-gray-200 my-4 invoice-container">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 border-b-2 border-orange-500 pb-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">
                {selectedNote.type === 'CREDIT' ? 'Credit Note' : 'Debit Note'}
              </h1>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1 mb-1">
                Official Adjustment Voucher
              </p>
              <p className="text-xs font-bold text-orange-600">TRN: {companyInfo.trn}</p>
            </div>
            <div className="text-right">
              <Logo src={companyInfo.logoUrl} className="h-14 mb-1 ml-auto" />
              <p className="font-black text-base text-gray-800">{companyInfo.name}</p>
              <p className="text-[10px] text-gray-600 max-w-xs ml-auto leading-tight">{companyInfo.address}</p>
              <p className="text-[10px] text-gray-600">Tel: {companyInfo.contact}</p>
              <p className="text-[10px] text-gray-600">Email: {companyInfo.email}</p>
              <p className="text-[10px] text-gray-600 font-bold">{companyInfo.website}</p>
            </div>
          </div>

          {/* Customer & Document Meta */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-[10px] font-black text-orange-600 uppercase mb-1">Issued To</h4>
              <p className="font-bold text-base text-gray-900">{selectedNote.customerName}</p>
              <p className="text-xs text-gray-500 mt-1">
                Client ID: #{selectedNote.customerId}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="font-bold text-gray-500 text-xs uppercase">Note Number</span>
                <span className="font-black text-gray-900 text-xs">{selectedNote.noteNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-500 text-xs uppercase">Date</span>
                <span className="font-bold text-gray-900 text-xs">{new Date(selectedNote.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-500 text-xs uppercase">Reference Invoice</span>
                <span className="font-bold text-orange-600 text-xs">{selectedNote.originalInvoiceNumber}</span>
              </div>
              {origInvoice && (
                <div className="flex justify-between text-[11px] text-gray-400 mt-0.5 pt-0.5 border-t border-gray-200 border-dashed">
                  <span>Invoice Date</span>
                  <span>{new Date(origInvoice.date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Table */}
          <div className="mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3 px-6 text-xs font-black uppercase tracking-wider">Adjustment Details & Reason</th>
                  <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-right w-48">Adjusted Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-b border-gray-100">
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-6">
                    <p className="font-bold text-sm text-gray-900">
                      {selectedNote.type === 'CREDIT' ? 'Credit note offset against invoice' : 'Debit note charge adjustment against invoice'} {selectedNote.originalInvoiceNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                      " {selectedNote.reason} "
                    </p>
                  </td>
                  <td className="py-5 px-6 text-right font-black text-base text-gray-900 vertical-top">
                    {formatCurrency(selectedNote.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-between items-start gap-8 mb-10">
            <div className="flex-1">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase mb-1">Amount in Words</h4>
                <p className="text-xs font-bold text-gray-900 leading-snug italic uppercase">
                  AED {numberToWords(Math.round(selectedNote.amount))} ONLY
                </p>
              </div>

              {selectedNote.type === 'CREDIT' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Credit Allocation:</span>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full ${getCreditActionColor(selectedNote.creditAction)}`}>
                    {getCreditActionLabel(selectedNote.creditAction)}
                  </span>
                </div>
              )}
            </div>

            <div className="w-64 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-black text-gray-600 uppercase">Total Adjustment</span>
                <span className="text-xl font-black text-orange-600">{formatCurrency(selectedNote.amount)}</span>
              </div>
            </div>
          </div>

          {/* Audit Footer */}
          <div className="pt-6 border-t border-gray-100 flex justify-between items-end text-[10px] text-gray-400">
            <div>
              <p>Prepared by: <span className="font-bold text-gray-600">{selectedNote.createdByName}</span></p>
              <p>System Timestamp: {new Date(selectedNote.timestamp).toLocaleString()}</p>
            </div>
            <div className="text-center w-40">
              <div className="h-12 border-b border-dashed border-gray-300 mb-1"></div>
              <p className="font-bold text-gray-400 uppercase">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CREATE ADJUSTMENT NOTE ───────────────────────────────────────────
  if (activeView === 'CREATE') {
    return (
      <div className="space-y-6">
        {/* Header — same pattern as other screens */}
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => setActiveView('LIST')}
              className="flex items-center gap-2 text-gray-500 hover:text-slate-900 font-bold mb-1"
            >
              <ArrowLeft size={18} /> Back to History
            </button>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Plus className="text-orange-500" size={26} />
              Issue Adjustment Note
            </h2>
            <p className="text-sm text-gray-500 mt-1">Create a Credit or Debit note linked to an existing invoice</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT COLUMN: Form ───────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {formError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3 font-bold text-sm">
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Note Type Selector */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleNoteTypeChange('CREDIT')}
                    className={`py-5 rounded-xl font-black border-2 transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      noteType === 'CREDIT'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    <span className="text-lg">Credit Note</span>
                    <span className="text-[10px] font-bold text-slate-400">Reduce receivables or issue refund</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNoteTypeChange('DEBIT')}
                    className={`py-5 rounded-xl font-black border-2 transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      noteType === 'DEBIT'
                        ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-md'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    <span className="text-lg">Debit Note</span>
                    <span className="text-[10px] font-bold text-slate-400">Increase invoice charges</span>
                  </button>
                </div>
              </div>

              {/* Searchable Invoice Picker */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">Reference Invoice</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <input
                    type="text"
                    placeholder="Type invoice number or customer name to search..."
                    className="w-full pl-9 pr-4 py-3 border border-amber-200 bg-amber-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                    value={invoiceSearch}
                    onChange={e => {
                      setInvoiceSearch(e.target.value);
                      setSelectedInvoiceId('');
                      setShowInvoiceDropdown(true);
                    }}
                    onFocus={() => setShowInvoiceDropdown(true)}
                    onBlur={() => setTimeout(() => setShowInvoiceDropdown(false), 150)}
                    autoComplete="off"
                  />
                  {showInvoiceDropdown && filteredInvoiceOptions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      {filteredInvoiceOptions.slice(0, 30).map(inv => (
                        <button
                          key={inv.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
                          onMouseDown={() => {
                            setSelectedInvoiceId(inv.id);
                            setInvoiceSearch(`${inv.invoiceNumber} - ${inv.customerName}`);
                            setShowInvoiceDropdown(false);
                            handleInvoiceChange(inv.id);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-sm text-gray-900">{inv.invoiceNumber}</p>
                              <p className="text-xs text-gray-500">{inv.customerName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-gray-900">AED {inv.totalAmount.toFixed(2)}</p>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>{inv.status}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                      {filteredInvoiceOptions.length === 0 && (
                        <p className="px-4 py-4 text-sm text-gray-400 text-center">No invoices found</p>
                      )}
                    </div>
                  )}
                </div>

                {selectedInvoice && (
                  <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-wrap gap-x-8 gap-y-2 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold">Client Name:</span>{' '}
                      <span className="font-bold text-gray-900">{selectedInvoice.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold">Invoice Total:</span>{' '}
                      <span className="font-bold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold">Payment Status:</span>{' '}
                      <span className={`font-bold px-2 py-0.5 rounded-full ${
                        selectedInvoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>{selectedInvoice.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold">Invoice Date:</span>{' '}
                      <span className="font-bold text-gray-900">{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Amount row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">Adjustment Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-amber-200 bg-amber-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                    value={noteDate}
                    onChange={e => setNoteDate(e.target.value)}
                  />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">Adjustment Amount (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-amber-200 bg-amber-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold"
                    value={noteAmount}
                    onChange={e => setNoteAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Credit Note Options (Refund vs. Offset) */}
              {noteType === 'CREDIT' && selectedInvoice && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">Credit Treatment Selection</h4>
                    {selectedInvoice.status === 'PAID' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-600">
                          The reference invoice is <strong>PAID</strong>. How would you like to process this credit?
                        </p>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="credit_action_radio"
                              value="APPLY_AS_CREDIT"
                              checked={creditAction === 'APPLY_AS_CREDIT'}
                              onChange={() => setCreditAction('APPLY_AS_CREDIT')}
                              className="w-4 h-4 accent-orange-500"
                            />
                            Apply as credit against customer's next invoice
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="credit_action_radio"
                              value="REFUND"
                              checked={creditAction === 'REFUND'}
                              onChange={() => setCreditAction('REFUND')}
                              className="w-4 h-4 accent-orange-500"
                            />
                            Refund the amount directly in Cash / Bank
                          </label>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-700 font-medium">
                        The reference invoice is <strong>UNPAID</strong>. This credit note will automatically reduce the remaining outstanding balance of the customer.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">Reason for Adjustment</label>
                <textarea
                  required
                  placeholder="e.g. Discount on shipping cost, Overcharge error correction, Additional container detention fee..."
                  className="w-full px-4 py-3 border border-amber-200 bg-amber-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium h-28"
                  value={noteReason}
                  onChange={e => setNoteReason(e.target.value)}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-xl transition-all shadow-lg text-center text-base"
                >
                  Generate Note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('LIST');
                    setSelectedInvoiceId('');
                    setInvoiceSearch('');
                    setNoteAmount('');
                    setNoteReason('');
                    setFormError('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT COLUMN: Guide Card ─────────────────── */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-700 mb-4 uppercase tracking-widest">Quick Guide</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-black text-sm">CN</div>
                  <div>
                    <p className="text-xs font-black text-gray-800">Credit Note</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Reduces the amount owed by the customer. Use for overcharges, returns or discounts.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 font-black text-sm">DN</div>
                  <div>
                    <p className="text-xs font-black text-gray-800">Debit Note</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Increases the amount owed by the customer. Use for extra charges added after invoice.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-black text-sm">✓</div>
                  <div>
                    <p className="text-xs font-black text-gray-800">Already Paid</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">If the invoice is PAID, choose to refund cash or apply the credit to the next invoice.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl text-white">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Note Numbering</p>
              <p className="text-2xl font-black text-orange-500">
                {selectedInvoice ? generateNextNoteNumber(noteType, selectedInvoice.invoiceNumber) : `${noteType === 'CREDIT' ? 'CN' : 'DN'}-...`}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Auto-assigned on generation</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="text-orange-500" />
            Voucher Adjustments
          </h2>
          <p className="text-sm text-gray-500 mt-1">Audit trail of Credit and Debit Notes issued</p>
        </div>
        <button
          onClick={() => setActiveView('CREATE')}
          className="bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md flex items-center gap-2"
        >
          <PlusCircle size={20} />
          Create Note
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Credit Notes</p>
            <p className="text-xl font-black text-blue-700">
              {formatCurrency(adjustmentNotes.filter(n => n.type === 'CREDIT').reduce((sum, n) => sum + n.amount, 0))}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {adjustmentNotes.filter(n => n.type === 'CREDIT').length} vouchers
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Debit Notes</p>
            <p className="text-xl font-black text-purple-700">
              {formatCurrency(adjustmentNotes.filter(n => n.type === 'DEBIT').reduce((sum, n) => sum + n.amount, 0))}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {adjustmentNotes.filter(n => n.type === 'DEBIT').length} vouchers
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Adjustments Impact</p>
            <p className="text-xl font-black text-orange-600">
              {formatCurrency(
                adjustmentNotes.filter(n => n.type === 'DEBIT').reduce((sum, n) => sum + n.amount, 0) -
                adjustmentNotes.filter(n => n.type === 'CREDIT').reduce((sum, n) => sum + n.amount, 0)
              )}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Adjusting net trade receivables</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="relative w-full md:w-90">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Note#, Client, Invoice..."
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              value={localSearchQuery}
              onChange={e => setLocalSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`flex-1 md:flex-initial text-[11px] font-black px-4 py-2 rounded-full transition-all ${filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border hover:bg-gray-100'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('CREDIT')}
              className={`flex-1 md:flex-initial text-[11px] font-black px-4 py-2 rounded-full transition-all ${filterType === 'CREDIT' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-blue-50'}`}
            >
              Credits Only
            </button>
            <button
              onClick={() => setFilterType('DEBIT')}
              className={`flex-1 md:flex-initial text-[11px] font-black px-4 py-2 rounded-full transition-all ${filterType === 'DEBIT' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border hover:bg-purple-50'}`}
            >
              Debits Only
            </button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-black text-gray-500 uppercase tracking-widest border-b">
            <tr>
              <th className="px-6 py-4">Voucher No</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Orig. Invoice</th>
              <th className="px-6 py-4">Issue Date</th>
              <th className="px-6 py-4">Treatment / Reason</th>
              <th className="px-6 py-4 text-right">Adjustment Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredNotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20 text-gray-400 font-medium">
                  No adjustments found matching selection.
                </td>
              </tr>
            ) : (
              filteredNotes.slice().reverse().map(note => (
                <tr key={note.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{note.noteNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                      note.type === 'CREDIT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {note.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-semibold">{note.customerName}</td>
                  <td className="px-6 py-4 text-orange-600 font-bold">{note.originalInvoiceNumber}</td>
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {new Date(note.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {note.type === 'CREDIT' ? (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full block w-fit mb-1 ${getCreditActionColor(note.creditAction)}`}>
                          {getCreditActionLabel(note.creditAction)}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 block w-fit mb-1">
                          Charges Increase
                        </span>
                      )}
                      <p className="text-xs text-gray-400 truncate max-w-xs">{note.reason}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-900">
                    {formatCurrency(note.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => { setSelectedNote(note); setActiveView('VIEW'); }}
                        className="text-orange-600 font-bold hover:underline"
                      >
                        Print/View
                      </button>
                      <button
                        onClick={() => handleDelete(note.id, note.noteNumber)}
                        className="text-red-600 font-bold hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdjustmentsManagement;
