
import React from 'react';
import { Invoice, CompanyInfo } from '../types';
import { formatCurrency, numberToWords } from '../utils';
import Logo from './Logo';

interface InvoicePreviewProps {
  invoice: Invoice;
  companyInfo: CompanyInfo;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, companyInfo }) => {
  const displayTrn = invoice.companyTrn || companyInfo.trn;

  return (
    <div className="bg-white p-10 max-w-4xl mx-auto shadow-2xl border border-gray-200 my-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-10 border-b-2 border-orange-500 pb-8">
        <div>
          <Logo src={companyInfo.logoUrl} className="h-20 mb-4" />
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Tax Invoice</h1>
          <p className="text-sm font-bold text-orange-600">TRN: {displayTrn}</p>
        </div>
        <div className="text-right">
          <p className="font-black text-xl text-gray-800">{companyInfo.name}</p>
          <p className="text-sm text-gray-600 max-w-xs ml-auto leading-tight">{companyInfo.address}</p>
          <p className="text-sm text-gray-600">Tel: {companyInfo.contact}</p>
          <p className="text-sm text-gray-600">Email: {companyInfo.email}</p>
          <p className="text-sm text-gray-600 font-bold">{companyInfo.website}</p>
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="grid grid-cols-2 gap-10 mb-10">
        <div>
          <h4 className="text-xs font-black text-orange-600 uppercase mb-2">Billed To</h4>
          <p className="font-bold text-lg text-gray-900">{invoice.customerName}</p>
          <p className="text-sm text-gray-600 leading-relaxed">{invoice.customerAddress}</p>
          <p className="text-sm text-gray-600 font-medium mt-1">Contact: {invoice.customerContact}</p>
          {invoice.customerEmail && <p className="text-sm text-gray-600">{invoice.customerEmail}</p>}
          {invoice.customerVat && <p className="text-sm font-bold text-gray-800 mt-1">VAT ID: {invoice.customerVat}</p>}
        </div>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Invoice No</span>
            <span className="text-sm font-black text-gray-900">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Date</span>
            <span className="text-sm font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Destination</span>
            <span className="text-sm font-bold text-orange-600 uppercase">{invoice.destinationCountry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider">Item Details</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">COO</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">Weight</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">Qty</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-right">Price</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-right">VAT (5%)</th>
              <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-b border-gray-200">
            {invoice.items.map((item, i) => {
              const lineTotal = item.price * item.quantity;
              const lineVat = lineTotal * (item.vatPercent / 100);
              return (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-5 px-4">
                    <p className="font-bold text-gray-900">{item.commodityType}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </td>
                  <td className="py-5 px-4 text-center text-sm font-medium text-gray-600 uppercase">{item.coo}</td>
                  <td className="py-5 px-4 text-center text-sm font-medium text-gray-600">{item.weight} kg</td>
                  <td className="py-5 px-4 text-center text-sm font-medium text-gray-600">{item.quantity}</td>
                  <td className="py-5 px-4 text-right text-sm font-medium text-gray-600">{item.price.toFixed(2)}</td>
                  <td className="py-5 px-4 text-right text-sm font-medium text-gray-600">{lineVat.toFixed(2)}</td>
                  <td className="py-5 px-4 text-right text-sm font-black text-gray-900">{(lineTotal + lineVat).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="flex justify-between items-start gap-10">
        <div className="flex-1">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-6">
            <h4 className="text-xs font-black text-gray-500 uppercase mb-2">Amount in Words</h4>
            <p className="text-sm font-bold text-gray-900 leading-relaxed italic uppercase">
              AED {numberToWords(Math.round(invoice.totalAmount))} ONLY
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Bank Transfer Details</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Account Holder</p>
                <p className="font-bold text-gray-900">{companyInfo.bank.name}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">CIF</p>
                <p className="font-bold text-gray-900">{companyInfo.bank.cif}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Account Number</p>
                <p className="font-bold text-gray-900">{companyInfo.bank.accNo}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">IBAN</p>
                <p className="font-bold text-gray-900">{companyInfo.bank.iban}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-72 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-bold text-gray-900">{formatCurrency(invoice.netAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">VAT (5%)</span>
            <span className="font-bold text-gray-900">{formatCurrency(invoice.totalVat)}</span>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-900 font-black text-lg">TOTAL</span>
            <span className="text-orange-600 font-black text-2xl">{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-end">
        <div className="text-xs text-gray-400 max-w-xs">
          <p className="font-bold text-gray-500 mb-1">Notes & Terms:</p>
          <p>Please pay within 30 days. Make all cheques payable to {companyInfo.bank.name}. Late payments may incur service charges.</p>
        </div>
        <div className="text-center w-48">
          <div className="h-20 border-b border-dashed border-gray-300 mb-2"></div>
          <p className="text-xs font-bold text-gray-400 uppercase">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
