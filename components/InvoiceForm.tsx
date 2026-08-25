
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Save, Send, Search, ChevronDown, X, Truck, ExternalLink } from 'lucide-react';

// ── Reusable Searchable Dropdown ─────────────────────────────────────────────
interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; sub?: string }[];
  placeholder?: string;
  required?: boolean;
  id?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label, value, onChange, options, placeholder = 'Search…', required, id
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = query.trim() === ''
    ? options
    : options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sub && o.sub.toLowerCase().includes(query.toLowerCase()))
      );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (opt: { value: string; label: string }) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div className="space-y-1" ref={ref}>
      <label className="block text-sm font-black text-gray-600 uppercase tracking-widest">{label}</label>

      {/* Trigger button */}
      {!open ? (
        <button
          id={id}
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer hover:border-orange-400"
        >
          <span className={selected ? 'text-slate-900' : 'text-slate-400 font-normal'}>
            {selected ? selected.label : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selected && (
              <span
                role="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </button>
      ) : (
        <div className="relative">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-orange-400 bg-amber-50 shadow-md">
            <Search size={15} className="text-orange-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent outline-none text-slate-900 font-semibold text-sm placeholder:text-gray-400"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown list */}
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">No results for "{query}"</div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex flex-col border-b border-gray-50 last:border-0 ${
                    opt.value === value ? 'bg-orange-50 font-black text-orange-700' : 'text-slate-800 font-semibold'
                  }`}
                >
                  <span className="text-sm">{opt.label}</span>
                  {opt.sub && <span className="text-[11px] text-gray-400 font-normal">{opt.sub}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hidden native input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          required
          readOnly
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          tabIndex={-1}
        />
      )}
    </div>
  );
};

// ── Reusable Smart Decimal & Numeric Input ─────────────────────────────────────
interface DecimalInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  defaultValue?: number;
  allowDecimal?: boolean;
}

const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChange,
  placeholder = '0.00',
  className = '',
  id,
  defaultValue = 0,
  allowDecimal = true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState<string>(() => {
    if (value === undefined || value === null) return String(defaultValue);
    return String(value);
  });

  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null) {
        setText(String(defaultValue));
      } else {
        setText(String(value));
      }
    }
  }, [value, isFocused, defaultValue]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (value === 0 || text === '0' || text === '0.00' || text === '0.0') {
      setText('');
    } else {
      e.target.select();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.');
    const regex = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
    if (raw === '' || regex.test(raw)) {
      setText(raw);
      if (raw === '' || raw === '.') {
        onChange(defaultValue);
      } else {
        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) {
          onChange(parsed);
        }
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (text.trim() === '' || text === '.' || isNaN(parseFloat(text))) {
      setText(String(defaultValue));
      onChange(defaultValue);
    } else {
      const parsed = parseFloat(text);
      setText(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};
// ─────────────────────────────────────────────────────────────────────────────
import {
  Invoice,
  InvoiceItem,
  Customer,
  Vendor,
  CompanyInfo,
  User,
  AuditLog,
  PaymentStatus,
  CarrierName,
  ShipmentStatus
} from '../types';
import {
  DESTINATION_COUNTRIES,
  ALL_COUNTRIES,
  COMMODITY_TYPES,
  MAJOR_CARRIERS,
  SHIPMENT_STATUSES
} from '../constants';
import { generateId, generateAwbNumber, getCarrierTrackingUrl } from '../utils';

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  customers: Customer[];
  vendors: Vendor[];
  companyInfo: CompanyInfo;
  editingInvoice: Invoice | null;
  currentUser: User | null;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSave, customers, vendors, companyInfo, editingInvoice, currentUser
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(editingInvoice?.customerId || '');
  const [selectedVendorId, setSelectedVendorId] = useState(editingInvoice?.vendorId || '');
  const [vendorCost, setVendorCost] = useState(editingInvoice?.vendorCost || 0);
  const [agentCommission, setAgentCommission] = useState(editingInvoice?.agentCommission || 0);
  const [pickupCost, setPickupCost] = useState(editingInvoice?.pickupCost || 0);
  const [destinationCountry, setDestinationCountry] = useState(editingInvoice?.destinationCountry || DESTINATION_COUNTRIES[0]);
  const [globalCoo, setGlobalCoo] = useState<string>(() => {
    if (editingInvoice && editingInvoice.items.length > 0) {
      return editingInvoice.items[0].coo;
    }
    return 'United Arab Emirates';
  });
  
  // Carrier & Tracking fields (can be set initially or updated post-payment)
  const [awbNumber, setAwbNumber] = useState<string>(editingInvoice?.awbNumber || generateAwbNumber());
  const [carrier, setCarrier] = useState<CarrierName | string>(editingInvoice?.carrier || 'DHL');
  const [carrierTrackingNumber, setCarrierTrackingNumber] = useState<string>(editingInvoice?.carrierTrackingNumber || '');
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>(editingInvoice?.shipmentStatus || 'BOOKED');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>(editingInvoice?.estimatedDeliveryDate || '');

  const [items, setItems] = useState<InvoiceItem[]>(editingInvoice?.items || [{
    commodityType: COMMODITY_TYPES[0],
    description: '',
    weight: 0,
    cbm: undefined,
    quantity: 1,
    coo: editingInvoice?.items[0]?.coo || 'United Arab Emirates',
    price: 0,
    vatPercent: 0
  }]);
  const [globalVatPercent, setGlobalVatPercent] = useState<number>(() => {
    if (editingInvoice && editingInvoice.items.length > 0) {
      return editingInvoice.items[0].vatPercent;
    }
    return 0;
  });
  const [status, setStatus] = useState<PaymentStatus>(editingInvoice?.status || 'UNPAID');
  const [vendorStatus, setVendorStatus] = useState<PaymentStatus>(editingInvoice?.vendorStatus || 'UNPAID');
  const [vendorPaidAmount, setVendorPaidAmount] = useState<number>(editingInvoice?.vendorPaidAmount !== undefined ? editingInvoice.vendorPaidAmount : (editingInvoice?.vendorStatus === 'PAID' ? (editingInvoice?.vendorCost || 0) : 0));
  const [vendorPaymentDate, setVendorPaymentDate] = useState<string>(editingInvoice?.vendorPaymentDate || new Date().toISOString().split('T')[0]);
  const [vendorTransactionReference, setVendorTransactionReference] = useState<string>(editingInvoice?.vendorTransactionReference || '');
  const [agentStatus, setAgentStatus] = useState<PaymentStatus>(editingInvoice?.agentStatus || 'UNPAID');
  const [manualTotal, setManualTotal] = useState<number>(editingInvoice?.totalAmount || 0);
  const [paymentDate, setPaymentDate] = useState<string>(editingInvoice?.paymentDate || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>(editingInvoice?.paymentMethod || 'Bank Transfer');
  const [transactionReference, setTransactionReference] = useState<string>(editingInvoice?.transactionReference || '');

  // Totals are based on the manually entered total — qty/weight/price are independent descriptive fields.
  const calculateTotals = () => {
    const netAmount = manualTotal;
    const totalVat = netAmount * (globalVatPercent / 100);
    const totalAmount = netAmount + totalVat;
    return { totalAmount, totalVat, netAmount };
  };

  const addItem = () => {
    setItems([...items, {
      commodityType: COMMODITY_TYPES[0],
      description: '',
      weight: 0,
      cbm: undefined,
      quantity: 1,
      coo: globalCoo,
      price: 0,
      vatPercent: globalVatPercent
    }]);
  };

  const addAdditionalCharge = () => {
    setItems([...items, {
      commodityType: 'Additional Charges',
      description: '',
      weight: 0,
      cbm: undefined,
      quantity: 1,
      coo: globalCoo,
      price: 0,
      vatPercent: globalVatPercent,
      isAdditionalCharge: true
    }]);
  };

  const handleGlobalVatChange = (value: number) => {
    setGlobalVatPercent(value);
    const updatedItems = items.map(item => ({ ...item, vatPercent: value }));
    setItems(updatedItems);
  };

  const handleGlobalCooChange = (value: string) => {
    setGlobalCoo(value);
    const updatedItems = items.map(item => ({ ...item, coo: value }));
    setItems(updatedItems);
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
    const profit = manualTotal - vendorCost - agentCommission - pickupCost;

    const auditLog: AuditLog = {
      action: editingInvoice ? 'EDIT' : 'CREATE',
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      timestamp: new Date().toISOString(),
      details: editingInvoice ? `Edited invoice ${editingInvoice.invoiceNumber}` : `Created invoice`
    };

    const invoiceData: Invoice = {
      id: editingInvoice?.id || generateId(),
      invoiceNumber: editingInvoice?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      awbNumber: awbNumber.trim() || generateAwbNumber(),
      carrier,
      carrierTrackingNumber: carrierTrackingNumber.trim(),
      shipmentStatus,
      estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      carrierAssignedAt: editingInvoice?.carrierAssignedAt || (carrierTrackingNumber.trim() ? new Date().toISOString() : undefined),
      carrierAssignedBy: editingInvoice?.carrierAssignedBy || currentUser?.name,
      trackingEvents: editingInvoice?.trackingEvents || (carrierTrackingNumber.trim() ? [{
        id: generateId(),
        date: new Date().toISOString(),
        status: shipmentStatus,
        location: `${globalCoo}`,
        description: `Shipment created with ${carrier} (AWB: ${carrierTrackingNumber.trim()})`,
        updatedBy: currentUser?.name || 'Staff'
      }] : []),
      date: editingInvoice?.date || new Date().toISOString(),
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
      agentCommission,
      pickupCost,
      status: status,
      vendorStatus: vendorStatus,
      vendorPaidAmount: vendorStatus === 'PAID' ? vendorCost : (vendorStatus === 'PARTIAL' ? vendorPaidAmount : 0),
      agentStatus: agentStatus,
      totalAmount,
      totalVat,
      netAmount,
      profit,
      paymentDate: status === 'PAID' ? paymentDate : undefined,
      paymentMethod: status === 'PAID' ? paymentMethod : undefined,
      transactionReference: status === 'PAID' ? transactionReference : undefined,
      vendorPaymentDate: vendorStatus !== 'UNPAID' ? vendorPaymentDate : undefined,
      vendorTransactionReference: vendorStatus !== 'UNPAID' ? vendorTransactionReference : undefined,
      companyTrn: companyInfo.trn,
      createdBy: editingInvoice?.createdBy || currentUser?.id || 'system',
      createdByName: editingInvoice?.createdByName || currentUser?.name || 'System',
      auditLogs: [...(editingInvoice?.auditLogs || []), auditLog]
    };

    onSave(invoiceData);
  };

  // Enhanced contrast with bg-amber-100
  const inputClass = "w-full px-4 py-3 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-semibold focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all";
  const selectClass = "w-full px-4 py-3 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-bold focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Send className="text-orange-500" size={24} />
          {editingInvoice ? `Editing Invoice ${editingInvoice.invoiceNumber}` : 'Create New Invoice'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer — searchable */}
          <SearchableSelect
            id="customer-select"
            label="Customer Selection"
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            placeholder="Type name to search…"
            required
            options={customers.map(c => ({
              value: c.id,
              label: c.name,
              sub: `${c.type === 'CREDIT' ? 'Commercial' : 'One-Time'} · ${c.contact}`
            }))}
          />

          {/* Country of Origin — searchable */}
          <SearchableSelect
            id="coo-select"
            label="Country of Origin (COO)"
            value={globalCoo}
            onChange={handleGlobalCooChange}
            placeholder="Type country name…"
            required
            options={ALL_COUNTRIES.map(c => ({ value: c, label: c }))}
          />

          {/* Destination Country — searchable */}
          <SearchableSelect
            id="destination-select"
            label="Destination Country"
            value={destinationCountry}
            onChange={setDestinationCountry}
            placeholder="Type country name…"
            required
            options={DESTINATION_COUNTRIES.map(c => ({ value: c, label: c }))}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6">Commodity Items</h3>
        <p className="text-xs text-amber-700 italic mb-4 font-semibold">Enter values freely for each row. Price is the line total — no automatic calculation from Qty/Weight.</p>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end p-4 border border-amber-200 bg-amber-100/50 rounded-lg">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Type</label>
                <select
                  value={item.commodityType}
                  onChange={(e) => updateItem(idx, 'commodityType', e.target.value)}
                  className="w-full px-2 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold"
                >
                  {item.isAdditionalCharge ? (
                    <>
                      <option value="Additional Charges" className="bg-amber-50">Additional Charges</option>
                      <option value="Documentation Charges" className="bg-amber-50">Documentation Charges</option>
                    </>
                  ) : (
                    COMMODITY_TYPES.map(t => <option key={t} value={t} className="bg-amber-50">{t}</option>)
                  )}
                </select>
              </div>
              <div className={item.isAdditionalCharge ? "md:col-span-5" : "md:col-span-2"}>
                <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Description</label>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  placeholder="Details..."
                  className="w-full px-2 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-semibold"
                />
              </div>
              {!item.isAdditionalCharge && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Weight (kg)</label>
                    <DecimalInput
                      value={item.weight}
                      onChange={(val) => updateItem(idx, 'weight', val)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">CBM</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.cbm !== undefined ? String(item.cbm) : ''}
                      onFocus={(e) => {
                        if (item.cbm === 0) {
                          updateItem(idx, 'cbm', undefined);
                        } else if (item.cbm !== undefined) {
                          e.target.select();
                        }
                      }}
                      onChange={(e) => {
                        const raw = e.target.value.replace(',', '.');
                        if (raw === '' || raw === '-') {
                          updateItem(idx, 'cbm', undefined);
                        } else if (/^-?\d*\.?\d*$/.test(raw)) {
                          const parsed = parseFloat(raw);
                          updateItem(idx, 'cbm', raw.endsWith('.') || isNaN(parsed) ? (raw as any) : parsed);
                        }
                      }}
                      placeholder="e.g. 1.263"
                      className="w-full px-2.5 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Qty</label>
                    <DecimalInput
                      value={item.quantity}
                      defaultValue={1}
                      allowDecimal={false}
                      onChange={(val) => updateItem(idx, 'quantity', val <= 0 ? 1 : Math.round(val))}
                      placeholder="1"
                      className="w-full px-2.5 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold text-left"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-black text-amber-800 uppercase mb-1">Price (Total)</label>
                <DecimalInput
                  value={item.price}
                  onChange={(val) => updateItem(idx, 'price', val)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-2 text-sm rounded border border-amber-300 bg-amber-100 text-slate-900 font-bold text-left"
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
          <div className="flex flex-wrap gap-4 mt-4">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-orange-600 font-black hover:text-orange-700 transition-colors uppercase text-sm"
            >
              <Plus size={18} /> Add Row
            </button>
            <button
              type="button"
              onClick={addAdditionalCharge}
              className="flex items-center gap-2 text-blue-600 font-black hover:text-blue-700 transition-colors uppercase text-sm"
            >
              <Plus size={18} /> Add Additional Charges
            </button>
          </div>
        </div>
      </div>

      {/* Carrier & Logistics AWB Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Carrier Logistics & Tracking Details</h3>
              <p className="text-xs text-gray-500">Auto-assigned Master AWB. Carrier & tracking number can be set now or updated post-payment.</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-200 w-fit">
            Post-Payment Updatable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Master AWB Number */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
            <label className="block text-xs font-black text-amber-900 uppercase tracking-widest">
              Carryint Master AWB Number
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="e.g. CARY-104829104"
                className="flex-1 px-3 py-2 rounded-lg border border-amber-300 font-mono font-black text-slate-950 text-sm bg-amber-100 focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setAwbNumber(generateAwbNumber())}
                className="px-2.5 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Regenerate
              </button>
            </div>
            <p className="text-[10px] text-amber-800 font-medium italic">
              Unique Master Air Waybill code for your customer to track on your website.
            </p>
          </div>

          {/* Initial Logistics Status & Estimated Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Shipment Status</label>
              <select
                value={shipmentStatus}
                onChange={(e) => setShipmentStatus(e.target.value as ShipmentStatus)}
                className="w-full px-3 py-2.5 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-bold text-xs outline-none"
              >
                {SHIPMENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1">Estimated Delivery</label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-semibold text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Carrier Selection & Tracking Number */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Logistics Carrier (Major Carriers: DHL, FedEx, UPS, DPD)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {MAJOR_CARRIERS.map(c => {
                const isSelected = carrier === c.id || carrier === c.name;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCarrier(c.id as CarrierName)}
                    className={`p-2.5 rounded-lg border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/80 shadow-sm font-black'
                        : 'border-gray-200 bg-white hover:border-gray-300 font-semibold'
                    }`}
                  >
                    <span className="text-xs truncate block text-slate-900">{c.name}</span>
                    <span className={`text-[9px] font-bold mt-1 px-1 py-0.5 rounded w-fit uppercase ${
                      isSelected ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">
                Carrier AWB / BL / Tracking Number (Optional on Invoice Creation)
              </label>
              {carrierTrackingNumber && getCarrierTrackingUrl(carrier, carrierTrackingNumber) && (
                <a
                  href={getCarrierTrackingUrl(carrier, carrierTrackingNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLink size={12} /> Test {carrier} Live Link
                </a>
              )}
            </div>
            <input
              type="text"
              value={carrierTrackingNumber}
              onChange={(e) => setCarrierTrackingNumber(e.target.value)}
              placeholder={`e.g. ${carrier === 'DHL' ? '10-digit DHL Waybill (e.g. 8492019482)' : carrier === 'FedEx' ? '12-digit FedEx Tracking No' : carrier === 'UPS' ? '1Z9999999999999999' : 'Carrier Tracking / BL Number'}`}
              className="w-full px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-mono font-bold text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
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
              <DecimalInput
                value={vendorCost}
                onChange={setVendorCost}
                placeholder="0.00"
                className={inputClass}
              />
              <p className="text-xs text-amber-900 mt-1 italic font-bold">Base cost for internal profit tracking.</p>
            </div>
            <div>
              <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-1">Broker Commission (AED)</label>
              <DecimalInput
                value={agentCommission}
                onChange={setAgentCommission}
                placeholder="0.00"
                className={inputClass}
              />
              <p className="text-xs text-amber-900 mt-1 italic font-bold">Commission paid to the broker.</p>
            </div>
            <div>
              <label className="block text-sm font-black text-gray-600 uppercase tracking-widest mb-1">Pickup / Transportation Cost (AED)</label>
              <DecimalInput
                value={pickupCost}
                onChange={setPickupCost}
                placeholder="0.00"
                className={inputClass}
              />
              <p className="text-xs text-amber-900 mt-1 italic font-bold">Additional transportation or pickup costs paid.</p>
            </div>

            <div className="pt-4 border-t border-amber-200 space-y-4">
              <div>
                <label className="block text-sm font-black text-orange-800 uppercase tracking-widest mb-1 italic">Customer Payment Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={selectClass}
                >
                  <option value="UNPAID">UNPAID (Awaiting Customer Payment)</option>
                  <option value="PAID">PAID (Amount Received)</option>
                  <option value="PARTIAL">PARTIAL (Partially Received)</option>
                </select>
              </div>
              {(status === 'PAID' || status === 'PARTIAL') && (
                <div className="space-y-4 pt-2">
                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200 animate-pulse-once">
                    <label className="block text-sm font-black text-green-800 uppercase tracking-widest mb-2">Bank Transaction Reference / Receipts / Number</label>
                    <input
                      type="text"
                      placeholder="Enter Bank Ref, Cheque No, or Transaction Details..."
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-green-300 bg-white text-slate-950 font-bold focus:ring-4 focus:ring-green-500 outline-none transition-all placeholder:text-green-200"
                    />
                    <p className="text-[10px] text-green-600 mt-2 font-bold uppercase tracking-wider italic">Note: This will be visible on the Payment Receipt</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-green-700 uppercase tracking-widest mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-green-700 uppercase tracking-widest mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={selectClass}
                      >
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online Payment">Online Payment</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-black text-orange-800 uppercase tracking-widest mb-1 italic">Vendor Payment Status</label>
                <select
                  value={vendorStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as PaymentStatus;
                    setVendorStatus(newStatus);
                    if (newStatus === 'PAID') {
                      setVendorPaidAmount(vendorCost);
                    } else if (newStatus === 'UNPAID') {
                      setVendorPaidAmount(0);
                    }
                  }}
                  className={selectClass}
                >
                  <option value="UNPAID">UNPAID (Pending Vendor Settlement)</option>
                  <option value="PARTIAL">PARTIALLY PAID (Partial Settlement)</option>
                  <option value="PAID">PAID (Closed Vendor Bill)</option>
                </select>
              </div>
              {vendorStatus === 'PARTIAL' && (
                <div className="space-y-4 pt-2">
                  <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-300">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-black text-amber-900 uppercase tracking-widest">Partial Amount Paid to Vendor (AED)</label>
                      <span className="text-xs font-bold text-amber-800">
                        Remaining: {Math.max(0, vendorCost - vendorPaidAmount).toFixed(2)} AED
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={vendorCost}
                      step="any"
                      value={vendorPaidAmount || ''}
                      onChange={(e) => setVendorPaidAmount(parseFloat(e.target.value) || 0)}
                      placeholder={`Enter paid amount (Max ${vendorCost} AED)`}
                      className={inputClass}
                    />
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-300">
                    <label className="block text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={vendorPaymentDate}
                      onChange={(e) => setVendorPaymentDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-300">
                    <label className="block text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Payment Reference / Cheque # / Bank Ref</label>
                    <input
                      type="text"
                      placeholder="Enter Bank Ref, Cheque No, etc. for Vendor..."
                      value={vendorTransactionReference}
                      onChange={(e) => setVendorTransactionReference(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
              {vendorStatus === 'PAID' && (
                <div className="space-y-4 pt-2">
                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                    <label className="block text-xs font-black text-green-700 uppercase tracking-widest mb-1">Vendor Payment Done Date</label>
                    <input
                      type="date"
                      value={vendorPaymentDate}
                      onChange={(e) => setVendorPaymentDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                    <label className="block text-xs font-black text-green-700 uppercase tracking-widest mb-1">Vendor Transaction Reference / Cheque #</label>
                    <input
                      type="text"
                      placeholder="Enter Bank Ref, Cheque No, etc. for Vendor..."
                      value={vendorTransactionReference}
                      onChange={(e) => setVendorTransactionReference(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-black text-orange-800 uppercase tracking-widest mb-1 italic">Broker Payment Status</label>
                <select
                  value={agentStatus}
                  onChange={(e) => setAgentStatus(e.target.value as any)}
                  className={selectClass}
                >
                  <option value="UNPAID">UNPAID (Pending Broker Payment)</option>
                  <option value="PAID">PAID (Closed Broker Commission)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col justify-between text-white">
          <h3 className="text-xl font-bold text-orange-500 mb-4">Financial Overview</h3>
          <div className="space-y-3">
            {/* Manual total entry — not linked to qty/weight/price */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount (AED)</label>
              <div className="flex items-center bg-slate-800 rounded-lg px-3 border border-slate-600 focus-within:border-orange-500 transition-colors">
                <DecimalInput
                  value={manualTotal}
                  onChange={setManualTotal}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-white font-black outline-none text-right py-2 text-lg"
                />
                <span className="text-slate-400 font-bold ml-2 text-sm">AED</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 italic">Enter the total amount manually — independent of qty / weight / price.</p>
            </div>
            <div className="flex justify-between items-center text-slate-400 border-b border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold">VAT:</span>
                <div className="flex items-center bg-slate-800 rounded px-2 border border-slate-700">
                  <DecimalInput
                    value={globalVatPercent}
                    onChange={handleGlobalVatChange}
                    placeholder="0"
                    className="w-12 bg-transparent text-white font-black outline-none text-right py-1"
                  />
                  <span className="text-xs font-bold text-slate-500 ml-1">%</span>
                </div>
              </div>
              <span className="font-black text-white">{calculateTotals().totalVat.toFixed(2)} AED</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-orange-500 pt-2">
              <span>Total Payable:</span>
              <span>{calculateTotals().totalAmount.toFixed(2)} AED</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm text-green-400 font-black uppercase tracking-widest">
                <span>Net Margin:</span>
                <span>{(manualTotal - vendorCost - agentCommission - pickupCost).toFixed(2)} AED</span>
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
