import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let token: string | undefined = req.cookies.get("gmail_access_token")?.value;
  const refreshToken = req.cookies.get("gmail_refresh_token")?.value;

  if (!token && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) token = refreshed;
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!msgRes.ok) {
      return NextResponse.json({ error: "Failed to fetch message details" }, { status: msgRes.status });
    }

    const msgData = await msgRes.json();
    const headers = msgData.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    const from = getHeader("From");
    const to = getHeader("To");
    const subject = getHeader("Subject") || "(제목 없음)";
    const date = getHeader("Date");

    const { htmlBody, textBody, attachments } = extractBodyAndAttachments(msgData.payload);

    return NextResponse.json({
      id: msgData.id,
      threadId: msgData.threadId,
      from,
      to,
      subject,
      date,
      htmlBody: htmlBody || textBody.replace(/\n/g, "<br/>"),
      textBody,
      snippet: msgData.snippet || "",
      attachments,
      labels: msgData.labelIds || [],
    });
  } catch (err) {
    console.error("Message detail error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Mark Message as Read in Gmail
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let token: string | undefined = req.cookies.get("gmail_access_token")?.value;
  const refreshToken = req.cookies.get("gmail_refresh_token")?.value;

  if (!token && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) token = refreshed;
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const modifyRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["UNREAD"],
      }),
    });

    return NextResponse.json({ success: modifyRes.ok });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
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

function extractBodyAndAttachments(payload: any) {
  let htmlBody = "";
  let textBody = "";
  const attachments: { filename: string; mimeType: string; size: number; attachmentId: string }[] = [];

  function traverse(part: any) {
    if (!part) return;

    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId,
      });
    }

    if (part.mimeType === "text/html" && part.body?.data) {
      htmlBody = decodeBase64Url(part.body.data);
    } else if (part.mimeType === "text/plain" && part.body?.data && !textBody) {
      textBody = decodeBase64Url(part.body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(traverse);
    }
  }

  traverse(payload);

  return { htmlBody, textBody, attachments };
}

function decodeBase64Url(base64Url: string): string {
  try {
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const buffer = Buffer.from(base64, "base64");
    return buffer.toString("utf-8");
  } catch (e) {
    return "";
  }
}
