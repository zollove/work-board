import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ title: "" });
    }

    const html = await response.text();

    // 1. og:title
    const ogTitleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      const decoded = decodeHtmlEntities(ogTitleMatch[1].trim());
      if (decoded) return NextResponse.json({ title: cleanTitle(decoded) });
    }

    // 2. twitter:title
    const twitterTitleMatch =
      html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i);
    if (twitterTitleMatch && twitterTitleMatch[1]) {
      const decoded = decodeHtmlEntities(twitterTitleMatch[1].trim());
      if (decoded) return NextResponse.json({ title: cleanTitle(decoded) });
    }

    // 3. <title>
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const decoded = decodeHtmlEntities(titleMatch[1].trim());
      if (decoded) return NextResponse.json({ title: cleanTitle(decoded) });
    }

    return NextResponse.json({ title: "" });
  } catch (err) {
    return NextResponse.json({ title: "" });
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, "·")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function cleanTitle(title: string): string {
  return title
    .replace(/ - YouTube$/i, "")
    .replace(/ \| Instagram$/i, "")
    .trim();
}
