import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { InspectionItem, InventoryItem, PasscodeItem } from "@/types";

const LOCAL_INSPECTIONS_KEY = "work_board_inspections_v1";
const LOCAL_INVENTORIES_KEY = "work_board_inventories_v1";
const LOCAL_PASSCODES_KEY = "work_board_passcodes_v1";

// Demo Seed Data
const DEFAULT_INSPECTIONS: InspectionItem[] = [
  {
    id: "ins-1",
    title: "승강기(엘리베이터) 정기 안전 점검",
    targetDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
    cycle: "월간",
    notes: "한국승강기안전공단 검사원 방문 점검",
    isDone: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ins-2",
    title: "소방 시설물 종합 종합정밀점검",
    targetDate: new Date(Date.now() + 18 * 86400000).toISOString().split("T")[0],
    cycle: "반기",
    notes: "소방 점검 대행업체 방문, 감지기 및 유도등 체크",
    isDone: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ins-3",
    title: "옥상 저수조(물탱크) 청소 및 위생점검",
    targetDate: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
    cycle: "반기",
    notes: "수질 검사 성적서 수령 필요",
    isDone: false,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_INVENTORIES: InventoryItem[] = [
  {
    id: "inv-1",
    name: "도어락 건전지 (AA 1.5V)",
    quantity: 4,
    minQuantity: 10,
    category: "전기/소모품",
    notes: "알칼라인 벡셀 48개입 박스 구매 권장",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv-2",
    name: "공용부 복도 LED 전등 (25W)",
    quantity: 2,
    minQuantity: 5,
    category: "조명/전등",
    notes: "주광색 삼구 주모양 램프",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv-3",
    name: "겨울철 제설용 염화칼슘",
    quantity: 8,
    minQuantity: 3,
    category: "제설/안전",
    notes: "25kg 마대 포대 (지하주차장 입구 보관)",
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PASSCODES: PasscodeItem[] = [
  {
    id: "pass-1",
    title: "1층 공용 현관 로비폰 비밀번호",
    code: "1234*",
    category: "공용현관",
    notes: "택배 기사님 및 입주민 공용 출입용",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pass-2",
    title: "옥상 및 전기/기계실 출입문",
    code: "7788#",
    category: "기계실/옥상",
    notes: "비상시 소방관 및 관리자 전용 key",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pass-3",
    title: "201호 공실 도어락 임시 비번",
    code: "9900*",
    category: "공실도어락",
    notes: "부동산 집 보러 올 때 안내용 임시 비번",
    createdAt: new Date().toISOString(),
  },
];

export function useUtilities() {
  // 1. Inspections State
  const [inspections, setInspections] = useState<InspectionItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_INSPECTIONS_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_INSPECTIONS;
      } catch (e) {
        return DEFAULT_INSPECTIONS;
      }
    }
    return DEFAULT_INSPECTIONS;
  });

  // 2. Inventories State
  const [inventories, setInventories] = useState<InventoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_INVENTORIES_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_INVENTORIES;
      } catch (e) {
        return DEFAULT_INVENTORIES;
      }
    }
    return DEFAULT_INVENTORIES;
  });

  // 3. Passcodes State
  const [passcodes, setPasscodes] = useState<PasscodeItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_PASSCODES_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_PASSCODES;
      } catch (e) {
        return DEFAULT_PASSCODES;
      }
    }
    return DEFAULT_PASSCODES;
  });

  const saveLocal = (key: string, data: any) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Fetch Inspections
  const fetchInspections = async () => {
    try {
      const { data, error } = await supabase
        .from("inspections")
        .select("*")
        .order("target_date", { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: InspectionItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          targetDate: d.target_date || d.targetDate,
          cycle: d.cycle || "월간",
          notes: d.notes || "",
          isDone: !!d.is_done,
          createdAt: d.created_at || d.createdAt,
        }));
        setInspections(mapped);
        saveLocal(LOCAL_INSPECTIONS_KEY, mapped);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Fetch Inventories
  const fetchInventories = async () => {
    try {
      const { data, error } = await supabase
        .from("inventories")
        .select("*")
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: InventoryItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          quantity: Number(d.quantity || 0),
          minQuantity: Number(d.min_quantity || d.minQuantity || 0),
          category: d.category || "기타",
          notes: d.notes || "",
          createdAt: d.created_at || d.createdAt,
        }));
        setInventories(mapped);
        saveLocal(LOCAL_INVENTORIES_KEY, mapped);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Fetch Passcodes
  const fetchPasscodes = async () => {
    try {
      const { data, error } = await supabase
        .from("passcodes")
        .select("*")
        .order("category", { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: PasscodeItem[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          code: d.code,
          category: d.category || "기타",
          notes: d.notes || "",
          createdAt: d.created_at || d.createdAt,
        }));
        setPasscodes(mapped);
        saveLocal(LOCAL_PASSCODES_KEY, mapped);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchInspections();
    fetchInventories();
    fetchPasscodes();

    const sub1 = supabase
      .channel("public:inspections")
      .on("postgres_changes", { event: "*", schema: "public", table: "inspections" }, fetchInspections)
      .subscribe();

    const sub2 = supabase
      .channel("public:inventories")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventories" }, fetchInventories)
      .subscribe();

    const sub3 = supabase
      .channel("public:passcodes")
      .on("postgres_changes", { event: "*", schema: "public", table: "passcodes" }, fetchPasscodes)
      .subscribe();

    return () => {
      supabase.removeChannel(sub1);
      supabase.removeChannel(sub2);
      supabase.removeChannel(sub3);
    };
  }, []);

  // --- INSPECTIONS ACTIONS ---
  const addInspection = async (item: Omit<InspectionItem, "id" | "createdAt">) => {
    const newItem: InspectionItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...inspections, newItem].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    setInspections(updated);
    saveLocal(LOCAL_INSPECTIONS_KEY, updated);

    await supabase.from("inspections").insert([
      {
        title: item.title,
        target_date: item.targetDate,
        cycle: item.cycle,
        notes: item.notes || "",
        is_done: !!item.isDone,
      },
    ]);
  };

  const toggleInspectionDone = async (id: string) => {
    const target = inspections.find((i) => i.id === id);
    if (!target) return;
    const newDone = !target.isDone;

    const updated = inspections.map((i) => (i.id === id ? { ...i, isDone: newDone } : i));
    setInspections(updated);
    saveLocal(LOCAL_INSPECTIONS_KEY, updated);

    await supabase.from("inspections").update({ is_done: newDone }).eq("id", id);
  };

  const deleteInspection = async (id: string) => {
    const updated = inspections.filter((i) => i.id !== id);
    setInspections(updated);
    saveLocal(LOCAL_INSPECTIONS_KEY, updated);

    await supabase.from("inspections").delete().eq("id", id);
  };

  // --- INVENTORIES ACTIONS ---
  const addInventory = async (item: Omit<InventoryItem, "id" | "createdAt">) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...inventories];
    setInventories(updated);
    saveLocal(LOCAL_INVENTORIES_KEY, updated);

    await supabase.from("inventories").insert([
      {
        name: item.name,
        quantity: item.quantity,
        min_quantity: item.minQuantity,
        category: item.category,
        notes: item.notes || "",
      },
    ]);
  };

  const updateInventoryQty = async (id: string, delta: number) => {
    const updated = inventories.map((inv) => {
      if (inv.id === id) {
        const newQty = Math.max(0, inv.quantity + delta);
        return { ...inv, quantity: newQty };
      }
      return inv;
    });
    setInventories(updated);
    saveLocal(LOCAL_INVENTORIES_KEY, updated);

    const target = updated.find((inv) => inv.id === id);
    if (target) {
      await supabase.from("inventories").update({ quantity: target.quantity }).eq("id", id);
    }
  };

  const deleteInventory = async (id: string) => {
    const updated = inventories.filter((i) => i.id !== id);
    setInventories(updated);
    saveLocal(LOCAL_INVENTORIES_KEY, updated);

    await supabase.from("inventories").delete().eq("id", id);
  };

  // --- PASSCODES ACTIONS ---
  const addPasscode = async (item: Omit<PasscodeItem, "id" | "createdAt">) => {
    const newItem: PasscodeItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...passcodes];
    setPasscodes(updated);
    saveLocal(LOCAL_PASSCODES_KEY, updated);

    await supabase.from("passcodes").insert([
      {
        title: item.title,
        code: item.code,
        category: item.category,
        notes: item.notes || "",
      },
    ]);
  };

  const deletePasscode = async (id: string) => {
    const updated = passcodes.filter((p) => p.id !== id);
    setPasscodes(updated);
    saveLocal(LOCAL_PASSCODES_KEY, updated);

    await supabase.from("passcodes").delete().eq("id", id);
  };

  return {
    inspections,
    inventories,
    passcodes,
    addInspection,
    toggleInspectionDone,
    deleteInspection,
    addInventory,
    updateInventoryQty,
    deleteInventory,
    addPasscode,
    deletePasscode,
  };
}
