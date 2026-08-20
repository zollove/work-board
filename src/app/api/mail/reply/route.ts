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
    const { to, subject, body, threadId } = await req.json();

    if (!to || !body) {
      return NextResponse.json({ error: "수신자와 내용을 입력하세요." }, { status: 400 });
    }

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;

    const emailRaw = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      body.replace(/\n/g, "<br/>"),
    ].join("\r\n");

    const encodedEmail = Buffer.from(emailRaw, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedEmail,
        threadId: threadId || undefined,
      }),
    });

    const sendData = await sendRes.json();

    if (!sendRes.ok) {
      console.error("Gmail send error detail:", sendData);
      return NextResponse.json(
        {
          error: "메일 전송 실패",
          message: sendData.error?.message || "Google 전송 오류",
          status: sendRes.status,
        },
        { status: sendRes.status }
      );
    }

    return NextResponse.json({ success: true, messageId: sendData.id });
  } catch (err) {
    console.error("Reply send catch error:", err);
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
