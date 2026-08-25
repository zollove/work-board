import { NextRequest, NextResponse } from "next/server";
import { getGmailMails } from "@/lib/naver-mail";
import { fetchNaverMailsViaRest } from "@/lib/naver-rest-connector";
import { MailItem } from "@/types/mail";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const provider = req.nextUrl.searchParams.get("provider") || "all";
    const gmailToken = req.cookies.get("gmail_access_token")?.value;

    const [gmailList, naverList] = await Promise.all([
      getGmailMails(gmailToken),
      fetchNaverMailsViaRest(25),
    ]);

    let combinedMails: MailItem[] = [];

    if (provider === "gmail") {
      combinedMails = gmailList;
    } else if (provider === "naver") {
      combinedMails = naverList;
    } else {
      combinedMails = [...gmailList, ...naverList];
    }

    // Sort by receivedAt descending (newest first)
    combinedMails.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    const totalCount = combinedMails.length;
    const unreadCount = combinedMails.filter((m) => !m.isRead).length;

    return NextResponse.json({
      success: true,
      provider,
      totalCount,
      unreadCount,
      mails: combinedMails,
    });
  } catch (err) {
    console.error("Mail fetch API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
