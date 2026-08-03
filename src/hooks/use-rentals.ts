import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Rental } from "@/types";

export function useRentals() {
  const [rentals, setRentals] = useState<Rental[]>([]);

  const fetchRentals = async () => {
    const { data, error } = await supabase
      .from("rental")
      .select("*");

    if (error) {
      console.error("Error fetching rentals:", error);
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
      setRentals(mapped);
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
    const payload = {
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
    if (error) console.error("Error adding rental:", error);
    else fetchRentals();
  };

  const updateRental = async (id: string, data: Partial<Rental>) => {
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
    if (error) console.error("Error updating rental:", error);
    else fetchRentals();
  };

  const deleteRental = async (id: string) => {
    const { error } = await supabase.from("rental").delete().eq("id", id);
    if (error) console.error("Error deleting rental:", error);
    else fetchRentals();
  };

  return { rentals, addRental, updateRental, deleteRental };
}
