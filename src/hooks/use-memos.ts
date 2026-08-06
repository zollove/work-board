import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Memo } from "@/types";

const LOCAL_STORAGE_KEY = "work_board_memos_v2";

// Helper function to compress images using HTML Canvas before uploading
export function compressImage(file: File, maxWidth = 1000, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context not available");

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const saveToLocal = (newMemos: Memo[]) => {
    setMemos(newMemos);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newMemos));
      } catch (e) {
        console.warn("localStorage quota exceeded:", e);
      }
    }
  };

  const fetchMemos = async () => {
    const { data, error } = await supabase
      .from("memo")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching memos (using local backup):", error.message);
      return;
    }

    if (data && data.length > 0) {
      const mapped: Memo[] = data.map((m: any) => ({
        id: m.id,
        title: m.title || "",
        content: m.content || "",
        category: m.category || "일반",
        imageUrl: m.image_url || m.imageUrl || "",
        createdAt: m.created_at || m.createdAt || new Date().toISOString(),
        updatedAt: m.updated_at || m.updatedAt || new Date().toISOString(),
      }));
      saveToLocal(mapped);
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
    const newMemo: Memo = {
      ...memo,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    saveToLocal([newMemo, ...memos]);

    const payload: any = {
      title: memo.title,
      content: memo.content,
      category: memo.category,
      image_url: memo.imageUrl || "",
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from("memo").insert([payload]);
    if (error) console.warn("Error adding memo to Supabase:", error.message);
    else fetchMemos();
  };

  const updateMemo = async (id: string, data: Partial<Memo>) => {
    const now = new Date().toISOString();
    const updated = memos.map((m) => (m.id === id ? { ...m, ...data, updatedAt: now } : m));
    saveToLocal(updated);

    const payload: any = {
      updated_at: now,
    };
    if (data.title !== undefined) payload.title = data.title;
    if (data.content !== undefined) payload.content = data.content;
    if (data.category !== undefined) payload.category = data.category;
    if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;

    const { error } = await supabase.from("memo").update(payload).eq("id", id);
    if (error) console.warn("Error updating memo in Supabase:", error.message);
    else fetchMemos();
  };

  const deleteMemo = async (id: string) => {
    const updated = memos.filter((m) => m.id !== id);
    saveToLocal(updated);

    const { error } = await supabase.from("memo").delete().eq("id", id);
    if (error) console.warn("Error deleting memo in Supabase:", error.message);
    else fetchMemos();
  };

  return { memos, addMemo, updateMemo, deleteMemo, refresh: fetchMemos };
}
