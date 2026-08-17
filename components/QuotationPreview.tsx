import React from 'react';
import { Quotation, CompanyInfo } from '../types';
import { formatCurrency, numberToWords } from '../utils';
import { COUNTRY_SHORT_NAMES } from '../constants';
import Logo from './Logo';
import { 
  ArrowLeft, 
  Printer, 
  Edit, 
  FileCheck, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Clock, 
  Building2, 
  User, 
  Receipt,
  CheckCircle2
} from 'lucide-react';

interface QuotationPreviewProps {
  quotation: Quotation;
  companyInfo: CompanyInfo;
  onBack: () => void;
  onEdit?: (quotation: Quotation) => void;
  onConvertToInvoice?: (quotation: Quotation) => void;
}

export const QuotationPreview: React.FC<QuotationPreviewProps> = ({
  quotation,
  companyInfo,
  onBack,
  onEdit,
  onConvertToInvoice
}) => {
  const displayTrn = companyInfo.trn;

  const getCountryDisplay = (name?: string) => {
    if (!name) return 'N/A';
    return COUNTRY_SHORT_NAMES[name] || name;
  };

  const isExpired = new Date(quotation.validityDate).getTime() < new Date().setHours(0, 0, 0, 0);

  const totalWeight = quotation.items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const totalQuantity = quotation.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar (No Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-bold px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Quotations
        </button>

        <div className="flex items-center flex-wrap gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(quotation)}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors"
            >
              <Edit size={16} />
              Edit Quotation
            </button>
          )}

          {onConvertToInvoice && (
            <button
              onClick={() => onConvertToInvoice(quotation)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
              title="Convert this quotation to an active invoice"
            >
              <Receipt size={16} />
              Convert to Invoice
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2 rounded-lg font-black hover:bg-orange-700 transition-all shadow-md"
          >
            <Printer size={18} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Quotation Document Container */}
      <div className="bg-white p-8 max-w-4xl mx-auto shadow-2xl border border-gray-200 my-4 invoice-container rounded-sm">
        {/* Header */}
        <div className="flex justify-between items-end mb-6 border-b-2 border-orange-500 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-black uppercase tracking-wider mb-2">
              <FileCheck size={14} />
              Official Price Quotation
            </div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Price Quotation</h1>
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

        {/* Validity & Meta Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Quotation Code</span>
              <span className="text-base font-black text-orange-400">{quotation.quotationNumber}</span>
            </div>
            <span className="px-2 py-1 bg-slate-800 text-[10px] font-bold rounded text-slate-300">
              {quotation.status}
            </span>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-orange-600 uppercase font-black tracking-widest block">Generated Date</span>
              <span className="text-sm font-bold text-gray-900">{new Date(quotation.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <Calendar size={18} className="text-orange-500" />
          </div>

          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isExpired ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div>
              <span className={`text-[10px] uppercase font-black tracking-widest block ${
                isExpired ? 'text-red-700' : 'text-emerald-700'
              }`}>
                Validity (5 Days)
              </span>
              <span className="text-sm font-bold text-gray-900">
                Valid till: {new Date(quotation.validityDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <Clock size={18} className={isExpired ? 'text-red-500' : 'text-emerald-600'} />
          </div>
        </div>

        {/* Customer & Route Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Card */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Customer Details</h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                quotation.customerCategory === 'COMMERCIAL' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {quotation.customerCategory === 'COMMERCIAL' ? <Building2 size={11} /> : <User size={11} />}
                {quotation.customerCategory === 'COMMERCIAL' ? 'Commercial Customer' : 'Personal Customer'}
              </span>
            </div>
            <p className="font-black text-base text-gray-900">{quotation.customerName}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{quotation.customerAddress}</p>
            <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-700">
              <span><strong className="text-gray-900">Contact:</strong> {quotation.customerContact}</span>
              {quotation.customerEmail && <span><strong className="text-gray-900">Email:</strong> {quotation.customerEmail}</span>}
              {quotation.customerVat && (
                <span className="w-full text-orange-700 font-bold mt-0.5">
                  TRN / VAT: {quotation.customerVat}
                </span>
              )}
            </div>
          </div>

          {/* Route & Shipment Addresses */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-0.5">
                  <MapPin size={12} />
                  Pickup Address (Origin)
                </div>
                <p className="text-xs font-semibold text-gray-900">{quotation.pickupAddress || 'As agreed / Ex-Works'}</p>
                {quotation.originCountry && (
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Origin Country: {quotation.originCountry}</p>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1 text-[10px] font-black text-orange-700 uppercase tracking-wider mb-0.5">
                  <MapPin size={12} />
                  Delivery Address (Destination)
                </div>
                <p className="text-xs font-semibold text-gray-900">{quotation.deliveryAddress || 'As per delivery order'}</p>
                {quotation.destinationCountry && (
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Destination Country: {quotation.destinationCountry}</p>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between text-xs text-gray-600 font-medium">
              <span>Approx. Total Weight: <strong className="text-gray-900">{totalWeight > 0 ? `${totalWeight} kg` : 'N/A'}</strong></span>
              <span>Total Quantity: <strong className="text-gray-900">{totalQuantity > 0 ? `${totalQuantity} Pkgs` : '1 Shipment'}</strong></span>
            </div>
          </div>
        </div>

        {/* Quotation Items Table */}
        <div className="mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                <th className="py-2.5 px-4 text-[10px] font-black uppercase tracking-wider">Commodity / Service Details</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-center">Approx Weight</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-center">Qty</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-center">CBM</th>
                <th className="py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">Price (AED)</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-right">VAT</th>
                <th className="py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">Total (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-b border-gray-200">
              {quotation.items.map((item, idx) => {
                const lineTotal = item.price;
                const lineVat = lineTotal * ((item.vatPercent || 0) / 100);
                const grandLine = lineTotal + lineVat;
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-xs text-gray-900">{item.commodityType || 'Cargo'}</p>
                      {item.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{item.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-semibold text-gray-700">
                      {item.weight > 0 ? `${item.weight} kg` : '--'}
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-semibold text-gray-700">
                      {item.quantity || 1}
                    </td>
                    <td className="py-3 px-3 text-center text-xs font-medium text-gray-600">
                      {item.cbm ? `${item.cbm} CBM` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-semibold text-gray-800">
                      {item.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-medium text-gray-600">
                      {lineVat > 0 ? `${lineVat.toFixed(2)} (${item.vatPercent}%)` : '0.00'}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-black text-gray-900">
                      {grandLine.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
              Quotation Amount in Words
            </span>
            <p className="text-xs font-bold text-slate-800 italic">
              {numberToWords(quotation.totalAmount)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
            <div className="flex justify-between text-xs text-gray-600 font-medium">
              <span>Subtotal (Excl. VAT):</span>
              <span className="font-bold text-gray-900">{formatCurrency(quotation.subtotal)}</span>
            </div>
            {quotation.vatAmount > 0 && (
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>VAT Amount:</span>
                <span className="font-bold text-gray-900">{formatCurrency(quotation.vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-gray-200">
              <span className="text-orange-600 uppercase tracking-wider">Total Quoted Price:</span>
              <span className="text-base text-orange-600">{formatCurrency(quotation.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions / Notes Section */}
        {quotation.notesAndTerms && (
          <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-orange-500" />
              Terms & Conditions / Important Notes
            </h4>
            <div className="text-[11px] text-gray-700 whitespace-pre-wrap leading-relaxed space-y-1 font-sans">
              {quotation.notesAndTerms}
            </div>
          </div>
        )}

        {/* Signatures & Acceptance Block */}
        <div className="grid grid-cols-2 gap-10 pt-6 border-t border-gray-200 text-xs">
          <div>
            <p className="font-black text-gray-900 uppercase text-[11px] mb-1">For Carryint Shipping Services L.L.C</p>
            <p className="text-[10px] text-gray-500 mb-8">Authorized Signatory / Operations Dept</p>
            <div className="w-44 border-b border-gray-400"></div>
            <p className="text-[10px] text-gray-400 mt-1">Authorized Signature & Stamp</p>
          </div>

          <div className="text-right">
            <p className="font-black text-gray-900 uppercase text-[11px] mb-1">Customer Acceptance & Confirmation</p>
            <p className="text-[10px] text-gray-500 mb-8">Sign & stamp to approve quotation</p>
            <div className="w-44 border-b border-gray-400 ml-auto"></div>
            <p className="text-[10px] text-gray-400 mt-1">Client Signature & Date</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
          <p>This quotation is generated electronically by Carryint CRM. Valid for 5 days from {new Date(quotation.date).toLocaleDateString()}.</p>
        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;
