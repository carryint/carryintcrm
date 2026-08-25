
export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';
export type CustomerType = 'ONE_TIME' | 'CREDIT';
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'ACCOUNTANT';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  department?: string;
  createdAt?: string;
}

export interface AuditLog {
  action: 'CREATE' | 'EDIT' | 'DELETE' | 'APPROVE' | 'REJECT' | 'CLOSE_PERIOD' | 'POST_JOURNAL';
  userId: string;
  userName: string;
  userRole?: UserRole;
  timestamp: string;
  module?: string;
  details?: string;
}

export interface AccountLedger {
  id: string;
  code: string;
  name: string;
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  type: string; // e.g. 'Bank Account', 'Accounts Receivable', 'Cost of Sales', etc.
  openingBalance: number;
  currentBalance: number;
  currency: string;
  description?: string;
  createdAt: string;
}

export interface JournalEntryLine {
  ledgerId: string;
  ledgerName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference: string;
  memo: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED' | 'VOID';
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  createdAt: string;
}

export interface BankReconciliation {
  id: string;
  bankAccount: string;
  statementDate: string;
  statementEndingBalance: number;
  bookBalance: number;
  clearedDeposits: number;
  clearedWithdrawals: number;
  difference: number;
  status: 'IN_PROGRESS' | 'RECONCILED';
  reconciledBy: string;
  reconciledAt?: string;
  notes?: string;
}

export interface VATFiling {
  id: string;
  taxPeriod: string; // e.g. '2026-Q1'
  startDate: string;
  endDate: string;
  standardRatedSupplies: number; // Box 1a
  standardRatedVat: number;      // Box 1b
  zeroRatedSupplies: number;     // Box 4
  exemptSupplies: number;        // Box 5
  standardRatedExpenses: number; // Box 8
  recoverableVat: number;        // Box 9
  netVatDue: number;             // Box 12
  status: 'DRAFT' | 'PREPARED' | 'FILED' | 'PAID';
  ftaFilingReference?: string;
  filedDate?: string;
  paymentDeadline?: string;
  preparedBy: string;
}

export interface CorporateTaxRecord {
  id: string;
  taxYear: string; // e.g. '2026'
  accountingNetProfit: number;
  exemptIncome: number;
  nonDeductibleExpenses: number;
  netTaxAdjustments: number;
  taxableIncome: number;
  smallBusinessReliefEligible: boolean; // Up to 3,000,000 AED threshold
  taxRate: number; // 0% up to 375k, 9% above
  taxLiability: number;
  status: 'PROVISIONAL' | 'CALCULATED' | 'FILED' | 'PAID';
  filingDeadline: string;
  paymentDeadline: string;
  filingReference?: string;
  notes?: string;
  preparedBy: string;
}

export interface TaxDeadlineItem {
  id: string;
  title: string;
  category: 'VAT' | 'CORPORATE_TAX' | 'AUDIT' | 'CLOSING';
  dueDate: string;
  type: 'FILING' | 'PAYMENT' | 'INTERNAL';
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  amount?: number;
  notes?: string;
}

export interface FixedAsset {
  id: string;
  assetCode: string;
  name: string;
  category: 'VEHICLE' | 'OFFICE_EQUIPMENT' | 'FURNITURE' | 'IT_HARDWARE' | 'MACHINERY';
  purchaseDate: string;
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  accumulatedDepreciation: number;
  netBookValue: number;
  location?: string;
  assignedTo?: string;
}

export interface PeriodClosing {
  id: string;
  periodName: string; // e.g. 'January 2026', 'FY 2025'
  periodType: 'MONTH' | 'YEAR';
  startDate: string;
  endDate: string;
  isLocked: boolean;
  closedBy?: string;
  closedAt?: string;
  checklist: {
    bankReconciled: boolean;
    vatReconciled: boolean;
    depreciationPosted: boolean;
    journalsVerified: boolean;
    managementApproved: boolean;
  };
}

export interface AccountingApproval {
  id: string;
  type: 'INVOICE_EDIT' | 'EXPENSE_CLAIM' | 'ADJUSTMENT_NOTE' | 'JOURNAL_ENTRY' | 'PERIOD_CLOSING';
  referenceNumber: string;
  amount: number;
  requestedBy: string;
  requestedByName: string;
  requestedRole: UserRole;
  requestedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverRole: 'MANAGER' | 'ADMIN' | 'ACCOUNTANT';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedDate?: string;
  comments?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  contact: string;
  email: string;
  website: string;
  trn: string;
  bank: {
    name: string;
    cif: string;
    accNo: string;
    iban: string;
  };
  logoUrl: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  contact: string;
  email?: string;
  vatNumber?: string;
  type: CustomerType;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  address: string;
  vatNumber?: string;
}

