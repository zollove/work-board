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
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "변경할 파일명을 입력하세요." }, { status: 400 });
    }

    const renameRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (!renameRes.ok) {
      const errData = await renameRes.json();
      return NextResponse.json({ error: "Rename failed", detail: errData }, { status: renameRes.status });
    }

    const updatedData = await renameRes.json();
    return NextResponse.json({ success: true, file: updatedData });
  } catch (err) {
    console.error("Drive file rename error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    // Move to Google Drive Trash
    const trashRes = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trashed: true }),
    });

    if (!trashRes.ok) {
      const errData = await trashRes.json();
      return NextResponse.json({ error: "Delete failed", detail: errData }, { status: trashRes.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Drive file delete error:", err);
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
