import { WorkLogView } from "@/components/worklog/worklog-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "일일 업무일지 | 업무 관리 시스템",
  description: "수행 업무, 미결 사항, 서식/표 작성, 사진 및 음성 일지 보고",
};

export default function WorkLogPage() {
  return <WorkLogView />;
}
