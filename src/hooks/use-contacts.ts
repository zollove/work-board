import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Contact } from "@/types";

const LOCAL_STORAGE_KEY = "work_board_contacts_v1";

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
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

  const saveLocal = (data: Contact[]) => {
    setContacts(data);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }
  };

  const fetchContacts = async () => {
    const { data, error } = await supabase.from("contact").select("*");

    if (error) {
      console.warn("Error fetching contacts:", error.message);
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
      saveLocal(mapped);
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
    const newContact: Contact = {
      ...contact,
      id: crypto.randomUUID(),
    };

    // Instant Optimistic UI Update (0ms)
    saveLocal([...contacts, newContact]);

    const payload = {
      id: newContact.id,
      company_name: contact.companyName,
      manager_name: contact.managerName,
      phone: contact.phone,
      email: contact.email,
      items: contact.items,
      notes: contact.notes || "",
    };

    const { error } = await supabase.from("contact").insert([payload]);
    if (error) console.warn("Error adding contact to DB:", error.message);
  };

  const updateContact = async (id: string, data: Partial<Contact>) => {
    // Instant Optimistic UI Update (0ms)
    const updated = contacts.map((c) => (c.id === id ? { ...c, ...data } : c));
    saveLocal(updated);

    const payload: any = {};
    if (data.companyName !== undefined) payload.company_name = data.companyName;
    if (data.managerName !== undefined) payload.manager_name = data.managerName;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.email !== undefined) payload.email = data.email;
    if (data.items !== undefined) payload.items = data.items;
    if (data.notes !== undefined) payload.notes = data.notes;

    const { error } = await supabase.from("contact").update(payload).eq("id", id);
    if (error) console.warn("Error updating contact in DB:", error.message);
  };

  const deleteContact = async (id: string) => {
    // Instant Optimistic UI Update (0ms)
    saveLocal(contacts.filter((c) => c.id !== id));

    const { error } = await supabase.from("contact").delete().eq("id", id);
    if (error) console.warn("Error deleting contact in DB:", error.message);
  };

  return { contacts, addContact, updateContact, deleteContact };
}
