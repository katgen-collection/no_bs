"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { chatApi } from "@/lib/api";
import type { Contact } from "@/types";
import { toast } from "sonner";

interface ContactsContextValue {
  contacts: Contact[];
  loading: boolean;
  /** Refetch the contacts list (e.g. after accepting a request) */
  refetch: () => void;
  /** Find a single contact by their user ID */
  getContact: (peerId: string) => Contact | undefined;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      const data = await chatApi.get<Contact[]>("/api/v1/contacts");
      setContacts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load contacts";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const getContact = useCallback(
    (peerId: string) => contacts.find((c) => c.contact_id === peerId),
    [contacts],
  );

  return (
    <ContactsContext.Provider value={{ contacts, loading, refetch: fetchContacts, getContact }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error("useContacts must be used within ContactsProvider");
  return ctx;
}
