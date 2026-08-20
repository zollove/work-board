import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface GolfArticle {
  id: string;
  title: string;
  link: string;
  date: string;
  timeAgo?: string;
  category: string;
  thumbnail: string;
  summary: string[];
  description: string;
  isNew: boolean;
  isAiSummary?: boolean;
}

// In-Memory Cache for AI Summaries to save API quota and speed up responses
const summaryCache = new Map<string, string[]>();

export async function GET(req: NextRequest) {
  try {
    const rssUrl = "https://cdn.golfjournal.co.kr/rss/gn_rss_allArticle.xml";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(rssUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: 300 }, // 5 minutes cache
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ articles: [], error: "Failed to fetch RSS" });
    }

    const xml = await response.text();
    const rawArticles = parseGolfJournalXml(xml);

    // Apply Gemini AI Summarization for the top recent articles in batch
    const apiKey = process.env.GEMINI_API_KEY || "";
    const articles = await enrichWithGeminiSummary(rawArticles, apiKey);

    return NextResponse.json({
      articles,
      updatedAt: new Date().toISOString(),
      totalCount: articles.length,
    });
  } catch (error) {
    console.error("Golf Journal RSS error:", error);
    return NextResponse.json({ articles: [], error: String(error) });
  }
}

function parseGolfJournalXml(xml: string): GolfArticle[] {
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  const articles: GolfArticle[] = [];
  const now = new Date().getTime();

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch =
      itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
      itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const catMatch =
      itemXml.match(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/i) ||
      itemXml.match(/<category>([\s\S]*?)<\/category>/i);
    const descMatch =
      itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
      itemXml.match(/<description>([\s\S]*?)<\/description>/i);

    const title = titleMatch ? cleanText(titleMatch[1]) : "무제";
    const link = linkMatch ? linkMatch[1].trim() : "";
    const rawDate = dateMatch ? dateMatch[1].trim() : "";
    const category = catMatch ? cleanCategory(catMatch[1]) : "GJ RADAR";

    const rawDesc = descMatch ? descMatch[1] : "";

    // Extract thumbnail image from description
    let thumbnail = "";
    const imgMatch = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
      thumbnail = imgMatch[1];
    }

    // Clean text description for summary
    const cleanDesc = rawDesc
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // Default Fallback Summary
    const summary = generateSmartSummary(title, cleanDesc);

    // Format Date strictly in Korea Standard Time (KST, UTC+9)
    let formattedDate = rawDate;
    let timeAgo = "";
    let isNew = false;

    try {
      const pDate = new Date(rawDate);
      if (!isNaN(pDate.getTime())) {
        const kstOffsetMs = 9 * 60 * 60 * 1000;
        const kstDate = new Date(pDate.getTime() + kstOffsetMs);

        const y = kstDate.getUTCFullYear();
        const m = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
        const d = String(kstDate.getUTCDate()).padStart(2, "0");
        const h = String(kstDate.getUTCHours()).padStart(2, "0");
        const min = String(kstDate.getUTCMinutes()).padStart(2, "0");
        formattedDate = `${y}.${m}.${d} ${h}:${min}`;

        // Calculate Relative Time Ago
        const diffMs = now - pDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 5) {
          timeAgo = "방금 전";
        } else if (diffMins < 60) {
          timeAgo = `${diffMins}분 전`;
        } else if (diffHours < 24) {
          timeAgo = `${diffHours}시간 전`;
        } else if (diffDays === 1) {
          timeAgo = "어제";
        } else if (diffDays < 7) {
          timeAgo = `${diffDays}일 전`;
        } else {
          timeAgo = `${m}.${d}`;
        }

        if (diffHours <= 48) {
          isNew = true;
        }
      }
    } catch (e) {}

    const idMatch = link.match(/idxno=(\d+)/);
    const id = idMatch ? idMatch[1] : `gj-${articles.length}`;

    articles.push({
      id,
      title,
      link,
      date: formattedDate,
      timeAgo,
      category,
      thumbnail,
      summary,
      description: cleanDesc,
      isNew,
      isAiSummary: false,
    });
  }

  return articles;
}

