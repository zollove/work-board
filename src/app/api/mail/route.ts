import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface MailItem {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  date: string;
  timeAgo: string;
  snippet: string;
  isUnread: boolean;
  hasAttachment: boolean;
  labels: string[];
}

export async function GET(req: NextRequest) {
  let token: string | undefined = req.cookies.get("gmail_access_token")?.value;
  const refreshToken = req.cookies.get("gmail_refresh_token")?.value;

  if (!token && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) token = refreshed;
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized", isConnected: false }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q") || "";
  const maxResults = req.nextUrl.searchParams.get("max") || "50";

  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&includeSpamTrash=false${
      query ? `&q=${encodeURIComponent(query)}` : ""
    }`;

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!listRes.ok) {
      if (listRes.status === 401 && refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          token = refreshed;
          return GET(req);
        }
      }
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: listRes.status });
    }

    const listData = await listRes.json();
    const messages = listData.messages || [];

    // Fetch message details in parallel
    const mailItems: MailItem[] = await Promise.all(
      messages.map(async (msg: { id: string; threadId: string }) => {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            }
          );
          if (!msgRes.ok) return null;
          const msgData = await msgRes.json();

          const headers = msgData.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

          const fromRaw = getHeader("From");
          const subject = getHeader("Subject") || "(제목 없음)";
          const dateRaw = getHeader("Date");
          const to = getHeader("To");

          const { name: fromName, email: fromEmail } = parseFromHeader(fromRaw);

          const isUnread = (msgData.labelIds || []).includes("UNREAD");
          const hasAttachment = (msgData.labelIds || []).includes("HAS_ATTACHMENT") || (msgData.snippet || "").includes("attachment");

          const { formattedDate, timeAgo } = formatMailDate(dateRaw);

          return {
            id: msg.id,
            threadId: msg.threadId,
            from: fromRaw,
            fromName,
            fromEmail,
            to,
            subject,
            date: formattedDate,
            timeAgo,
            snippet: decodeHtmlEntities(msgData.snippet || ""),
            isUnread,
            hasAttachment,
            labels: msgData.labelIds || [],
          };
        } catch (e) {
          return null;
        }
      })
    );

    const validMails = mailItems.filter(Boolean) as MailItem[];

    return NextResponse.json({
      mails: validMails,
      total: listData.resultSizeEstimate || validMails.length,
    });
  } catch (err) {
    console.error("Mail fetch error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (e) {
    return null;
  }
}

function parseFromHeader(from: string) {
  const match = from.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/["']/g, "").trim() || match[2], email: match[2].trim() };
  }
  return { name: from.trim(), email: from.trim() };
}

function formatMailDate(dateStr: string) {
  if (!dateStr) return { formattedDate: "", timeAgo: "" };
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { formattedDate: dateStr, timeAgo: "" };

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let timeAgo = "";
    if (diffMins < 1) timeAgo = "방금 전";
    else if (diffMins < 60) timeAgo = `${diffMins}분 전`;
    else if (diffHours < 24) timeAgo = `${diffHours}시간 전`;
    else if (diffDays === 1) timeAgo = "어제";
    else if (diffDays < 7) timeAgo = `${diffDays}일 전`;
    else timeAgo = `${date.getMonth() + 1}.${date.getDate()}`;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return { formattedDate: `${y}.${m}.${d} ${h}:${min}`, timeAgo };
  } catch (e) {
    return { formattedDate: dateStr, timeAgo: "" };
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
