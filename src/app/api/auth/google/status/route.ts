import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("gmail_access_token")?.value;
  const refreshToken = req.cookies.get("gmail_refresh_token")?.value;
  const email = req.cookies.get("gmail_user_email")?.value;

  const isConnected = !!(token || refreshToken);

  return NextResponse.json({
    isConnected,
    email: email || "",
  });
}
