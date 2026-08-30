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
import QuotationManagement from './components/QuotationManagement';
import QuotationForm from './components/QuotationForm';
import QuotationPreview from './components/QuotationPreview';
import StaffDashboard from './components/StaffDashboard';
import AccountantDashboard from './components/AccountantDashboard';
import UserAnalyticsDashboard from './components/UserAnalyticsDashboard';
import CarrierAwbModal from './components/CarrierAwbModal';
import TrackingManagement from './components/TrackingManagement';
import { supabase } from './supabase';
import { Customer, Vendor, Invoice, CompanyInfo, User, Expense, AdjustmentNote, Quotation, PaymentStatus } from './types';
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
  Wallet,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { generateId, generateAwbNumber, getCarrierTrackingUrl, prepareInvoiceForSupabase, hydrateInvoiceFromStorage, sortInvoicesByNewestCreated } from './utils';

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
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
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
  const [carrierModalInvoice, setCarrierModalInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [invoiceFilterDate, setInvoiceFilterDate] = useState('');
  const [invoiceFilterMonth, setInvoiceFilterMonth] = useState('');
  const [invoiceFilterCreator, setInvoiceFilterCreator] = useState('ALL');

  // Load initial data from Supabase Cloud with reliable LocalStorage fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          { data: savedUsers },
          { data: savedCompanyInfo },
          { data: savedCustomers },
          { data: savedVendors },
          { data: savedInvoices },
          { data: savedExpenses },
          { data: savedAdjustments }
        ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('company_info').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('vendors').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('adjustment_notes').select('*')
        ]);

        if (savedCompanyInfo && savedCompanyInfo.length > 0) {
          setCompanyInfo(savedCompanyInfo[0] as any);
          localStorage.setItem('carryint_company_info', JSON.stringify(savedCompanyInfo[0]));
        } else {
          const localComp = localStorage.getItem('carryint_company_info');
          if (localComp) {
            setCompanyInfo(JSON.parse(localComp));
          } else {
            const initial = { ...DEFAULT_COMPANY_INFO, trn: '100456209800003' };
            setCompanyInfo(initial as any);
          }
        }

        const defaultAdmin: User = {
          id: 'admin-1',
          name: 'Super Admin',
          email: 'info@carryint.com',
          password: 'intCC3#0',
          role: 'ADMIN'
        };

        if (savedUsers && savedUsers.length > 0) {
          setUsers(savedUsers);
          localStorage.setItem('carryint_users', JSON.stringify(savedUsers));
        } else {
          const localUsers = localStorage.getItem('carryint_users');
          if (localUsers) {
            setUsers(JSON.parse(localUsers));
          } else {
            setUsers([defaultAdmin]);
            try {
              await supabase.from('users').upsert([defaultAdmin]);
            } catch (e) {
              console.error('Error seeding default admin:', e);
            }
          }
        }

        if (savedCustomers !== null && savedCustomers !== undefined) {
          setCustomers(savedCustomers);
          localStorage.setItem('carryint_customers', JSON.stringify(savedCustomers));
        } else {
          const localCust = localStorage.getItem('carryint_customers');
          if (localCust) setCustomers(JSON.parse(localCust));
        }

        if (savedVendors !== null && savedVendors !== undefined) {
          setVendors(savedVendors);
          localStorage.setItem('carryint_vendors', JSON.stringify(savedVendors));
        } else {
          const localVen = localStorage.getItem('carryint_vendors');
          if (localVen) setVendors(JSON.parse(localVen));
        }

        if (savedInvoices !== null && savedInvoices !== undefined) {
          const normalized = savedInvoices.map(hydrateInvoiceFromStorage);
          const sorted = sortInvoicesByNewestCreated(normalized);
          setInvoices(sorted);
          localStorage.setItem('carryint_invoices', JSON.stringify(sorted));
        } else {
          const localInv = localStorage.getItem('carryint_invoices');
          if (localInv) {
            const parsed = JSON.parse(localInv).map(hydrateInvoiceFromStorage);
            const sorted = sortInvoicesByNewestCreated(parsed);
            setInvoices(sorted);
          }
        }

        if (savedExpenses !== null && savedExpenses !== undefined) {
          setExpenses(savedExpenses);
          localStorage.setItem('carryint_expenses', JSON.stringify(savedExpenses));
        } else {
          const localExp = localStorage.getItem('carryint_expenses');
          if (localExp) setExpenses(JSON.parse(localExp));
        }

        if (savedAdjustments !== null && savedAdjustments !== undefined) {
          setAdjustmentNotes(savedAdjustments);
          localStorage.setItem('carryint_adjustment_notes', JSON.stringify(savedAdjustments));
        } else {
          const localAdj = localStorage.getItem('carryint_adjustment_notes');
          if (localAdj) setAdjustmentNotes(JSON.parse(localAdj));
        }

        // Load Quotations (Local Storage first, then Supabase if table exists)
        const localQuotations = localStorage.getItem('carryint_quotations');
        if (localQuotations) {
          try {
            setQuotations(JSON.parse(localQuotations));
          } catch (e) {
            console.error('Error parsing local quotations:', e);
          }
        }
        try {
          const { data: savedQuotations } = await supabase.from('quotations').select('*');
          if (savedQuotations && savedQuotations.length > 0) {
            setQuotations(savedQuotations);
            localStorage.setItem('carryint_quotations', JSON.stringify(savedQuotations));
          }
        } catch (e) {
          console.log('Quotations cloud sync fallback to local storage');
        }

        const sessionUser = localStorage.getItem('carryint_current_user');
        if (sessionUser) {
          setCurrentUser(JSON.parse(sessionUser));
        }
      } catch (error) {
        console.error("Error loading data from Supabase:", error);
      } finally {
        setIsAppLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogin = async (emailInput: string, passInput: string) => {
    setAuthError('');
    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedPass = passInput.trim();

    // Check currently loaded state first
    const user = users.find(u => u.email?.toLowerCase().trim() === trimmedEmail && u.password?.trim() === trimmedPass);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('carryint_current_user', JSON.stringify(user));
      return;
    }

    // Check live cloud database directly
    try {
      const { data: dbUsers } = await supabase.from('users').select('*');
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
        localStorage.setItem('carryint_users', JSON.stringify(dbUsers));
        const match = dbUsers.find(u => u.email?.toLowerCase().trim() === trimmedEmail && u.password?.trim() === trimmedPass);
        if (match) {
          setCurrentUser(match);
          localStorage.setItem('carryint_current_user', JSON.stringify(match));
          return;
        }
      }
    } catch (err) {
      console.error('Cloud login check failed:', err);
    }

    if (trimmedEmail === 'info@carryint.com' && trimmedPass === 'intCC3#0') {
      const adminUser: User = {
        id: 'admin-1',
        name: 'Super Admin',
        email: 'info@carryint.com',
        password: 'intCC3#0',
        role: 'ADMIN'
      };
      setCurrentUser(adminUser);
      localStorage.setItem('carryint_current_user', JSON.stringify(adminUser));
      const updated = [...users.filter(u => u.id !== 'admin-1'), adminUser];
      setUsers(updated);
      localStorage.setItem('carryint_users', JSON.stringify(updated));
      await supabase.from('users').upsert([adminUser]);
      return;
    }

    setAuthError('Invalid credentials. Access Denied.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('carryint_current_user');
  };

  const handleAddUser = async (user: User) => {
    const cleanUser = {
      id: user.id || generateId(),
      name: user.name,
      email: user.email.toLowerCase().trim(),
      password: user.password,
      role: user.role
    };

    const updated = [...users.filter(u => u.id !== cleanUser.id), cleanUser];
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));

    try {
      const { error } = await supabase.from('users').upsert([cleanUser]);
      if (error) {
        console.error("Error syncing user to Supabase:", error);
      }
    } catch (err) {
      console.error("Error creating user:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (users.length <= 1) {
      alert("Cannot delete the only remaining user.");
      return;
    }
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));

    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.error("Error deleting user from Supabase:", error);
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const cleanUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email.toLowerCase().trim(),
      password: updatedUser.password,
      role: updatedUser.role
    };

    const updated = users.map(u => u.id === cleanUser.id ? cleanUser : u);
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));

    try {
      const { error } = await supabase.from('users').upsert([cleanUser]);
      if (error) {
        console.error("Error updating user in Supabase:", error);
      }
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: 'PAID' | 'UNPAID', transactionReference?: string) => {
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
    const target = updated.find(i => i.id === invoiceId);
    if (target) {
      try {
        await supabase.from('invoices').upsert([prepareInvoiceForSupabase(target)]);
      } catch (err) {
        console.error('Error updating invoice status in Supabase:', err);
      }
    }
  };
  const handleUpdateVendorStatus = async (
    invoiceId: string, 
    vendorStatus: PaymentStatus, 
    vendorPaymentDate?: string, 
    vendorTransactionReference?: string,
    vendorPaidAmount?: number
  ) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        const finalPaid = vendorStatus === 'PAID' 
          ? inv.vendorCost 
          : (vendorStatus === 'PARTIAL' ? (vendorPaidAmount !== undefined ? vendorPaidAmount : (inv.vendorPaidAmount || 0)) : 0);
        return {
          ...inv,
          vendorStatus,
          vendorPaidAmount: finalPaid,
          vendorPaymentDate: vendorStatus !== 'UNPAID' ? (vendorPaymentDate || inv.vendorPaymentDate || new Date().toISOString().split('T')[0]) : undefined,
          vendorTransactionReference: vendorStatus !== 'UNPAID' ? (vendorTransactionReference !== undefined ? vendorTransactionReference : inv.vendorTransactionReference) : undefined
        };
      }
      return inv;
    });
    setInvoices(updated);
    localStorage.setItem('carryint_invoices', JSON.stringify(updated));
    const target = updated.find(i => i.id === invoiceId);
    if (target) {
      try {
        await supabase.from('invoices').upsert([prepareInvoiceForSupabase(target)]);
      } catch (err) {
        console.error('Error updating vendor status in Supabase:', err);
      }
    }
  };

  const handleAddExpense = async (expense: Expense) => {
    const updated = [...expenses, expense];
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
    try {
      await supabase.from('expenses').upsert([expense]);
    } catch (err) {
      console.error('Error adding expense to Supabase:', err);
    }
  };
  const handleUpdateExpense = async (updatedExpense: Expense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
    try {
      await supabase.from('expenses').upsert([updatedExpense]);
    } catch (err) {
      console.error('Error updating expense in Supabase:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting expense from Supabase:', err);
    }
  };

  const handleAddAdjustmentNote = async (note: AdjustmentNote) => {
    const updatedNotes = [...adjustmentNotes, note];
    setAdjustmentNotes(updatedNotes);
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updatedNotes));
    try {
      await supabase.from('adjustment_notes').upsert([note]);
    } catch (err) {
      console.error('Error adding adjustment note to Supabase:', err);
    }

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
    const invTarget = updatedInvoices.find(i => i.id === note.originalInvoiceId);
    if (invTarget) {
      try {
        await supabase.from('invoices').upsert([prepareInvoiceForSupabase(invTarget)]);
      } catch (err) {
        console.error('Error updating invoice audit in Supabase:', err);
      }
    }
  };

  const handleDeleteAdjustmentNote = async (id: string) => {
    const noteToDelete = adjustmentNotes.find(n => n.id === id);
    if (!noteToDelete) return;

    const updated = adjustmentNotes.filter(n => n.id !== id);
    setAdjustmentNotes(updated);
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));
    try {
      await supabase.from('adjustment_notes').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting adjustment note from Supabase:', err);
    }

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
    const invTarget = updatedInvoices.find(i => i.id === noteToDelete.originalInvoiceId);
    if (invTarget) {
      try {
        await supabase.from('invoices').upsert([prepareInvoiceForSupabase(invTarget)]);
      } catch (err) {
        console.error('Error updating invoice audit in Supabase:', err);
      }
    }
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    const exists = invoices.find(inv => inv.id === invoice.id);
    let updatedInvoices;
    if (exists) {
      updatedInvoices = invoices.map(inv => inv.id === invoice.id ? invoice : inv);
    } else {
      updatedInvoices = [invoice, ...invoices];
    }
    const sorted = sortInvoicesByNewestCreated(updatedInvoices);
    setInvoices(sorted);
    localStorage.setItem('carryint_invoices', JSON.stringify(sorted));
    try {
      await supabase.from('invoices').upsert([prepareInvoiceForSupabase(invoice)]);
    } catch (err) {
      console.error('Error saving invoice to Supabase:', err);
    }
    setSelectedInvoice(invoice);
    setActiveTab('view-invoice');
  };

  const handleQuickUpdateCarrier = async (updatedInvoice: Invoice) => {
    const updated = invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv);
    const sorted = sortInvoicesByNewestCreated(updated);
    setInvoices(sorted);
    localStorage.setItem('carryint_invoices', JSON.stringify(sorted));
    try {
      await supabase.from('invoices').upsert([prepareInvoiceForSupabase(updatedInvoice)]);
    } catch (err) {
      console.error('Error updating carrier AWB in Supabase:', err);
    }
    if (selectedInvoice && selectedInvoice.id === updatedInvoice.id) {
      setSelectedInvoice(updatedInvoice);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (currentUser?.role === 'STAFF') {
      alert('Access Denied: Standard Staff cannot delete tax invoices. Please contact your Manager or System Administrator.');
      return;
    }
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem('carryint_invoices', JSON.stringify(updated));
      try {
        await supabase.from('invoices').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting invoice from Supabase:', err);
      }
    }
  };

  const handleEditInvoice = (inv: Invoice) => {
    if (currentUser?.role === 'STAFF') {
      const isOwner = inv.createdBy === currentUser.id || inv.createdBy === currentUser.email || inv.createdByName === currentUser.name;
      if (!isOwner) {
        alert('Access Restricted: Standard Staff can only edit invoices they personally generated.');
        return;
      }
    }
    setSelectedInvoice(inv);
    setActiveTab('create-invoice');
  };

  const handleAddCustomer = async (customer: Customer) => {
    const updated = [...customers, customer];
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
    try {
      await supabase.from('customers').upsert([customer]);
    } catch (err) {
      console.error('Error saving customer to Supabase:', err);
    }
  };

  const handleEditCustomer = async (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
    try {
      await supabase.from('customers').upsert([updatedCustomer]);
    } catch (err) {
      console.error('Error updating customer in Supabase:', err);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Are you sure you want to remove this client? This will affect existing invoices linked to this client.')) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      localStorage.setItem('carryint_customers', JSON.stringify(updated));
      try {
        await supabase.from('customers').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting customer from Supabase:', err);
      }
    }
  };

  const handleUpdateCompanyInfo = async (info: CompanyInfo) => {
    setCompanyInfo(info);
    localStorage.setItem('carryint_company_info', JSON.stringify(info));
    try {
      await supabase.from('company_info').upsert([{ id: '1', ...info }]);
    } catch (err) {
      console.error('Error updating company info in Supabase:', err);
    }
  };

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorInvoiceFilter, setVendorInvoiceFilter] = useState<'ALL' | 'UNPAID' | 'PAID_LATEST'>('ALL');
  const [showVendorDescriptions, setShowVendorDescriptions] = useState(false);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({});
  const [selectedVendorInvoiceIds, setSelectedVendorInvoiceIds] = useState<string[]>([]);
  const [vendorPaymentModalInvoice, setVendorPaymentModalInvoice] = useState<Invoice | null>(null);
  const [modalVendorStatus, setModalVendorStatus] = useState<PaymentStatus>('PAID');
  const [modalVendorPaidAmount, setModalVendorPaidAmount] = useState<number>(0);
  const [modalVendorPaymentDate, setModalVendorPaymentDate] = useState<string>('');
  const [modalVendorPaymentRef, setModalVendorPaymentRef] = useState<string>('');

  const openVendorPaymentModal = (inv: Invoice) => {
    setVendorPaymentModalInvoice(inv);
    const currStatus = inv.vendorStatus || 'UNPAID';
    setModalVendorStatus(currStatus);
    setModalVendorPaidAmount(currStatus === 'PAID' ? inv.vendorCost : (inv.vendorPaidAmount || 0));
    setModalVendorPaymentDate(inv.vendorPaymentDate || new Date().toISOString().split('T')[0]);
    setModalVendorPaymentRef(inv.vendorTransactionReference || '');
  };

  // Automatically update document title based on the active preview (Invoice, Receipt, Quotation, Vendor Statement)
  // Ensures mobile and desktop browsers save PDFs with the exact reference number as file name
  useEffect(() => {
    const defaultTitle = 'Carryint CRM & Invoicing';
    if (activeTab === 'view-invoice' && selectedInvoice) {
      document.title = selectedInvoice.invoiceNumber;
    } else if (activeTab === 'view-receipt' && selectedInvoice) {
      const receiptNo = `RCP-${selectedInvoice.invoiceNumber.split('-')[1] || selectedInvoice.invoiceNumber}`;
      document.title = receiptNo;
    } else if (activeTab === 'view-quotation' && selectedQuotation) {
      document.title = selectedQuotation.quotationNumber;
    } else if (activeTab === 'vendors' && selectedVendor) {
      document.title = `Vendor_Statement_${selectedVendor.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    } else {
      document.title = defaultTitle;
    }
  }, [activeTab, selectedInvoice, selectedQuotation, selectedVendor]);

  const handleAddVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVendor.name && newVendor.contact && newVendor.address) {
      if (editingVendor) {
        const updatedVendorObj: Vendor = { ...editingVendor, ...newVendor } as Vendor;
        const updatedVendors = vendors.map(v => v.id === editingVendor.id ? updatedVendorObj : v);
        setVendors(updatedVendors);
        localStorage.setItem('carryint_vendors', JSON.stringify(updatedVendors));
        setEditingVendor(null);
        try {
          await supabase.from('vendors').upsert([updatedVendorObj]);
        } catch (err) {
          console.error('Error updating vendor in Supabase:', err);
        }
      } else {
        const vendorToAdd: Vendor = {
          ...(newVendor as Vendor),
          id: generateId(),
        };
        const updated = [...vendors, vendorToAdd];
        setVendors(updated);
        localStorage.setItem('carryint_vendors', JSON.stringify(updated));
        try {
          await supabase.from('vendors').upsert([vendorToAdd]);
        } catch (err) {
          console.error('Error adding vendor to Supabase:', err);
        }
      }
      setIsAddingVendor(false);
      setNewVendor({});
    }
  };

  const handleDeleteVendor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this vendor?')) {
      const updated = vendors.filter(v => v.id !== id);
      setVendors(updated);
      localStorage.setItem('carryint_vendors', JSON.stringify(updated));
      try {
        await supabase.from('vendors').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting vendor from Supabase:', err);
      }
    }
  };

  const handleEditVendor = (v: Vendor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVendor(v);
    setNewVendor(v);
    setIsAddingVendor(true);
  };

  const handleSaveQuotation = async (quotation: Quotation, andPreview = false) => {
    const exists = quotations.find(q => q.id === quotation.id);
    let updated: Quotation[];
    if (exists) {
      updated = quotations.map(q => q.id === quotation.id ? quotation : q);
    } else {
      updated = [quotation, ...quotations];
    }
    setQuotations(updated);
    localStorage.setItem('carryint_quotations', JSON.stringify(updated));
    try {
      await supabase.from('quotations').upsert([quotation]);
    } catch (e) {
      console.warn('Quotations Supabase sync skipped:', e);
    }

    if (andPreview) {
      setSelectedQuotation(quotation);
      setActiveTab('view-quotation');
    } else {
      setActiveTab('quotations');
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      const updated = quotations.filter(q => q.id !== id);
      setQuotations(updated);
      localStorage.setItem('carryint_quotations', JSON.stringify(updated));
      try {
        await supabase.from('quotations').delete().eq('id', id);
      } catch (e) {
        console.warn('Quotations Supabase delete skipped:', e);
      }
    }
  };

  const handleDuplicateQuotation = (quotation: Quotation) => {
    const today = new Date().toISOString().split('T')[0];
    const valD = new Date(today);
    valD.setDate(valD.getDate() + 5);

    const duplicated: Quotation = {
      ...quotation,
      id: generateId(),
      quotationNumber: `${quotation.quotationNumber}-COPY`,
      date: today,
      validityDate: valD.toISOString().split('T')[0],
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };
    setEditingQuotation(duplicated);
    setActiveTab('create-quotation');
  };

  const handleConvertToInvoice = (quotation: Quotation) => {
    if (confirm(`Convert quotation "${quotation.quotationNumber}" for ${quotation.customerName} into an active invoice?`)) {
      const currentYear = new Date().getFullYear();
      const yearPrefix = `INV-${currentYear}-`;
      const numbers = invoices
        .map(i => i.invoiceNumber)
        .filter(num => num && num.startsWith(yearPrefix))
        .map(num => {
          const parts = num.split('-');
          return parseInt(parts[2], 10);
        })
        .filter(n => !isNaN(n));
      const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      const invNumber = `${yearPrefix}${String(nextNum).padStart(4, '0')}`;

      const matchedCust = customers.find(c => 
        c.id === quotation.customerId || 
        c.name.trim().toLowerCase() === quotation.customerName.trim().toLowerCase()
      );

      const draftInvoice: Invoice = {
        id: generateId(),
        invoiceNumber: invNumber,
        date: new Date().toISOString().split('T')[0],
        customerId: matchedCust ? matchedCust.id : (quotation.customerId || generateId()),
        customerName: quotation.customerName,
        customerAddress: quotation.customerAddress,
        customerContact: quotation.customerContact,
        customerEmail: quotation.customerEmail,
        customerVat: quotation.customerVat,
        destinationCountry: quotation.destinationCountry || 'United Arab Emirates',
        items: quotation.items.map(item => ({
          commodityType: item.commodityType,
          description: item.description,
          weight: item.weight,
          cbm: item.cbm,
          quantity: item.quantity,
          coo: quotation.originCountry || 'United Arab Emirates',
          price: item.price,
          vatPercent: item.vatPercent || 0
        })),
        vendorCost: 0,
        agentCommission: 0,
        pickupCost: 0,
        status: 'UNPAID',
        vendorStatus: 'UNPAID',
        totalAmount: quotation.totalAmount,
        totalVat: quotation.vatAmount,
        netAmount: quotation.subtotal,
        profit: quotation.subtotal,
        createdBy: currentUser?.id || 'admin-1',
        createdByName: currentUser?.name || 'Super Admin',
        auditLogs: [
          {
            action: 'CREATE',
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'System User',
            timestamp: new Date().toISOString(),
            details: `Converted from Quotation ${quotation.quotationNumber}`
          }
        ]
      };

      if (!matchedCust && quotation.customerName.trim()) {
        const newCust: Customer = {
          id: draftInvoice.customerId,
          name: quotation.customerName.trim(),
          address: quotation.customerAddress.trim() || 'Dubai, UAE',
          contact: quotation.customerContact.trim() || '+971',
          email: quotation.customerEmail?.trim(),
          vatNumber: quotation.customerVat?.trim(),
          type: quotation.customerCategory === 'COMMERCIAL' ? 'CREDIT' : 'ONE_TIME'
        };
        handleAddCustomer(newCust);
      }

      handleSaveQuotation({
        ...quotation,
        status: 'ACCEPTED'
      });

      setSelectedInvoice(draftInvoice);
      setActiveTab('create-invoice');
    }
  };

  const handleDataRestored = (restored: {
    invoices: Invoice[];
    customers: Customer[];
    vendors: Vendor[];
    expenses: Expense[];
    adjustmentNotes: AdjustmentNote[];
    companyInfo?: CompanyInfo;
    users?: User[];
    quotations?: Quotation[];
  }) => {
    setInvoices(restored.invoices);
    setCustomers(restored.customers);
    setVendors(restored.vendors);
    setExpenses(restored.expenses);
    setAdjustmentNotes(restored.adjustmentNotes);
    if (restored.quotations) {
      setQuotations(restored.quotations);
      localStorage.setItem('carryint_quotations', JSON.stringify(restored.quotations));
    }
    if (restored.companyInfo) setCompanyInfo(restored.companyInfo);
    if (restored.users && restored.users.length > 0) setUsers(restored.users);

    localStorage.setItem('carryint_invoices', JSON.stringify(restored.invoices));
    localStorage.setItem('carryint_customers', JSON.stringify(restored.customers));
    localStorage.setItem('carryint_vendors', JSON.stringify(restored.vendors));
    localStorage.setItem('carryint_expenses', JSON.stringify(restored.expenses));
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(restored.adjustmentNotes));
    if (restored.companyInfo) localStorage.setItem('carryint_company_info', JSON.stringify(restored.companyInfo));
    if (restored.users && restored.users.length > 0) localStorage.setItem('carryint_users', JSON.stringify(restored.users));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (currentUser?.role === 'STAFF') {
          return (
            <StaffDashboard
              currentUser={currentUser}
              invoices={invoices}
              quotations={quotations}
              onNavigate={setActiveTab}
              onInvoiceClick={(inv) => {
                setSelectedInvoice(inv);
                setActiveTab('view-invoice');
              }}
              onQuotationClick={(q) => {
                setSelectedQuotation(q);
                setActiveTab('view-quotation');
              }}
            />
          );
        }
        if (currentUser?.role === 'ACCOUNTANT') {
          return (
            <AccountantDashboard
              invoices={invoices}
              customers={customers}
              vendors={vendors}
              companyInfo={companyInfo}
              expenses={expenses}
              adjustmentNotes={adjustmentNotes}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onInvoiceClick={(inv) => {
                setSelectedInvoice(inv);
                setActiveTab('view-invoice');
              }}
            />
          );
        }
        return (
          <Dashboard 
            invoices={invoices} 
            expenses={expenses} 
            adjustmentNotes={adjustmentNotes}
            users={users}
            onInvoiceClick={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('view-invoice');
            }}
          />
        );
      case 'user-analytics':
        return (
          <UserAnalyticsDashboard
            users={users}
            invoices={invoices}
            quotations={quotations}
            expenses={expenses}
            adjustmentNotes={adjustmentNotes}
            currentUser={currentUser!}
            onNavigate={setActiveTab}
            onViewInvoice={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('view-invoice');
            }}
          />
        );
      case 'accounting-suite':
        return (
          <AccountantDashboard
            invoices={invoices}
            customers={customers}
            vendors={vendors}
            companyInfo={companyInfo}
            expenses={expenses}
            adjustmentNotes={adjustmentNotes}
            currentUser={currentUser!}
            onNavigate={setActiveTab}
            onInvoiceClick={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('view-invoice');
            }}
          />
        );
      case 'quotations':
        return (
          <QuotationManagement
            quotations={quotations}
            onAddNew={() => {
              setEditingQuotation(null);
              setActiveTab('create-quotation');
            }}
            onView={(q) => {
              setSelectedQuotation(q);
              setActiveTab('view-quotation');
            }}
            onEdit={(q) => {
              setEditingQuotation(q);
              setActiveTab('create-quotation');
            }}
            onDelete={handleDeleteQuotation}
            onDuplicate={handleDuplicateQuotation}
            onConvertToInvoice={handleConvertToInvoice}
            searchQuery={searchQuery}
          />
        );
      case 'create-quotation':
        return (
          <QuotationForm
            initialQuotation={editingQuotation}
            existingQuotations={quotations}
            customers={customers}
            onSave={handleSaveQuotation}
            onCancel={() => {
              setEditingQuotation(null);
              setActiveTab('quotations');
            }}
            currentUserId={currentUser?.id}
            currentUserName={currentUser?.name}
          />
        );
      case 'view-quotation':
        return selectedQuotation ? (
          <QuotationPreview
            quotation={selectedQuotation}
            companyInfo={companyInfo}
            onBack={() => setActiveTab('quotations')}
            onEdit={(q) => {
              setEditingQuotation(q);
              setActiveTab('create-quotation');
            }}
            onConvertToInvoice={handleConvertToInvoice}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No quotation selected</p>
            <button
              onClick={() => setActiveTab('quotations')}
              className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold"
            >
              Back to Quotations
            </button>
          </div>
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 mb-2 sm:mb-4 no-print bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-gray-100 shadow-sm sm:shadow-none">
              <button
                onClick={() => setActiveTab('invoices')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                <span>Back to Invoices</span>
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setCarrierModalInvoice(selectedInvoice)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Truck size={14} />
                  <span>Update Carrier / AWB</span>
                </button>
                {selectedInvoice.status === 'PAID' && (
                  <button
                    onClick={() => setActiveTab('view-receipt')}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all"
                  >
                    View Receipt
                  </button>
                )}
                <button
                  onClick={() => {
                    document.title = selectedInvoice.invoiceNumber;
                    setTimeout(() => {
                      window.print();
                    }, 50);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3.5 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-black shadow-md transition-all flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
            <InvoicePreview 
              invoice={selectedInvoice} 
              companyInfo={companyInfo} 
              adjustmentNotes={adjustmentNotes}
              onOpenCarrierModal={(inv) => setCarrierModalInvoice(inv)}
            />
          </div>
        ) : <p>No invoice selected</p>;
      case 'view-receipt':
        return selectedInvoice ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 mb-2 sm:mb-4 no-print bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-gray-100 shadow-sm sm:shadow-none">
              <button
                onClick={() => setActiveTab('invoices')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={14} />
                <span>Back to Invoices</span>
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setActiveTab('view-invoice')}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all"
                >
                  View Invoice
                </button>
                <button
                  onClick={() => {
                    const receiptNo = `RCP-${selectedInvoice.invoiceNumber.split('-')[1] || selectedInvoice.invoiceNumber}`;
                    document.title = receiptNo;
                    setTimeout(() => {
                      window.print();
                    }, 50);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3.5 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-black shadow-md transition-all flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
            <PaymentReceipt invoice={selectedInvoice} companyInfo={companyInfo} />
          </div>
        ) : <p>No receipt available</p>;
      case 'tracking':
        return (
          <TrackingManagement
            invoices={invoices}
            companyInfo={companyInfo}
            currentUser={currentUser}
            onOpenCarrierModal={(inv) => setCarrierModalInvoice(inv)}
            onViewInvoice={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('view-invoice');
            }}
            onViewReceipt={(inv) => {
              setSelectedInvoice(inv);
              setActiveTab('view-receipt');
            }}
          />
        );
      case 'invoices':
        const filteredInvoices = invoices.filter(inv => {
          const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.awbNumber && inv.awbNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (inv.carrierTrackingNumber && inv.carrierTrackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
          
          const matchesCustomer = !searchQuery || inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesStatus = invoiceFilterStatus === 'ALL' || inv.status === invoiceFilterStatus;
          const matchesDate = !invoiceFilterDate || inv.date.startsWith(invoiceFilterDate);
          const matchesMonth = !invoiceFilterMonth || inv.date.startsWith(invoiceFilterMonth);
          const matchesCreator = invoiceFilterCreator === 'ALL' || 
            inv.createdBy === invoiceFilterCreator || 
            inv.createdByName?.toLowerCase() === invoiceFilterCreator.toLowerCase();

          return matchesSearch && matchesStatus && matchesDate && matchesMonth && matchesCreator;
        });
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-gray-900">All Tax Invoices & Logistics</h3>
                  <p className="text-xs text-gray-500">View invoices, track Air Waybill numbers, and assign carrier logistics post-payment.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('tracking')}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Truck size={14} />
                    <span>Tracking Portal</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('create-invoice'); setSearchQuery(''); setSelectedInvoice(null); }}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-black shadow-md transition-all flex items-center gap-1.5"
                  >
                    <PlusCircle size={15} />
                    <span>Create New</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 bg-gray-50 p-3 rounded-xl">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Customer / AWB / Inv #</label>
                  <input
                    type="text"
                    placeholder="Search AWB or invoice..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Created By Staff</label>
                  <select
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-500 font-bold bg-white"
                    value={invoiceFilterCreator}
                    onChange={(e) => setInvoiceFilterCreator(e.target.value)}
                  >
                    <option value="ALL">All Staff Members</option>
                    {users.map(u => (
                      <option key={u.id} value={u.name}>👤 {u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Specific Date</label>
                  <input
                    type="date"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={invoiceFilterDate}
                    onChange={(e) => setInvoiceFilterDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Filter by Month</label>
                  <input
                    type="month"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={invoiceFilterMonth}
                    onChange={(e) => setInvoiceFilterMonth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Payment Status</label>
                  <select
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-500 font-bold bg-white"
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5">Invoice No</th>
                    <th className="px-4 py-2.5">Created By</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Carrier / AWB</th>
                    <th className="px-4 py-2.5">From</th>
                    <th className="px-4 py-2.5">To</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Total Amount</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-gray-400">
                        {searchQuery ? `No invoices matching "${searchQuery}"` : "No invoices found for this selection."}
                      </td>
                    </tr>
                  ) : (
                    sortInvoicesByNewestCreated(filteredInvoices).map(inv => {
                      const carrierTrkUrl = getCarrierTrackingUrl(inv.carrier, inv.carrierTrackingNumber);
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-black text-gray-900">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                              👤 {inv.createdByName || 'Admin'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-bold">{inv.customerName}</td>
                          <td className="px-4 py-3">
                            {inv.carrierTrackingNumber ? (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-white">
                                    {inv.carrier || 'CARRIER'}
                                  </span>
                                  {carrierTrkUrl ? (
                                    <a
                                      href={carrierTrkUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-mono font-bold text-orange-600 hover:underline inline-flex items-center gap-0.5"
                                      title="Open Carrier Live Tracking"
                                    >
                                      {inv.carrierTrackingNumber} <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] font-mono font-bold text-slate-800">{inv.carrierTrackingNumber}</span>
                                  )}
                                </div>
                                <span className="text-[9px] font-mono text-gray-400 mt-0.5">
                                  {inv.awbNumber || 'PENDING'}
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCarrierModalInvoice(inv)}
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                                  inv.status === 'PAID'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 shadow-sm'
                                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                }`}
                              >
                                <Truck size={12} className={inv.status === 'PAID' ? 'text-amber-700' : 'text-gray-500'} />
                                <span>{inv.status === 'PAID' ? '⚡ Assign AWB' : '+ Add AWB'}</span>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 uppercase">
                              {inv.items[0]?.coo || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                              {inv.destinationCountry}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 font-bold">{new Date(inv.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
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
                          <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2.5 items-center">
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
                              onClick={() => setCarrierModalInvoice(inv)}
                              className="text-indigo-600 font-bold hover:underline"
                              title="Update Carrier AWB / Milestones"
                            >
                              {inv.carrierTrackingNumber ? 'Tracking' : 'AWB'}
                            </button>
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
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
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
          
          const filteredSet = selectedVendorInvoiceIds.length > 0
            ? displayedInvoices.filter(inv => selectedVendorInvoiceIds.includes(inv.id))
            : displayedInvoices;

          const totalBilled = filteredSet.reduce((s, i) => s + (i.vendorCost || 0), 0);
          const totalPaid = filteredSet.reduce((s, i) => s + (i.vendorStatus === 'PAID' ? (i.vendorCost || 0) : (i.vendorStatus === 'PARTIAL' ? (i.vendorPaidAmount || 0) : 0)), 0);
          const totalPayable = filteredSet.reduce((s, i) => s + (i.vendorStatus === 'PAID' ? 0 : (i.vendorStatus === 'PARTIAL' ? Math.max(0, (i.vendorCost || 0) - (i.vendorPaidAmount || 0)) : (i.vendorCost || 0))), 0);

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
                  onClick={() => {
                    if (selectedVendor) {
                      document.title = `Vendor_Statement_${selectedVendor.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}`;
                    }
                    setTimeout(() => {
                      window.print();
                    }, 50);
                  }}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                  <Printer size={18} /> Print Statement
                </button>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 invoice-container">
                <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-1">Vendor Statement</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accounts Payable Ledger</p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Total Billed</p>
                      <p className="text-lg font-black text-gray-800">{totalBilled.toFixed(2)} AED</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <p className="text-xs text-emerald-600 font-black uppercase tracking-widest">Paid Amount</p>
                      <p className="text-lg font-black text-emerald-700">{totalPaid.toFixed(2)} AED</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                      <p className="text-xs text-red-500 font-black uppercase tracking-widest">Outstanding Payable</p>
                      <p className="text-xl font-black text-red-600">{totalPayable.toFixed(2)} AED</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mb-8">
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
                        <option value="UNPAID">Unpaid & Partial Only</option>
                        <option value="PAID_LATEST">Latest Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="px-4 py-4 no-print w-10">
                        <input
                          type="checkbox"
                          checked={displayedInvoices.length > 0 && selectedVendorInvoiceIds.length === displayedInvoices.length}
                          onChange={handleSelectAllVendors}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase">Invoice No</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase">From</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase">To</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase">Date & Aging</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-right">Vendor Cost</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-right">Paid Amount</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-right">Balance Due</th>
                      <th className="px-4 py-4 text-[10px] font-black uppercase text-center">Status / Payment Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 border-b border-gray-100">
                    {displayedInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-20 text-gray-400 font-medium">No records found for this selection.</td>
                      </tr>
                    ) : (
                      displayedInvoices.map(inv => {
                        const paid = inv.vendorStatus === 'PAID' ? inv.vendorCost : (inv.vendorStatus === 'PARTIAL' ? (inv.vendorPaidAmount || 0) : 0);
                        const balance = inv.vendorStatus === 'PAID' ? 0 : (inv.vendorStatus === 'PARTIAL' ? Math.max(0, inv.vendorCost - (inv.vendorPaidAmount || 0)) : inv.vendorCost);
                        const statusColor = inv.vendorStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300'
                          : inv.vendorStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300';

                        return (
                          <tr 
                            key={inv.id}
                            className={`${selectedVendorInvoiceIds.length > 0 && !selectedVendorInvoiceIds.includes(inv.id) ? 'no-print opacity-40' : ''} hover:bg-gray-50 transition-colors`}
                          >
                            <td className="px-4 py-5 no-print">
                              <input
                                type="checkbox"
                                checked={selectedVendorInvoiceIds.includes(inv.id)}
                                onChange={() => toggleVendorInvoiceSelection(inv.id)}
                                className="w-4 h-4 accent-orange-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-5 font-bold text-gray-900">
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
                            <td className="px-4 py-5">
                              <span className="text-[10px] font-black px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100 uppercase">
                                {inv.items[0]?.coo || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-5">
                              <span className="text-[10px] font-black px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                                {inv.destinationCountry}
                              </span>
                            </td>
                            <td className="px-4 py-5 text-gray-600 text-sm">
                              <div className="font-bold text-gray-800">{new Date(inv.date).toLocaleDateString()}</div>
                              <div className="text-[11px] font-medium text-orange-600 mt-0.5 whitespace-nowrap">
                                {getInvoiceAging(inv.date, inv.vendorStatus === 'PAID', inv.vendorPaymentDate)}
                              </div>
                            </td>
                            <td className="px-4 py-5 text-right font-black text-gray-900">{inv.vendorCost.toFixed(2)} AED</td>
                            <td className="px-4 py-5 text-right font-bold text-emerald-600">{paid.toFixed(2)} AED</td>
                            <td className="px-4 py-5 text-right font-black text-red-600">{balance.toFixed(2)} AED</td>
                            <td className="px-4 py-5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={() => openVendorPaymentModal(inv)}
                                  className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 no-print border w-fit shadow-sm ${statusColor}`}
                                  title="Click to update vendor payment amount, date & ref"
                                >
                                  {inv.vendorStatus || 'UNPAID'} ✏️
                                </button>
                                <span className={`print-only text-[10px] font-black px-3 py-1.5 rounded-full border ${statusColor}`}>
                                  {inv.vendorStatus || 'UNPAID'}
                                </span>
                                {inv.vendorPaymentDate && (
                                  <div className="text-[10px] text-gray-500 font-bold space-y-0.5">
                                    <div className="underline decoration-dashed">
                                      📅 {new Date(inv.vendorPaymentDate).toLocaleDateString()}
                                    </div>
                                    {inv.vendorTransactionReference && (
                                      <div className="text-blue-600">
                                        🔖 {inv.vendorTransactionReference}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-4 py-5 text-right text-xs font-black text-gray-500 uppercase">
                        Summary Totals
                      </td>
                      <td className="px-4 py-5 text-right font-black text-base text-gray-900">
                        {totalBilled.toFixed(2)} AED
                      </td>
                      <td className="px-4 py-5 text-right font-black text-base text-emerald-600">
                        {totalPaid.toFixed(2)} AED
                      </td>
                      <td className="px-4 py-5 text-right font-black text-base text-red-600">
                        {totalPayable.toFixed(2)} AED
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Vendor Payment Edit Modal */}
              {vendorPaymentModalInvoice && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
                  <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-6">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">Update Vendor Payment</h3>
                        <p className="text-xs text-gray-500 font-bold mt-0.5">
                          Invoice #{vendorPaymentModalInvoice.invoiceNumber} • Vendor: {vendorPaymentModalInvoice.vendorName || selectedVendor.name}
                        </p>
                      </div>
                      <button
                        onClick={() => setVendorPaymentModalInvoice(null)}
                        className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Vendor Freight Bill</span>
                      <span className="text-lg font-black text-gray-900">{vendorPaymentModalInvoice.vendorCost.toFixed(2)} AED</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">Select Payment Status</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setModalVendorStatus('UNPAID');
                              setModalVendorPaidAmount(0);
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all ${
                              modalVendorStatus === 'UNPAID'
                                ? 'bg-red-500 text-white border-red-600 shadow-md'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            🔴 UNPAID
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalVendorStatus('PARTIAL');
                              if (modalVendorPaidAmount === 0 || modalVendorPaidAmount >= vendorPaymentModalInvoice.vendorCost) {
                                setModalVendorPaidAmount(Math.round(vendorPaymentModalInvoice.vendorCost / 2));
                              }
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all ${
                              modalVendorStatus === 'PARTIAL'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            🟡 PARTIAL
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setModalVendorStatus('PAID');
                              setModalVendorPaidAmount(vendorPaymentModalInvoice.vendorCost);
                            }}
                            className={`py-2.5 px-3 rounded-xl text-xs font-black border transition-all ${
                              modalVendorStatus === 'PAID'
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            🟢 FULLY PAID
                          </button>
                        </div>
                      </div>

                      {modalVendorStatus === 'PARTIAL' && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3 animate-in fade-in">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-amber-900 uppercase tracking-wider">Paid Amount (AED)</label>
                            <span className="text-xs font-black text-amber-700">
                              Remaining: {Math.max(0, vendorPaymentModalInvoice.vendorCost - modalVendorPaidAmount).toFixed(2)} AED
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={vendorPaymentModalInvoice.vendorCost}
                            step="any"
                            value={modalVendorPaidAmount}
                            onChange={(e) => setModalVendorPaidAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2.5 rounded-lg border border-amber-300 bg-white text-gray-900 font-black text-base outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter amount paid"
                          />
                        </div>
                      )}

                      {modalVendorStatus !== 'UNPAID' && (
                        <>
                          <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Payment Date</label>
                            <input
                              type="date"
                              value={modalVendorPaymentDate}
                              onChange={(e) => setModalVendorPaymentDate(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Payment Reference / Cheque # / Bank Ref</label>
                            <input
                              type="text"
                              value={modalVendorPaymentRef}
                              onChange={(e) => setModalVendorPaymentRef(e.target.value)}
                              placeholder="e.g. Cheque #49281, Bank Transfer Ref #92819"
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await handleUpdateVendorStatus(
                            vendorPaymentModalInvoice.id,
                            modalVendorStatus,
                            modalVendorStatus !== 'UNPAID' ? modalVendorPaymentDate : undefined,
                            modalVendorStatus !== 'UNPAID' ? modalVendorPaymentRef : undefined,
                            modalVendorStatus === 'PAID' 
                              ? vendorPaymentModalInvoice.vendorCost 
                              : (modalVendorStatus === 'PARTIAL' ? modalVendorPaidAmount : 0)
                          );
                          setVendorPaymentModalInvoice(null);
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-xl transition-all shadow-lg text-sm"
                      >
                        Save Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setVendorPaymentModalInvoice(null)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                    const payable = invoices.filter(inv => inv.vendorId === v.id).reduce((s, i) => s + (i.vendorStatus === 'PAID' ? 0 : (i.vendorStatus === 'PARTIAL' ? Math.max(0, i.vendorCost - (i.vendorPaidAmount || 0)) : i.vendorCost)), 0);
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
            quotations={quotations}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUser={handleUpdateUser}
            currentUser={currentUser}
            onDataRestored={handleDataRestored}
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
        currentUser={currentUser}
      />

      <main className={`lg:pl-64 min-h-screen bg-gray-50 ${activeTab === 'view-invoice' ? 'bg-white' : ''}`}>
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-10 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-44 sm:w-72 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                placeholder={`Search in ${activeTab.replace('-', ' ')}...`}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-5">
            <div className="relative cursor-pointer text-gray-500 hover:text-orange-600 p-1.5">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex items-center gap-2.5 lg:pl-5 lg:border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-xs font-bold text-gray-900 leading-none">{currentUser.name}</p>
                  <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
                    currentUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                    currentUser.role === 'MANAGER' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    currentUser.role === 'ACCOUNTANT' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[9px] text-orange-600 font-bold mt-0.5 uppercase">{companyInfo.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
              <UserCircle size={28} className="text-gray-300" />
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-6 max-w-full">
          {renderContent()}
        </div>
      </main>

      {/* Quick Carrier & AWB Assignment Modal */}
      {carrierModalInvoice && (
        <CarrierAwbModal
          invoice={carrierModalInvoice}
          currentUser={currentUser}
          onClose={() => setCarrierModalInvoice(null)}
          onSave={handleQuickUpdateCarrier}
        />
      )}
    </div>
  );
};

export default App;
