import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let token: string | undefined = req.cookies.get("gmail_access_token")?.value;
  const refreshToken = req.cookies.get("gmail_refresh_token")?.value;

  if (!token && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) token = refreshed;
  }

  if (!token) {
    return NextResponse.json({ unreadCount: 0, isConnected: false });
  }

  try {
    // Fetch INBOX label metadata to get unread count directly in 1 lightweight request
    const labelRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!labelRes.ok) {
      if (labelRes.status === 401 && refreshToken) {
        const refreshed = await refreshAccessToken(refreshToken);
        if (refreshed) {
          token = refreshed;
          return GET(req);
        }
      }
      return NextResponse.json({ unreadCount: 0, isConnected: false });
    }

    const labelData = await labelRes.json();
    const unreadCount = labelData.messagesUnread || 0;

    return NextResponse.json({ unreadCount, isConnected: true });
  } catch (err) {
    return NextResponse.json({ unreadCount: 0, isConnected: false });
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
