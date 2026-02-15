
import React, { useState } from 'react';
import { 
  PieChart, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Printer, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { Invoice, Customer, Vendor } from '../types';
import { formatCurrency } from '../utils';

interface FinancialReportsProps {
  invoices: Invoice[];
  customers: Customer[];
  vendors: Vendor[];
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ invoices, customers, vendors }) => {
  const [reportType, setReportType] = useState<'RECEIVABLES' | 'PAYABLES'>('RECEIVABLES');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  const receivables = invoices.filter(inv => inv.status !== 'PAID');
  const payables = invoices.filter(inv => inv.vendorId && inv.vendorStatus !== 'PAID');

  const filteredItems = reportType === 'RECEIVABLES' 
    ? (selectedEntity === 'all' ? receivables : receivables.filter(r => r.customerId === selectedEntity))
    : (selectedEntity === 'all' ? payables : payables.filter(p => p.vendorId === selectedEntity));

  const totalFiltered = filteredItems.reduce((sum, item) => 
    sum + (reportType === 'RECEIVABLES' ? item.totalAmount : item.vendorCost), 0
  );

  const printReport = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <PieChart className="text-orange-500" />
            Financial Reporting
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage your cash flow and individual account statements</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={printReport}
            className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm"
          >
            <Printer size={18} /> Print Report
          </button>
          <button 
            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 flex items-center gap-2 transition-all shadow-md"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Report Type</h3>
            <div className="space-y-2">
              <button 
                onClick={() => { setReportType('RECEIVABLES'); setSelectedEntity('all'); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold transition-all ${
                  reportType === 'RECEIVABLES' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={18} /> Receivables
                </div>
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => { setReportType('PAYABLES'); setSelectedEntity('all'); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold transition-all ${
                  reportType === 'PAYABLES' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowDownLeft size={18} /> Payables
                </div>
                <ChevronRight size={16} />
              </button>
            </div>

            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-8 mb-4">Filter Account</h3>
            <select 
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer shadow-sm"
            >
              <option value="all" className="bg-white">All Accounts</option>
              {reportType === 'RECEIVABLES' 
                ? customers.map(c => <option key={c.id} value={c.id} className="bg-white">{c.name}</option>)
                : vendors.map(v => <option key={v.id} value={v.id} className="bg-white">{v.name}</option>)
              }
            </select>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl text-white">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Statement Balance</h3>
            <p className="text-3xl font-black text-white">{formatCurrency(totalFiltered)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              <Filter size={14} /> {filteredItems.length} Pending Records
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-gray-800 uppercase tracking-tighter">
                {reportType === 'RECEIVABLES' ? 'Client Aging Statement' : 'Vendor Payable Ledger'}
              </h3>
              <span className="text-[10px] font-black text-gray-400 tracking-widest">REAL-TIME DATA</span>
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <PieChart className="mx-auto text-gray-200" size={48} />
                <p className="text-gray-500 font-medium">No pending transactions found.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Transaction</th>
                    <th className="px-6 py-4">Entity</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Days Open</th>
                    <th className="px-6 py-4 text-right">Amount Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map(item => {
                    const daysOpen = Math.floor((new Date().getTime() - new Date(item.date).getTime()) / (1000 * 3600 * 24));
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900">{item.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">{item.destinationCountry}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-800">
                            {reportType === 'RECEIVABLES' ? item.customerName : item.vendorName}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-500">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                            daysOpen > 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {daysOpen} Days
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-orange-600">
                          {formatCurrency(reportType === 'RECEIVABLES' ? item.totalAmount : item.vendorCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
