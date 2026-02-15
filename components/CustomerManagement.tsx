
import React, { useState } from 'react';
import { Users, Plus, Search, PieChart } from 'lucide-react';
import { Customer, Invoice } from '../types';
import { formatCurrency, generateId } from '../utils';

interface CustomerManagementProps {
  customers: Customer[];
  invoices: Invoice[];
  onAdd: (customer: Customer) => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, invoices, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({ type: 'ONE_TIME' });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      onAdd({
        ...newCustomer as Customer,
        id: generateId(),
      });
      setIsAdding(false);
      setNewCustomer({ type: 'ONE_TIME' });
    }
  };

  const inputClass = "w-full px-4 py-2 border border-amber-200 bg-amber-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Users className="text-orange-500" />
          Customer CRM
        </h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={20} /> Add New Client
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" size={20} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-amber-200 bg-amber-50 text-slate-900 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
            />
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
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                          c.type === 'CREDIT' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.type === 'CREDIT' ? 'Commercial' : 'One-Time'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-gray-600">{stats.count}</td>
                      <td className="px-6 py-5 text-right font-black text-orange-600">{formatCurrency(stats.outstanding)}</td>
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
              <h3 className="text-lg font-black mb-4">Add Customer Profile</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  placeholder="Full Legal Name" 
                  required
                  className={inputClass}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
                <select 
                  className={inputClass}
                  onChange={e => setNewCustomer({...newCustomer, type: e.target.value as any})}
                >
                  <option value="ONE_TIME" className="bg-white">One-Time Customer</option>
                  <option value="CREDIT" className="bg-white">Commercial / Credit Client</option>
                </select>
                <textarea 
                  placeholder="Complete Address" 
                  required
                  className={`${inputClass} h-24`}
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                />
                <input 
                  placeholder="Contact Number" 
                  required
                  className={inputClass}
                  onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})}
                />
                <input 
                  placeholder="VAT/TRN Number (Optional)" 
                  className={inputClass}
                  onChange={e => setNewCustomer({...newCustomer, vatNumber: e.target.value})}
                />
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-orange-600 text-white font-black py-3 rounded-lg hover:bg-orange-700 transition-colors">Save Profile</button>
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 bg-amber-100 text-amber-800 font-bold py-3 rounded-lg hover:bg-amber-200 transition-colors">Cancel</button>
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
