import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

  if (!code) {
    return NextResponse.redirect(`${req.nextUrl.origin}/mail?auth=failed`);
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    const response = NextResponse.redirect(`${req.nextUrl.origin}/mail?auth=success`);

    if (data.access_token) {
      response.cookies.set("gmail_access_token", data.access_token, {
        path: "/",
        httpOnly: true,
        maxAge: 3600,
      });
    }

    if (data.refresh_token) {
      response.cookies.set("gmail_refresh_token", data.refresh_token, {
        path: "/",
        httpOnly: true,
        maxAge: 30 * 24 * 3600,
      });
    }

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${req.nextUrl.origin}/mail?auth=error`);
  }
}
