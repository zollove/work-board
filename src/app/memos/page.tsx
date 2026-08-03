import { MemoBoard } from "@/components/memos/memo-board";

export default function MemosPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">메모 보드</h1>
        <p className="text-muted-foreground mt-2">
          업무 노트, 아이디어, 할 일 등을 기록하고 관리하세요.
        </p>
      </div>
      <MemoBoard />
    </div>
  );
}
