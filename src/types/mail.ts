export type MailProvider = "gmail" | "naver";

export interface MailItem {
  id: string;
  provider: MailProvider;
  accountEmail: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  body?: string;
  receivedAt: string; // ISO Date String
  isRead: boolean;
  isStarred?: boolean;
  folder?: "inbox" | "sent";
}

export interface MailFilterState {
  providerFilter: "all" | "gmail_inbox" | "gmail_sent" | "naver_inbox" | "naver_sent" | "gmail" | "naver";
  searchQuery: string;
  unreadOnly: boolean;
}
