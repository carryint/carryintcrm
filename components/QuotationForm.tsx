import React, { useState, useEffect } from 'react';
import { Customer, Quotation, QuotationItem, CustomerCategory, QuotationStatus } from '../types';
import { COMMODITY_TYPES, DESTINATION_COUNTRIES } from '../constants';
import { generateId } from '../utils';
import { 
  Building2, 
  User, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Check, 
  Sparkles, 
  RotateCcw,
  ShieldCheck,
  Truck
} from 'lucide-react';

interface QuotationFormProps {
  initialQuotation?: Quotation | null;
  existingQuotations: Quotation[];
  customers: Customer[];
  onSave: (quotation: Quotation, andPreview?: boolean) => void;
  onCancel: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

const DEFAULT_TERMS = `1. Rates quoted are in AED and valid for 5 days from the quotation date.
2. Rates are based on the declared approximate weight, dimensions, and commodity type. Any variance upon physical cargo inspection or scale weighing will be adjusted accordingly.
3. Rates include transportation from the designated pickup address to the delivery address.
4. Quotation excludes destination customs inspection, duty/taxes, demurrage, storage charges, or special handling fees unless specifically stated.
5. Transit time is estimated and subject to customs clearance, border approvals, and port operations.
6. Payment Terms: 100% upon cargo collection / as agreed prior to delivery.
7. Cargo must be properly packed and labeled for secure transportation.`;

const calculateFiveDaysAhead = (dateString: string): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  d.setDate(d.getDate() + 5);
  return d.toISOString().split('T')[0];
};

