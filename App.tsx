
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import CustomerManagement from './components/CustomerManagement';
import FinancialReports from './components/FinancialReports';
import Settings from './components/Settings';
import { Customer, Vendor, Invoice, CompanyInfo } from './types';
import { COMPANY_INFO as DEFAULT_COMPANY_INFO } from './constants';
import { Bell, Search, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO as any);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load initial data
  useEffect(() => {
    const savedCustomers = localStorage.getItem('carryint_customers');
    const savedVendors = localStorage.getItem('carryint_vendors');
    const savedInvoices = localStorage.getItem('carryint_invoices');
    const savedCompanyInfo = localStorage.getItem('carryint_company_info');

    if (savedCompanyInfo) {
      setCompanyInfo(JSON.parse(savedCompanyInfo));
    } else {
      const initial = { ...DEFAULT_COMPANY_INFO, trn: '100456209800003' };
      setCompanyInfo(initial as any);
      localStorage.setItem('carryint_company_info', JSON.stringify(initial));
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
  }, []);

  const handleSaveInvoice = (invoice: Invoice) => {
    const updatedInvoices = [...invoices, invoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));
    setSelectedInvoice(invoice);
    setActiveTab('view-invoice');
  };

  const handleAddCustomer = (customer: Customer) => {
    const updated = [...customers, customer];
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
  };

  const handleUpdateCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
    localStorage.setItem('carryint_company_info', JSON.stringify(info));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard invoices={invoices} />;
      case 'create-invoice':
        return <InvoiceForm onSave={handleSaveInvoice} customers={customers} vendors={vendors} companyInfo={companyInfo} />;
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
                        <button 
                          onClick={() => { setSelectedInvoice(inv); setActiveTab('view-invoice'); }}
                          className="text-orange-600 font-bold hover:underline"
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
        );
      case 'customers':
        return <CustomerManagement customers={customers} invoices={invoices} onAdd={handleAddCustomer} />;
      case 'reports':
        return <FinancialReports invoices={invoices} customers={customers} vendors={vendors} />;
      case 'vendors':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Vendor Management</h3>
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold">Add Vendor</button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-black text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Vendor Name</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Address</th>
                  <th className="px-6 py-4 text-right">Total Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map(v => {
                  const payable = invoices.filter(inv => inv.vendorId === v.id && inv.vendorStatus !== 'PAID').reduce((s, i) => s + i.vendorCost, 0);
                  return (
                    <tr key={v.id}>
                      <td className="px-6 py-4 font-bold">{v.name}</td>
                      <td className="px-6 py-4 text-gray-600">{v.contact}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{v.address}</td>
                      <td className="px-6 py-4 text-right font-black text-red-600">{payable.toFixed(2)} AED</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        );
      case 'settings':
        return (
          <Settings 
            companyInfo={companyInfo} 
            onUpdate={handleUpdateCompanyInfo}
            invoices={invoices}
            customers={customers}
            vendors={vendors}
          />
        );
      default:
        return <Dashboard invoices={invoices} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className={`pl-64 min-h-screen bg-gray-50 ${activeTab === 'view-invoice' ? 'bg-white' : ''}`}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 no-print">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              placeholder="Search anything..." 
              className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer text-gray-500 hover:text-orange-600">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 leading-none">Admin Staff</p>
                <p className="text-[10px] text-orange-600 font-bold mt-1 uppercase">{companyInfo.name}</p>
              </div>
              <UserCircle size={32} className="text-gray-300" />
            </div>
          </div>
        </header>

        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