async function enrichWithGeminiSummary(articles: GolfArticle[], apiKey: string): Promise<GolfArticle[]> {
  if (!apiKey || articles.length === 0) return articles;

  // Process top 12 recent articles concurrently with Gemini AI
  const targetCount = Math.min(articles.length, 12);
  const tasks = [];

  for (let i = 0; i < targetCount; i++) {
    const article = articles[i];

    // Check Cache first
    if (summaryCache.has(article.id)) {
      article.summary = summaryCache.get(article.id)!;
      article.isAiSummary = true;
      continue;
    }

    // Call Gemini for new articles
    tasks.push(
      (async () => {
        try {
          const aiSummary = await requestGeminiSummary(article.title, article.description, apiKey);
          if (aiSummary && aiSummary.length > 0) {
            article.summary = aiSummary;
            article.isAiSummary = true;
            summaryCache.set(article.id, aiSummary);
          }
        } catch (e) {
          // Keep fallback summary
        }
      })()
    );
  }

  await Promise.all(tasks);
  return articles;
}

async function requestGeminiSummary(title: string, desc: string, apiKey: string): Promise<string[] | null> {
  const prompt = `당신은 골프 매거진 전문 수석 기자입니다. 아래 골프 기사를 읽고, 골퍼들이 10초 만에 핵심을 이해할 수 있도록 명확하고 간결한 핵심 인사이트 3줄 요약(각 1문장)을 작성해주세요.

[기사 제목]: ${title}
[기사 내용]: ${desc.slice(0, 1500)}

[출력 규칙]:
- 반드시 3개의 한국어 완성형 문장으로 구성된 JSON 배열(예: ["첫번째 핵심 인사이트", "두번째 핵심 인사이트", "세번째 핵심 인사이트"]) 형태로만 출력하세요.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .map((s: any) => String(s).replace(/^[-*•\d.]+\s*/, "").trim())
        .filter((s: string) => s.length >= 6)
        .slice(0, 3);
    }
  } catch (e) {}

  const lines = text
    .split("\n")
    .map((l: string) => l.replace(/^[-*•\d.\[\]",]+\s*/, "").replace(/["\]]/g, "").trim())
    .filter((l: string) => l.length >= 6);

  return lines.slice(0, 3);
}

function cleanText(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCategory(cat: string): string {
  const upper = cat.trim().toUpperCase();
  if (upper.includes("RADAR") || upper.includes("FEATURE")) return "GJ RADAR";
  if (upper.includes("TALK")) return "GOLF TALK";
  if (upper.includes("PEOPLE") || upper.includes("인터뷰")) return "PEOPLE";
  if (upper.includes("PLACE") || upper.includes("골프장")) return "PLACE";
  if (upper.includes("ISSUE") || upper.includes("이슈")) return "GOLF&ISSUE";
  if (upper.includes("EQUIPMENT") || upper.includes("용품")) return "EQUIPMENT";
  if (upper.includes("INSTRUCTION") || upper.includes("LESSON") || upper.includes("레슨")) return "INSTRUCTION";
  if (upper.includes("STYLE") || upper.includes("패션")) return "STYLE";
  if (upper.includes("PARK") || upper.includes("파크")) return "PARK GOLF";
  if (upper.includes("LIFE") || upper.includes("건강") || upper.includes("여행")) return "LIFE";
  return cat.trim() || "GJ RADAR";
}

function generateSmartSummary(title: string, desc: string): string[] {
  if (!desc || desc.length < 20) return [`📌 ${title}`, "골프저널 최신 기사 전문은 본문 읽기에서 확인하실 수 있습니다."];

  // Split into sentences
  const rawSentences = desc
    .split(/(?<=[.?!다])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 10 && !s.includes("기자") && !s.includes("무단전재"));

  const points: string[] = [];

  for (const s of rawSentences) {
    if (points.length >= 3) break;
    if (!points.includes(s)) points.push(s);
  }

  // If less than 3 sentences, intelligently segment the description
  if (points.length < 3 && desc.length >= 60) {
    const chunkLen = Math.floor(desc.length / 3);
    if (points.length === 1) {
      points.push(desc.slice(chunkLen, chunkLen * 2).trim() + "...");
      points.push(desc.slice(chunkLen * 2, chunkLen * 3).trim() + "...");
    } else if (points.length === 2) {
      points.push(desc.slice(chunkLen * 2).trim() + "...");
    }
  }

  if (points.length === 0) {
    points.push(title);
  }

  return points.slice(0, 3);
}
