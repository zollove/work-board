import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("gmail_access_token");
  response.cookies.delete("gmail_refresh_token");
  response.cookies.delete("gmail_user_email");
  return response;
}
