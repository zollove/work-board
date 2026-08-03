import { CalendarEvent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthCardProps {
  month: number;
  events: CalendarEvent[];
  onClick: () => void;
}

export function MonthCard({ month, events, onClick }: MonthCardProps) {
  // Sort events by date ascending
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card 
      className="h-48 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group flex flex-col"
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2 shrink-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">{month + 1}월</CardTitle>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            +
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              className={`text-xs px-2 py-1.5 rounded truncate flex items-center gap-1 ${event.isImportant ? 'bg-red-100 text-red-700 font-medium border border-red-100' : 'bg-primary/10 text-primary'}`}
            >
              <span className="opacity-70 flex-shrink-0 w-5">
                {event.date.split("-")[2]}
              </span>
              {event.isImportant && <span className="text-[10px]">★</span>}
              <span className="truncate">{event.title}</span>
            </div>
          ))}
          {sortedEvents.length === 0 && (
            <div className="text-sm text-muted-foreground flex-1 flex items-center justify-center h-full">
              일정 없음
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
