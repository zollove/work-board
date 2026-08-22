import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
    const { name, parentId } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "폴더명을 입력하세요." }, { status: 400 });
    }

    const folderMetadata = {
      name: name.trim(),
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId && parentId !== "root" ? [parentId] : [],
    };

    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(folderMetadata),
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      return NextResponse.json({ error: "Folder creation failed", detail: errData }, { status: createRes.status });
    }

    const folderData = await createRes.json();
    return NextResponse.json({ success: true, folder: folderData });
  } catch (err) {
    console.error("Drive folder create error:", err);
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
