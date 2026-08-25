import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
  );
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
