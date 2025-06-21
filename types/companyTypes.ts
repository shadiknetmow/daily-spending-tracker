
export interface CompanyProfile {
  id: string; // Unique ID for the company profile
  userId: string; // User who owns this profile
  companyName: string;
  address?: string;
  phone?: string;
  email?: string;
  logoBase64?: string; // Store logo as base64 string
  taxId?: string; // e.g., VAT ID, BIN
  isDefault?: boolean; // If this is the user's default company profile
  createdAt: string; // ISO Date string
  lastModified: string; // ISO Date string
  isDeleted?: boolean;   // Added for soft deletion
  deletedAt?: string;    // Added for soft deletion
}
