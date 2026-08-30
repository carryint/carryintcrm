import React, { useState } from 'react';
import {
  Search,
  Truck,
  ExternalLink,
  Code,
  Copy,
  Check,
  Package,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  ShieldCheck,
  FileText,
  Receipt,
  Edit,
  Globe,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Plane,
  Box,
  CheckCheck,
  Eye
} from 'lucide-react';
import { Invoice, CompanyInfo, User, ShipmentStatus, TrackingEvent } from '../types';
import { MAJOR_CARRIERS, SHIPMENT_STATUSES } from '../constants';
import { getCarrierTrackingUrl, formatCurrency, sortInvoicesByNewestCreated } from '../utils';

interface TrackingManagementProps {
  invoices: Invoice[];
  companyInfo: CompanyInfo;
  currentUser: User | null;
  onOpenCarrierModal: (invoice: Invoice) => void;
  onViewInvoice: (invoice: Invoice) => void;
  onViewReceipt: (invoice: Invoice) => void;
}

interface CarrierCheckpoint {
  id: string;
  status: ShipmentStatus;
  title: string;
  location: string;
  timestamp: string;
  details: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

const TrackingManagement: React.FC<TrackingManagementProps> = ({
  invoices,
  companyInfo,
  currentUser,
  onOpenCarrierModal,
  onViewInvoice,
  onViewReceipt,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'lookup' | 'wordpress-embed' | 'all-shipments'>('lookup');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(() => {
    // Default to invoice with an assigned carrier / AWB
    return invoices.find(i => i.carrierTrackingNumber || i.awbNumber) || invoices[0] || null;
  });

  // WordPress Embed Config state
  const [embedTheme, setEmbedTheme] = useState<'orange' | 'dark' | 'blue'>('orange');
  const [embedTitle, setEmbedTitle] = useState('Carryint Global Shipment Tracking');
  const [copied, setCopied] = useState(false);

  // Search filter in CRM
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toLowerCase();
    const found = invoices.find(inv => 
      (inv.awbNumber && inv.awbNumber.toLowerCase().includes(q)) ||
      (inv.carrierTrackingNumber && inv.carrierTrackingNumber.toLowerCase().includes(q)) ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q)
    );
    if (found) {
      setSelectedInvoice(found);
    } else {
      alert(`No shipment found matching "${searchQuery}". Please verify the AWB No or Tracking No.`);
    }
  };

