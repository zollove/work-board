import { MindmapView } from "@/components/calendar/mindmap-view";

export const metadata = {
  title: "연간 마인드맵 | 업무 관리 시스템",
  description: "1월부터 12월까지 한 해 동안의 일정을 마인드맵으로 시각화합니다.",
};

export default function MindmapPage() {
  return <MindmapView />;
}
