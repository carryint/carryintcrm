
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Invoice } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(amount);
};

export const numberToWords = (num: number): string => {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const numStr = num.toString();
  if (numStr.length > 9) return 'overflow';
  const n = ('000000000' + numStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'crore ' : '';
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'lakh ' : '';
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'thousand ' : '';
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'hundred ' : '';
  str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'only' : '';
  return str.toUpperCase();
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Generates an Excel Workbook with multiple sheets
 */
export const exportToExcel = (data: { invoices: any[], customers: any[], vendors: any[], expenses?: any[], adjustmentNotes?: any[], quotations?: any[] }) => {
  const wb = XLSX.utils.book_new();
  
  // Create Invoices Sheet
  const invSheet = XLSX.utils.json_to_sheet(data.invoices.map(i => ({
    'Invoice No': i.invoiceNumber,
    'Date': new Date(i.date).toLocaleDateString(),
    'Customer': i.customerName,
    'Destination': i.destinationCountry,
    'Net Amount': i.netAmount,
    'VAT': i.totalVat,
    'Total Amount': i.totalAmount,
    'Status': i.status,
    'Profit': i.profit,
    'Vendor': i.vendorName || 'N/A'
  })));
  XLSX.utils.book_append_sheet(wb, invSheet, 'Invoices');

  // Create Quotations Sheet
  if (data.quotations && data.quotations.length > 0) {
    const quotSheet = XLSX.utils.json_to_sheet(data.quotations.map(q => ({
      'Quote No': q.quotationNumber,
      'Date': new Date(q.date).toLocaleDateString(),
      'Valid Until': new Date(q.validityDate).toLocaleDateString(),
      'Category': q.customerCategory,
      'Customer': q.customerName,
      'Contact': q.customerContact,
      'Pickup Address': q.pickupAddress,
      'Delivery Address': q.deliveryAddress,
      'Total Amount (AED)': q.totalAmount,
      'Status': q.status
    })));
    XLSX.utils.book_append_sheet(wb, quotSheet, 'Quotations');
  }

  // Create Customers Sheet
  const custSheet = XLSX.utils.json_to_sheet(data.customers.map(c => ({
    'Name': c.name,
    'Type': c.type,
    'Contact': c.contact,
    'VAT Number': c.vatNumber || 'N/A',
    'Address': c.address
  })));
  XLSX.utils.book_append_sheet(wb, custSheet, 'Customers');

  // Create Vendors Sheet
  const vendSheet = XLSX.utils.json_to_sheet(data.vendors.map(v => ({
    'Name': v.name,
    'Contact': v.contact,
    'Address': v.address
  })));
  XLSX.utils.book_append_sheet(wb, vendSheet, 'Vendors');
  
  // Create Expenses Sheet
  if (data.expenses && data.expenses.length > 0) {
    const expSheet = XLSX.utils.json_to_sheet(data.expenses.map(e => ({
      'Date': new Date(e.date).toLocaleDateString(),
      'Details': e.itemDetails,
      'Payee': e.payeeName,
      'Method': e.paymentMethod,
      'Reference': e.paymentReference,
      'Amount': e.amount,
      'Created By': e.createdByName
    })));
    XLSX.utils.book_append_sheet(wb, expSheet, 'Company Expenses');
  }

  // Create Voucher Adjustments Sheet
  if (data.adjustmentNotes && data.adjustmentNotes.length > 0) {
    const adjSheet = XLSX.utils.json_to_sheet(data.adjustmentNotes.map(a => ({
      'Note No': a.noteNumber,
      'Type': a.type,
      'Date': new Date(a.date).toLocaleDateString(),
      'Customer': a.customerName,
      'Invoice No': a.originalInvoiceNumber || 'N/A',
      'Reason': a.reason,
      'Amount': a.amount,
      'Action': a.creditAction || 'REDUCE_OUTSTANDING',
    })));
    XLSX.utils.book_append_sheet(wb, adjSheet, 'Voucher Adjustments');
  }

  // Write file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return excelBuffer;
};

/**
 * Generates a ZIP file containing a JSON backup and the Excel report
 */
export const downloadSystemZip = async (data: any) => {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Add JSON Data
  zip.file(`carryint_backup_${timestamp}.json`, JSON.stringify(data, null, 2));
  
  // Add Excel Report
  const excelBuffer = exportToExcel({
    invoices: data.invoices,
    customers: data.customers,
    vendors: data.vendors,
    expenses: data.expenses,
    adjustmentNotes: data.adjustmentNotes,
    quotations: data.quotations,
  });
  zip.file(`carryint_financial_report_${timestamp}.xlsx`, excelBuffer);
  
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Carryint_Full_Backup_${timestamp}.zip`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadExcelOnly = (data: { invoices: any[], customers: any[], vendors: any[], expenses?: any[], adjustmentNotes?: any[], quotations?: any[] }) => {
  const buffer = exportToExcel(data);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Carryint_Financial_Report_${new Date().toLocaleDateString()}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Generates an internal Carryint Master Air Waybill (AWB) number
 * Format: CARY-000000000 (starting with CARY followed by 9 random digits)
 */
export const generateAwbNumber = (): string => {
  const random9Digits = Math.floor(100000000 + Math.random() * 900000000);
  return `CARY-${random9Digits}`;
};

/**
 * Builds the official live direct tracking URL for supported carriers (DHL, FedEx, UPS, DPD, Aramex)
 */
export const getCarrierTrackingUrl = (carrier?: string, trackingNumber?: string): string => {
  if (!trackingNumber || !trackingNumber.trim()) return '';
  const cleanTrk = trackingNumber.trim();
  const carrierUpper = (carrier || '').toUpperCase();

  if (carrierUpper.includes('DHL')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(cleanTrk)}`;
  }
  if (carrierUpper.includes('FEDEX') || carrierUpper.includes('FDX')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(cleanTrk)}`;
  }
  if (carrierUpper.includes('UPS')) {
    return `https://www.ups.com/track?tracknum=${encodeURIComponent(cleanTrk)}`;
  }
  if (carrierUpper.includes('DPD')) {
    return `https://tracking.dpd.de/status/en_US/parcel/${encodeURIComponent(cleanTrk)}`;
  }
  if (carrierUpper.includes('ARAMEX')) {
    return `https://www.aramex.com/track/results?mode=0&ShipmentNumber=${encodeURIComponent(cleanTrk)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent((carrier ? carrier + ' ' : '') + cleanTrk + ' tracking')}`;
};

const ALLOWED_INVOICE_DB_KEYS = [
  'id',
  'invoiceNumber',
  'date',
  'customerId',
  'customerName',
  'customerAddress',
  'customerContact',
  'customerEmail',
  'customerVat',
  'destinationCountry',
  'items',
  'vendorId',
  'vendorName',
  'vendorCost',
  'agentCommission',
  'pickupCost',
  'agentStatus',
  'status',
  'vendorStatus',
  'totalAmount',
  'totalVat',
  'netAmount',
  'profit',
  'paymentDate',
  'vendorPaymentDate',
  'vendorTransactionReference',
  'paymentMethod',
  'transactionReference',
  'companyTrn',
  'createdBy',
  'createdByName',
  'auditLogs'
];

/**
 * Prepares an Invoice for Supabase persistence by embedding logistics fields
 * into items[0]._logistics and stripping top-level unsupported columns.
 */
export const prepareInvoiceForSupabase = (inv: Invoice): any => {
  const logistics = {
    awbNumber: inv.awbNumber,
    carrier: inv.carrier,
    carrierTrackingNumber: inv.carrierTrackingNumber,
    shipmentStatus: inv.shipmentStatus,
    estimatedDeliveryDate: inv.estimatedDeliveryDate,
    carrierAssignedAt: inv.carrierAssignedAt,
    carrierAssignedBy: inv.carrierAssignedBy,
    trackingEvents: inv.trackingEvents,
    vendorPaidAmount: inv.vendorPaidAmount
  };

  const rawItems = Array.isArray(inv.items) && inv.items.length > 0
    ? inv.items.map((item, idx) => idx === 0 ? { ...item, _logistics: logistics } : item)
    : [{ description: 'Shipment Item', quantity: 1, price: inv.totalAmount || 0, vatPercent: 0, _logistics: logistics }];

  const dbObj: any = {};
  ALLOWED_INVOICE_DB_KEYS.forEach(key => {
    if (key === 'items') {
      dbObj.items = rawItems;
    } else if ((inv as any)[key] !== undefined) {
      dbObj[key] = (inv as any)[key];
    }
  });

  return dbObj;
};

/**
 * Hydrates an invoice loaded from Supabase or LocalStorage, restoring
 * top-level carrier, AWB, tracking milestone, and vendor partial payment fields.
 */
export const hydrateInvoiceFromStorage = (raw: any): Invoice => {
  const firstItemLogistics = raw.items && raw.items[0] && raw.items[0]._logistics ? raw.items[0]._logistics : {};
  
  return {
    ...raw,
    awbNumber: raw.awbNumber || firstItemLogistics.awbNumber || generateAwbNumber(),
    carrier: raw.carrier || firstItemLogistics.carrier || undefined,
    carrierTrackingNumber: raw.carrierTrackingNumber || firstItemLogistics.carrierTrackingNumber || undefined,
    shipmentStatus: raw.shipmentStatus || firstItemLogistics.shipmentStatus || 'BOOKED',
    estimatedDeliveryDate: raw.estimatedDeliveryDate || firstItemLogistics.estimatedDeliveryDate || undefined,
    carrierAssignedAt: raw.carrierAssignedAt || firstItemLogistics.carrierAssignedAt || undefined,
    carrierAssignedBy: raw.carrierAssignedBy || firstItemLogistics.carrierAssignedBy || undefined,
    trackingEvents: raw.trackingEvents || firstItemLogistics.trackingEvents || [],
    vendorPaidAmount: raw.vendorPaidAmount !== undefined ? Number(raw.vendorPaidAmount) : (firstItemLogistics.vendorPaidAmount !== undefined ? Number(firstItemLogistics.vendorPaidAmount) : (raw.vendorStatus === 'PAID' ? Number(raw.vendorCost || 0) : 0))
  };
};

/**
 * Resolves the true original creation timestamp for an invoice.
 * Subsequent edits do NOT alter the creation timestamp, as the original creation
 * timestamp is preserved from the initial 'CREATE' audit log, createdAt field, or invoice date.
 */
export const getInvoiceCreationTimestamp = (inv: Invoice): number => {
  if (!inv) return 0;

  // 1. Audit log with 'CREATE' action (persisted and unchanged by subsequent edits)
  if (Array.isArray(inv.auditLogs) && inv.auditLogs.length > 0) {
    const createLog = inv.auditLogs.find(l => l.action === 'CREATE');
    if (createLog?.timestamp) {
      const t = new Date(createLog.timestamp).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    // Fallback to the first audit log timestamp
    const firstLog = inv.auditLogs[0];
    if (firstLog?.timestamp) {
      const t = new Date(firstLog.timestamp).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
  }

  // 2. Explicit createdAt property if available
  if ((inv as any).createdAt) {
    const t = new Date((inv as any).createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 3. Invoice date field (assigned at creation time)
  if (inv.date) {
    const t = new Date(inv.date).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 4. Epoch milliseconds embedded in ID (e.g. inv-1740738291000)
  if (inv.id) {
    const match = inv.id.match(/\d{10,13}/);
    if (match) {
      const t = Number(match[0]);
      if (!isNaN(t) && t > 1000000000000) return t;
    }
  }

  return 0;
};

/**
 * Arranges invoices with newly entered (created) invoices on top.
 * Edited invoices retain their original creation order and will NOT jump to the top.
 */
export const sortInvoicesByNewestCreated = (invoicesList: Invoice[]): Invoice[] => {
  if (!Array.isArray(invoicesList)) return [];
  return [...invoicesList].sort((a, b) => {
    const timeA = getInvoiceCreationTimestamp(a);
    const timeB = getInvoiceCreationTimestamp(b);
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    // Tie-breaker: sort descending by invoice number / id
    const numA = (a.invoiceNumber || a.id || '').toString();
    const numB = (b.invoiceNumber || b.id || '').toString();
    return numB.localeCompare(numA, undefined, { numeric: true, sensitivity: 'base' });
  });
};




