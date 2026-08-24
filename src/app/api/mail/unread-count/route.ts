import { NextRequest, NextResponse } from "next/server";
import { getGmailMails, getNaverMails } from "@/lib/naver-mail";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const [gmailList, naverList] = await Promise.all([
      getGmailMails(),
      getNaverMails(),
    ]);

    const combinedMails = [...gmailList, ...naverList];
    const unreadCount = combinedMails.filter((m) => !m.isRead).length;

    return NextResponse.json({
      unreadCount,
      isConnected: true,
    });
  } catch (err) {
    return NextResponse.json({ unreadCount: 0, isConnected: false });
  }
}
