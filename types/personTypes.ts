export type ProfileImageAction = 'added' | 'updated' | 'removed' | 'none';

export interface PersonVersion {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored';
  userId: string;
  snapshot: {
    name: string;
    mobileNumber?: string;
    address?: string;
    shopName?: string;
    email?: string;
    profileImageAction?: ProfileImageAction | null; // track image changes
    isDeleted?: boolean;
    deletedAt?: string;
    systemUserId?: string;
    customAlias?: string;
  };
}

export interface Person {
  id: string;
  name: string;
  customAlias?: string; // User-defined alias for a person
  mobileNumber?: string;
  address?: string;
  shopName?: string;
  email?: string;
  profileImage?: string; // Store as base64 Data URL or a link
  systemUserId?: string; // If this person is also a system user
  userId: string; // The user who created/owns this person entry
  createdAt: string; // ISO Date string
  lastModified: string; // ISO Date string
  editHistory: PersonVersion[];
  isDeleted?: boolean;
  deletedAt?: string; // ISO Date string when soft deleted
}