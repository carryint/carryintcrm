import React from 'react';
import { Invoice, CompanyInfo } from '../types';
import { formatCurrency, numberToWords } from '../utils';
import Logo from './Logo';
import { CheckCircle2 } from 'lucide-react';

interface PaymentReceiptProps {
  invoice: Invoice;
  companyInfo: CompanyInfo;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ invoice, companyInfo }) => {
  const displayTrn = invoice.companyTrn || companyInfo.trn;
  const receiptDate = new Date().toLocaleDateString();
  const paymentDate = invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : receiptDate;

  return (
    <div className="bg-white p-3.5 sm:p-6 sm:p-8 max-w-4xl mx-auto shadow-xl border border-gray-200 my-2 sm:my-4 receipt-container relative overflow-hidden rounded-xl sm:rounded-none">
      {/* Watermark/Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
        <CheckCircle2 size={350} className="text-green-600" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row print-flex-row justify-between items-start sm:items-end gap-3 mb-6 border-b-2 border-green-600 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <CheckCircle2 size={26} className="text-green-600" />
             <h1 className="text-2xl sm:text-4xl font-black text-gray-900 uppercase tracking-tighter">Payment Receipt</h1>
          </div>
          <p className="text-xs font-bold text-green-700">Official Acknowledgment of Funds Received</p>
          <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">TRN: {displayTrn}</p>
        </div>
        <div className="sm:text-right print-text-right text-left w-full sm:w-auto print-w-auto flex flex-col items-start sm:items-end print-items-end">
          <Logo src={companyInfo.logoUrl} className="h-10 sm:h-14 print-h-14 mb-1 sm:ml-auto print-ml-auto" />
          <p className="font-black text-sm sm:text-base text-gray-800">{companyInfo.name}</p>
          <p className="text-[10px] text-gray-600 max-w-xs sm:ml-auto print-ml-auto leading-tight">{companyInfo.address}</p>
          <p className="text-[10px] text-gray-600">Tel: {companyInfo.contact} | Email: {companyInfo.email}</p>
          <p className="text-[10px] text-gray-600 font-bold">{companyInfo.website}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 print-grid-2 gap-4 sm:gap-8 mb-6 relative z-10">
        <div className="space-y-3">
          <div>
            <h4 className="text-[10px] font-black text-green-700 uppercase mb-1 tracking-widest">Received From</h4>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
              <p className="font-bold text-base sm:text-lg text-gray-900">{invoice.customerName}</p>
              <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{invoice.customerAddress}</p>
              <p className="text-xs text-gray-600 font-medium mt-1">Contact: {invoice.customerContact}</p>
              {invoice.customerVat && <p className="text-xs font-bold text-gray-800 mt-1">TRN: {invoice.customerVat}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
             <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Payment Method</h4>
                <p className="font-bold text-xs text-gray-900">{invoice.paymentMethod || 'Cash / Bank Transfer'}</p>
             </div>
             <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Payment Date</h4>
                <p className="font-bold text-xs text-gray-900">{paymentDate}</p>
             </div>
             {invoice.transactionReference && (
               <div className="col-span-2 pt-1 border-t border-gray-200/60">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Transaction Ref</h4>
                  <p className="font-bold text-xs text-gray-900">{invoice.transactionReference}</p>
               </div>
             )}
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-3">
           <div className="bg-green-50 p-4 sm:p-6 rounded-2xl border-2 border-green-100 text-center">
              <h4 className="text-[10px] font-black text-green-700 uppercase mb-1 tracking-widest">Total Amount Received</h4>
              <p className="text-2xl sm:text-4xl font-black text-green-600">{formatCurrency(invoice.totalAmount)}</p>
              <p className="text-[10px] font-bold text-green-800 mt-1 italic uppercase underline decoration-green-200 decoration-2 underline-offset-4">Full Payment Received</p>
           </div>

           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs">
              <div className="flex justify-between border-b border-gray-200/60 pb-1">
                 <span className="text-[10px] font-bold text-gray-500 uppercase">Receipt No</span>
                 <span className="text-xs font-black text-gray-900">RCP-{invoice.invoiceNumber.split('-')[1] || invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-1">
                 <span className="text-[10px] font-bold text-gray-500 uppercase">Invoice Reference</span>
                 <span className="text-xs font-black text-gray-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                 <span className="text-[10px] font-bold text-gray-500 uppercase">Date of Issue</span>
                 <span className="text-xs font-bold text-gray-900">{receiptDate}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 mb-6 relative z-10">
        <h4 className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Amount in Words</h4>
        <p className="text-xs font-black text-gray-900 leading-snug italic uppercase">
          AED {numberToWords(Math.round(invoice.totalAmount))} ONLY
        </p>
      </div>

      {/* Footer / Confirmation */}
      <div className="flex flex-col sm:flex-row print-flex-row justify-between items-start sm:items-end border-t border-gray-100 pt-4 sm:pt-6 relative z-10 gap-4">
        <div className="text-[10px] text-gray-500 max-w-sm">
          <p className="font-bold text-gray-700 mb-0.5">Note:</p>
          <p>This is a computer-generated receipt and does not require a physical signature for validity. Thank you for your business.</p>
        </div>
        <div className="text-center w-full sm:w-48 print-w-auto">
          <div className="h-10 flex items-center justify-center mb-1">
             <div className="bg-green-100 text-green-700 px-3.5 py-1 rounded-full text-[10px] font-black border border-green-200 shadow-sm">
               ✓ VERIFIED & PAID
             </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Carry International Logistics</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
