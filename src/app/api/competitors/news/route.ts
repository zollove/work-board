import { NextResponse } from "next/server";
import { CompetitorNewsItem } from "@/types/competitor";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("query") || "골프존";

  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`;
    const res = await fetch(rssUrl, { next: { revalidate: 300 } });
    const xmlText = await res.text();

    const items: CompetitorNewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);

      let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
      let link = linkMatch ? linkMatch[1].trim() : "";
      let pubDateRaw = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      let origin = sourceMatch ? sourceMatch[1].trim() : "온라인 언론사";
      let description = descMatch
        ? descMatch[1]
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
            .replace(/\s+/g, " ")
            .trim()
        : "";

      // Format pubDate into YYYY-MM-DD
      let pubDate = new Date().toISOString().slice(0, 10);
      try {
        const d = new Date(pubDateRaw);
        if (!isNaN(d.getTime())) {
          pubDate = d.toISOString().slice(0, 10);
        }
      } catch (e) {}

      // Clean title string
      title = title
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/ - [^-]+$/, "");

      if (title && link) {
        items.push({
          id: `news-${Math.random().toString(36).substring(2, 9)}`,
          competitorName: keyword,
          title,
          description: description || title,
          link,
          pubDate,
          origin,
        });
      }

      if (items.length >= 30) break;
    }

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ success: false, items: [], error: error.message }, { status: 500 });
  }
}
