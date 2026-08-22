import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { targetFolderId, currentFolderId } = await req.json();

    if (!targetFolderId) {
      return NextResponse.json({ error: "이동할 대상 폴더가 지정되지 않았습니다." }, { status: 400 });
    }

    let removeParentsParam = "";
    if (currentFolderId && currentFolderId !== "root") {
      removeParentsParam = `&removeParents=${encodeURIComponent(currentFolderId)}`;
    }

    const moveUrl = `https://www.googleapis.com/drive/v3/files/${id}?addParents=${encodeURIComponent(
      targetFolderId
    )}${removeParentsParam}&fields=id,parents`;

    const moveRes = await fetch(moveUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!moveRes.ok) {
      const errData = await moveRes.json();
      return NextResponse.json({ error: "File move failed", detail: errData }, { status: moveRes.status });
    }

    const movedData = await moveRes.json();
    return NextResponse.json({ success: true, file: movedData });
  } catch (err) {
    console.error("Drive move error:", err);
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
