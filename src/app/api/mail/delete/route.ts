import { NextRequest, NextResponse } from "next/server";
import { deleteRealNaverPop3Mail, deleteRealGmailMail } from "@/lib/naver-mail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mailIds: string[] = body.mailIds || [];
    const gmailToken = req.cookies.get("gmail_access_token")?.value;

    const results = await Promise.all(
      mailIds.map(async (id) => {
        if (id.startsWith("naver")) {
          return deleteRealNaverPop3Mail(id);
        } else if (id.startsWith("gmail")) {
          return deleteRealGmailMail(id, gmailToken);
        }
        return true;
      })
    );

    return NextResponse.json({
      success: true,
      deletedCount: mailIds.length,
      results,
    });
  } catch (err) {
    console.error("Mail delete API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
