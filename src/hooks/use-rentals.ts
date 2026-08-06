import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Rental } from "@/types";

const LOCAL_STORAGE_KEY = "work_board_rentals_v1";

export function useRentals() {
  const [rentals, setRentals] = useState<Rental[]>(() => {
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

  const saveLocal = (data: Rental[]) => {
    setRentals(data);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }
  };

  const fetchRentals = async () => {
    const { data, error } = await supabase.from("rental").select("*");

    if (error) {
      console.warn("Error fetching rentals:", error.message);
      return;
    }

    if (data) {
      const mapped: Rental[] = data.map((r: any) => ({
        id: r.id,
        building: r.building || "",
        room: r.room || "",
        tenantName: r.tenant_name || r.tenantName || "",
        contact: r.contact || "",
        deposit: Number(r.deposit) || 0,
        rent: Number(r.rent) || 0,
        contractStart: r.contract_start || r.contractStart || "",
        contractEnd: r.contract_end || r.contractEnd || "",
        notes: r.notes || "",
      }));
      saveLocal(mapped);
    }
  };

  useEffect(() => {
    fetchRentals();

    const channel = supabase
      .channel("public:rental")
      .on("postgres_changes", { event: "*", schema: "public", table: "rental" }, () => {
        fetchRentals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addRental = async (rental: Omit<Rental, "id">) => {
    const newRental: Rental = {
      ...rental,
      id: crypto.randomUUID(),
    };

    // Instant Optimistic UI Update (0ms)
    saveLocal([...rentals, newRental]);

    const payload = {
      id: newRental.id,
      building: rental.building,
      room: rental.room,
      tenant_name: rental.tenantName,
      contact: rental.contact,
      deposit: rental.deposit,
      rent: rental.rent,
      contract_start: rental.contractStart,
      contract_end: rental.contractEnd,
      notes: rental.notes || "",
    };

    const { error } = await supabase.from("rental").insert([payload]);
    if (error) console.warn("Error adding rental to DB:", error.message);
  };

  const updateRental = async (id: string, data: Partial<Rental>) => {
    // Instant Optimistic UI Update (0ms)
    const updated = rentals.map((r) => (r.id === id ? { ...r, ...data } : r));
    saveLocal(updated);

    const payload: any = {};
    if (data.building !== undefined) payload.building = data.building;
    if (data.room !== undefined) payload.room = data.room;
    if (data.tenantName !== undefined) payload.tenant_name = data.tenantName;
    if (data.contact !== undefined) payload.contact = data.contact;
    if (data.deposit !== undefined) payload.deposit = data.deposit;
    if (data.rent !== undefined) payload.rent = data.rent;
    if (data.contractStart !== undefined) payload.contract_start = data.contractStart;
    if (data.contractEnd !== undefined) payload.contract_end = data.contractEnd;
    if (data.notes !== undefined) payload.notes = data.notes;

    const { error } = await supabase.from("rental").update(payload).eq("id", id);
    if (error) console.warn("Error updating rental in DB:", error.message);
  };

  const deleteRental = async (id: string) => {
    // Instant Optimistic UI Update (0ms)
    saveLocal(rentals.filter((r) => r.id !== id));

    const { error } = await supabase.from("rental").delete().eq("id", id);
    if (error) console.warn("Error deleting rental in DB:", error.message);
  };

  return { rentals, addRental, updateRental, deleteRental };
}
