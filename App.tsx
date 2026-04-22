
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import PaymentReceipt from './components/PaymentReceipt';
import CustomerManagement from './components/CustomerManagement';
import FinancialReports from './components/FinancialReports';
import Settings from './components/Settings';
import CompanyExpenses from './components/CompanyExpenses';
import Login from './components/Login';
import { Customer, Vendor, Invoice, CompanyInfo, User, Expense } from './types';
import { COMPANY_INFO as DEFAULT_COMPANY_INFO } from './constants';
import {
  Bell, Search,
  UserCircle,
  Menu,
  LogOut,
  Loader2,
  PlusCircle,
  X,
  ArrowLeft,
  Printer,
  Truck,
  FileText,
  Edit,
  Wallet
} from 'lucide-react';
import { generateId } from './utils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO as any);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load initial data
  useEffect(() => {
    const savedCustomers = localStorage.getItem('carryint_customers');
    const savedVendors = localStorage.getItem('carryint_vendors');
    const savedInvoices = localStorage.getItem('carryint_invoices');
    const savedExpenses = localStorage.getItem('carryint_expenses');
    const savedCompanyInfo = localStorage.getItem('carryint_company_info');
    const savedUsers = localStorage.getItem('carryint_users');
    const sessionUser = localStorage.getItem('carryint_current_user');

    if (savedCompanyInfo) {
      setCompanyInfo(JSON.parse(savedCompanyInfo));
    } else {
      const initial = { ...DEFAULT_COMPANY_INFO, trn: '100456209800003' };
      setCompanyInfo(initial as any);
      localStorage.setItem('carryint_company_info', JSON.stringify(initial));
    }

    try {
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers(parsed);
        } else {
          throw new Error('Invalid users data');
        }
      } else {
        throw new Error('No users found');
      }
    } catch (e) {
      const defaultAdmin: User = {
        id: 'admin-1',
        name: 'Super Admin',
        email: 'info@carryint.com',
        password: 'intCC3#0',
        role: 'ADMIN'
      };
      setUsers([defaultAdmin]);
      localStorage.setItem('carryint_users', JSON.stringify([defaultAdmin]));
    }

    if (sessionUser) {
      setCurrentUser(JSON.parse(sessionUser));
    }

    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    else {
      const mockCustomers: Customer[] = [
        { id: '1', name: 'Al Ghurair Group', address: 'Al Rigga, Deira, Dubai', contact: '+971 4 222 3333', type: 'CREDIT', vatNumber: '100023456700003' },
        { id: '2', name: 'Emaar Properties', address: 'Downtown Dubai', contact: '+971 4 367 3333', type: 'CREDIT' },
        { id: '3', name: 'Retail Cash Customer', address: 'Bur Dubai', contact: '+971 50 123 4567', type: 'ONE_TIME' },
      ];
      setCustomers(mockCustomers);
      localStorage.setItem('carryint_customers', JSON.stringify(mockCustomers));
    }

    if (savedVendors) setVendors(JSON.parse(savedVendors));
    else {
      const mockVendors: Vendor[] = [
        { id: 'v1', name: 'DP World', contact: '+971 4 881 5555', address: 'Jebel Ali Port, Dubai' },
        { id: 'v2', name: 'Maersk Line', contact: '+971 4 433 9999', address: 'Port Rashid, Dubai' },
      ];
      setVendors(mockVendors);
      localStorage.setItem('carryint_vendors', JSON.stringify(mockVendors));
    }

    if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

    setIsAppLoading(false);
  }, []);

  const handleLogin = (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // Primary check: Search in the loaded users list
    let user = users.find(u =>
      (u.email?.toLowerCase().trim() === trimmedEmail) &&
      (u.password?.trim() === trimmedPass)
    );

    // Bulletproof Fallback: Hardcoded check for default admin
    // This repairs the login if localStorage was corrupted or empty on a specific browser
    if (!user && trimmedEmail === 'info@carryint.com' && trimmedPass === 'intCC3#0') {
      user = {
        id: 'admin-1',
        name: 'Super Admin',
        email: 'info@carryint.com',
        password: 'intCC3#0',
        role: 'ADMIN'
      };
      // Auto-repair the users list
      const updated = users.some(u => u.id === 'admin-1')
        ? users.map(u => u.id === 'admin-1' ? user! : u)
        : [...users, user];

      setUsers(updated);
      localStorage.setItem('carryint_users', JSON.stringify(updated));
    }

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('carryint_current_user', JSON.stringify(user));
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. Access Denied.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('carryint_current_user');
  };

  const handleAddUser = (user: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const updated = [...users, user];
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));
  };

  const handleDeleteUser = (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    if (users.find(u => u.id === id)?.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1) {
      alert("Cannot delete the last administrator.");
      return;
    }
    if (confirm('Are you sure you want to remove this user?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('carryint_users', JSON.stringify(updated));
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: 'PAID' | 'UNPAID', transactionReference?: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status,
          paymentDate: status === 'PAID' ? (inv.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
          paymentMethod: status === 'PAID' ? (inv.paymentMethod || 'Bank Transfer') : undefined,
          transactionReference: status === 'PAID' ? (transactionReference || inv.transactionReference) : undefined
        };
      }
      return inv;
    });
    setInvoices(updated);
    localStorage.setItem('carryint_invoices', JSON.stringify(updated));
  };

  const handleUpdateVendorStatus = (invoiceId: string, vendorStatus: 'PAID' | 'UNPAID') => {
    const updated = invoices.map(inv => inv.id === invoiceId ? { ...inv, vendorStatus } : inv);
    setInvoices(updated);
    localStorage.setItem('carryint_invoices', JSON.stringify(updated));
  };

  const handleAddExpense = (expense: Expense) => {
    const updated = [...expenses, expense];
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
  };
  const handleUpdateExpense = (updatedExpense: Expense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
  };


  const handleSaveInvoice = (invoice: Invoice) => {
    const exists = invoices.find(inv => inv.id === invoice.id);
    let updatedInvoices;
    if (exists) {
      updatedInvoices = invoices.map(inv => inv.id === invoice.id ? invoice : inv);
    } else {
      updatedInvoices = [...invoices, invoice];
    }
    setInvoices(updatedInvoices);
    localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));
    setSelectedInvoice(invoice);
    setActiveTab('view-invoice');
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem('carryint_invoices', JSON.stringify(updated));
    }
  };

  const handleEditInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setActiveTab('create-invoice');
  };

  const handleAddCustomer = (customer: Customer) => {
    const updated = [...customers, customer];
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
  };

  const handleEditCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Are you sure you want to remove this client? This will affect existing invoices linked to this client.')) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      localStorage.setItem('carryint_customers', JSON.stringify(updated));
    }
  };

  const handleUpdateCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
    localStorage.setItem('carryint_company_info', JSON.stringify(info));
  };

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showUnpaidVendorOnly, setShowUnpaidVendorOnly] = useState(false);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({});
  const [selectedVendorInvoiceIds, setSelectedVendorInvoiceIds] = useState<string[]>([]);

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVendor.name && newVendor.contact && newVendor.address) {
      if (editingVendor) {
        const updatedVendors = vendors.map(v => v.id === editingVendor.id ? { ...editingVendor, ...newVendor } as Vendor : v);
        setVendors(updatedVendors);
        localStorage.setItem('carryint_vendors', JSON.stringify(updatedVendors));
        setEditingVendor(null);
      } else {
        const vendorToAdd: Vendor = {
          ...(newVendor as Vendor),
          id: generateId(),
        };
        const updated = [...vendors, vendorToAdd];
        setVendors(updated);
        localStorage.setItem('carryint_vendors', JSON.stringify(updated));
      }
      setIsAddingVendor(false);
      setNewVendor({});
    }
  };

  const handleDeleteVendor = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this vendor?')) {
      const updated = vendors.filter(v => v.id !== id);
      setVendors(updated);
      localStorage.setItem('carryint_vendors', JSON.stringify(updated));
    }
  };

  const handleEditVendor = (v: Vendor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVendor(v);
    setNewVendor(v);
    setIsAddingVendor(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard invoices={invoices} expenses={expenses} />;
      case 'create-invoice':
        return (
          <InvoiceForm
            onSave={handleSaveInvoice}
            customers={customers}
            vendors={vendors}
            companyInfo={companyInfo}
            editingInvoice={selectedInvoice}
            currentUser={currentUser}
          />
        );
      case 'view-invoice':
        return selectedInvoice ? (
          <div>
            <div className="flex justify-end gap-2 mb-4 no-print">
              <button
                onClick={() => window.print()}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg"
              >
                Print / Save PDF
              </button>
              {selectedInvoice.status === 'PAID' && (
                <button
                  onClick={() => setActiveTab('view-receipt')}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg"
                >
                  View Receipt
                </button>
              )}
              <button
                onClick={() => setActiveTab('invoices')}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-bold"
              >
                Back to List
              </button>
            </div>
            <InvoicePreview invoice={selectedInvoice} companyInfo={companyInfo} />
          </div>
        ) : <p>No invoice selected</p>;
      case 'view-receipt':
        return selectedInvoice ? (
          <div>
            <div className="flex justify-end gap-2 mb-4 no-print">
              <button
                onClick={() => window.print()}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-bold"
              >
                Back to List
              </button>
            </div>
            <PaymentReceipt invoice={selectedInvoice} companyInfo={companyInfo} />
          </div>
        ) : <p>No receipt available</p>;
      case 'invoices':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">All Tax Invoices</h3>
              <button
                onClick={() => setActiveTab('create-invoice')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                Create New
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-black text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">No invoices generated yet.</td>
                  </tr>
                ) : (
                  invoices.slice().reverse().map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-gray-600">{inv.customerName}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">{inv.totalAmount.toFixed(2)} AED</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => { setSelectedInvoice(inv); setActiveTab('view-invoice'); }}
                            className="text-orange-600 font-bold hover:underline"
                          >
                            View
                          </button>
                          {inv.status === 'PAID' && (
                            <button
                              onClick={() => { setSelectedInvoice(inv); setActiveTab('view-receipt'); }}
                              className="text-green-600 font-bold hover:underline"
                            >
                              Receipt
                            </button>
                          )}
                          <button
                            onClick={() => handleEditInvoice(inv)}
                            className="text-blue-600 font-bold hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
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
        );
      case 'customers':
        return <CustomerManagement customers={customers} invoices={invoices} onAdd={handleAddCustomer} onEdit={handleEditCustomer} onDelete={handleDeleteCustomer} onUpdateInvoiceStatus={handleUpdateInvoiceStatus} />;
      case 'reports':
        return <FinancialReports invoices={invoices} customers={customers} vendors={vendors} companyInfo={companyInfo} expenses={expenses} />;
      case 'vendors':
        if (selectedVendor) {
          const vendorInvoices = invoices.filter(inv => inv.vendorId === selectedVendor.id);
          const displayedInvoices = showUnpaidVendorOnly
            ? vendorInvoices.filter(inv => inv.vendorStatus !== 'PAID')
            : vendorInvoices;
          
          const totalPayable = selectedVendorInvoiceIds.length > 0
            ? displayedInvoices.filter(inv => selectedVendorInvoiceIds.includes(inv.id)).reduce((s, i) => s + i.vendorCost, 0)
            : displayedInvoices.filter(inv => inv.vendorStatus !== 'PAID').reduce((s, i) => s + i.vendorCost, 0);

          const handleSelectAllVendors = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.checked) {
              setSelectedVendorInvoiceIds(displayedInvoices.map(inv => inv.id));
            } else {
              setSelectedVendorInvoiceIds([]);
            }
          };

          const toggleVendorInvoiceSelection = (id: string) => {
            setSelectedVendorInvoiceIds(prev =>
              prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
          };

          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center no-print">
                <button
                  onClick={() => { setSelectedVendor(null); setSelectedVendorInvoiceIds([]); }}
                  className="flex items-center gap-2 text-gray-500 hover:text-slate-900 font-bold"
                >
                  <ArrowLeft size={20} /> Back to Vendors
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                  <Printer size={18} /> Print Statement
                </button>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 invoice-container">
                <div className="flex justify-between items-start mb-10 pb-8 border-b border-gray-100">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Vendor Statement</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accounts Payable</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-red-600">{totalPayable.toFixed(2)} AED</p>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Outstanding Payable</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mb-10">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Vendor Details</h4>
                    <p className="font-bold text-lg text-gray-900">{selectedVendor.name}</p>
                    <p className="text-sm text-gray-500 max-w-xs">{selectedVendor.address}</p>
                    <p className="text-sm text-gray-500 mt-1">Contact: {selectedVendor.contact}</p>
                    {selectedVendor.vatNumber && <p className="text-sm text-orange-600 font-bold mt-1">VAT/TRN: {selectedVendor.vatNumber}</p>}
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Statement Date</h4>
                    <p className="font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-6 flex justify-between items-center no-print">
                  <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest text-sm">
                    <Truck size={18} className="text-orange-500" />
                    Transaction History
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showUnpaidVendorOnly}
                      onChange={() => setShowUnpaidVendorOnly(!showUnpaidVendorOnly)}
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
                          checked={displayedInvoices.length > 0 && selectedVendorInvoiceIds.length === displayedInvoices.length}
                          onChange={handleSelectAllVendors}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase">Invoice No</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-right">Vendor Cost</th>
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
                          className={`${selectedVendorInvoiceIds.length > 0 && !selectedVendorInvoiceIds.includes(inv.id) ? 'no-print opacity-40' : ''} hover:bg-gray-50 transition-colors`}
                        >
                          <td className="px-6 py-5 no-print">
                            <input
                              type="checkbox"
                              checked={selectedVendorInvoiceIds.includes(inv.id)}
                              onChange={() => toggleVendorInvoiceSelection(inv.id)}
                              className="w-4 h-4 accent-orange-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-5 font-bold text-gray-900">{inv.invoiceNumber}</td>
                          <td className="px-6 py-5 text-gray-600 text-sm">{new Date(inv.date).toLocaleDateString()}</td>
                          <td className="px-6 py-5">
                            <button
                              onClick={() => handleUpdateVendorStatus(inv.id, inv.vendorStatus === 'PAID' ? 'UNPAID' : 'PAID')}
                              className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 no-print ${inv.vendorStatus === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                            >
                              {inv.vendorStatus}
                            </button>
                            <span className={`print-only text-[10px] font-black px-3 py-1.5 rounded-full ${inv.vendorStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {inv.vendorStatus}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-gray-900">{inv.vendorCost.toFixed(2)} AED</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-5 text-right text-xs font-black text-gray-500 uppercase">Total Payable</td>
                      <td className="px-6 py-5 text-right font-black text-red-600 text-lg">{totalPayable.toFixed(2)} AED</td>
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
                <Truck className="text-orange-500" />
                Vendor Management
              </h2>
              <button
                onClick={() => { setIsAddingVendor(true); setEditingVendor(null); setNewVendor({}); }}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md flex items-center gap-2"
              >
                <PlusCircle size={20} /> Add New Vendor
              </button>
            </div>

            {isAddingVendor && (
              <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-orange-500 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-lg font-black mb-4">{editingVendor ? 'Edit Vendor Profile' : 'Add Vendor Profile'}</h3>
                <form onSubmit={handleAddVendorSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Vendor Company Name</label>
                    <input
                      placeholder="e.g. DP World"
                      required
                      className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                      value={newVendor.name || ''}
                      onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Contact Information</label>
                    <input
                      placeholder="e.g. +971 4 881 5555"
                      required
                      className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                      value={newVendor.contact || ''}
                      onChange={e => setNewVendor({ ...newVendor, contact: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">VAT or TRN Number</label>
                    <input
                      placeholder="e.g. 100456209800003"
                      className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                      value={newVendor.vatNumber || ''}
                      onChange={e => setNewVendor({ ...newVendor, vatNumber: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Business Address</label>
                    <textarea
                      placeholder="e.g. Jebel Ali Port, Dubai, UAE"
                      required
                      className="w-full px-4 py-3 border border-orange-200 bg-orange-50 text-slate-900 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium h-24"
                      value={newVendor.address || ''}
                      onChange={e => setNewVendor({ ...newVendor, address: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    <button type="submit" className="flex-1 bg-orange-600 text-white font-black py-3 rounded-lg hover:bg-orange-700 transition-colors shadow-lg">
                      {editingVendor ? 'Update Vendor' : 'Save Vendor Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsAddingVendor(false); setEditingVendor(null); setNewVendor({}); }}
                      className="flex-1 bg-gray-100 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Vendor Name</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Contact</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Address</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">VAT/TRN</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Total Payable</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendors.map(v => {
                    const payable = invoices.filter(inv => inv.vendorId === v.id && inv.vendorStatus !== 'PAID').reduce((s, i) => s + i.vendorCost, 0);
                    return (
                      <tr key={v.id} className="group">
                        <td className="px-6 py-4 font-bold">{v.name}</td>
                        <td className="px-6 py-4 text-gray-600">{v.contact}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{v.address}</td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-700">{v.vatNumber || '-'}</td>
                        <td className="px-6 py-4 text-right font-black text-red-600">{payable.toFixed(2)} AED</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedVendor(v)}
                              className="bg-slate-100 p-2 rounded-lg text-slate-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                              title="View Statement"
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={(e) => handleEditVendor(v, e)}
                              className="bg-blue-50 p-2 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Edit Vendor"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteVendor(v.id, e)}
                              className="bg-red-50 p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Delete Vendor"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'expenses':
        return (
          <CompanyExpenses
            expenses={expenses}
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            onDelete={handleDeleteExpense}
            currentUser={currentUser}
          />
        );
      case 'settings':
        return (
          <Settings
            companyInfo={companyInfo}
            onUpdate={handleUpdateCompanyInfo}
            invoices={invoices}
            customers={customers}
            vendors={vendors}
            users={users}
            expenses={expenses}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUser={handleUpdateUser}
            currentUser={currentUser}
          />
        );
      default:
        return <Dashboard invoices={invoices} expenses={expenses} />;
    }
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={48} />
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={authError} companyName={companyInfo.name} />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className={`lg:pl-64 min-h-screen bg-gray-50 ${activeTab === 'view-invoice' ? 'bg-white' : ''}`}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 no-print">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="relative w-48 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                placeholder="Search..."
                className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-6">
            <div className="relative cursor-pointer text-gray-500 hover:text-orange-600 p-2">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex items-center gap-3 lg:pl-6 lg:border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase">{companyInfo.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
              <UserCircle size={32} className="text-gray-300" />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
