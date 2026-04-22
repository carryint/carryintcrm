
import React, { useState } from 'react';
import { ArrowLeft, Users, Plus, Search, PieChart, FileText, Download, Printer, Trash2, Edit } from 'lucide-react';
import { Customer, Invoice } from '../types';
import { formatCurrency, generateId } from '../utils';

interface CustomerManagementProps {
  customers: Customer[];
  invoices: Invoice[];
  onAdd: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: 'PAID' | 'UNPAID', transactionReference?: string) => void;
  searchQuery?: string;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, invoices, onAdd, onEdit, onDelete, onUpdateInvoiceStatus, searchQuery = '' }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ type: 'ONE_TIME' });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCustomerStats = (customerId: string) => {
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    const outstanding = customerInvoices
      .filter(inv => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    return { count: customerInvoices.length, outstanding };
  };

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

  const inputClass = "w-full px-4 py-2 border border-amber-200 bg-amber-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all";

  if (selectedCustomer) {
    const customerInvoices = invoices.filter(inv => inv.customerId === selectedCustomer.id);
    const displayedInvoices = showUnpaidOnly
      ? customerInvoices.filter(inv => inv.status !== 'PAID')
      : customerInvoices;
    const totalOutstanding = selectedInvoiceIds.length > 0
      ? displayedInvoices.filter(inv => selectedInvoiceIds.includes(inv.id)).reduce((s, i) => s + i.totalAmount, 0)
      : customerInvoices.filter(inv => inv.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0);

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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnpaidOnly}
                onChange={() => setShowUnpaidOnly(!showUnpaidOnly)}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-xs font-bold text-gray-600">Show Unpaid Only</span>
            </label>
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
                <th className="px-6 py-4 text-[10px] font-black uppercase">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-b border-gray-100">
              {displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-gray-400 font-medium">No records found for this selection.</td>
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
                    <td className="px-6 py-5 font-bold text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-5 text-gray-600 text-sm">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => {
                          let reference = undefined;
                          const newStatus = inv.status === 'PAID' ? 'UNPAID' : 'PAID';
                          if (newStatus === 'PAID') {
                            const input = window.prompt("Enter Transaction Reference (Optional for Bank Transfer):", inv.transactionReference || "");
                            if (input === null) return; // User cancelled
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Users className="text-orange-500" />
          Customer CRM
        </h2>
        <button
          onClick={() => { setIsAdding(true); setEditingCustomer(null); setNewCustomer({ type: 'ONE_TIME' }); }}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={20} /> Add New Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">

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
                {filteredCustomers.map(c => {
                  const stats = getCustomerStats(c.id);
                  return (
                    <tr key={c.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.contact}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${c.type === 'CREDIT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {c.type === 'CREDIT' ? 'Commercial' : 'One-Time'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-gray-600">{stats.count}</td>
                      <td className="px-6 py-5 text-right font-black text-orange-600">
                        <div className="flex items-center justify-end gap-3">
                          <span>{formatCurrency(stats.outstanding)}</span>
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-orange-500 hover:text-white transition-all shadow-sm group-hover:scale-110"
                            title="View Statement"
                          >
                            <FileText size={18} />
                          </button>
                          <button
                            onClick={(e) => handleEditClick(c, e)}
                            className="bg-blue-50 p-2 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
                            title="Edit Client"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(c.id);
                            }}
                            className="bg-red-50 p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
                            title="Delete Client"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {isAdding && (
            <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-orange-500 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-black mb-4">{editingCustomer ? 'Edit Customer Profile' : 'Add Customer Profile'}</h3>
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
                  <button type="submit" className="flex-1 bg-orange-600 text-white font-black py-3 rounded-lg hover:bg-orange-700 transition-colors">{editingCustomer ? 'Update Profile' : 'Save Profile'}</button>
                  <button type="button" onClick={() => { setIsAdding(false); setEditingCustomer(null); setNewCustomer({ type: 'ONE_TIME' }); }} className="flex-1 bg-amber-100 text-amber-800 font-bold py-3 rounded-lg hover:bg-amber-200 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-slate-900 p-6 rounded-xl text-white shadow-lg overflow-hidden relative">
            <PieChart className="absolute -bottom-10 -right-10 opacity-10 w-40 h-40" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Account Receivables</h3>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-black text-orange-500">
                  {formatCurrency(invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0))}
                </p>
                <p className="text-xs text-slate-400 mt-1">Total Pending Across All Clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
