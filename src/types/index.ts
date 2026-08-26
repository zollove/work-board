export type MemoCategory = "업무" | "중요" | "일반" | "생활" | "아이디어" | "노하우" | "링크" | "체크";

export interface Memo {
  id: string;
  title: string;
  content: string;
  category: MemoCategory | string;
  imageUrl?: string;
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
  leasedArea?: string; // 임대면적
  exclusiveArea?: string; // 전용면적
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
  date: string; // YYYY-MM-DD (Start date)
  endDate?: string; // YYYY-MM-DD (End date for multi-day events)
  color?: string; // blue, red, green, amber, purple, pink
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

// 🔔 법정 의무 점검 항목
export interface InspectionItem {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  cycle: string; // 월간, 분기, 반기, 연간
  notes?: string;
  isDone?: boolean;
  createdAt: string;
}

// 🛠️ 유지보수 비품 재고 항목
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  category: string;
  notes?: string;
  createdAt: string;
}

// 🔑 공용 및 공실 비밀번호 항목
export interface PasscodeItem {
  id: string;
  title: string;
  code: string;
  category: string; // 공용현관, 공실도어락, 기계실/옥상, 기타
  notes?: string;
  createdAt: string;
}

// 🎙️ 회의록 항목 (Meeting Minutes)
export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  attendees: string;
  content: string;
  actionItems: string;
  createdAt: string;
}

// 📖 일일 업무일지 항목 (Daily Work Log)
export interface WorkLog {
  id: string;
  date: string; // YYYY-MM-DD
  todayWork: string; // Rich Text & Table HTML
  pendingWork: string;
  issues: string; // Rich Text & Table HTML
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
