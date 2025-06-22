
import { StockAdjustment } from './stockTypes'; // Import StockAdjustment

export interface Product {
  id: string;
  userId: string;
  name: string;
  description?: string;
  unitPrice?: number; // Sales Price
  unit?: string; // e.g., পিস, কেজি, লিটার
  productImage?: string; // Base64 Data URL or a link
  mrp?: number; // Maximum Retail Price
  wholesalePrice?: number; // Wholesale Price
  createdAt: string; // ISO Date string
  lastModified: string; // ISO Date string
  isDeleted?: boolean;
  deletedAt?: string; // ISO Date string

  // Inventory Management Fields
  currentStock: number; // Current quantity on hand
  stockUnit?: string; // Unit of measurement for the stock (e.g., পিস, কেজি). Defaults to 'পিস'.
  lowStockThreshold?: number; // Threshold to consider stock as low. Defaults to 0 or 5.
  stockHistory?: StockAdjustment[]; // Log of all stock changes. Defaults to [].
}
