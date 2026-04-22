import React, { useState } from 'react';
import { Wallet, PlusCircle, X, Search, FileText, Trash2, Calendar, CreditCard, User, Tag } from 'lucide-react';
import { Expense, User as UserType } from '../types';
import { generateId, formatCurrency } from '../utils';

interface CompanyExpensesProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
  currentUser: UserType | null;
  searchQuery?: string;
}

const CompanyExpenses: React.FC<CompanyExpensesProps> = ({ expenses, onAdd, onUpdate, onDelete, currentUser, searchQuery = '' }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountStr && newExpense.itemDetails && newExpense.payeeName) {
      if (editingExpenseId) {
        const expenseToUpdate: Expense = {
          ...newExpense as Expense,
          id: editingExpenseId,
          amount: Number(amountStr),
        };
        onUpdate(expenseToUpdate);
      } else {
        const expenseToAdd: Expense = {
          id: generateId(),
          date: newExpense.date || new Date().toISOString().split('T')[0],
          amount: Number(amountStr),
          itemDetails: newExpense.itemDetails || '',
          paymentMethod: newExpense.paymentMethod || 'Cash',
          paymentReference: newExpense.paymentReference || '-',
          payeeName: newExpense.payeeName || '',
          createdBy: currentUser?.id || 'unknown',
          createdByName: currentUser?.name || 'Unknown',
        };
        onAdd(expenseToAdd);
      }
      
      setIsAdding(false);
      setEditingExpenseId(null);
      setAmountStr('');
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
      });
    }
  };

  const handleEdit = (exp: Expense) => {
    setNewExpense(exp);
    setAmountStr(exp.amount.toString());
    setEditingExpenseId(exp.id);
    setIsAdding(true);
  };

  const filteredExpenses = expenses.filter(exp => 
    exp.itemDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.payeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.paymentReference.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Wallet className="text-orange-500" />
            Company Expenses
          </h2>
          <p className="text-gray-500 text-sm font-medium">Manage and track your company expenditures</p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingExpenseId(null); setAmountStr(''); setNewExpense({ date: new Date().toISOString().split('T')[0], paymentMethod: 'Bank Transfer' }); }}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <PlusCircle size={20} /> Record New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-3">
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Total Expenses (Filtered)</p>
          <h3 className="text-3xl font-black text-red-600">{formatCurrency(totalExpenses)}</h3>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-orange-500 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-900">{editingExpenseId ? 'Edit Expense Record' : 'Record New Expense'}</h3>
            <button onClick={() => { setIsAdding(false); setEditingExpenseId(null); }} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Item / Expense Details</label>
              <textarea
                placeholder="What was this expense for? (e.g., Office Rent, Electricity, Stationery)"
                required
                className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium h-24"
                value={newExpense.itemDetails || ''}
                onChange={e => setNewExpense({ ...newExpense, itemDetails: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Amount Paid (AED)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">AED</div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  className="w-full pl-14 pr-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Expense Date</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                value={newExpense.date || ''}
                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Payee Name (Person/Company)</label>
              <input
                placeholder="Who was paid?"
                required
                className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                value={newExpense.payeeName || ''}
                onChange={e => setNewExpense({ ...newExpense, payeeName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Payment Method</label>
              <select
                className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                value={newExpense.paymentMethod || 'Bank Transfer'}
                onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Online Payment">Online Payment</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">Payment Reference / Receipt No.</label>
              <input
                placeholder="e.g. TRN-123456 or Receipt #889"
                className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                value={newExpense.paymentReference || ''}
                onChange={e => setNewExpense({ ...newExpense, paymentReference: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 flex gap-4 mt-2">
              <button type="submit" className="flex-1 bg-orange-600 text-white font-black py-4 rounded-xl hover:bg-orange-700 transition-colors shadow-lg">
                {editingExpenseId ? 'Update Expense Record' : 'Save Expense Record'}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-gray-100 text-gray-800 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Expense Details</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Payee</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Payment Info</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium italic">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-900 font-bold">
                        <Calendar size={14} className="text-orange-500" />
                        {new Date(exp.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{exp.itemDetails}</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                          <User size={10} /> Created by: {exp.createdByName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-gray-700 font-medium">{exp.payeeName}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-600">
                          <CreditCard size={12} className="text-blue-500" />
                          {exp.paymentMethod}
                        </div>
                        {exp.paymentReference && exp.paymentReference !== '-' && (
                          <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Tag size={10} /> Ref: {exp.paymentReference}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-black text-red-600 text-lg">{exp.amount.toFixed(2)} AED</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Edit Record"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this expense record?')) {
                              onDelete(exp.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Record"
                        >
                          <Trash2 size={18} />
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
    </div>
  );
};

export default CompanyExpenses;
