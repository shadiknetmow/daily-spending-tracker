// Chat / Messaging Feature
export interface ImageMessageContent {
  type: 'image';
  base64Data: string; // Data URL (e.g., "data:image/png;base64,...")
  mimeType: string;
  fileName?: string;
}

export interface AudioMessageContent {
  type: 'audio';
  base64Data: string; // Data URL (e.g., "data:audio/webm;base64,...")
  mimeType: string;   // e.g., 'audio/webm', 'audio/ogg'
  duration?: number;  // Optional: duration in seconds
}


export interface MessageVersionSnapshot {
  content: string;
  imageContent?: ImageMessageContent;
  audioContent?: AudioMessageContent;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface MessageVersion {
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'restored' | 'history_deleted';
  userId: string; // User ID of who performed the action
  snapshot: MessageVersionSnapshot;
}


export interface Message {
  id: string;
  threadId: string; // Combined sorted UserIDs (currentUser.id + person.systemUserId)
  actualSenderId: string; // User.id of the actual sender
  actualReceiverId: string; // User.id of the actual receiver
  content: string;
  imageContent?: ImageMessageContent;
  audioContent?: AudioMessageContent;
  timestamp: string; // ISO Date string
  isRead: boolean; // Specific to the `userId` (owner) of this message record
  userId: string; // Owner of this message record (could be sender or receiver)
  reactions?: Record<string, string[]>; // Key: emoji (string), Value: array of User.id (string[])
  isDeleted?: boolean; // If this specific user has "deleted" this message from their view
  deletedAt?: string;  // ISO Date string for when this user deleted it
  editHistory: MessageVersion[];
  lastModified?: string; // ISO Date string for last modification
}