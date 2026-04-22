
export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';
export type CustomerType = 'ONE_TIME' | 'CREDIT';
export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

export interface AuditLog {
  action: 'CREATE' | 'EDIT' | 'DELETE';
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
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
  agentStatus?: PaymentStatus;
  status: PaymentStatus;
  vendorStatus: PaymentStatus;
  totalAmount: number;
  totalVat: number;
  netAmount: number;
  profit: number;
  paymentDate?: string;    // Date when customer paid
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
