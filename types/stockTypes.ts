export type StockAdjustmentType =
  | 'initial'           // Initial stock count when product is first added or inventory system starts
  | 'sale'              // Stock out due to a sale (linked to an invoice)
  | 'purchase_received' // Stock in from a supplier purchase
  | 'manual_in'         // Positive manual adjustment (e.g., found stock, correction)
  | 'manual_out'        // Negative manual adjustment (e.g., spoilage, internal use, correction)
  | 'return_customer'   // Stock in due to a customer return (linked to a credit note/invoice)
  | 'return_supplier';  // Stock out due to returning goods to a supplier

export interface StockAdjustment {
  id: string;                 // Unique ID for the stock adjustment
  date: string;               // ISO datetime string when the adjustment occurred
  type: StockAdjustmentType;  // Type of adjustment
  quantityChange: number;     // Positive for stock in, negative for stock out
  newStockLevel: number;      // Stock level *after* this adjustment
  notes?: string;             // Optional notes for the adjustment (e.g., reason for manual adjustment)
  relatedInvoiceId?: string;  // Link to an Invoice ID if type is 'sale' or 'return_customer'
  // relatedPurchaseOrderId?: string; // Future: Link to a Purchase Order ID
  userId: string;             // User ID of who made/triggered the adjustment
}
