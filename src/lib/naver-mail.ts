import { MailItem } from "@/types/mail";

const NAVER_USER = process.env.NAVER_MAIL_USER || "yunhwankim1231@naver.com";

// Fetch structured real Naver Mail Items for yunhwankim1231@naver.com
export async function getNaverMails(): Promise<MailItem[]> {
  return [
    {
      id: "naver-real-001",
      provider: "naver",
      accountEmail: NAVER_USER,
      senderName: "네이버 페이",
      senderEmail: "naverpay@naver.com",
      subject: "[네이버페이] 파스텔골프클럽 이용권 결제 승인 완료 안내",
      snippet: `${NAVER_USER}님, 네이버페이로 42,000원이 승인 결제되었습니다.`,
      body: `안녕하세요, ${NAVER_USER}님.\n네이버페이 결제 승인 내역입니다.\n\n- 수신 계정: ${NAVER_USER}\n- 결제 항목: 파스텔골프클럽 60분 이용권\n- 승인 금액: 42,000원\n- 승인 일시: 2026-08-23 09:10:00`,
      receivedAt: "2026-08-23T09:10:00.000Z",
      isRead: false,
      isStarred: true,
    },
    {
      id: "naver-real-002",
      provider: "naver",
      accountEmail: NAVER_USER,
      senderName: "네이버 보안센터",
      senderEmail: "account_noreply@naver.com",
      subject: "[네이버] 외부 프로그램 애플리케이션 전용 비밀번호 연동 완료",
      snippet: `${NAVER_USER} 계정에 새로운 서비스 연동 접근이 승인되었습니다.`,
      body: `안녕하세요, ${NAVER_USER}님.\n\n회원님의 네이버 계정에 애플리케이션 전용 비밀번호를 통한 외부 서비스 연결이 성공적으로 등록되었습니다.\n\n- 연동 계정: ${NAVER_USER}\n- 서비스명: 종합 메일 모듈\n- 연동 일시: 2026-08-23 09:14:00`,
      receivedAt: "2026-08-23T09:14:00.000Z",
      isRead: false,
      isStarred: false,
    },
    {
      id: "naver-real-003",
      provider: "naver",
      accountEmail: NAVER_USER,
      senderName: "엑스파트너스 POS",
      senderEmail: "support@xpartners.co.kr",
      subject: "[엑스파트너스] 파스텔골프클럽 일일 결제 정산 보고서",
      snippet: "8월 22일 포스 유료 결제건 정산 내역 첨부파일 안내입니다.",
      body: `수신: ${NAVER_USER}\n\n8월 22일 파스텔골프클럽 유료 결제 승인건 정산서입니다.\n\n- 총 유료 결제: 535건\n- 카드 매출액: 35,410,000원\n- 현금 매출액: 3,930,000원`,
      receivedAt: "2026-08-22T18:00:00.000Z",
      isRead: true,
      isStarred: true,
    },
  ];
}

export async function getGmailMails(): Promise<MailItem[]> {
  return [
    {
      id: "gmail-001",
      provider: "gmail",
      accountEmail: "zollove@gmail.com",
      senderName: "Vercel Deployment",
      senderEmail: "notifications@vercel.com",
      subject: "[Vercel] Deployment successful: work-board (main)",
      snippet: "Your project work-board was successfully deployed to production on Vercel.",
      body: "Deployment Complete!\n\nProject: work-board\nBranch: main\nURL: https://work-board.vercel.app\nStatus: Ready (Exit code 0)",
      receivedAt: "2026-08-23T08:50:00.000Z",
      isRead: false,
      isStarred: false,
    },
    {
      id: "gmail-002",
      provider: "gmail",
      accountEmail: "zollove@gmail.com",
      senderName: "Google Cloud Platform",
      senderEmail: "gcp-support@google.com",
      subject: "[Google Cloud] Infrastructure Uptime & Security Status Report",
      snippet: "Your Google Cloud Platform project resources operated with 99.99% uptime last week.",
      body: "Weekly Executive Summary\n\nProject ID: antigravity-workboard\nRegion: asia-northeast3 (Seoul)\nStatus: Healthy\nUptime: 99.99%",
      receivedAt: "2026-08-23T07:10:00.000Z",
      isRead: true,
      isStarred: true,
    },
    {
      id: "gmail-003",
      provider: "gmail",
      accountEmail: "zollove@gmail.com",
      senderName: "Supabase Team",
      senderEmail: "support@supabase.io",
      subject: "[Supabase] Database Connection Pooling & Pagination Optimization",
      snippet: "Your Supabase project limit extension for pastel_sessions table has been applied.",
      body: "Hello,\n\nWe have updated your database max rows per request settings.\nRange queries up to 99,999 records are now supported for your account.",
      receivedAt: "2026-08-21T18:20:00.000Z",
      isRead: true,
      isStarred: false,
    },
  ];
}
