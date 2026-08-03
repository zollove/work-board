import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Contact } from "@/types";

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("contact")
      .select("*");

    if (error) {
      console.error("Error fetching contacts:", error);
      return;
    }

    if (data) {
      const mapped: Contact[] = data.map((c: any) => ({
        id: c.id,
        companyName: c.company_name || c.companyName || "",
        managerName: c.manager_name || c.managerName || "",
        phone: c.phone || "",
        email: c.email || "",
        items: c.items || "",
        notes: c.notes || "",
      }));
      setContacts(mapped);
    }
  };

  useEffect(() => {
    fetchContacts();

    const channel = supabase
      .channel("public:contact")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact" }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addContact = async (contact: Omit<Contact, "id">) => {
    const payload = {
      company_name: contact.companyName,
      manager_name: contact.managerName,
      phone: contact.phone,
      email: contact.email,
      items: contact.items,
      notes: contact.notes || "",
    };

    const { error } = await supabase.from("contact").insert([payload]);
    if (error) console.error("Error adding contact:", error);
    else fetchContacts();
  };

  const updateContact = async (id: string, data: Partial<Contact>) => {
    const payload: any = {};
    if (data.companyName !== undefined) payload.company_name = data.companyName;
    if (data.managerName !== undefined) payload.manager_name = data.managerName;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.items !== undefined) payload.items = data.items;
    if (data.notes !== undefined) payload.notes = data.notes;

    const { error } = await supabase.from("contact").update(payload).eq("id", id);
    if (error) console.error("Error updating contact:", error);
    else fetchContacts();
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from("contact").delete().eq("id", id);
    if (error) console.error("Error deleting contact:", error);
    else fetchContacts();
  };

  return { contacts, addContact, updateContact, deleteContact };
}