const generateQuotationNumber = (existingQuotations: Quotation[]): string => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `QT-${currentYear}-`;
  
  // Find highest number for current year
  const numbers = existingQuotations
    .map(q => q.quotationNumber)
    .filter(num => num && num.startsWith(yearPrefix))
    .map(num => {
      const parts = num.split('-');
      return parseInt(parts[2], 10);
    })
    .filter(n => !isNaN(n));

  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${yearPrefix}${String(nextNumber).padStart(4, '0')}`;
};

export const QuotationForm: React.FC<QuotationFormProps> = ({
  initialQuotation,
  existingQuotations,
  customers,
  onSave,
  onCancel,
  currentUserId = 'user-1',
  currentUserName = 'Operations Staff'
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [customerCategory, setCustomerCategory] = useState<CustomerCategory>(
    initialQuotation?.customerCategory || 'COMMERCIAL'
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialQuotation?.customerId || ''
  );
  const [quotationNumber, setQuotationNumber] = useState<string>(
    initialQuotation?.quotationNumber || generateQuotationNumber(existingQuotations)
  );
  const [date, setDate] = useState<string>(initialQuotation?.date || today);
  const [validityDate, setValidityDate] = useState<string>(
    initialQuotation?.validityDate || calculateFiveDaysAhead(initialQuotation?.date || today)
  );

  // Customer Information
  const [customerName, setCustomerName] = useState<string>(initialQuotation?.customerName || '');
  const [customerAddress, setCustomerAddress] = useState<string>(initialQuotation?.customerAddress || '');
  const [customerContact, setCustomerContact] = useState<string>(initialQuotation?.customerContact || '');
  const [customerEmail, setCustomerEmail] = useState<string>(initialQuotation?.customerEmail || '');
  const [customerVat, setCustomerVat] = useState<string>(initialQuotation?.customerVat || '');

  // Routing
  const [pickupAddress, setPickupAddress] = useState<string>(
    initialQuotation?.pickupAddress || 'Mo2, Al Khabeesi Building, Deira, Dubai, UAE'
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>(initialQuotation?.deliveryAddress || '');
  const [originCountry, setOriginCountry] = useState<string>(initialQuotation?.originCountry || 'United Arab Emirates');
  const [destinationCountry, setDestinationCountry] = useState<string>(initialQuotation?.destinationCountry || 'United Arab Emirates');

  // Items
  const [items, setItems] = useState<QuotationItem[]>(
    initialQuotation?.items && initialQuotation.items.length > 0
      ? initialQuotation.items
      : [
          {
            commodityType: 'General Cargo',
            description: '',
            weight: 0,
            quantity: 1,
            cbm: 0,
            price: 0,
            vatPercent: 0
          }
        ]
  );

  // Notes & Terms
  const [notesAndTerms, setNotesAndTerms] = useState<string>(
    initialQuotation ? initialQuotation.notesAndTerms : DEFAULT_TERMS
  );
  const [status, setStatus] = useState<QuotationStatus>(initialQuotation?.status || 'DRAFT');

  // When quotation date changes, update validity date to date + 5 days by default
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setValidityDate(calculateFiveDaysAhead(newDate));
  };

  // Helper for quick validity duration
  const setValidityDays = (days: number) => {
    if (!date) return;
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setValidityDate(d.toISOString().split('T')[0]);
  };

  // When picking an existing customer from CRM
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const found = customers.find(c => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerAddress(found.address);
      setCustomerContact(found.contact);
      setCustomerEmail(found.email || '');
      setCustomerVat(found.vatNumber || '');
    }
  };

  // Line item handlers
  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        commodityType: 'General Cargo',
        description: '',
        weight: 0,
        quantity: 1,
        cbm: 0,
        price: 0,
        vatPercent: 0
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Quotation must have at least one line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculation
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const vatAmount = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const vatPct = Number(item.vatPercent) || 0;
    return sum + (price * (vatPct / 100));
  }, 0);
  const totalAmount = subtotal + vatAmount;

  const handleSubmit = (e: React.FormEvent, andPreview = false) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Please enter a Customer Name.');
      return;
    }
    if (!quotationNumber.trim()) {
      alert('Please enter a Quotation Number.');
      return;
    }

    const newQuotation: Quotation = {
      id: initialQuotation?.id || generateId(),
      quotationNumber: quotationNumber.trim(),
      date,
      validityDate,
      customerCategory,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      customerContact: customerContact.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerVat: customerVat.trim() || undefined,
      pickupAddress: pickupAddress.trim(),
      deliveryAddress: deliveryAddress.trim(),
      originCountry,
      destinationCountry,
      items: items.map(item => ({
        commodityType: item.commodityType,
        description: item.description || '',
        weight: Number(item.weight) || 0,
        quantity: Number(item.quantity) || 1,
        cbm: item.cbm !== undefined && item.cbm !== null ? Number(item.cbm) : undefined,
        price: Number(item.price) || 0,
        vatPercent: Number(item.vatPercent) || 0
      })),
      subtotal,
      vatAmount,
      totalAmount,
      notesAndTerms,
      status,
      createdBy: initialQuotation?.createdBy || currentUserId,
      createdByName: initialQuotation?.createdByName || currentUserName,
      createdAt: initialQuotation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newQuotation, andPreview);
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-gray-900">
              {initialQuotation ? 'Edit Quotation' : 'Create New Quotation'}
            </h2>
            <span className="bg-orange-100 text-orange-800 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              {quotationNumber}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Generate formal rate quotes for prospective commercial or personal clients (Valid for 5 days).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm flex items-center gap-2"
          >
            <Sparkles size={16} className="text-orange-400" />
            Save & View Preview
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20 text-sm"
          >
            Save Quotation
          </button>
        </div>
      </div>

      {/* SECTION 1: Customer Type & Information */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Customer Category & Details</h3>
              <p className="text-xs text-gray-400">Specify whether client is Commercial business or Personal individual</p>
            </div>
          </div>

          {/* Commercial vs Personal Selector */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setCustomerCategory('COMMERCIAL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                customerCategory === 'COMMERCIAL'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 size={14} />
              Commercial Client
            </button>
            <button
              type="button"
              onClick={() => setCustomerCategory('PERSONAL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                customerCategory === 'PERSONAL'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User size={14} />
              Personal Client
            </button>
          </div>
        </div>

        {/* Existing customer quick-picker */}
        {customers.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Quick Pick Existing Customer (Optional)
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">-- Or type new customer details below --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.contact}) - {c.address}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
              {customerCategory === 'COMMERCIAL' ? 'Company / Business Name *' : 'Customer Full Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={customerCategory === 'COMMERCIAL' ? 'e.g. Al Futtaim Logistics LLC' : 'e.g. John Doe'}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
              Contact / Phone Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. +971 50 123 4567"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. client@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
              {customerCategory === 'COMMERCIAL' ? 'TRN / VAT Number' : 'ID / Tax Number (Optional)'}
            </label>
            <input
              type="text"
              placeholder={customerCategory === 'COMMERCIAL' ? 'e.g. 100456209800003' : 'Optional identification'}
              value={customerVat}
              onChange={(e) => setCustomerVat(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
              Customer Full Address
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Office 402, Business Bay, Dubai, UAE"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Quotation Code, Validity (5 Days) & Status */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Quotation Code & Validity Period</h3>
            <p className="text-xs text-gray-400">Default validity is automatically set to 5 days from generated date</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
              Quotation Number *
            </label>
            <input
              type="text"
              required
              value={quotationNumber}
              onChange={(e) => setQuotationNumber(e.target.value)}
              className="w-full bg-orange-50/50 border border-orange-200 text-orange-950 font-black rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
              Quotation Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <Clock size={13} />
                Validity Date *
              </label>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                5 Days Auto
              </span>
            </div>
            <input
              type="date"
              required
              value={validityDate}
              onChange={(e) => setValidityDate(e.target.value)}
              className="w-full bg-emerald-50/50 border border-emerald-300 text-emerald-950 font-black rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-1 mt-1.5">
              <button
                type="button"
                onClick={() => setValidityDays(5)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded"
              >
                +5 Days
              </button>
              <button
                type="button"
                onClick={() => setValidityDays(7)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded"
              >
                +7 Days
              </button>
              <button
                type="button"
                onClick={() => setValidityDays(14)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded"
              >
                +14 Days
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuotationStatus)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-orange-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent to Customer</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: Pickup & Delivery Addresses */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Truck size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Pickup & Delivery Route</h3>
            <p className="text-xs text-gray-400">Specify collection point and drop-off destination</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
              <MapPin size={15} className="text-emerald-600" />
              Pickup / Collection Address (Origin)
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Warehouse 12, Al Quoz Industrial 3, Dubai, UAE"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Origin Country</label>
              <select
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500"
              >
                {DESTINATION_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Delivery */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-orange-800 uppercase tracking-wider">
              <MapPin size={15} className="text-orange-600" />
              Delivery / Destination Address
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Muscat Port / Client Facility, Muscat, Oman"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Destination Country</label>
              <select
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500"
              >
                {DESTINATION_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Shipment Items, Approx Weight, Quantity & Price */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-base font-black text-gray-900">Shipment Details & Pricing</h3>
            <p className="text-xs text-gray-400">Specify approximate weight, quantity, cargo description, and quoted price in AED</p>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-orange-100 transition-colors"
          >
            <Plus size={14} /> Add Line Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider">Commodity Type</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider">Description</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider w-28">Approx Weight (kg)</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider w-20">Qty (Pkgs)</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider w-24">CBM (Opt)</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider w-32">Price (AED)</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider w-24">VAT %</th>
                <th className="py-2.5 px-3 text-[10px] font-black uppercase tracking-wider text-right w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx} className="group">
                  <td className="py-2 px-2">
                    <select
                      value={item.commodityType}
                      onChange={(e) => handleItemChange(idx, 'commodityType', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {COMMODITY_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </td>

                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="e.g. 5 Cartons Spare Parts / Personal Items"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </td>

                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0 kg"
                      value={item.weight || ''}
                      onChange={(e) => handleItemChange(idx, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 text-center"
                    />
                  </td>

                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 text-center"
                    />
                  </td>

                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="CBM"
                      value={item.cbm || ''}
                      onChange={(e) => handleItemChange(idx, 'cbm', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500 text-center"
                    />
                  </td>

                  <td className="py-2 px-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0.00"
                      value={item.price || ''}
                      onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-black outline-none focus:ring-2 focus:ring-orange-500 text-right text-orange-600"
                    />
                  </td>

                  <td className="py-2 px-2">
                    <select
                      value={item.vatPercent}
                      onChange={(e) => handleItemChange(idx, 'vatPercent', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="0">0% (Exempt)</option>
                      <option value="5">5% Standard</option>
                    </select>
                  </td>

                  <td className="py-2 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove line item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary Box */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <div className="w-72 bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Subtotal:</span>
              <span className="font-bold text-gray-900">{subtotal.toFixed(2)} AED</span>
            </div>
            {vatAmount > 0 && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>VAT Total:</span>
                <span className="font-bold text-gray-900">{vatAmount.toFixed(2)} AED</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-gray-200">
              <span className="text-orange-600 uppercase">Total Quoted Price:</span>
              <span className="text-orange-600 text-base">{totalAmount.toFixed(2)} AED</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Terms & Conditions / Note Portion */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Quotation Terms & Conditions / Notes</h3>
              <p className="text-xs text-gray-400">Type or copy-paste custom terms and conditions for this quotation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotesAndTerms(DEFAULT_TERMS)}
              className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw size={12} /> Reset to Default Freight Terms
            </button>
            <button
              type="button"
              onClick={() => setNotesAndTerms('')}
              className="text-xs font-bold text-gray-500 hover:text-red-600 px-2 py-1.5"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          rows={7}
          value={notesAndTerms}
          onChange={(e) => setNotesAndTerms(e.target.value)}
          placeholder="Type or copy-paste terms and conditions here..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-mono leading-relaxed outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all"
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm flex items-center gap-2"
        >
          <Sparkles size={16} className="text-orange-400" />
          Save & View Preview
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/20 text-sm"
        >
          Save Quotation
        </button>
      </div>
    </form>
  );
};

export default QuotationForm;
