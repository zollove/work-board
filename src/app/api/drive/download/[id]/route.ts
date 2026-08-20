import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filename = req.nextUrl.searchParams.get("filename") || "download";
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
    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;

    // If Google Docs/Sheets/Slides, export as PDF or XLSX
    if (mimeType.includes("google-apps")) {
      if (mimeType.includes("spreadsheet")) {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
      } else if (mimeType.includes("document")) {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=application/pdf`;
      } else {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=application/pdf`;
      }
    }

    const driveRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!driveRes.ok) {
      return NextResponse.json({ error: "Failed to download file" }, { status: driveRes.status });
    }

    const buffer = Buffer.from(await driveRes.arrayBuffer());
    const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, "%2A");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": driveRes.headers.get("Content-Type") || mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Drive download error:", err);
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
