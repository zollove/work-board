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
    return NextResponse.json({ error: "Unauthorized", isConnected: false }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const parentId = (formData.get("parentId") as string) || "root";

    if (!file) {
      return NextResponse.json({ error: "업로드할 파일이 없습니다." }, { status: 400 });
    }

    const metadata = {
      name: file.name,
      parents: parentId && parentId !== "root" ? [parentId] : [],
      mimeType: file.type || "application/octet-stream",
    };

    // Step 1: Initiate Resumable Upload Session
    const initRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": file.type || "application/octet-stream",
        "X-Upload-Content-Length": file.size.toString(),
      },
      body: JSON.stringify(metadata),
    });

    if (!initRes.ok) {
      const errData = await initRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "드라이브 권한이 없거나 업로드 세션 생성에 실패했습니다.",
          detail: errData,
          status: initRes.status,
        },
        { status: initRes.status }
      );
    }

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) {
      return NextResponse.json({ error: "업로드 세션 URL을 가져오지 못했습니다." }, { status: 500 });
    }

    // Step 2: Upload File Binary Buffer to Resumable Session
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "Content-Length": fileBuffer.length.toString(),
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: "파일 전송 실패", detail: uploadErr, status: uploadRes.status },
        { status: uploadRes.status }
      );
    }

    const uploadedData = await uploadRes.json();
    return NextResponse.json({ success: true, file: uploadedData });
  } catch (err) {
    console.error("Drive upload error:", err);
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
