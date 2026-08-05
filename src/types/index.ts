export type MemoCategory = "일반" | "중요" | "아이디어" | "긴급";

export interface Memo {
  id: string;
  title: string;
  content: string;
  category: MemoCategory;
  createdAt: string;
  updatedAt: string;
}

export interface Rental {
  id: string;
  building: string;
  room: string;
  tenantName: string;
  contact: string;
  deposit: number;
  rent: number;
  contractStart: string;
  contractEnd: string;
  notes?: string;
}

export interface Contact {
  id: string;
  companyName: string;
  managerName: string;
  phone: string;
  email: string;
  items: string;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  isImportant?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  notes?: string;
  createdAt: string;
}
