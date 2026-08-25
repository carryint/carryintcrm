import React from 'react';
import { Invoice, CompanyInfo, AdjustmentNote } from '../types';
import { formatCurrency, numberToWords, getCarrierTrackingUrl } from '../utils';
import { COUNTRY_SHORT_NAMES, MAJOR_CARRIERS } from '../constants';
import { Truck, ExternalLink, Edit } from 'lucide-react';
import Logo from './Logo';

interface InvoicePreviewProps {
  invoice: Invoice;
  companyInfo: CompanyInfo;
  adjustmentNotes?: AdjustmentNote[];
  onOpenCarrierModal?: (invoice: Invoice) => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, companyInfo, adjustmentNotes = [], onOpenCarrierModal }) => {
  const linkedNotes = adjustmentNotes.filter(n => n.originalInvoiceId === invoice.id);
  const totalCredits = linkedNotes.filter(n => n.type === 'CREDIT').reduce((sum, n) => sum + n.amount, 0);
  const totalDebits = linkedNotes.filter(n => n.type === 'DEBIT').reduce((sum, n) => sum + n.amount, 0);
  const adjustedBalance = invoice.totalAmount + totalDebits - totalCredits;
  const displayTrn = invoice.companyTrn || companyInfo.trn;
  const carrierUrl = getCarrierTrackingUrl(invoice.carrier, invoice.carrierTrackingNumber);

  const getCountryDisplay = (name: string) => {
    return COUNTRY_SHORT_NAMES[name] || name;
  };

  return (
    <div className="bg-white p-3.5 sm:p-6 sm:p-8 max-w-4xl mx-auto shadow-xl border border-gray-200 my-2 sm:my-4 invoice-container rounded-xl sm:rounded-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row print-flex-row justify-between items-start sm:items-end gap-3 mb-4 border-b-2 border-orange-500 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tighter">Tax Invoice</h1>
          <p className="text-xs font-bold text-orange-600">TRN: {displayTrn}</p>
        </div>
        <div className="sm:text-right print-text-right text-left w-full sm:w-auto print-w-auto flex flex-col items-start sm:items-end print-items-end">
          <Logo src={companyInfo.logoUrl} className="h-10 sm:h-14 print-h-14 mb-1 sm:ml-auto print-ml-auto" />
          <p className="font-black text-sm sm:text-base text-gray-800">{companyInfo.name}</p>
          <p className="text-[10px] text-gray-600 max-w-xs sm:ml-auto print-ml-auto leading-tight">{companyInfo.address}</p>
          <p className="text-[10px] text-gray-600">Tel: {companyInfo.contact} | Email: {companyInfo.email}</p>
          <p className="text-[10px] text-gray-600 font-bold">{companyInfo.website}</p>
        </div>
      </div>

      {/* Invoice Meta & Carrier Logistics Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 print-grid-2 gap-3 sm:gap-6 mb-4">
        <div className="bg-gray-50/70 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-gray-100 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-black text-orange-600 uppercase mb-0.5 tracking-wider">Billed To</h4>
            <p className="font-bold text-sm text-gray-900">{invoice.customerName}</p>
            <p className="text-[10px] text-gray-600 leading-tight">{invoice.customerAddress}</p>
            <p className="text-[10px] text-gray-600 font-medium mt-0.5">Contact: {invoice.customerContact}</p>
            {invoice.customerEmail && <p className="text-[10px] text-gray-600">{invoice.customerEmail}</p>}
            {invoice.customerVat && <p className="text-[10px] font-bold text-gray-800 mt-0.5">VAT ID: {invoice.customerVat}</p>}
          </div>

          {/* Master AWB Badge Box */}
          <div className="mt-3 p-2.5 rounded-lg bg-orange-50/80 border border-orange-200 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black text-orange-800 uppercase tracking-widest block">Carryint Master AWB No</span>
              <span className="text-xs font-mono font-black text-slate-900">{invoice.awbNumber || 'CARY-PENDING'}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Status</span>
              <span className="text-[10px] font-black uppercase text-orange-700">{invoice.shipmentStatus || 'BOOKED'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Invoice No</span>
            <span className="text-xs font-black text-gray-900">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Date</span>
            <span className="text-[10px] font-bold text-gray-900">{new Date(invoice.date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Origin (COO)</span>
            <span className="text-[10px] font-bold text-gray-900 uppercase">
              {invoice.items[0]?.coo || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Destination</span>
            <span className="text-[10px] font-bold text-orange-600 uppercase">
              {invoice.destinationCountry}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200/60">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Payment Status</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {invoice.status}
            </span>
          </div>

          {/* Carrier & Carrier Tracking Number info */}
          <div className="mt-1 pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Carrier & AWB</span>
            <div className="text-right">
              {invoice.carrierTrackingNumber ? (
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[10px] font-black text-slate-800">{invoice.carrier || 'Carrier'}:</span>
                  {carrierUrl ? (
                    <a
                      href={carrierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono font-bold text-orange-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      {invoice.carrierTrackingNumber} <ExternalLink size={10} className="no-print" />
                    </a>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-orange-600">{invoice.carrierTrackingNumber}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[10px] text-gray-400 italic">Pending Assignment</span>
                  {onOpenCarrierModal && (
                    <button
                      onClick={() => onOpenCarrierModal(invoice)}
                      className="no-print text-[9px] font-black uppercase text-orange-600 hover:underline flex items-center gap-0.5 ml-1"
                    >
                      <Edit size={10} /> Assign
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Items Table with Full Print Width */}
      <div className="mb-4 overflow-x-auto print-overflow-visible -mx-1 sm:mx-0">
        <table className="w-full text-left border-collapse min-w-[560px] sm:min-w-full">
          <thead>
            <tr className="bg-gray-50 text-gray-700 border-b border-gray-100">
              <th className="py-2 px-3 sm:px-4 text-[10px] font-black uppercase tracking-wider">Item Details</th>
              <th className="py-2 px-2 sm:px-4 text-[10px] font-black uppercase tracking-wider text-center">COO</th>
              <th className="py-2 px-2 sm:px-4 text-[10px] font-black uppercase tracking-wider text-center">Weight</th>
              <th className="py-2 px-2 sm:px-4 text-[10px] font-black uppercase tracking-wider text-center">CBM</th>
              <th className="py-2 px-2 sm:px-4 text-[10px] font-black uppercase tracking-wider text-center">Qty</th>
              <th className="py-2 px-2 sm:px-4 text-[10px] font-black uppercase tracking-wider text-right">Price</th>
              <th className="py-2 px-2 sm:px-4 text-[10px] font-black uppercase tracking-wider text-right">VAT</th>
              <th className="py-2 px-3 sm:px-4 text-[10px] font-black uppercase tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-b border-gray-100 text-xs">
            {invoice.items.map((item, i) => {
              const lineTotal = item.price;
              const lineVat = lineTotal * (item.vatPercent / 100);
              return (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 sm:px-4">
                    <p className="font-bold text-xs text-gray-900">{item.commodityType}</p>
                    <p className="text-[10px] text-gray-500">{item.description}</p>
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center text-xs font-medium text-gray-600 uppercase">
                    {item.isAdditionalCharge ? '-' : getCountryDisplay(item.coo)}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center text-xs font-medium text-gray-600">
                    {item.isAdditionalCharge ? '-' : (item.weight === 0 ? '--' : `${item.weight} kg`)}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center text-xs font-medium text-gray-600">
                    {item.isAdditionalCharge ? '-' : (item.cbm !== undefined && item.cbm !== null ? `${item.cbm} CBM` : '-')}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center text-xs font-medium text-gray-600">
                    {item.isAdditionalCharge ? '-' : item.quantity}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-right text-xs font-medium text-gray-600 whitespace-nowrap">{item.price.toFixed(2)}</td>
                  <td className="py-2 px-2 sm:px-4 text-right text-xs font-medium text-gray-600 whitespace-nowrap">{lineVat.toFixed(2)}</td>
                  <td className="py-2 px-3 sm:px-4 text-right text-xs font-black text-gray-900 whitespace-nowrap">{(lineTotal + lineVat).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="flex flex-col sm:flex-row print-flex-between-start justify-between items-stretch sm:items-start gap-4 sm:gap-6">
        <div className="flex-1 space-y-3">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <h4 className="text-[10px] font-black text-gray-500 uppercase mb-0.5">Amount in Words</h4>
            <p className="text-[10px] sm:text-xs font-bold text-gray-900 leading-snug italic uppercase">
              AED {numberToWords(Math.round(invoice.totalAmount))} ONLY
            </p>
          </div>

          <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b pb-0.5">Bank Transfer Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 print-grid-2 gap-x-4 gap-y-1 text-[10px]">
              <div>
                <p className="text-gray-500">Account Holder</p>
                <p className="font-bold text-gray-900">{companyInfo.bank.name}</p>
              </div>
              <div>
                <p className="text-gray-500">CIF</p>
                <p className="font-bold text-gray-900">{companyInfo.bank.cif}</p>
              </div>
              <div>
                <p className="text-gray-500">Account Number</p>
                <p className="font-bold text-gray-900">{companyInfo.bank.accNo}</p>
              </div>
              <div>
                <p className="text-gray-500">IBAN</p>
                <p className="font-bold text-gray-900 break-all">{companyInfo.bank.iban}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-64 print-w-64 bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">Subtotal (Net)</span>
            <span className="font-bold text-gray-900">{formatCurrency(invoice.netAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">VAT ({invoice.items.length > 0 ? invoice.items[0].vatPercent : 0}%)</span>
            <span className="font-bold text-gray-900">{formatCurrency(invoice.totalVat)}</span>
          </div>
          <div className="h-px bg-gray-200"></div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-900 font-black text-xs uppercase tracking-wider">Total Invoice Price</span>
            <span className="text-orange-600 font-black text-lg sm:text-xl">{formatCurrency(invoice.totalAmount)}</span>
          </div>
          {linkedNotes.length > 0 && (
            <>
              {totalCredits > 0 && (
                <div className="flex justify-between items-center text-xs text-green-700">
                  <span className="font-medium">Credit Notes</span>
                  <span className="font-bold">- {formatCurrency(totalCredits)}</span>
                </div>
              )}
              {totalDebits > 0 && (
                <div className="flex justify-between items-center text-xs text-red-700">
                  <span className="font-medium">Debit Notes</span>
                  <span className="font-bold">+ {formatCurrency(totalDebits)}</span>
                </div>
              )}
              <div className="h-px bg-gray-300"></div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-900 font-black text-xs">ADJUSTED BALANCE</span>
                <span className="text-blue-700 font-black text-base sm:text-lg">{formatCurrency(adjustedBalance)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Linked Credit & Debit Notes */}
      {linkedNotes.length > 0 && (
        <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Linked Voucher Adjustments</h4>
          </div>
          <div className="overflow-x-auto print-overflow-visible">
            <table className="w-full text-[10px] min-w-[480px] sm:min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-1.5 text-left font-black text-gray-600 uppercase">Note No</th>
                  <th className="px-3 py-1.5 text-left font-black text-gray-600 uppercase">Type</th>
                  <th className="px-3 py-1.5 text-left font-black text-gray-600 uppercase">Date</th>
                  <th className="px-3 py-1.5 text-left font-black text-gray-600 uppercase">Reason</th>
                  <th className="px-3 py-1.5 text-right font-black text-gray-600 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {linkedNotes.map(note => (
                  <tr key={note.id} className="border-t border-gray-100">
                    <td className="px-3 py-1.5 font-bold text-gray-800">{note.noteNumber}</td>
                    <td className={`px-3 py-1.5 font-black ${ note.type === 'CREDIT' ? 'text-green-600' : 'text-red-600' }`}>{note.type}</td>
                    <td className="px-3 py-1.5 text-gray-600">{new Date(note.date).toLocaleDateString()}</td>
                    <td className="px-3 py-1.5 text-gray-600 max-w-[180px] truncate">{note.reason}</td>
                    <td className={`px-3 py-1.5 font-bold text-right ${ note.type === 'CREDIT' ? 'text-green-700' : 'text-red-700' }`}>
                      {note.type === 'CREDIT' ? '- ' : '+ '}{formatCurrency(note.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row print-flex-row justify-between items-start sm:items-end gap-4">
        <div className="text-[10px] text-gray-400 max-w-xs">
          <p className="font-bold text-gray-500 mb-0.5">Notes & Terms:</p>
          <p>Please pay within 30 days. Make all cheques payable to {companyInfo.bank.name}. Late payments may incur service charges.</p>
        </div>
        <div className="text-center w-full sm:w-36 print-w-auto pt-2 sm:pt-0">
          <div className="h-10 border-b border-dashed border-gray-300 mb-1 w-36 mx-auto sm:w-full"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
