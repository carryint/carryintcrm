
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
import AdjustmentsManagement from './components/AdjustmentsManagement';
import { Customer, Vendor, Invoice, CompanyInfo, User, Expense, AdjustmentNote } from './types';
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

const getInvoiceAging = (dateStr: string, isPaid: boolean, paidDateStr?: string) => {
  const invDate = new Date(dateStr);
  const endDate = isPaid && paidDateStr ? new Date(paidDateStr) : new Date();
  invDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = endDate.getTime() - invDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Future';
  if (diffDays === 0) return 'Today';
  if (isPaid) return `Paid in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} old`;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adjustmentNotes, setAdjustmentNotes] = useState<AdjustmentNote[]>([]);
  const [preSelectedInvoice, setPreSelectedInvoice] = useState<Invoice | null>(null);
  const [preSelectedType, setPreSelectedType] = useState<'CREDIT' | 'DEBIT' | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO as any);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [invoiceFilterDate, setInvoiceFilterDate] = useState('');
  const [invoiceFilterMonth, setInvoiceFilterMonth] = useState('');

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
    const savedAdjustments = localStorage.getItem('carryint_adjustment_notes');
    if (savedAdjustments) setAdjustmentNotes(JSON.parse(savedAdjustments));

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

  const handleUpdateVendorStatus = (invoiceId: string, vendorStatus: 'PAID' | 'UNPAID', vendorPaymentDate?: string, vendorTransactionReference?: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          vendorStatus,
          vendorPaymentDate: vendorStatus === 'PAID' ? (vendorPaymentDate || inv.vendorPaymentDate || new Date().toISOString().split('T')[0]) : undefined,
          vendorTransactionReference: vendorStatus === 'PAID' ? (vendorTransactionReference !== undefined ? vendorTransactionReference : inv.vendorTransactionReference) : undefined
        };
      }
      return inv;
    });
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

  const handleAddAdjustmentNote = (note: AdjustmentNote) => {
    const updated = [...adjustmentNotes, note];
    setAdjustmentNotes(updated);
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));

    const updatedInvoices = invoices.map(inv => {
      if (inv.id === note.originalInvoiceId) {
        return {
          ...inv,
          auditLogs: [
            ...(inv.auditLogs || []),
            {
              action: 'EDIT' as const,
              userId: currentUser?.id || 'system',
              userName: currentUser?.name || 'System User',
              timestamp: new Date().toISOString(),
              details: `Issued ${note.type} ${note.noteNumber} for amount ${note.amount} AED (Reason: ${note.reason})`
            }
          ]
        };
      }
      return inv;
    });
    setInvoices(updatedInvoices);
    localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));
  };

  const handleDeleteAdjustmentNote = (id: string) => {
    const noteToDelete = adjustmentNotes.find(n => n.id === id);
    if (!noteToDelete) return;

    const updated = adjustmentNotes.filter(n => n.id !== id);
    setAdjustmentNotes(updated);
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));

    const updatedInvoices = invoices.map(inv => {
      if (inv.id === noteToDelete.originalInvoiceId) {
        return {
          ...inv,
          auditLogs: [
            ...(inv.auditLogs || []),
            {
              action: 'EDIT' as const,
              userId: currentUser?.id || 'system',
              userName: currentUser?.name || 'System User',
              timestamp: new Date().toISOString(),
              details: `Deleted ${noteToDelete.type} ${noteToDelete.noteNumber} for amount ${noteToDelete.amount} AED`
            }
          ]
        };
      }
      return inv;
    });
    setInvoices(updatedInvoices);
    localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));
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
  const [vendorInvoiceFilter, setVendorInvoiceFilter] = useState<'ALL' | 'UNPAID' | 'PAID_LATEST'>('ALL');
  const [showVendorDescriptions, setShowVendorDescriptions] = useState(false);
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
        return (
          <Dashboard 
            invoices={invoices} 
            expenses={expenses} 
            adjustmentNotes={adjustmentNotes}
            onInvoiceClick={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('view-invoice');
            }}
          />
        );
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
                onClick={() => {
                  const originalTitle = document.title;
                  document.title = selectedInvoice.invoiceNumber;
                  window.print();
                  document.title = originalTitle;
                }}
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
            <InvoicePreview 
              invoice={selectedInvoice} 
              companyInfo={companyInfo} 
              adjustmentNotes={adjustmentNotes}
              onIssueAdjustment={(type) => {
                setPreSelectedInvoice(selectedInvoice);
                setPreSelectedType(type);
                setActiveTab('adjustments');
              }}
            />
          </div>
        ) : <p>No invoice selected</p>;
      case 'view-receipt':
        return selectedInvoice ? (
          <div>
            <div className="flex justify-end gap-2 mb-4 no-print">
              <button
                onClick={() => {
                  const originalTitle = document.title;
                  const receiptNo = `RCP-${selectedInvoice.invoiceNumber.split('-')[1] || selectedInvoice.invoiceNumber}`;
                  document.title = receiptNo;
                  window.print();
                  document.title = originalTitle;
                }}
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
        const filteredInvoices = invoices.filter(inv => {
          const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesCustomer = !searchQuery || inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesStatus = invoiceFilterStatus === 'ALL' || inv.status === invoiceFilterStatus;
          
          const matchesDate = !invoiceFilterDate || inv.date.startsWith(invoiceFilterDate);
          
          const matchesMonth = !invoiceFilterMonth || inv.date.startsWith(invoiceFilterMonth);

          return matchesSearch && matchesStatus && matchesDate && matchesMonth;
        });
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">All Tax Invoices</h3>
                <button
                  onClick={() => { setActiveTab('create-invoice'); setSearchQuery(''); }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                  Create New
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Customer / Invoice #</label>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Specific Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    value={invoiceFilterDate}
                    onChange={(e) => setInvoiceFilterDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Filter by Month</label>
                  <input
                    type="month"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    value={invoiceFilterMonth}
                    onChange={(e) => setInvoiceFilterMonth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Payment Status</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    value={invoiceFilterStatus}
                    onChange={(e) => setInvoiceFilterStatus(e.target.value as any)}
                  >
                    <option value="ALL">All Status</option>
                    <option value="PAID">PAID</option>
                    <option value="UNPAID">UNPAID</option>
                  </select>
                </div>
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-black text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">From</th>
                  <th className="px-6 py-4">To</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-gray-400 font-medium">
                      {searchQuery ? `No invoices matching "${searchQuery}"` : "No invoices generated yet."}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.slice().reverse().map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{inv.customerName}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100 uppercase">
                          {inv.items[0]?.coo || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                          {inv.destinationCountry}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-bold">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-black text-gray-900">{inv.totalAmount.toFixed(2)} AED</div>
                        {(() => {
                          const linked = adjustmentNotes.filter(n => n.originalInvoiceId === inv.id);
                          if (linked.length > 0) {
                            const credits = linked.filter(n => n.type === 'CREDIT').reduce((sum, n) => sum + n.amount, 0);
                            const debits = linked.filter(n => n.type === 'DEBIT').reduce((sum, n) => sum + n.amount, 0);
                            const adjusted = inv.totalAmount + debits - credits;
                            return (
                              <div className="text-[10px] font-black text-blue-600 mt-0.5 whitespace-nowrap">
                                Adjusted: {adjusted.toFixed(2)} AED
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => { setSelectedInvoice(inv); setActiveTab('view-invoice'); setSearchQuery(''); }}
                            className="text-orange-600 font-bold hover:underline"
                          >
                            View
                          </button>
                          {inv.status === 'PAID' && (
                            <button
                              onClick={() => { setSelectedInvoice(inv); setActiveTab('view-receipt'); setSearchQuery(''); }}
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
        return (
          <CustomerManagement 
            searchQuery={searchQuery} 
            customers={customers} 
            invoices={invoices} 
            adjustmentNotes={adjustmentNotes}
            onAdd={handleAddCustomer} 
            onEdit={handleEditCustomer} 
            onDelete={handleDeleteCustomer} 
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus} 
            onInvoiceClick={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('view-invoice');
            }}
          />
        );
      case 'reports':
        return (
          <FinancialReports 
            invoices={invoices} 
            customers={customers} 
            vendors={vendors} 
            companyInfo={companyInfo} 
            expenses={expenses} 
            adjustmentNotes={adjustmentNotes}
          />
        );
      case 'vendors':
        const filteredVendors = vendors.filter(v => 
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.contact.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (selectedVendor) {
          const vendorInvoices = invoices.filter(inv => inv.vendorId === selectedVendor.id);
          
          let displayedInvoices = [...vendorInvoices];
          if (vendorInvoiceFilter === 'UNPAID') {
            displayedInvoices = vendorInvoices.filter(inv => inv.vendorStatus !== 'PAID');
          } else if (vendorInvoiceFilter === 'PAID_LATEST') {
            displayedInvoices = vendorInvoices
              .filter(inv => inv.vendorStatus === 'PAID')
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          }
          
          const totalPayable = selectedVendorInvoiceIds.length > 0
            ? displayedInvoices.filter(inv => selectedVendorInvoiceIds.includes(inv.id)).reduce((s, i) => s + i.vendorCost, 0)
            : displayedInvoices.filter(inv => inv.vendorStatus !== 'PAID').reduce((s, i) => s + i.vendorCost, 0);

          const totalPaid = selectedVendorInvoiceIds.length > 0
            ? displayedInvoices.filter(inv => selectedVendorInvoiceIds.includes(inv.id)).reduce((s, i) => s + i.vendorCost, 0)
            : displayedInvoices.reduce((s, i) => s + i.vendorCost, 0);

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
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showVendorDescriptions}
                        onChange={() => setShowVendorDescriptions(!showVendorDescriptions)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-xs font-bold text-gray-600">Show Descriptions</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-600">Filter Invoices:</span>
                      <select
                        value={vendorInvoiceFilter}
                        onChange={(e) => setVendorInvoiceFilter(e.target.value as any)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-500 font-bold bg-white text-gray-700 cursor-pointer shadow-sm"
                      >
                        <option value="ALL">All Invoices</option>
                        <option value="UNPAID">Unpaid Only</option>
                        <option value="PAID_LATEST">Latest Paid</option>
                      </select>
                    </div>
                  </div>
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
                      <th className="px-6 py-4 text-[10px] font-black uppercase">From</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase">To</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-right">Vendor Cost</th>
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
                          <td className="px-6 py-5 font-bold text-gray-900">
                            <div>{inv.invoiceNumber}</div>
                            {showVendorDescriptions && inv.items && inv.items.length > 0 && (
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
                            <div className="font-bold text-gray-800">{new Date(inv.date).toLocaleDateString()}</div>
                            <div className="text-[11px] font-medium text-orange-600 mt-0.5 whitespace-nowrap">
                              {getInvoiceAging(inv.date, inv.vendorStatus === 'PAID', inv.vendorPaymentDate)}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => {
                                  if (inv.vendorStatus === 'UNPAID') {
                                    const dateStr = prompt('Enter vendor payment date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                                    if (dateStr === null) return;
                                    const refStr = prompt('Enter vendor transaction reference (optional):', '');
                                    if (refStr === null) return;
                                    handleUpdateVendorStatus(inv.id, 'PAID', dateStr || undefined, refStr);
                                  } else {
                                    handleUpdateVendorStatus(inv.id, 'UNPAID');
                                  }
                                }}
                                className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 no-print w-fit ${inv.vendorStatus === 'PAID' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                  }`}
                              >
                                {inv.vendorStatus}
                              </button>
                              <span className={`print-only text-[10px] font-black px-3 py-1.5 rounded-full ${inv.vendorStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {inv.vendorStatus}
                              </span>
                              {inv.vendorStatus === 'PAID' && (
                                <div
                                  className="text-[10px] text-gray-500 font-bold cursor-pointer hover:text-orange-600 no-print space-y-0.5"
                                  onClick={() => {
                                    const dateStr = prompt('Update vendor payment date (YYYY-MM-DD):', inv.vendorPaymentDate || new Date().toISOString().split('T')[0]);
                                    if (dateStr === null) return;
                                    const refStr = prompt('Update vendor transaction reference:', inv.vendorTransactionReference || '');
                                    if (refStr === null) return;
                                    handleUpdateVendorStatus(inv.id, 'PAID', dateStr || undefined, refStr);
                                  }}
                                  title="Click to update payment details"
                                >
                                  <div className="underline decoration-dashed">
                                    📅 {inv.vendorPaymentDate ? new Date(inv.vendorPaymentDate).toLocaleDateString() : 'N/A'}
                                  </div>
                                  {inv.vendorTransactionReference && (
                                    <div className="underline decoration-dashed text-blue-500">
                                      🔖 {inv.vendorTransactionReference}
                                    </div>
                                  )}
                                </div>
                              )}
                              {inv.vendorStatus === 'PAID' && (
                                <div className="text-[10px] text-gray-500 font-bold print-only space-y-0.5">
                                  {inv.vendorPaymentDate && <div>Paid: {new Date(inv.vendorPaymentDate).toLocaleDateString()}</div>}
                                  {inv.vendorTransactionReference && <div>Ref: {inv.vendorTransactionReference}</div>}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-gray-900">{inv.vendorCost.toFixed(2)} AED</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-5 text-right text-xs font-black text-gray-500 uppercase">
                        {vendorInvoiceFilter === 'PAID_LATEST' ? 'Total Paid' : 'Total Payable'}
                      </td>
                      <td className={`px-6 py-5 text-right font-black text-lg ${vendorInvoiceFilter === 'PAID_LATEST' ? 'text-green-600' : 'text-red-600'}`}>
                        {(vendorInvoiceFilter === 'PAID_LATEST' ? totalPaid : totalPayable).toFixed(2)} AED
                      </td>
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
                  {filteredVendors.map(v => {
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
      case 'adjustments':
        return (
          <AdjustmentsManagement
            invoices={invoices}
            customers={customers}
            adjustmentNotes={adjustmentNotes}
            onAddNote={handleAddAdjustmentNote}
            onDeleteNote={handleDeleteAdjustmentNote}
            currentUser={currentUser}
            searchQuery={searchQuery}
            preSelectedInvoice={preSelectedInvoice}
            preSelectedType={preSelectedType}
            companyInfo={companyInfo}
            onClearPreSelections={() => {
              setPreSelectedInvoice(null);
              setPreSelectedType(null);
            }}
          />
        );
      case 'expenses':
        return (
          <CompanyExpenses
            expenses={expenses}
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            onDelete={handleDeleteExpense}
            currentUser={currentUser}
            searchQuery={searchQuery}
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
            adjustmentNotes={adjustmentNotes}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUser={handleUpdateUser}
            currentUser={currentUser}
          />
        );
      default:
        return (
          <Dashboard 
            invoices={invoices} 
            expenses={expenses} 
            adjustmentNotes={adjustmentNotes}
            onInvoiceClick={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('view-invoice');
            }}
          />
        );
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
                placeholder={`Search in ${activeTab.replace('-', ' ')}...`}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
