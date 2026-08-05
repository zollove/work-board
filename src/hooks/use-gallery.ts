import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { GalleryItem } from "@/types";

// Helper function to compress images using HTML Canvas before uploading
export function compressImage(file: File, maxWidth = 1200, quality = 0.75): Promise<string> {
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

export function useGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase gallery table read error (using fallback state):", error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const mapped: GalleryItem[] = data.map((g: any) => ({
          id: g.id,
          title: g.title || "제목 없음",
          category: g.category || "기타",
          imageUrl: g.image_url || g.imageUrl || "",
          notes: g.notes || "",
          createdAt: g.created_at || g.createdAt || new Date().toISOString(),
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("public:gallery")
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery" }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addItem = async (data: { title: string; category: string; imageUrl: string; notes?: string }) => {
    const now = new Date().toISOString();
    const payload = {
      title: data.title,
      category: data.category,
      image_url: data.imageUrl,
      notes: data.notes || "",
      created_at: now,
    };

    const { error } = await supabase.from("gallery").insert([payload]);
    if (error) {
      console.warn("Gallery insert fallback:", error.message);
      // Fallback local update if table doesn't exist yet
      const newItem: GalleryItem = {
        id: crypto.randomUUID(),
        title: data.title,
        category: data.category,
        imageUrl: data.imageUrl,
        notes: data.notes || "",
        createdAt: now,
      };
      setItems((prev) => [newItem, ...prev]);
    } else {
      fetchItems();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      fetchItems();
    }
  };

  return { items, loading, addItem, deleteItem, refresh: fetchItems };
}
