"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Users, UserPlus, Bell } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";
import AddContactModal from "@/components/modals/AddContactModal";
import ContactRequestsModal from "@/components/modals/ContactRequestsModal";
import type { ContactRequest } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useChatContext } from "@/context/ChatContext";
import { useContacts } from "@/context/ContactsContext";
import { chatApi } from "@/lib/api";
import { useEffect, useCallback } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user: me } = useAuth();
  const { onlineUsers } = useChatContext();
  const { contacts, loading, refetch } = useContacts();

  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const fetchPendingCount = useCallback(async () => {
    if (!me) return;
    try {
      const data = await chatApi.get<ContactRequest[]>(
        `/api/v1/contact-requests?receiver_id=${me.id}&status=pending`,
      );
      setPendingCount(data.length);
    } catch {
      // silently ignore
    }
  }, [me]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Filter contacts locally
  const filtered = contacts.filter((c) => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const name = (c.assigned_name || c.name || "").toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (showOnlineOnly && !onlineUsers.includes(c.contact_id)) {
      return false;
    }
    return true;
  });

  if (loading) return <SidebarSkeleton />;

  const activePeerId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  return (
    <>
      <aside className="h-full w-full md:w-20 lg:w-72 border-r border-border flex flex-col transition-all duration-200 shrink-0">
        {/* Header */}
        <div className="border-b border-border w-full p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-muted-foreground" />
              <span className="font-medium text-lg md:hidden lg:block">Contacts</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRequestsModalOpen(true)}
                className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Contact Requests"
              >
                <Bell className="size-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-primary
                    text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Add Contact"
              >
                <UserPlus className="size-4" />
              </button>
            </div>
          </div>

          {/* Search — visible on mobile and lg+ */}
          <div className="relative md:hidden lg:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-secondary/50
                text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2
                focus:ring-ring"
            />
          </div>

          {/* Online filter */}
          <label className="md:hidden lg:flex items-center gap-2 cursor-pointer flex">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="size-3.5 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground">Show online only</span>
          </label>
        </div>

        {/* Contact List */}
        <div className="overflow-y-auto w-full py-1 flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Search className="size-8 mb-2 opacity-50" />
              <p className="text-sm">No contacts found</p>
              {searchQuery && (
                <button
                  className="text-xs mt-2 text-primary hover:underline"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filtered.map((contact) => {
              const displayName = contact.assigned_name || contact.name;
              const isActive = activePeerId === contact.contact_id;
              const isOnline = onlineUsers.includes(contact.contact_id);

              return (
                <Link
                  key={contact.id}
                  href={`/chat/${contact.contact_id}`}
                  className={`w-full py-2.5 px-3 flex items-center gap-3 transition-all
                    hover:bg-secondary active:scale-[0.99]
                    ${isActive ? "bg-primary/10 border-l-4 border-primary" : ""}`}
                >
                  {/* Avatar */}
                  <div className="relative mx-0 md:mx-auto lg:mx-0 shrink-0">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                      <span className="text-sm font-medium text-primary">
                        {getInitials(displayName)}
                      </span>
                    </div>
                    {/* Online dot */}
                    <span
                      className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-background transition-colors ${
                        isOnline ? "bg-success" : "bg-muted-foreground/30"
                      }`}
                    />
                  </div>

                  {/* Info — visible on mobile and lg+ */}
                  <div className="md:hidden lg:block text-left min-w-0 flex-1">
                    <div className="font-medium truncate text-sm">{displayName}</div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`size-2 rounded-full ${
                          isOnline ? "bg-success" : "bg-muted-foreground/30"
                        }`}
                      />
                      <span className="text-xs text-muted-foreground truncate">
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* Modals */}
      <AddContactModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <ContactRequestsModal
        open={requestsModalOpen}
        onClose={() => setRequestsModalOpen(false)}
        onContactsChanged={() => {
          refetch();
          fetchPendingCount();
        }}
      />
    </>
  );
}
