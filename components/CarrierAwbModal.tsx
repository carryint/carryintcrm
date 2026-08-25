import React, { useState } from 'react';
import { X, Truck, ExternalLink, Calendar, MapPin, Plus, CheckCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Invoice, User, CarrierName, ShipmentStatus, TrackingEvent } from '../types';
import { MAJOR_CARRIERS, SHIPMENT_STATUSES } from '../constants';
import { getCarrierTrackingUrl, generateAwbNumber, generateId } from '../utils';

interface CarrierAwbModalProps {
  invoice: Invoice;
  currentUser: User | null;
  onClose: () => void;
  onSave: (updatedInvoice: Invoice) => void;
}

const CarrierAwbModal: React.FC<CarrierAwbModalProps> = ({
  invoice,
  currentUser,
  onClose,
  onSave,
}) => {
  const [carrier, setCarrier] = useState<CarrierName | string>(invoice.carrier || 'DHL');
  const [carrierTrackingNumber, setCarrierTrackingNumber] = useState<string>(invoice.carrierTrackingNumber || '');
  const [awbNumber, setAwbNumber] = useState<string>(invoice.awbNumber || generateAwbNumber());
  const [shipmentStatus, setShipmentStatus] = useState<ShipmentStatus>(invoice.shipmentStatus || 'BOOKED');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>(invoice.estimatedDeliveryDate || '');
  
  // New milestone form
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newLocation, setNewLocation] = useState('Dubai Hub, UAE');
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState<ShipmentStatus>(invoice.shipmentStatus || 'IN_TRANSIT');

  const testTrackingUrl = getCarrierTrackingUrl(carrier, carrierTrackingNumber);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const timestamp = new Date().toISOString();
    let events = [...(invoice.trackingEvents || [])];

    // If a new milestone was typed
    if (newNote.trim()) {
      const milestoneEvent: TrackingEvent = {
        id: generateId(),
        date: timestamp,
        status: newStatus,
        location: newLocation.trim() || 'Dubai Hub, UAE',
        description: newNote.trim(),
        updatedBy: currentUser?.name || 'Staff'
      };
      events.unshift(milestoneEvent);
    } else if (events.length === 0 && carrierTrackingNumber) {
      // Create initial event
      events.push({
        id: generateId(),
        date: timestamp,
        status: shipmentStatus,
        location: `${invoice.items[0]?.coo || 'Dubai, UAE'}`,
        description: `Shipment assigned to ${carrier} (AWB/BL: ${carrierTrackingNumber})`,
        updatedBy: currentUser?.name || 'Staff'
      });
    }

    const updatedInvoice: Invoice = {
      ...invoice,
      awbNumber: awbNumber.trim() || generateAwbNumber(),
      carrier,
      carrierTrackingNumber: carrierTrackingNumber.trim(),
      shipmentStatus: newNote.trim() ? newStatus : shipmentStatus,
      estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      carrierAssignedAt: invoice.carrierAssignedAt || timestamp,
      carrierAssignedBy: invoice.carrierAssignedBy || currentUser?.name || 'Staff',
      trackingEvents: events,
      auditLogs: [
        ...(invoice.auditLogs || []),
        {
          action: 'EDIT',
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'System',
          timestamp,
          details: `Updated Carrier to ${carrier} (${carrierTrackingNumber || 'Pending AWB'}), status: ${shipmentStatus}`
        }
      ]
    };

    onSave(updatedInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Assign Carrier & Logistics AWB</h3>
              <p className="text-xs text-slate-400">
                Invoice <span className="font-bold text-white">{invoice.invoiceNumber}</span> • Customer: <span className="font-bold text-orange-400">{invoice.customerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Payment Status Notice */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            invoice.status === 'PAID' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center space-x-2">
              {invoice.status === 'PAID' ? (
                <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
              )}
              <div>
                <span className="font-black uppercase tracking-wider">Customer Payment: {invoice.status}</span>
                <p className="text-[11px] text-gray-600">
                  {invoice.status === 'PAID' 
                    ? 'Payment confirmed. You can now dispatch with the selected carrier and provide the customer with their AWB.' 
                    : 'Customer payment is still pending. You can still pre-assign carrier details or wait until payment is received.'}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
              invoice.status === 'PAID' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
            }`}>
              {invoice.status}
            </span>
          </div>

          {/* Master AWB Number */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5">
              Carryint Master AWB Number
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="e.g. CARY-104928374"
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono font-black text-slate-900 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setAwbNumber(generateAwbNumber())}
                className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors whitespace-nowrap"
              >
                Regenerate AWB
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Internal system tracking code for customer lookups on your Carryint website tracking page.
            </p>
          </div>

          {/* Carrier Selection Grid */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
              Select Logistics Carrier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MAJOR_CARRIERS.map(c => {
                const isSelected = carrier === c.id || carrier === c.name;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCarrier(c.id as CarrierName)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/80 shadow-md ring-2 ring-orange-400/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="font-black text-xs block truncate text-slate-900">{c.name}</span>
                    <span className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded w-fit uppercase ${
                      isSelected ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {c.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carrier Tracking / AWB / BL Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest">
                {carrier} Tracking / AWB / BL Number
              </label>
              {testTrackingUrl && (
                <a
                  href={testTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLink size={13} /> Test Official {carrier} Link
                </a>
              )}
            </div>
            <input
              type="text"
              required
              value={carrierTrackingNumber}
              onChange={(e) => setCarrierTrackingNumber(e.target.value)}
              placeholder={`Enter official ${carrier} Air Waybill / Tracking No (e.g. 1234567890)`}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {/* Logistics Status & Estimated Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5">
                Current Shipment Status
              </label>
              <select
                value={shipmentStatus}
                onChange={(e) => setShipmentStatus(e.target.value as ShipmentStatus)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 font-bold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {SHIPMENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-1.5">
                Estimated Delivery Date
              </label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 font-semibold text-slate-900 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Quick Milestone Section */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Logistics Timeline & Updates ({invoice.trackingEvents?.length || 0} Milestones)
              </span>
              <button
                type="button"
                onClick={() => setShowAddMilestone(!showAddMilestone)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                <Plus size={14} /> {showAddMilestone ? 'Cancel Milestone' : '+ Add New Milestone'}
              </button>
            </div>

            {showAddMilestone && (
              <div className="bg-orange-50/50 p-3.5 rounded-xl border border-orange-200 space-y-3 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-orange-200 text-xs font-bold bg-white outline-none"
                    >
                      {SHIPMENT_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Location</label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Dubai Cargo Terminal"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-orange-200 text-xs font-semibold bg-white outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Progress Description / Notes</label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Custom clearance completed, package dispatched on flight..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-orange-200 text-xs font-semibold bg-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* List existing milestones */}
            {invoice.trackingEvents && invoice.trackingEvents.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {invoice.trackingEvents.map((evt, idx) => (
                  <div key={evt.id || idx} className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/70 text-xs flex items-start gap-2.5">
                    <Clock size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-900">{evt.status}</span>
                        <span className="text-[10px] text-gray-400">{new Date(evt.date).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-600 text-[11px] font-medium mt-0.5">{evt.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {evt.location}</span>
                        {evt.updatedBy && <span>• By {evt.updatedBy}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No milestone updates recorded yet.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2"
            >
              <ShieldCheck size={16} /> Save & Update Tracking
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CarrierAwbModal;
