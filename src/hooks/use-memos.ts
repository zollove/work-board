import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Memo } from "@/types";

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([]);

  const fetchMemos = async () => {
    const { data, error } = await supabase
      .from("memo")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching memos:", error);
      return;
    }

    if (data) {
      const mapped: Memo[] = data.map((m: any) => ({
        id: m.id,
        title: m.title || "",
        content: m.content || "",
        category: m.category || "일반",
        createdAt: m.created_at || m.createdAt || new Date().toISOString(),
        updatedAt: m.updated_at || m.updatedAt || new Date().toISOString(),
      }));
      setMemos(mapped);
    }
  };

  useEffect(() => {
    fetchMemos();

    const channel = supabase
      .channel("public:memo")
      .on("postgres_changes", { event: "*", schema: "public", table: "memo" }, () => {
        fetchMemos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addMemo = async (memo: Omit<Memo, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const payload = {
      title: memo.title,
      content: memo.content,
      category: memo.category,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from("memo").insert([payload]);
    if (error) console.error("Error adding memo:", error);
    else fetchMemos();
  };

  const updateMemo = async (id: string, data: Partial<Memo>) => {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) payload.title = data.title;
    if (data.content !== undefined) payload.content = data.content;
    if (data.category !== undefined) payload.category = data.category;

    const { error } = await supabase.from("memo").update(payload).eq("id", id);
    if (error) console.error("Error updating memo:", error);
    else fetchMemos();
  };

  const deleteMemo = async (id: string) => {
    const { error } = await supabase.from("memo").delete().eq("id", id);
    if (error) console.error("Error deleting memo:", error);
    else fetchMemos();
  };

  return { memos, addMemo, updateMemo, deleteMemo };
}