export interface InvoiceItem {
  commodityType: string;
  description: string;
  weight: number;
  cbm?: number;       // CBM weight (optional)
  quantity: number;
  coo: string; // Country of Origin
  price: number;
  vatPercent: number;
  isAdditionalCharge?: boolean;
}

export type CarrierName = 'DHL' | 'FedEx' | 'UPS' | 'DPD' | 'Aramex' | 'Direct Freight' | 'Other';
export type ShipmentStatus = 'BOOKED' | 'PICKED_UP' | 'IN_TRANSIT' | 'CUSTOMS_CLEARANCE' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'ON_HOLD';

export interface TrackingEvent {
  id: string;
  date: string;
  status: ShipmentStatus | string;
  location: string;
  description: string;
  updatedBy?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  awbNumber?: string;          // Master Carryint AWB (e.g. CARY-104829104)
  carrier?: CarrierName | string; // Carrier Name: DHL, FedEx, UPS, DPD, etc.
  carrierTrackingNumber?: string; // Carrier's own AWB / BL / Tracking Number
  shipmentStatus?: ShipmentStatus; // Current logistics status
  estimatedDeliveryDate?: string; // Estimated arrival date
  carrierAssignedAt?: string;  // Timestamp when carrier AWB was updated
  carrierAssignedBy?: string;  // Staff who updated carrier details
  trackingEvents?: TrackingEvent[]; // Milestone timeline events
  date: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  customerEmail?: string;
  customerVat?: string;
  destinationCountry: string;
  items: InvoiceItem[];
  vendorId?: string;
  vendorName?: string;
  vendorCost: number;
  agentCommission?: number;
  pickupCost?: number;
  agentStatus?: PaymentStatus;
  status: PaymentStatus;
  vendorStatus: PaymentStatus;
  totalAmount: number;
  totalVat: number;
  netAmount: number;
  profit: number;
  paymentDate?: string;    // Date when customer paid
  vendorPaymentDate?: string; // Date when vendor was paid
  vendorPaidAmount?: number; // Amount paid to vendor so far (for partial payments)
  vendorTransactionReference?: string; // Transaction reference for vendor payment
  paymentMethod?: string;  // e.g. Cash, Bank Transfer, Cheque
  transactionReference?: string; // Transaction reference for bank transfers
  companyTrn?: string; // Capture TRN at time of generation
  createdBy: string;
  createdByName: string;
  auditLogs: AuditLog[];
}


export interface Expense {
  id: string;
  date: string;
  amount: number;
  itemDetails: string;
  paymentMethod: string;
  paymentReference: string;
  payeeName: string;
  createdBy: string;
  createdByName: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  totalExpenses: number;
}

export interface AdjustmentNote {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  noteNumber: string; // e.g. CN-0001, DN-0001
  date: string;
  customerId: string;
  customerName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  reason: string;
  amount: number;
  creditAction?: 'REFUND' | 'APPLY_AS_CREDIT' | 'REDUCE_OUTSTANDING'; // Only for CREDIT notes
  createdBy: string;
  createdByName: string;
  timestamp: string;
}

export type CustomerCategory = 'COMMERCIAL' | 'PERSONAL';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface QuotationItem {
  commodityType: string;
  description: string;
  weight: number;      // Approximate weight (kg)
  quantity: number;    // Quantity / units
  cbm?: number;        // CBM (optional)
  price: number;       // Line Price in AED
  vatPercent: number;  // VAT % (0 or 5)
}

export interface Quotation {
  id: string;
  quotationNumber: string; // Unique Quotation Code e.g. QT-2026-0001
  date: string;            // Generated Date (YYYY-MM-DD)
  validityDate: string;    // Validity Date (Default 5 days from generated date)
  customerCategory: CustomerCategory; // 'COMMERCIAL' | 'PERSONAL'
  customerId?: string;     // Link to customer if selected from list
  customerName: string;
  customerAddress: string;
  customerContact: string;
  customerEmail?: string;
  customerVat?: string;    // VAT / TRN (especially for commercial)
  pickupAddress: string;   // Pickup location
  deliveryAddress: string; // Delivery location
  originCountry?: string;
  destinationCountry?: string;
  items: QuotationItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  notesAndTerms: string;   // Type or copy-paste terms and conditions
  status: QuotationStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
}

