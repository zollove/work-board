import { WorkCalendar } from "@/components/calendar/work-calendar";

export const metadata = {
  title: "캘린더 | 업무 관리 시스템",
  description: "날씨 경보, 건물 관리 업무 유틸리티 및 월별 캘린더",
};

export default function Home() {
  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <WorkCalendar />
    </div>
  );
}
