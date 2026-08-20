import { MailView } from "@/components/mail/mail-view";

export const metadata = {
  title: "구글 메일 (Gmail) | Work Board",
  description: "실시간 구글 메일 수신함 및 메모/지식창고 1초 스크랩",
};

export default function MailPage() {
  return <MailView />;
}
