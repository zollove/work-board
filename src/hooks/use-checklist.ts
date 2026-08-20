import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = "work_board_daily_checklist_v1";

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: "check-1",
    text: "옥상/공용부 미백 상태 및 배수구 청소 점검",
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "check-2",
    text: "1층 로비 폰 및 승강기 정상 작동 확인",
    isCompleted: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "check-3",
    text: "주차장 차수판 및 집수정 배수펌프 점검",
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

export function useChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST;
      } catch (e) {
        return DEFAULT_CHECKLIST;
      }
    }
    return DEFAULT_CHECKLIST;
  });

  const saveLocal = (newItems: ChecklistItem[]) => {
    setItems(newItems);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
      } catch (e) {}
    }
  };

  const fetchChecklist = async () => {
    const { data, error } = await supabase
      .from("checklist")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Checklist table fallback to local storage:", error.message);
      return;
    }

    if (data) {
      const mapped: ChecklistItem[] = data.map((item: any) => ({
        id: item.id,
        text: item.text || "",
        isCompleted: item.is_completed ?? item.isCompleted ?? false,
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      }));
      // Exact sync with DB (deletions on one device will instantly reflect on all devices)
      saveLocal(mapped);
    }
  };

  useEffect(() => {
    fetchChecklist();

    const channel = supabase
      .channel("public:checklist")
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist" }, () => {
        fetchChecklist();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addItem = async (text: string) => {
    if (!text.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...items, newItem];
    saveLocal(updated);

    const payload = {
      id: newItem.id,
      text: newItem.text,
      is_completed: false,
      created_at: newItem.createdAt,
    };

    const { error } = await supabase.from("checklist").insert([payload]);
    if (error) console.warn("Checklist DB insert error:", error.message);
    else fetchChecklist();
  };

  const toggleItem = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    const newCompleted = !target.isCompleted;
    const updated = items.map((i) => (i.id === id ? { ...i, isCompleted: newCompleted } : i));
    saveLocal(updated);

    const { error } = await supabase
      .from("checklist")
      .update({ is_completed: newCompleted })
      .eq("id", id);
    if (error) console.warn("Checklist DB update error:", error.message);
    else fetchChecklist();
  };

  const deleteItem = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    saveLocal(updated);

    const { error } = await supabase.from("checklist").delete().eq("id", id);
    if (error) console.warn("Checklist DB delete error:", error.message);
    else fetchChecklist();
  };

  const clearCompleted = async () => {
    const completedIds = items.filter((i) => i.isCompleted).map((i) => i.id);
    const updated = items.filter((i) => !i.isCompleted);
    saveLocal(updated);

    if (completedIds.length > 0) {
      const { error } = await supabase.from("checklist").delete().in("id", completedIds);
      if (error) console.warn("Checklist DB clear error:", error.message);
      else fetchChecklist();
    }
  };

  return { items, addItem, toggleItem, deleteItem, clearCompleted };
}
