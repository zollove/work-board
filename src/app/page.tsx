import { WorkCalendar } from "@/components/calendar/work-calendar";

export default function Home() {
  return (
    <div className="p-8 w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Work Calendar</h1>
        <p className="text-muted-foreground mt-2">
          연간 업무 일정을 한눈에 파악하고 월별 상세 내역을 관리하세요.
        </p>
      </div>
      <WorkCalendar />
    </div>
  );
}
