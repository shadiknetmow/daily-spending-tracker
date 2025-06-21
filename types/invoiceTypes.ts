// src/types/invoiceTypes.ts
export enum InvoiceType {
  SALES = 'SALES', // Selling to a customer
  PURCHASE = 'PURCHASE', // Buying from a supplier/person
}

export interface InvoiceItem {
  id: string; // for local key management in UI
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number; // quantity * unitPrice;
  unit?: string; // Optional: unit for the item, e.g., পিস, কেজি
  originalProductId?: string; // Added: ID of the product from which this item was created
}

export enum InvoicePaymentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export type InvoicePaymentMethod = 'Cash' | 'Bank Transfer' | 'bKash' | 'Nagad' | 'Rocket' | 'Card' | 'Cheque' | 'Other';

export interface InvoicePayment {
  id: string;
  paymentDate: string; // ISO Date string
  amount: number;
  paymentMethod?: InvoicePaymentMethod;
  notes?: string;
  recordedAt: string; // ISO DateTime string when payment was recorded
  bankAccountId?: string; // ID of the bank account used for this payment
  bankAccountName?: string; // Name of the bank account for display
}

export interface InvoiceVersionSnapshot {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: InvoiceType; // Added
  dueDate?: string;
  personId: string;
  companyProfileId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  discountAmount?: number;
  taxType?: 'percentage' | 'fixed' | null;
  taxValue?: number;
  taxAmount?: number;
  totalAmount: number;
  notes?: string;
  paymentStatus: InvoicePaymentStatus;
  paymentsReceived?: InvoicePayment[];
  paidAmount?: number; // Derived, but snapshotting might be useful for specific states
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface InvoiceVersion {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored' | 'payment_recorded';
  userId: string;
  snapshot: InvoiceVersionSnapshot;
}

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  invoiceType: InvoiceType; // Added
  invoiceDate: string; // ISO Date string
  dueDate?: string; // ISO Date string
  personId: string;
  companyProfileId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountType?: 'percentage' | 'fixed' | null;
  discountValue?: number;
  discountAmount?: number;
  taxType?: 'percentage' | 'fixed' | null;
  taxValue?: number;
  taxAmount?: number;
  totalAmount: number;
  notes?: string;
  paymentStatus: InvoicePaymentStatus;
  paymentsReceived: InvoicePayment[];
  createdAt: string; // ISO DateTime string
  lastModified: string; // ISO DateTime string
  editHistory: InvoiceVersion[];
  isDeleted?: boolean;
  deletedAt?: string;
  initialPayment?: Omit<InvoicePayment, 'id' | 'recordedAt'>; // Transient field for creation
}

// Data structure for saving a new invoice, potentially with an initial payment
export type InvoiceCreationData = Omit<Invoice, 'id' | 'userId' | 'createdAt' | 'lastModified' | 'editHistory' | 'isDeleted' | 'deletedAt' | 'paymentsReceived'> & {
  initialPayment?: Omit<InvoicePayment, 'id' | 'recordedAt'>;
};

// Types for AI pre-rendering data
export interface AIPartialInvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  unit?: string | null;
}

export interface AIPreRenderData {
  customerName?: string | null;
  items?: AIPartialInvoiceItem[] | null;
  notes?: string | null;
}