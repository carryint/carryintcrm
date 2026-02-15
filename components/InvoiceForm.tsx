
import React, { useState } from 'react';
import { Plus, Trash2, Save, Send } from 'lucide-react';
import { 
  Invoice, 
  InvoiceItem, 
  Customer, 
  Vendor, 
  CompanyInfo
} from '../types';
import { 
  DESTINATION_COUNTRIES, 
  COMMODITY_TYPES 
} from '../constants';
import { generateId } from '../utils';

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  customers: Customer[];
  vendors: Vendor[];
  companyInfo: CompanyInfo;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, customers, vendors, companyInfo }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorCost, setVendorCost] = useState(0);
  const [destinationCountry, setDestinationCountry] = useState(DESTINATION_COUNTRIES[0]);
  const [items, setItems] = useState<InvoiceItem[]>([{
    commodityType: COMMODITY_TYPES[0],
    description: '',
    weight: 0,
    quantity: 1,
    coo: 'UAE',
    price: 0,
    vatPercent: 5
  }]);

  const calculateTotals = () => {
    let totalAmount = 0;
    let totalVat = 0;
    let netAmount = 0;

    items.forEach(item => {
      const lineTotal = item.price * item.quantity;
      const lineVat = lineTotal * (item.vatPercent / 100);
      netAmount += lineTotal;
      totalVat += lineVat;
      totalAmount += (lineTotal + lineVat);
    });

    return { totalAmount, totalVat, netAmount };
  };

  const addItem = () => {
    setItems([...items, {
      commodityType: COMMODITY_TYPES[0],
      description: '',
      weight: 0,
      quantity: 1,
      coo: 'UAE',
      price: 0,
      vatPercent: 5
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === selectedCustomerId);
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!customer) return alert("Please select a customer");

    const { totalAmount, totalVat, netAmount } = calculateTotals();
    const profit = totalAmount - vendorCost;

    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      customerAddress: customer.address,
      customerContact: customer.contact,
      customerEmail: customer.email,
      customerVat: customer.vatNumber,
      destinationCountry,
      items,
      vendorId: vendor?.id,
      vendorName: vendor?.name,
      vendorCost,
      status: customer.type === 'ONE_TIME' ? 'PAID' : 'UNPAID',
      vendorStatus: 'UNPAID',
      totalAmount,
      totalVat,
      netAmount,
      profit,
      companyTrn: companyInfo.trn 
    };

    onSave(newInvoice);
  };

  // Enhanced contrast with bg-amber-100
  const inputClass = "w-full px-4 py-3 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-semibold focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all";
  const selectClass = "w-full px-4 py-3 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-bold focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Send className="text-orange-500" size={24} />
          Invoice Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="block text-sm font-black text-gray-600 uppercase tracking-widest">Customer Selection</label>
            <select 
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className={selectClass}
              required
            >
              <option value="" className="bg-amber-100">Select Customer Profile</option>
              {customers.map(c => (
                <option key={c.id} value={c.id} className="bg-amber-100">{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-black text-gray-600 uppercase tracking-widest">Destination Country</label>
            <select 
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
              className={selectClass}
              required
            >
              {DESTINATION_COUNTRIES.map(c => (
                <option key={c} value={c} className="bg-amber-100">{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6">Commodity Items</h3>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end p-4 border border-amber-200 bg-amber-100/50 rounded-lg">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Type</label>
                <select 
                  value={item.commodityType}
                  onChange={(e) => updateItem(idx, 'commodityType', e.target.value)}
                  className="w-full px-2 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold"
                >
                  {COMMODITY_TYPES.map(t => <option key={t} value={t} className="bg-amber-50">{t}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Description</label>
                <input 
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  placeholder="Details..."
                  className="w-full px-2 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Weight</label>
                <input 
                  type="number"
                  value={item.weight}
                  onChange={(e) => updateItem(idx, 'weight', Number(e.target.value))}
                  className="w-full px-2 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Qty</label>
                <input 
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                  className="w-full px-2 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Price</label>
                <input 
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                  className="w-full px-2 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold"
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          <button 
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 text-orange-600 font-black hover:text-orange-700 mt-4 transition-colors uppercase text-sm"
          >
            <Plus size={18} /> Add Row
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6">Vendor & Cost Mapping</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-1">Shipment Vendor</label>
              <select 
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className={selectClass}
              >
                <option value="" className="bg-amber-50">Direct Booking (No Vendor)</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id} className="bg-amber-50">{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-1">Vendor Cost (AED)</label>
              <input 
                type="number"
                value={vendorCost}
                onChange={(e) => setVendorCost(Number(e.target.value))}
                className={inputClass}
              />
              <p className="text-xs text-amber-900 mt-1 italic font-bold">Base cost for internal profit tracking.</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col justify-between text-white">
          <h3 className="text-xl font-bold text-orange-500 mb-4">Financial Overview</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-slate-400">
              <span className="font-bold">Subtotal:</span>
              <span className="font-black text-white">{calculateTotals().netAmount.toFixed(2)} AED</span>
            </div>
            <div className="flex justify-between text-slate-400 border-b border-slate-700 pb-2">
              <span className="font-bold">VAT (5%):</span>
              <span className="font-black text-white">{calculateTotals().totalVat.toFixed(2)} AED</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-orange-500 pt-2">
              <span>Total Payable:</span>
              <span>{calculateTotals().totalAmount.toFixed(2)} AED</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm text-green-400 font-black uppercase tracking-widest">
                <span>Net Margin:</span>
                <span>{(calculateTotals().totalAmount - vendorCost).toFixed(2)} AED</span>
              </div>
            </div>
          </div>
          <button 
            type="submit"
            className="mt-6 w-full bg-orange-600 text-white py-4 rounded-lg font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-900/40 flex items-center justify-center gap-2"
          >
            <Save size={20} /> Generate & View Invoice
          </button>
        </div>
      </div>
    </form>
  );
};

export default InvoiceForm;
