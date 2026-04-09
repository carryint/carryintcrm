
import React, { useState } from 'react';
import { 
  PieChart, 
  Download, 
  Printer, 
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock
} from 'lucide-react';
import { Invoice, Customer, Vendor, CompanyInfo } from '../types';
import { formatCurrency } from '../utils';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinancialReportsProps {
  invoices: Invoice[];
  customers: Customer[];
  vendors: Vendor[];
  companyInfo: CompanyInfo;
}

type TimeRangeType = 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

const FinancialReports: React.FC<FinancialReportsProps> = ({ invoices, customers, vendors, companyInfo }) => {
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredItems = invoices.filter(item => {
    // Entity filter (Check both customer and vendor IDs since we're unified)
    const entityMatch = selectedEntity === 'all' || 
      item.customerId === selectedEntity || 
      item.vendorId === selectedEntity;
    
    if (!entityMatch) return false;

    // Time filter
    if (timeRange === 'ALL') return true;

    const itemDate = new Date(item.date);
    const filterDate = new Date(selectedDate);

    if (timeRange === 'DAILY') {
      return itemDate.toDateString() === filterDate.toDateString();
    } else if (timeRange === 'MONTHLY') {
      return itemDate.getMonth() === filterDate.getMonth() && 
             itemDate.getFullYear() === filterDate.getFullYear();
    } else if (timeRange === 'YEARLY') {
      return itemDate.getFullYear() === filterDate.getFullYear();
    } else if (timeRange === 'CUSTOM') {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }

    return true;
  });

  const totals = filteredItems.reduce((acc, item) => {
    // Received: Sales Price where status is PAID
    if (item.status === 'PAID') {
      acc.received += item.totalAmount;
    } else {
      acc.notReceived += item.totalAmount;
    }

    // Paid: Vendor Price where vendorStatus is PAID
    if (item.vendorId) {
      if (item.vendorStatus === 'PAID') {
        acc.paidToVendor += item.vendorCost;
      } else {
        acc.notPaidToVendor += item.vendorCost;
      }
    }

    return acc;
  }, { received: 0, notReceived: 0, paidToVendor: 0, notPaidToVendor: 0 });

  const handleExportExcel = () => {
    const data = filteredItems.map(item => ({
      'Invoice No': item.invoiceNumber,
      'Date': new Date(item.date).toLocaleDateString(),
      'Customer': item.customerName,
      'Vendor': item.vendorName || '-',
      'Received': item.status === 'PAID' ? item.totalAmount : 0,
      'Not Received': item.status !== 'PAID' ? item.totalAmount : 0,
      'Paid (Exp)': item.vendorStatus === 'PAID' ? item.vendorCost : 0,
      'Not Paid (Exp)': item.vendorStatus !== 'PAID' ? item.vendorCost : 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Unified Ledger');
    
    const wscols = [
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `CarryInt_Unified_Report_${timeRange}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22); 
    doc.text(`Unified Financial Ledger`, 14, 22);
    
    const rangeText = timeRange === 'CUSTOM' ? `${selectedDate} to ${endDate}` : selectedDate;
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Filter: ${timeRange} (${rangeText})`, 14, 35);
    
    // Summary Grid in PDF
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Received: ${formatCurrency(totals.received)}`, 14, 45);
    doc.text(`Not Received: ${formatCurrency(totals.notReceived)}`, 80, 45);
    doc.text(`Paid: ${formatCurrency(totals.paidToVendor)}`, 146, 45);
    doc.text(`Not Paid: ${formatCurrency(totals.notPaidToVendor)}`, 212, 45);

    const tableData = filteredItems.map(item => [
      item.invoiceNumber,
      new Date(item.date).toLocaleDateString(),
      item.customerName,
      item.vendorName || '-',
      item.status === 'PAID' ? item.totalAmount.toFixed(2) : '0.00',
      item.status !== 'PAID' ? item.totalAmount.toFixed(2) : '0.00',
      item.vendorStatus === 'PAID' ? item.vendorCost.toFixed(2) : '0.00',
      item.vendorStatus !== 'PAID' ? item.vendorCost.toFixed(2) : '0.00',
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Inv No', 'Date', 'Customer', 'Vendor', 'Received', 'Not Rec', 'Paid', 'Not Paid']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      columnStyles: {
        4: { fontStyle: 'bold', textColor: [22, 163, 74] }, // Green Received
        5: { fontStyle: 'bold', textColor: [220, 38, 38] }, // Red Not Received
        6: { fontStyle: 'bold', textColor: [22, 163, 74] }, 
        7: { fontStyle: 'bold', textColor: [220, 38, 38] },
      }
    });

    doc.save(`CarryInt_Unified_Financial_Report.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Layers className="text-orange-500" />
            Unified Transaction Ledger
          </h2>
          <p className="text-sm text-gray-500 mt-1">Single view for all receivables and payables</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-2 transition-all shadow-sm"
          >
            <Printer size={18} /> Print
          </button>
          <button 
            onClick={handleExportExcel}
            className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-green-700 font-bold hover:bg-green-50 flex items-center gap-2 transition-all shadow-sm"
          >
            <FileSpreadsheet size={18} /> Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2 transition-all shadow-md"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4 no-print">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Account Selection</h3>
            <select 
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer shadow-sm"
            >
              <option value="all" className="bg-white">All Accounts</option>
              <optgroup label="Customers">
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
              <optgroup label="Vendors">
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </optgroup>
            </select>

            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-8 mb-4">Time Range</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['ALL', 'DAILY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as TimeRangeType[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`text-[10px] font-black py-2 rounded-lg border transition-all ${
                    timeRange === range 
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-100' 
                      : 'bg-white text-gray-500 border-gray-100 hover:border-orange-500'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {timeRange !== 'ALL' && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                  {timeRange === 'DAILY' ? 'Select Date' : timeRange === 'MONTHLY' ? 'Select Month' : timeRange === 'YEARLY' ? 'Select Year' : 'Select Range'}
                </label>
                {timeRange === 'YEARLY' ? (
                  <select
                    value={selectedDate.split('-')[0]}
                    onChange={(e) => setSelectedDate(`${e.target.value}-01-01`)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold"
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                ) : timeRange === 'CUSTOM' ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex-1 px-2 py-2 rounded-lg border border-gray-200 text-xs font-bold"
                    />
                    <span className="text-gray-400 text-xs font-bold">TO</span>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 px-2 py-2 rounded-lg border border-gray-200 text-xs font-bold"
                    />
                  </div>
                ) : (
                  <input 
                    type={timeRange === 'DAILY' ? 'date' : 'month'}
                    value={timeRange === 'DAILY' ? selectedDate : selectedDate.substring(0, 7)}
                    onChange={(e) => setSelectedDate(e.target.value + (timeRange === 'MONTHLY' ? '-01' : ''))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold"
                  />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-green-600 uppercase">Received</p>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <p className="text-lg font-black text-slate-900">{formatCurrency(totals.received)}</p>
            </div>
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-red-600 uppercase">Not Received</p>
                <Clock size={14} className="text-red-500" />
              </div>
              <p className="text-lg font-black text-slate-900">{formatCurrency(totals.notReceived)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-blue-600 uppercase">Paid (Vendor)</p>
                <Wallet size={14} className="text-blue-500" />
              </div>
              <p className="text-lg font-black text-slate-900">{formatCurrency(totals.paidToVendor)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-amber-600 uppercase">Not Paid</p>
                <TrendingDown size={14} className="text-amber-500" />
              </div>
              <p className="text-lg font-black text-slate-900">{formatCurrency(totals.notPaidToVendor)}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-2">
                <PieChart className="text-gray-400" size={18} />
                <h3 className="font-black text-gray-800 uppercase tracking-tighter">Transaction Ledger</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase tracking-widest">
                  {timeRange}
                </span>
                <span className="text-[10px] font-black text-gray-400 tracking-widest">REAL-TIME DATA</span>
              </div>
            </div>
            
            {filteredItems.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Layers className="mx-auto text-gray-200" size={48} />
                <p className="text-gray-500 font-medium">No transactions found for the selected criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 border-b">Transaction</th>
                      <th className="px-6 py-4 border-b">Date</th>
                      <th className="px-6 py-4 border-b">Customer</th>
                      <th className="px-6 py-4 border-b">Vendor</th>
                      <th className="px-6 py-4 border-b text-right bg-green-50/30 text-green-700">Received</th>
                      <th className="px-6 py-4 border-b text-right bg-red-50/30 text-red-700">Not Rec.</th>
                      <th className="px-6 py-4 border-b text-right bg-blue-50/30 text-blue-700">Paid</th>
                      <th className="px-6 py-4 border-b text-right bg-amber-50/30 text-amber-700">Not Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map(item => {
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-gray-900 tracking-tight">{item.invoiceNumber}</td>
                          <td className="px-6 py-4 text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-bold text-gray-700 text-xs">{item.customerName}</td>
                          <td className="px-6 py-4 text-xs text-gray-500 italic">{item.vendorName || '-'}</td>
                          
                          {/* Received */}
                          <td className="px-6 py-4 text-right">
                            {item.status === 'PAID' ? (
                              <span className="font-black text-green-600">{formatCurrency(item.totalAmount)}</span>
                            ) : '-'}
                          </td>
                          
                          {/* Not Received */}
                          <td className="px-6 py-4 text-right">
                            {item.status !== 'PAID' ? (
                              <span className="font-black text-red-600">{formatCurrency(item.totalAmount)}</span>
                            ) : '-'}
                          </td>

                          {/* Paid (to vendor) */}
                          <td className="px-6 py-4 text-right">
                            {item.vendorId && item.vendorStatus === 'PAID' ? (
                              <span className="font-black text-blue-600">{formatCurrency(item.vendorCost)}</span>
                            ) : '-'}
                          </td>

                          {/* Not Paid (to vendor) */}
                          <td className="px-6 py-4 text-right">
                            {item.vendorId && item.vendorStatus !== 'PAID' ? (
                              <span className="font-black text-amber-600">{formatCurrency(item.vendorCost)}</span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
