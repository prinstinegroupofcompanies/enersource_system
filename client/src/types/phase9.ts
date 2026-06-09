export interface CommunicationSummary {
  channelCount: number;
  messagesToday: number;
  recentMessages: {
    id: string;
    body: string;
    channel: string;
    sender: string;
    createdAt: string;
  }[];
}

export interface ChatChannel {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  department?: { name: string; code: string };
  messageCount: number;
  lastMessage?: { body: string; createdAt: string };
}

export interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { firstName: string; lastName: string };
}

export interface DocumentsSummary {
  totalDocuments: number;
  categories: { category: string; count: number }[];
  recentUploads: {
    id: string;
    documentNumber: string;
    title: string;
    category: string;
    versionNumber: number;
    fileName: string;
    createdAt: string;
  }[];
}

export interface DocumentListItem {
  id: string;
  documentNumber: string;
  title: string;
  description?: string;
  category: string;
  versionCount: number;
  latestVersion?: {
    versionNumber: number;
    fileName: string;
    createdAt: string;
  };
  updatedAt: string;
}

export interface DocumentDetail extends DocumentListItem {
  versions: {
    id: string;
    versionNumber: number;
    fileName: string;
    mimeType?: string;
    fileSize: number;
    changeNotes?: string;
    createdAt: string;
    downloadUrl?: string;
  }[];
}
