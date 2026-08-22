import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;
  const filename = req.nextUrl.searchParams.get("filename") || "attachment";
  const mimeType = req.nextUrl.searchParams.get("mimeType") || "application/octet-stream";

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
    const attUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/attachments/${attachmentId}`;
    const attRes = await fetch(attUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!attRes.ok) {
      return NextResponse.json({ error: "Failed to fetch attachment" }, { status: attRes.status });
    }

    const attData = await attRes.json();
    const base64Data = attData.data?.replace(/-/g, "+").replace(/_/g, "/") || "";
    const buffer = Buffer.from(base64Data, "base64");

    const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, "%2A");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Attachment download error:", err);
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
