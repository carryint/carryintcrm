
export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';
export type CustomerType = 'ONE_TIME' | 'CREDIT';

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
}

export interface InvoiceItem {
  commodityType: string;
  description: string;
  weight: number;
  quantity: number;
  coo: string; // Country of Origin
  price: number;
  vatPercent: number;
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
  status: PaymentStatus;
  vendorStatus: PaymentStatus;
  totalAmount: number;
  totalVat: number;
  netAmount: number;
  profit: number;
  companyTrn?: string; // Capture TRN at time of generation
}

export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  outstandingReceivables: number;
  outstandingPayables: number;
}