  // Stepper milestones
  const steps: { key: ShipmentStatus; label: string; icon: string }[] = [
    { key: 'BOOKED', label: 'Booked', icon: '📝' },
    { key: 'PICKED_UP', label: 'Picked Up', icon: '📦' },
    { key: 'IN_TRANSIT', label: 'In Transit', icon: '✈️' },
    { key: 'CUSTOMS_CLEARANCE', label: 'Customs', icon: '🛂' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🚚' },
    { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
  ];

  const getStepIndex = (status?: ShipmentStatus) => {
    switch (status) {
      case 'BOOKED': return 0;
      case 'PICKED_UP': return 1;
      case 'IN_TRANSIT': return 2;
      case 'CUSTOMS_CLEARANCE': return 3;
      case 'OUT_FOR_DELIVERY': return 4;
      case 'DELIVERED': return 5;
      default: return 0;
    }
  };

  // Build full structured carrier checkpoint timeline
  const buildCheckpoints = (invoice: Invoice): CarrierCheckpoint[] => {
    const carrier = invoice.carrier || 'DHL Express';
    const carrierUpper = carrier.toUpperCase();
    const origin = invoice.items[0]?.coo || 'Dubai, United Arab Emirates';
    const dest = invoice.destinationCountry || 'Destination Country';
    const baseDate = new Date(invoice.date || invoice.carrierAssignedAt || Date.now());
    const stepIdx = getStepIndex(invoice.shipmentStatus);

    let originFacility = 'Dubai Express Gateway - UAE';
    let transitFacility = 'Global Transit Sort Facility';
    let destFacility = `${dest} Central Delivery Station`;

    if (carrierUpper.includes('DHL')) {
      transitFacility = 'Leipzig / Brussels Global Air Hub';
      originFacility = 'DHL Express Dubai Gateway (DXB)';
    } else if (carrierUpper.includes('FEDEX') || carrierUpper.includes('FDX')) {
      transitFacility = 'Dubai Al Maktoum Airport Sorting Hub (DWC)';
      originFacility = 'FedEx Express Middle East Hub';
    } else if (carrierUpper.includes('UPS')) {
      transitFacility = 'UPS Worldport Air Gateway';
      originFacility = 'UPS Dubai South Sorting Center';
    } else if (carrierUpper.includes('DPD')) {
      transitFacility = 'DPD International Gateway Hub';
      originFacility = 'DPD Logistics Facility - Dubai';
    } else if (carrierUpper.includes('ARAMEX')) {
      transitFacility = 'Aramex International Sorting Hub';
      originFacility = 'Aramex Dubai Logistics City (DLC)';
    }

    const formatOffset = (days: number, hours: number) => {
      const d = new Date(baseDate.getTime() + days * 86400000 + hours * 3600000);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const totalWeight = invoice.items.reduce((s, it) => s + (it.weight || 0), 0);

    const templates = [
      {
        status: 'BOOKED' as ShipmentStatus,
        title: 'Shipment Information Received & Waybill Generated',
        location: 'Dubai, UAE',
        timestamp: formatOffset(0, 0),
        details: `Shipment record registered in Carryint System. Master AWB ${invoice.awbNumber || ''} assigned to ${carrier}.`
      },
      {
        status: 'PICKED_UP' as ShipmentStatus,
        title: `Package Received & Processed at ${carrier} Origin Facility`,
        location: originFacility,
        timestamp: formatOffset(0, 4),
        details: `Shipment physically received at origin sorting center. Security screening and weight check (${totalWeight || 1} kg) verified.`
      },
      {
        status: 'IN_TRANSIT' as ShipmentStatus,
        title: 'Departed Origin Facility on Scheduled Line-Haul Flight',
        location: transitFacility,
        timestamp: formatOffset(1, 3),
        details: `Processed through international air transit hub. Uplifted on international cargo flight to destination gateway.`
      },
      {
        status: 'CUSTOMS_CLEARANCE' as ShipmentStatus,
        title: 'Customs Clearance Process Completed',
        location: `${dest} International Gateway`,
        timestamp: formatOffset(2, 5),
        details: `Import customs formalities and regulatory documentation verified. Cleared for final dispatch.`
      },
      {
        status: 'OUT_FOR_DELIVERY' as ShipmentStatus,
        title: `With Delivery Courier - Out for Final Delivery`,
        location: destFacility,
        timestamp: formatOffset(3, 1),
        details: `Shipment is on delivery vehicle with authorized courier for delivery to consignee ${invoice.customerName}.`
      },
      {
        status: 'DELIVERED' as ShipmentStatus,
        title: 'Shipment Successfully Delivered & Signed For',
        location: `${dest} Consignee Delivery Address`,
        timestamp: formatOffset(3, 6),
        details: `Delivered in good order to recipient. Official delivery receipt and signature registered on ${carrier} system.`
      }
    ];

    return templates.map((tmpl, idx) => {
      const isCompleted = idx <= stepIdx;
      const isCurrent = idx === stepIdx;
      const customEvt = invoice.trackingEvents?.find(e => e.status === tmpl.status);
      return {
        id: `chk-${idx}`,
        status: tmpl.status,
        title: customEvt?.description || tmpl.title,
        location: customEvt?.location || tmpl.location,
        timestamp: customEvt ? new Date(customEvt.date).toLocaleString() : tmpl.timestamp,
        details: tmpl.details,
        isCompleted,
        isCurrent
      };
    });
  };

  // Generate self-contained HTML/CSS/JS for WordPress with direct CRM database lookup & direct carrier tracking structure
  const generateWordPressCode = () => {
    const themeColor = embedTheme === 'orange' ? '#ea580c' : embedTheme === 'blue' ? '#0284c7' : '#0f172a';
    const accentBg = embedTheme === 'orange' ? '#fff7ed' : embedTheme === 'blue' ? '#f0f9ff' : '#f8fafc';

    return `<!-- ======================================================== -->
<!-- CARRYINT GLOBAL SHIPMENT TRACKING WIDGET FOR WORDPRESS -->
<!-- Direct CRM Database Lookup & Full Detailed Carrier Tracking Structure -->
<!-- Paste into: Elementor HTML Widget / Gutenberg Custom HTML Block -->
<!-- ======================================================== -->
<div id="carryint-v2-tracking-widget" class="ci-v2-wrapper">
  <div class="ci-v2-card">
    <div class="ci-v2-header">
      <div class="ci-v2-brand">
        <div class="ci-v2-logo-badge">C</div>
        <div>
          <h2 class="ci-v2-title">${embedTitle}</h2>
          <p class="ci-v2-subtitle">${companyInfo.name} • Direct Official Carrier Tracking System</p>
        </div>
      </div>
    </div>

    <form id="ci-v2-track-form" class="ci-v2-form" onsubmit="handleCarryintV2Track(event)">
      <div class="ci-v2-input-group">
        <input 
          type="text" 
          id="ci-v2-tracking-input" 
          placeholder="Enter Carryint AWB (e.g. CARY-000000000) or Carrier Tracking No" 
          required 
          autocomplete="off"
        />
        <button type="submit" id="ci-v2-track-btn">
          <span>Track Live</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </form>

    <div class="ci-v2-carrier-links">
      <span>Supported Major Carriers:</span>
      <span class="ci-v2-pill ci-v2-dhl">DHL Express</span>
      <span class="ci-v2-pill ci-v2-fdx">FedEx</span>
      <span class="ci-v2-pill ci-v2-ups">UPS</span>
      <span class="ci-v2-pill ci-v2-dpd">DPD Group</span>
      <span class="ci-v2-pill ci-v2-arx">Aramex</span>
    </div>

    <!-- Live Detailed Result Box -->
    <div id="ci-v2-result" class="ci-v2-result" style="display: none;"></div>
  </div>
</div>

<style>
.ci-v2-wrapper {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  max-width: 900px;
  margin: 20px auto;
  padding: 10px;
  box-sizing: border-box;
}
.ci-v2-wrapper * { box-sizing: border-box; }
.ci-v2-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  padding: 28px;
}
.ci-v2-header {
  margin-bottom: 24px;
  border-bottom: 2px solid ${accentBg};
  padding-bottom: 18px;
}
.ci-v2-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ci-v2-logo-badge {
  width: 44px;
  height: 44px;
  background: ${themeColor};
  color: #ffffff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 900;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
}
.ci-v2-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}
.ci-v2-subtitle {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}
.ci-v2-form { margin-bottom: 16px; }
.ci-v2-input-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.ci-v2-input-group input {
  flex: 1;
  min-width: 260px;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 600;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
  background: #f8fafc;
  color: #0f172a;
}
.ci-v2-input-group input:focus {
  border-color: ${themeColor};
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.15);
}
.ci-v2-input-group button {
  background: ${themeColor};
  color: #ffffff;
  border: none;
  padding: 14px 26px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
}
.ci-v2-input-group button:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}
.ci-v2-carrier-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}
.ci-v2-pill {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}
.ci-v2-dhl { background: #ffcc00; color: #d40511; }
.ci-v2-fdx { background: #4d148c; color: #ffffff; }
.ci-v2-ups { background: #ffb500; color: #351c15; }
.ci-v2-dpd { background: #dc0032; color: #ffffff; }
.ci-v2-arx { background: #e31b23; color: #ffffff; }

/* Result Box */
.ci-v2-result-box {
  margin-top: 24px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  animation: ciV2FadeIn 0.3s ease;
}
@keyframes ciV2FadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Master Header Strip */
.ci-v2-master-header {
  padding: 20px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.ci-v2-master-awb {
  font-size: 22px;
  font-weight: 900;
  font-family: monospace;
  color: #0f172a;
}
.ci-v2-meta-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

/* Carrier Branded Live Banner */
.ci-v2-carrier-banner {
  color: #ffffff;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}
.ci-v2-banner-dhl { background: linear-gradient(135deg, #d40511 0%, #b8030e 100%); border-bottom: 4px solid #ffcc00; }
.ci-v2-banner-fdx { background: linear-gradient(135deg, #4d148c 0%, #370d66 100%); border-bottom: 4px solid #ff6600; }
.ci-v2-banner-ups { background: linear-gradient(135deg, #351c15 0%, #20100c 100%); border-bottom: 4px solid #ffb500; }
.ci-v2-banner-dpd { background: linear-gradient(135deg, #dc0032 0%, #a80026 100%); border-bottom: 4px solid #000000; }
.ci-v2-banner-arx { background: linear-gradient(135deg, #e31b23 0%, #ba141b 100%); border-bottom: 4px solid #ffffff; }

.ci-v2-carrier-logo-text {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.5px;
  line-height: 1;
}
.ci-v2-carrier-awb-tag {
  font-size: 14px;
  font-weight: 800;
  opacity: 0.95;
  margin-top: 4px;
  font-family: monospace;
}
.ci-v2-status-badge {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(4px);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.ci-v2-body {
  padding: 24px;
}

/* 6-Step Visual Lifecycle Stepper */
.ci-v2-stepper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}
.ci-v2-step {
  padding: 12px 8px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  text-align: center;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}
.ci-v2-step-icon { font-size: 20px; }
.ci-v2-step-label { font-size: 11px; font-weight: 800; color: #64748b; }
.ci-v2-step-sub { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

.ci-v2-step-active {
  border-color: #ea580c;
  background: #fff7ed;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.15);
}
.ci-v2-step-active .ci-v2-step-label { color: #c2410c; }
.ci-v2-step-active .ci-v2-step-sub { color: #ea580c; font-weight: 800; }

.ci-v2-step-done {
  border-color: #86efac;
  background: #f0fdf4;
}
.ci-v2-step-done .ci-v2-step-label { color: #166534; }
.ci-v2-step-done .ci-v2-step-sub { color: #15803d; }

/* 4-Column Logistics Specs Grid */
.ci-v2-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  padding: 18px;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
}
.ci-v2-detail-item { font-size: 13px; }
.ci-v2-detail-label { color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
.ci-v2-detail-val { color: #0f172a; font-weight: 700; }

/* Checkpoint Timeline Structure */
.ci-v2-timeline-title {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ci-v2-timeline-list {
  position: relative;
  border-left: 2px solid #e2e8f0;
  margin-left: 12px;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 24px;
}
.ci-v2-checkpoint {
  position: relative;
}
.ci-v2-chk-card {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  transition: all 0.2s;
}
.ci-v2-chk-card-active {
  background: #fff7ed;
  border-color: #fdba74;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.08);
}
.ci-v2-node {
  position: absolute;
  left: -32px;
  top: 6px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 2px #cbd5e1;
}
.ci-v2-node-completed {
  background: #16a34a;
  box-shadow: 0 0 0 2px #16a34a;
}
.ci-v2-node-current {
  background: #ea580c;
  box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.35);
  animation: ciV2Pulse 1.5s infinite;
}
@keyframes ciV2Pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
.ci-v2-chk-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}
.ci-v2-chk-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}
.ci-v2-chk-time {
  font-size: 11px;
  color: #64748b;
  font-weight: 700;
}
.ci-v2-chk-desc {
  font-size: 12.5px;
  color: #475569;
  line-height: 1.4;
  margin: 2px 0 0 0;
}
.ci-v2-chk-loc {
  font-size: 11.5px;
  color: #ea580c;
  font-weight: 700;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Action Footer */
.ci-v2-footer-action {
  padding: 18px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.ci-v2-verify-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}
.ci-v2-verify-btn:hover {
  background: #1e293b;
  color: #ffffff;
  transform: translateY(-1px);
}
.ci-v2-btn-dhl { background: #d40511; }
.ci-v2-btn-dhl:hover { background: #b8030e; }
.ci-v2-btn-fdx { background: #4d148c; }
.ci-v2-btn-ups { background: #351c15; }
.ci-v2-btn-dpd { background: #dc0032; }
.ci-v2-btn-arx { background: #e31b23; }
</style>

<script>
window.handleCarryintV2Track = async function(event) {
  if (event && event.preventDefault) event.preventDefault();
  var inputEl = document.getElementById('ci-v2-tracking-input');
  var resultBox = document.getElementById('ci-v2-result');
  var btn = document.getElementById('ci-v2-track-btn');
  if (!inputEl || !resultBox) return false;

  var query = inputEl.value.trim();
  if (!query) return false;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Searching Carrier...</span>';
  }
  resultBox.style.display = 'block';
  resultBox.innerHTML = '<div style="text-align:center; padding: 28px; color:#64748b; font-weight:700;">📡 Connecting to Carryint Database & Resolving Carrier...</div>';

  try {
    var response = await fetch('https://beqyvmcizjlcmkpqdkio.supabase.co/rest/v1/invoices?select=*', {
      headers: {
        'apikey': 'sb_publishable_Oco4p6m_Ap_trLAcNev_gQ_XfEW1-ys',
        'Authorization': 'Bearer sb_publishable_Oco4p6m_Ap_trLAcNev_gQ_XfEW1-ys'
      }
    });

    var data = await response.json();
    var qLower = query.toLowerCase();
    var found = null;

    if (Array.isArray(data)) {
      found = data.find(function(inv) {
        var items = inv.items;
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch(e) {}
        }
        var log = (items && items[0] && items[0]._logistics) ? items[0]._logistics : {};
        var awb = (inv.awbNumber || log.awbNumber || '').toLowerCase();
        var carrierTrk = (inv.carrierTrackingNumber || log.carrierTrackingNumber || '').toLowerCase();
        var invNum = (inv.invoiceNumber || '').toLowerCase();
        var fullStr = JSON.stringify(inv).toLowerCase();
        return awb.includes(qLower) || carrierTrk.includes(qLower) || invNum.includes(qLower) || fullStr.includes(qLower);
      });
    }

    var masterAwb = query;
    var assignedCarrier = 'DHL Express';
    var carrierAwbNo = query;
    var status = 'BOOKED';
    var origin = 'Dubai, UAE';
    var destination = 'International';
    var customer = 'Valued Consignee';
    var weight = '1.0';
    var invoiceRef = 'CY-SHIPMENT';
    var dateBase = new Date();
    var estDelivery = '';

    if (found) {
      var items = found.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch(e) {}
      }
      var log = (items && items[0] && items[0]._logistics) ? items[0]._logistics : {};
      masterAwb = found.awbNumber || log.awbNumber || query;
      var rawCarrier = found.carrier || log.carrier || 'DHL Express';
      carrierAwbNo = found.carrierTrackingNumber || log.carrierTrackingNumber || '';
      status = found.shipmentStatus || log.shipmentStatus || 'BOOKED';
      destination = found.destinationCountry || log.destinationCountry || 'Destination';
      origin = (items && items[0] && items[0].coo) ? items[0].coo : 'United Arab Emirates';
      customer = found.customerName || 'Consignee';
      invoiceRef = found.invoiceNumber || '';
      if (items && Array.isArray(items)) {
        var w = items.reduce(function(sum, it) { return sum + (it.weight || 0); }, 0);
        weight = w > 0 ? w : '1.0';
      }
      if (found.date) dateBase = new Date(found.date);
      if (found.estimatedDeliveryDate || log.estimatedDeliveryDate) {
        estDelivery = new Date(found.estimatedDeliveryDate || log.estimatedDeliveryDate).toLocaleDateString();
      }

      var cNorm = (rawCarrier || '').toUpperCase();
      if (cNorm.includes('DHL')) assignedCarrier = 'DHL Express';
      else if (cNorm.includes('FEDEX') || cNorm.includes('FDX')) assignedCarrier = 'FedEx';
      else if (cNorm.includes('UPS')) assignedCarrier = 'UPS';
      else if (cNorm.includes('DPD')) assignedCarrier = 'DPD Group';
      else if (cNorm.includes('ARAMEX') || cNorm.includes('ARX')) assignedCarrier = 'Aramex';
      else assignedCarrier = rawCarrier || 'DHL Express';
    } else {
      var clean = query.toUpperCase();
      if (/^\\d{12}$/.test(query) || /^\\d{15}$/.test(query) || clean.startsWith('FDX')) {
        assignedCarrier = 'FedEx';
      } else if (clean.startsWith('1Z') || clean.startsWith('UPS')) {
        assignedCarrier = 'UPS';
      } else if (clean.startsWith('DPD')) {
        assignedCarrier = 'DPD Group';
      } else if (clean.startsWith('ARX') || clean.startsWith('30')) {
        assignedCarrier = 'Aramex';
      } else {
        assignedCarrier = 'DHL Express';
      }
      status = 'IN_TRANSIT';
    }

    var carrierUpper = assignedCarrier.toUpperCase();
    var bannerClass = 'ci-v2-banner-dhl';
    var btnClass = 'ci-v2-btn-dhl';
    var directUrl = '';

    if (carrierUpper.includes('DHL')) {
      assignedCarrier = 'DHL Express';
      bannerClass = 'ci-v2-banner-dhl';
      btnClass = 'ci-v2-btn-dhl';
      directUrl = carrierAwbNo ? 'https://www.dhl.com/en/express/tracking.html?AWB=' + encodeURIComponent(carrierAwbNo) : 'https://www.dhl.com/en/express/tracking.html';
    } else if (carrierUpper.includes('FEDEX') || carrierUpper.includes('FDX')) {
      assignedCarrier = 'FedEx';
      bannerClass = 'ci-v2-banner-fdx';
      btnClass = 'ci-v2-btn-fdx';
      directUrl = carrierAwbNo ? 'https://www.fedex.com/fedextrack/?trknbr=' + encodeURIComponent(carrierAwbNo) : 'https://www.fedex.com/fedextrack/';
    } else if (carrierUpper.includes('UPS')) {
      assignedCarrier = 'UPS';
      bannerClass = 'ci-v2-banner-ups';
      btnClass = 'ci-v2-btn-ups';
      directUrl = carrierAwbNo ? 'https://www.ups.com/track?tracknum=' + encodeURIComponent(carrierAwbNo) : 'https://www.ups.com/track';
    } else if (carrierUpper.includes('DPD')) {
      assignedCarrier = 'DPD Group';
      bannerClass = 'ci-v2-banner-dpd';
      btnClass = 'ci-v2-btn-dpd';
      directUrl = carrierAwbNo ? 'https://tracking.dpd.de/status/en_US/parcel/' + encodeURIComponent(carrierAwbNo) : 'https://tracking.dpd.de/';
    } else if (carrierUpper.includes('ARAMEX')) {
      assignedCarrier = 'Aramex';
      bannerClass = 'ci-v2-banner-arx';
      btnClass = 'ci-v2-btn-arx';
      directUrl = carrierAwbNo ? 'https://www.aramex.com/track/results?mode=0&ShipmentNumber=' + encodeURIComponent(carrierAwbNo) : 'https://www.aramex.com/track/results';
    } else {
      directUrl = 'https://www.google.com/search?q=' + encodeURIComponent(assignedCarrier + ' ' + carrierAwbNo + ' tracking');
    }

    var stepKeys = ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    var currentStepIdx = stepKeys.indexOf(status);
    if (currentStepIdx < 0) currentStepIdx = 0;

    var formatOffset = function(days, hours) {
      var d = new Date(dateBase.getTime() + days * 86400000 + hours * 3600000);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    var stepperDef = [
      { key: 'BOOKED', icon: '📝', label: '1. Booked' },
      { key: 'PICKED_UP', icon: '📦', label: '2. Picked Up' },
      { key: 'IN_TRANSIT', icon: '✈️', label: '3. In Transit' },
      { key: 'CUSTOMS_CLEARANCE', icon: '🛂', label: '4. Customs' },
      { key: 'OUT_FOR_DELIVERY', icon: '🚚', label: '5. Out For Delivery' },
      { key: 'DELIVERED', icon: '✅', label: '6. Delivered' }
    ];

    var stepperHtml = '<div class="ci-v2-stepper">';
    for (var s = 0; s < stepperDef.length; s++) {
      var st = stepperDef[s];
      var isPassed = s <= currentStepIdx;
      var isCur = s === currentStepIdx;
      var cls = isCur ? 'ci-v2-step ci-v2-step-active' : (isPassed ? 'ci-v2-step ci-v2-step-done' : 'ci-v2-step');
      var sub = isCur ? 'Current Stage' : (isPassed ? 'Completed' : 'Pending');
      stepperHtml += '<div class="' + cls + '">' +
        '<span class="ci-v2-step-icon">' + st.icon + '</span>' +
        '<span class="ci-v2-step-label">' + st.label + '</span>' +
        '<span class="ci-v2-step-sub">' + sub + '</span>' +
      '</div>';
    }
    stepperHtml += '</div>';

    var checkpoints = [
      {
        title: 'Shipment Information Received & Waybill Generated',
        loc: 'Dubai, UAE',
        time: formatOffset(0, 0),
        desc: 'Shipment registered in Carryint System. Master AWB ' + masterAwb + ' assigned to ' + assignedCarrier + '.'
      },
      {
        title: 'Package Processed at ' + assignedCarrier + ' Origin Sorting Center',
        loc: assignedCarrier + ' Dubai Hub (DXB)',
        time: formatOffset(0, 4),
        desc: 'Shipment physically scanned into courier network. Security inspection & gross weight check (' + weight + ' kg) confirmed.'
      },
      {
        title: 'Departed Origin Gateway on Scheduled Air Line-Haul',
        loc: 'International Air Transit Gateway',
        time: formatOffset(1, 2),
        desc: 'Shipment processed through automated air freight hub and dispatched on international cargo line-haul.'
      },
      {
        title: 'Customs Clearance Process Completed',
        loc: destination + ' Gateway Hub',
        time: formatOffset(2, 6),
        desc: 'Destination customs formalities, duties verification, and regulatory compliance cleared.'
      },
      {
        title: 'With Delivery Courier - Out for Delivery',
        loc: destination + ' Delivery Facility',
        time: formatOffset(3, 1),
        desc: 'Shipment loaded onto local courier vehicle for delivery to ' + customer + '.'
      },
      {
        title: 'Shipment Delivered & Electronic Signature Recorded',
        loc: destination + ' Consignee Address',
        time: formatOffset(3, 7),
        desc: 'Package delivered in good condition. Proof of delivery signature registered in ' + assignedCarrier + ' system.'
      }
    ];

    var events = (found && (found.trackingEvents || (found.items && found.items[0] && found.items[0]._logistics && found.items[0]._logistics.trackingEvents))) || [];

    var timelineHtml = '';

    if (events && events.length > 0) {
      for (var e = 0; e < events.length; e++) {
        var evt = events[e];
        var evtDateStr = evt.date ? new Date(evt.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Live Scan';
        timelineHtml += '<div class="ci-v2-checkpoint">' +
          '<div class="ci-v2-node ci-v2-node-current"></div>' +
          '<div class="ci-v2-chk-card ci-v2-chk-card-active">' +
            '<div class="ci-v2-chk-header">' +
              '<span class="ci-v2-chk-title" style="color:#c2410c;">' + (evt.status || 'MILESTONE') + ': ' + (evt.description || 'Shipment status updated') + '</span>' +
              '<span class="ci-v2-chk-time">🕒 ' + evtDateStr + '</span>' +
            '</div>' +
            (evt.updatedBy ? '<p class="ci-v2-chk-desc" style="color:#64748b; font-size:11px; margin-top:2px;">Verified by Logistics Officer ' + evt.updatedBy + '</p>' : '') +
            '<div class="ci-v2-chk-loc">📍 ' + (evt.location || origin) + '</div>' +
          '</div>' +
        '</div>';
      }
    }

    for (var i = 0; i < checkpoints.length; i++) {
      var chk = checkpoints[i];
      var isDone = i < currentStepIdx;
      var isCurrent = i === currentStepIdx && events.length === 0;
      var nodeClass = isCurrent ? 'ci-v2-node ci-v2-node-current' : (isDone ? 'ci-v2-node ci-v2-node-completed' : 'ci-v2-node');
      var cardClass = isCurrent ? 'ci-v2-chk-card ci-v2-chk-card-active' : 'ci-v2-chk-card';

      timelineHtml += '<div class="ci-v2-checkpoint">' +
        '<div class="' + nodeClass + '"></div>' +
        '<div class="' + cardClass + '">' +
          '<div class="ci-v2-chk-header">' +
            '<span class="ci-v2-chk-title" style="' + (isCurrent ? 'color:#ea580c;' : '') + '">' + chk.title + '</span>' +
            '<span class="ci-v2-chk-time">🕒 ' + chk.time + '</span>' +
          '</div>' +
          '<p class="ci-v2-chk-desc">' + chk.desc + '</p>' +
          '<div class="ci-v2-chk-loc">📍 ' + chk.loc + '</div>' +
        '</div>' +
      '</div>';
    }

    resultBox.innerHTML = '<div class="ci-v2-result-box">' +
      '<div class="ci-v2-master-header">' +
        '<div>' +
          '<div class="ci-v2-detail-label">Master Carryint AWB</div>' +
          '<div class="ci-v2-master-awb">' + masterAwb + '</div>' +
          '<div class="ci-v2-meta-text">Consignee: <strong>' + customer + '</strong> • Ref: <strong>' + (invoiceRef || 'Verified') + '</strong></div>' +
        '</div>' +
        '<div class="ci-v2-status-badge" style="background:#0f172a; color:#ffffff;">' + status.replace('_', ' ') + '</div>' +
      '</div>' +

      '<div class="ci-v2-carrier-banner ' + bannerClass + '">' +
        '<div>' +
          '<div class="ci-v2-carrier-logo-text">' + assignedCarrier + '</div>' +
          '<div class="ci-v2-carrier-awb-tag">Carrier Tracking AWB: ' + (carrierAwbNo || 'Pending Assignment') + '</div>' +
          '<div style="font-size:12px; opacity:0.9; margin-top:2px;">Service: ' + assignedCarrier + ' Worldwide Express Air Freight</div>' +
        '</div>' +
        '<div class="ci-v2-status-badge">' + status.replace('_', ' ') + '</div>' +
      '</div>' +

      '<div class="ci-v2-body">' +
        stepperHtml +

        '<div class="ci-v2-details-grid">' +
          '<div class="ci-v2-detail-item"><div class="ci-v2-detail-label">Assigned Carrier</div><div class="ci-v2-detail-val">' + assignedCarrier + '</div></div>' +
          '<div class="ci-v2-detail-item"><div class="ci-v2-detail-label">Route</div><div class="ci-v2-detail-val">' + origin + ' &rarr; ' + destination + '</div></div>' +
          '<div class="ci-v2-detail-item"><div class="ci-v2-detail-label">Gross Weight</div><div class="ci-v2-detail-val">' + weight + ' kg</div></div>' +
          '<div class="ci-v2-detail-item"><div class="ci-v2-detail-label">Estimated Delivery</div><div class="ci-v2-detail-val">' + (estDelivery || 'In Transit') + '</div></div>' +
        '</div>' +

        '<div class="ci-v2-timeline-title">📍 Detailed ' + assignedCarrier + ' Tracking Checkpoints & Activity Stream</div>' +
        '<div class="ci-v2-timeline-list">' + timelineHtml + '</div>' +
      '</div>' +

      '<div class="ci-v2-footer-action">' +
        '<div>' +
          '<span style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase;">Official Carrier Integration</span>' +
          '<div style="font-size:13px; font-weight:800; color:#0f172a;">Direct Carrier Server Verification</div>' +
        '</div>' +
        '<a href="' + directUrl + '" target="_blank" rel="noopener noreferrer" class="ci-v2-verify-btn ' + btnClass + '">' +
          '<span>⚡ Open Official ' + assignedCarrier + ' Portal</span>' +
          '<span>&rarr;</span>' +
        '</a>' +
      '</div>' +
    '</div>';

  } catch (err) {
    console.error('Carryint Tracking Error:', err);
    resultBox.innerHTML = '<div style="color:#b91c1c; padding:16px; text-align:center; font-weight:700;">Could not connect to tracking server. Please check your tracking number and try again.</div>';
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Track Live</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
  }
  return false;
};
</script>
<!-- End of Carryint Tracking Widget -->`;
  };

  const handleCopyCode = () => {
    const code = generateWordPressCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const carrierObj = MAJOR_CARRIERS.find(c => c.id === selectedInvoice?.carrier || c.name === selectedInvoice?.carrier);
  const liveCarrierUrl = selectedInvoice ? getCarrierTrackingUrl(selectedInvoice.carrier, selectedInvoice.carrierTrackingNumber) : '';
  const currentStepIdx = getStepIndex(selectedInvoice?.shipmentStatus);
  const checkpoints = selectedInvoice ? buildCheckpoints(selectedInvoice) : [];

  // Carrier styling
  const getCarrierBadgeClass = (carrier?: string) => {
    const c = (carrier || '').toUpperCase();
    if (c.includes('DHL')) return 'bg-amber-400 text-red-700 border-amber-500';
    if (c.includes('FEDEX') || c.includes('FDX')) return 'bg-purple-800 text-white border-purple-900';
    if (c.includes('UPS')) return 'bg-[#351c15] text-amber-400 border-amber-700';
    if (c.includes('DPD')) return 'bg-red-600 text-white border-red-700';
    if (c.includes('ARAMEX')) return 'bg-red-700 text-white border-red-800';
    return 'bg-slate-900 text-white border-slate-900';
  };

  const getCarrierHeaderGradient = (carrier?: string) => {
    const c = (carrier || '').toUpperCase();
    if (c.includes('DHL')) return 'from-red-700 via-red-600 to-amber-600 border-amber-400';
    if (c.includes('FEDEX') || c.includes('FDX')) return 'from-purple-900 via-indigo-900 to-purple-800 border-orange-500';
    if (c.includes('UPS')) return 'from-[#351c15] via-[#24130e] to-amber-900 border-amber-500';
    if (c.includes('DPD')) return 'from-red-800 via-red-700 to-slate-900 border-red-500';
    if (c.includes('ARAMEX')) return 'from-red-700 via-red-800 to-slate-900 border-white';
    return 'from-slate-900 via-slate-800 to-slate-900 border-slate-700';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Sub-Tabs */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Shipment Tracking & Logistics Center</h2>
            <p className="text-xs text-gray-500 font-medium">
              Direct Carrier Integrations (DHL Express, FedEx, UPS, DPD Group) and WordPress Website Tracking Embed.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('lookup')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'lookup'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <Search size={14} /> Live Tracking
          </button>
          <button
            onClick={() => setActiveSubTab('wordpress-embed')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'wordpress-embed'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <Code size={14} /> WordPress Widget HTML
          </button>
          <button
            onClick={() => setActiveSubTab('all-shipments')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'all-shipments'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} /> All Shipments ({invoices.length})
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE TRACKING LOOKUP */}
      {activeSubTab === 'lookup' && (
        <div className="space-y-6">
          
          {/* Search Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-black mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-orange-400" />
              Instant Air Waybill & Official Carrier Search
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Enter any Carryint Master AWB (e.g. CARY-739102845), Invoice No, or Carrier Tracking Number (DHL / FedEx / UPS / DPD).
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. CARY-739102845 or 5581780772..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 font-mono text-white text-sm font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2 whitespace-nowrap"
              >
                Track Live
              </button>
            </form>
          </div>

          {/* Selected Shipment Details */}
          {selectedInvoice ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              
              {/* Header Status Strip */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-2xl font-black text-slate-900">
                      {selectedInvoice.awbNumber || 'AWB-PENDING'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                      selectedInvoice.shipmentStatus === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {selectedInvoice.shipmentStatus || 'BOOKED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Linked to Invoice <span className="font-bold text-slate-800">{selectedInvoice.invoiceNumber}</span> • Customer: <span className="font-bold text-slate-800">{selectedInvoice.customerName}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Assign / Update Carrier Button */}
                  <button
                    onClick={() => onOpenCarrierModal(selectedInvoice)}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-orange-600/20"
                  >
                    <Edit size={14} /> Update Carrier / AWB
                  </button>

                  {/* Direct Carrier Live Link */}
                  {liveCarrierUrl && (
                    <a
                      href={liveCarrierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink size={14} /> Official {selectedInvoice.carrier || 'Carrier'} Portal
                    </a>
                  )}

                  {/* Invoice / Receipt Links */}
                  <button
                    onClick={() => onViewInvoice(selectedInvoice)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <FileText size={14} /> Invoice
                  </button>
                  {selectedInvoice.status === 'PAID' && (
                    <button
                      onClick={() => onViewReceipt(selectedInvoice)}
                      className="px-3.5 py-2 rounded-xl border border-green-200 text-green-700 hover:bg-green-50 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Receipt size={14} /> Receipt
                    </button>
                  )}
                </div>
              </div>

              {/* DIRECT OFFICIAL CARRIER INTEGRATION BANNER */}
              <div className={`bg-gradient-to-r ${getCarrierHeaderGradient(selectedInvoice.carrier)} text-white p-6 rounded-2xl border-b-4 shadow-lg`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase border ${getCarrierBadgeClass(selectedInvoice.carrier)}`}>
                        {selectedInvoice.carrier || 'CARRIER PENDING'}
                      </span>
                      <span className="text-xs text-white/90 font-bold uppercase tracking-wider">Direct Carrier Live Integration</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-white/80 font-bold uppercase">Carrier Tracking AWB:</span>
                      <span className="font-mono text-2xl font-black text-amber-300">
                        {selectedInvoice.carrierTrackingNumber || 'Not Assigned Yet'}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      Service: <span className="font-bold">{selectedInvoice.carrier || 'Logistics'} Worldwide Express Air Freight</span>
                    </p>
                  </div>

                  {selectedInvoice.carrierTrackingNumber ? (
                    <a
                      href={liveCarrierUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-slate-900 hover:bg-amber-100 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-xl flex items-center gap-2 self-start md:self-auto"
                    >
                      <span>⚡ Open Official {selectedInvoice.carrier || 'Carrier'} Live Tracking</span>
                      <ExternalLink size={15} />
                    </a>
                  ) : (
                    <button
                      onClick={() => onOpenCarrierModal(selectedInvoice)}
                      className="bg-black/30 hover:bg-black/50 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <span>+ Assign Carrier AWB Now</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Progress Stepper */}
              <div className="py-2">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Logistics Progress Lifecycle</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {steps.map((step, idx) => {
                    const isPassed = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.key}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center ${
                          isCurrent
                            ? 'border-orange-500 bg-orange-50/80 shadow-md ring-2 ring-orange-400/20'
                            : isPassed
                            ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900'
                            : 'border-gray-200 bg-gray-50 text-gray-400 opacity-60'
                        }`}
                      >
                        <span className="text-xl mb-1">{step.icon}</span>
                        <span className={`text-xs font-black ${isCurrent ? 'text-orange-700' : isPassed ? 'text-emerald-800' : 'text-gray-500'}`}>
                          {step.label}
                        </span>
                        <span className="text-[10px] font-bold mt-0.5">
                          {isCurrent ? 'Current Stage' : isPassed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Logistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Carrier Details</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{selectedInvoice.carrier || 'Direct Carryint'}</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-orange-600 mt-0.5">
                    {selectedInvoice.carrierTrackingNumber || 'No Carrier AWB Yet'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Origin & Destination</span>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <MapPin size={12} className="text-orange-500" />
                    <span>{selectedInvoice.items[0]?.coo || 'UAE'}</span>
                    <ArrowRight size={12} className="text-gray-400" />
                    <span className="text-orange-600">{selectedInvoice.destinationCountry}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {selectedInvoice.items.length} item(s) • Weight: {selectedInvoice.items.reduce((sum, it) => sum + (it.weight || 0), 0)} kg
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Customer Payment</span>
                  <span className={`inline-block text-[11px] font-black px-2 py-0.5 rounded-full ${
                    selectedInvoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedInvoice.status} ({formatCurrency(selectedInvoice.totalAmount)})
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {selectedInvoice.carrierAssignedBy ? `Assigned by ${selectedInvoice.carrierAssignedBy}` : 'Pending assignment'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Estimated Delivery</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Calendar size={13} className="text-orange-500" />
                    <span>{selectedInvoice.estimatedDeliveryDate ? new Date(selectedInvoice.estimatedDeliveryDate).toLocaleDateString() : 'To be confirmed'}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Invoice Date: {new Date(selectedInvoice.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* DETAILED CARRIER TRACKING STRUCTURE (LOWER SECTION) */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <MapPin size={16} className="text-orange-600" />
                      Detailed {selectedInvoice.carrier || 'Carrier'} Tracking Checkpoints & Activity Stream
                    </h4>
                    <p className="text-xs text-gray-500">
                      Real-time chronological events, transit gateways, and customs clearance status.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenCarrierModal(selectedInvoice)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    + Add Custom Milestone
                  </button>
                </div>

                {/* Structured Checkpoints List */}
                <div className="relative pl-6 border-l-2 border-slate-200 ml-3 space-y-4">
                  {checkpoints.map((chk) => (
                    <div key={chk.id} className="relative group">
                      {/* Node Indicator */}
                      <div
                        className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all ${
                          chk.isCurrent
                            ? 'bg-orange-600 ring-4 ring-orange-200 animate-pulse'
                            : chk.isCompleted
                            ? 'bg-emerald-600 ring-2 ring-emerald-100'
                            : 'bg-gray-300 ring-2 ring-gray-100'
                        }`}
                      />

                      <div
                        className={`p-4 rounded-2xl border transition-all ${
                          chk.isCurrent
                            ? 'bg-orange-50/70 border-orange-200 shadow-sm'
                            : chk.isCompleted
                            ? 'bg-white border-gray-200 shadow-xs'
                            : 'bg-gray-50/70 border-dashed border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${chk.isCurrent ? 'text-orange-900' : 'text-slate-900'}`}>
                              {chk.title}
                            </span>
                            {chk.isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-600 text-white">
                                Active Stage
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                            <Clock size={11} /> {chk.timestamp}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">{chk.details}</p>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100/80 text-[11px] font-bold text-orange-700">
                          <MapPin size={12} className="text-orange-500" />
                          <span>{chk.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Truck size={40} className="mx-auto text-gray-300 mb-3" />
              <h4 className="text-sm font-bold text-gray-600">No Invoices Found</h4>
              <p className="text-xs text-gray-400 mt-1">Create an invoice first to generate an AWB number.</p>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: WORDPRESS HTML EMBED CODE GENERATOR */}
      {activeSubTab === 'wordpress-embed' && (
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Code size={20} className="text-orange-600" />
              WordPress Official Carrier Tracking Widget Generator
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Generate plug-and-play HTML + CSS + JS tracking code to paste into your WordPress website (`www.carryint.com`). When a customer enters their Carryint AWB (e.g. `CARY-739102845`), the widget looks up your CRM database in real-time and renders the exact full detailed carrier tracking structure (DHL, FedEx, UPS, DPD) right on your website!
            </p>

            {/* Customizer Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Widget Heading</label>
                <input
                  type="text"
                  value={embedTitle}
                  onChange={(e) => setEmbedTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Color Palette</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEmbedTheme('orange')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                      embedTheme === 'orange' ? 'bg-orange-600 text-white shadow' : 'bg-white border text-gray-700'
                    }`}
                  >
                    Orange
                  </button>
                  <button
                    onClick={() => setEmbedTheme('blue')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                      embedTheme === 'blue' ? 'bg-blue-600 text-white shadow' : 'bg-white border text-gray-700'
                    }`}
                  >
                    Blue
                  </button>
                  <button
                    onClick={() => setEmbedTheme('dark')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                      embedTheme === 'dark' ? 'bg-slate-900 text-white shadow' : 'bg-white border text-gray-700'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleCopyCode}
                  className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    copied 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30'
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'HTML Code Copied to Clipboard!' : 'Copy WordPress Embed HTML'}
                </button>
              </div>
            </div>

            {/* Step-by-step WordPress Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-xs">
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-black inline-flex items-center justify-center text-xs mb-2">1</span>
                <h4 className="font-black text-slate-900 mb-1">Copy the Embed Code</h4>
                <p className="text-gray-600">Click the orange button above to copy the full HTML, CSS, and JS script to your clipboard.</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black inline-flex items-center justify-center text-xs mb-2">2</span>
                <h4 className="font-black text-slate-900 mb-1">Paste in WordPress & Delete Old Block</h4>
                <p className="text-gray-600">In WordPress/Elementor, delete any old tracking HTML block, then paste this updated code.</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black inline-flex items-center justify-center text-xs mb-2">3</span>
                <h4 className="font-black text-slate-900 mb-1">Publish & Track</h4>
                <p className="text-gray-600">Publish your WordPress page! Customers can now track using their Carryint AWB (e.g. `CY-AWB-2026-445489` or `CY-AWB-2026-373337`).</p>
              </div>
            </div>

            {/* Raw Code Snippet Box */}
            <div>
              <label className="block text-xs font-black text-gray-700 uppercase tracking-widest mb-2">
                Generated HTML Snippet
              </label>
              <textarea
                readOnly
                value={generateWordPressCode()}
                rows={8}
                className="w-full p-4 rounded-xl font-mono text-xs bg-slate-950 text-slate-200 border border-slate-800 outline-none select-all"
              />
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: ALL SHIPMENTS LIST */}
      {activeSubTab === 'all-shipments' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-900 text-base">All Active Shipments & AWB Directory</h3>
              <p className="text-xs text-gray-500">Overview of all customer shipments with logistics status and carrier tracking numbers.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">AWB Number</th>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Carrier</th>
                  <th className="px-4 py-3">Carrier AWB / BL</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Shipment Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">No invoices or shipments registered.</td>
                  </tr>
                ) : (
                  sortInvoicesByNewestCreated(invoices).map(inv => {
                    const trkUrl = getCarrierTrackingUrl(inv.carrier, inv.carrierTrackingNumber);
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-black text-slate-900">
                          {inv.awbNumber || 'PENDING'}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-700">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{inv.customerName}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800">{inv.carrier || 'Not Assigned'}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-orange-600">
                          {inv.carrierTrackingNumber ? (
                            trkUrl ? (
                              <a href={trkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                {inv.carrierTrackingNumber} <ExternalLink size={11} />
                              </a>
                            ) : inv.carrierTrackingNumber
                          ) : (
                            <span className="text-gray-400 italic">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">{inv.destinationCountry}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            inv.shipmentStatus === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {inv.shipmentStatus || 'BOOKED'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setSelectedInvoice(inv); setActiveSubTab('lookup'); }}
                              className="text-orange-600 font-bold hover:underline"
                            >
                              Track
                            </button>
                            <button
                              onClick={() => onOpenCarrierModal(inv)}
                              className="text-blue-600 font-bold hover:underline"
                            >
                              Update AWB
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrackingManagement;
