
import React, { useState } from 'react';
import { 
  PieChart, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Printer, 
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileText
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

type TimeRangeType = 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY';

const FinancialReports: React.FC<FinancialReportsProps> = ({ invoices, customers, vendors, companyInfo }) => {
  const [reportType, setReportType] = useState<'RECEIVABLES' | 'PAYABLES'>('RECEIVABLES');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const receivables = invoices.filter(inv => inv.status !== 'PAID');
  const payables = invoices.filter(inv => inv.vendorId && inv.vendorStatus !== 'PAID');

  const baseItems = reportType === 'RECEIVABLES' ? receivables : payables;

  const filteredItems = baseItems.filter(item => {
    // Entity filter
    const entityMatch = selectedEntity === 'all' || 
      (reportType === 'RECEIVABLES' ? item.customerId === selectedEntity : item.vendorId === selectedEntity);
    
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
    }

    return true;
  });

  const totalFiltered = filteredItems.reduce((sum, item) => 
    sum + (reportType === 'RECEIVABLES' ? item.totalAmount : item.vendorCost), 0
  );

  const handleExportExcel = () => {
    const data = filteredItems.map(item => ({
      'Invoice No': item.invoiceNumber,
      'Entity': reportType === 'RECEIVABLES' ? item.customerName : item.vendorName,
      'Date': new Date(item.date).toLocaleDateString(),
      'Amount (AED)': reportType === 'RECEIVABLES' ? item.totalAmount : item.vendorCost,
      'Status': reportType === 'RECEIVABLES' ? item.status : item.vendorStatus,
      'Destination': item.destinationCountry
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
    
    // Set column widths
    const wscols = [
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `CarryInt_${reportType}_Report_${timeRange}_${selectedDate}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(249, 115, 22); // Orange-500
    doc.text(`Financial Report: ${reportType}`, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Filter: ${timeRange} (${selectedDate})`, 14, 35);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Total Balance: ${formatCurrency(totalFiltered)}`, 14, 45);

    // Table
    const tableData = filteredItems.map(item => [
      item.invoiceNumber,
      reportType === 'RECEIVABLES' ? item.customerName : item.vendorName,
      new Date(item.date).toLocaleDateString(),
      formatCurrency(reportType === 'RECEIVABLES' ? item.totalAmount : item.vendorCost)
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Transaction', 'Entity', 'Date', 'Amount Due']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 247, 237] }
    });

    doc.save(`CarryInt_${reportType}_Report.pdf`);
  };

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
            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 flex items-center gap-2 transition-all shadow-md"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4 no-print">
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

            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-8 mb-4">Time Range</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['ALL', 'DAILY', 'MONTHLY', 'YEARLY'] as TimeRangeType[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`text-[10px] font-black py-2 rounded-lg border transition-all ${
                    timeRange === range 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-orange-500'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {timeRange !== 'ALL' && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                  {timeRange === 'DAILY' ? 'Select Date' : timeRange === 'MONTHLY' ? 'Select Month' : 'Select Year'}
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
                ) : (
                  <input 
                    type={timeRange === 'DAILY' ? 'date' : 'month'}
                    value={timeRange === 'DAILY' ? selectedDate : selectedDate.substring(0, 7)}
                    onChange={(e) => setSelectedDate(e.target.value + (timeRange === 'MONTHLY' ? '-01' : ''))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                  />
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-xl text-white shadow-xl shadow-slate-200">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Statement Balance</h3>
            <p className="text-3xl font-black text-white">{formatCurrency(totalFiltered)}</p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
              <Filter size={14} /> {filteredItems.length} Transactions Found
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-2">
                <Layers className="text-gray-400" size={18} />
                <h3 className="font-black text-gray-800 uppercase tracking-tighter">
                  {reportType === 'RECEIVABLES' ? 'Client Aging Statement' : 'Vendor Payable Ledger'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase tracking-widest">
                  {timeRange}
                </span>
                <span className="text-[10px] font-black text-gray-400 tracking-widest">REAL-TIME DATA</span>
              </div>
            </div>
            
            <div className="only-print p-8 hidden">
              <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-orange-500">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Financial Statement</h1>
                  <p className="font-bold text-orange-600 uppercase tracking-widest text-sm">{reportType} REPORT</p>
                  <p className="text-gray-500 text-xs mt-2">Filter: {timeRange} - {selectedDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900">{formatCurrency(totalFiltered)}</p>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Available Balance</p>
                </div>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <PieChart className="mx-auto text-gray-200" size={48} />
                <p className="text-gray-500 font-medium">No transactions found for the selected period.</p>
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
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors tracking-tight">{item.invoiceNumber}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">{item.destinationCountry}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-700">
                            {reportType === 'RECEIVABLES' ? item.customerName : item.vendorName}
                          </p>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-500 font-medium">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                            daysOpen > 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {daysOpen} Days
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-orange-600 text-lg">
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
