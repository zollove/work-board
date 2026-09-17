export interface Competitor {
  id: string;
  name: string;
  keyword: string;
  category?: string;
  createdAt: string;
}

export interface CompetitorNewsItem {
  id: string;
  competitorName: string;
  title: string;
  description: string;
  link: string;
  pubDate: string; // ISO or formatted date
  origin: string; // e.g. 조선일보, 매일경제, 네이버뉴스 등
  category?: string;
  createdAt?: string;
}
