
import React from 'react';
import { Invoice, CompanyInfo } from '../types';
import { formatCurrency, numberToWords } from '../utils';
import { COUNTRY_SHORT_NAMES } from '../constants';
import Logo from './Logo';

interface InvoicePreviewProps {
  invoice: Invoice;
  companyInfo: CompanyInfo;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, companyInfo }) => {
  const displayTrn = invoice.companyTrn || companyInfo.trn;

  const getCountryDisplay = (name: string) => {
    return COUNTRY_SHORT_NAMES[name] || name;
  };

  return (
    <div className="bg-white p-6 max-w-4xl mx-auto shadow-2xl border border-gray-200 my-4 invoice-container">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 border-b-2 border-orange-500 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Tax Invoice</h1>
          <p className="text-xs font-bold text-orange-600">TRN: {displayTrn}</p>
        </div>
        <div className="text-right">
          <Logo src={companyInfo.logoUrl} className="h-14 mb-1 ml-auto" />
          <p className="font-black text-base text-gray-800">{companyInfo.name}</p>
          <p className="text-[10px] text-gray-600 max-w-xs ml-auto leading-tight">{companyInfo.address}</p>
          <p className="text-[10px] text-gray-600">Tel: {companyInfo.contact}</p>
          <p className="text-[10px] text-gray-600">Email: {companyInfo.email}</p>
          <p className="text-[10px] text-gray-600 font-bold">{companyInfo.website}</p>
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <h4 className="text-[10px] font-black text-orange-600 uppercase mb-0.5">Billed To</h4>
          <p className="font-bold text-sm text-gray-900">{invoice.customerName}</p>
          <p className="text-[10px] text-gray-600 leading-tight">{invoice.customerAddress}</p>
          <p className="text-[10px] text-gray-600 font-medium mt-0.5">Contact: {invoice.customerContact}</p>
          {invoice.customerEmail && <p className="text-[10px] text-gray-600">{invoice.customerEmail}</p>}
          {invoice.customerVat && <p className="text-[10px] font-bold text-gray-800 mt-0.5">VAT ID: {invoice.customerVat}</p>}
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-0.5">
          <div className="flex justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Invoice No</span>
            <span className="text-[10px] font-black text-gray-900">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Date</span>
            <span className="text-[10px] font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Origin (COO)</span>
            <span className="text-[10px] font-bold text-gray-900 uppercase">
              {invoice.items[0]?.coo ? getCountryDisplay(invoice.items[0].coo) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Destination</span>
            <span className="text-[10px] font-bold text-orange-600 uppercase">
              {getCountryDisplay(invoice.destinationCountry)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-700 border-b border-gray-100">
              <th className="py-2 px-4 text-[10px] font-black uppercase tracking-wider">Item Details</th>
              <th className="py-2 px-4 text-[10px] font-black uppercase tracking-wider text-center">COO</th>
              <th className="py-2 px-4 text-[10px] font-black uppercase tracking-wider text-center">Weight</th>
              <th className="py-2 px-4 text-[10px] font-black uppercase tracking-wider text-center">CBM</th>
              <th className="py-2 px-4 text-[10px] font-black uppercase tracking-wider text-center">Qty</th>
              <th className="py-2 px-4 text-[10px] font-black uppercase tracking-wider text-right">Price</th>
              <th className="py-2 px-4 text-[10px] font-black uppercase tracking-wider text-right">VAT</th>
              <th className="py-2 px-4 text-[10px] font-black uppercase tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-b border-gray-100">
            {invoice.items.map((item, i) => {
              const lineTotal = item.price;  // Price is the line total — not multiplied by qty
              const lineVat = lineTotal * (item.vatPercent / 100);
              return (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-4">
                    <p className="font-bold text-xs text-gray-900">{item.commodityType}</p>
                    <p className="text-[10px] text-gray-500">{item.description}</p>
                  </td>
                  <td className="py-2 px-4 text-center text-xs font-medium text-gray-600 uppercase">
                    {item.isAdditionalCharge ? '-' : getCountryDisplay(item.coo)}
                  </td>
                  <td className="py-2 px-4 text-center text-xs font-medium text-gray-600">
                    {item.isAdditionalCharge ? '-' : `${item.weight} kg`}
                  </td>
                  <td className="py-2 px-4 text-center text-xs font-medium text-gray-600">
                    {item.isAdditionalCharge ? '-' : (item.cbm !== undefined && item.cbm !== null ? `${item.cbm} CBM` : '-')}
                  </td>
                  <td className="py-2 px-4 text-center text-xs font-medium text-gray-600">
                    {item.isAdditionalCharge ? '-' : item.quantity}
                  </td>
                  <td className="py-2 px-4 text-right text-xs font-medium text-gray-600 text-nowrap">{item.price.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right text-xs font-medium text-gray-600 text-nowrap">{lineVat.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right text-xs font-black text-gray-900 text-nowrap">{(lineTotal + lineVat).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-2">
            <h4 className="text-[10px] font-black text-gray-500 uppercase mb-0.5">Amount in Words</h4>
            <p className="text-[10px] font-bold text-gray-900 leading-snug italic uppercase">
              AED {numberToWords(Math.round(invoice.totalAmount))} ONLY
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-0.5">Bank Transfer Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              <div>
                <p className="text-gray-500">Account Holder</p>
                <p className="font-bold text-gray-900 text-[10px]">{companyInfo.bank.name}</p>
              </div>
              <div>
                <p className="text-gray-500">CIF</p>
                <p className="font-bold text-gray-900 text-[10px]">{companyInfo.bank.cif}</p>
              </div>
              <div>
                <p className="text-gray-500">Account Number</p>
                <p className="font-bold text-gray-900 text-[10px]">{companyInfo.bank.accNo}</p>
              </div>
              <div>
                <p className="text-gray-500">IBAN</p>
                <p className="font-bold text-gray-900 text-[10px]">{companyInfo.bank.iban}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-60 space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-bold text-gray-900">{formatCurrency(invoice.netAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-500 font-medium">VAT ({invoice.items.length > 0 ? invoice.items[0].vatPercent : 0}%)</span>
            <span className="font-bold text-gray-900">{formatCurrency(invoice.totalVat)}</span>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-gray-900 font-black text-sm">TOTAL</span>
            <span className="text-orange-600 font-black text-lg">{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-end">
        <div className="text-[10px] text-gray-400 max-w-xs">
          <p className="font-bold text-gray-500 mb-0.5">Notes & Terms:</p>
          <p>Please pay within 30 days. Make all cheques payable to {companyInfo.bank.name}. Late payments may incur service charges.</p>
        </div>
        <div className="text-center w-36">
          <div className="h-10 border-b border-dashed border-gray-300 mb-1"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
