"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, X, Trash2 } from "lucide-react";
import { chatApi } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { useChatContext } from "@/context/ChatContext";
import { useContacts } from "@/context/ContactsContext";
import { useState } from "react";
import { toast } from "sonner";

interface ChatHeaderProps {
  contactId: string;
  name: string;
  avatar?: string | null;
}

export default function ChatHeader({ contactId, name, avatar }: ChatHeaderProps) {
  const router = useRouter();
  const { onlineUsers } = useChatContext();
  const { refetch } = useContacts();
  const [showConfirm, setShowConfirm] = useState(false);
  const [removing, setRemoving] = useState(false);

  const isOnline = onlineUsers.includes(contactId);

  const handleRemoveContact = async () => {
    setRemoving(true);
    try {
      await chatApi.delete(`/api/v1/contacts/${contactId}`);
      toast.success("Contact removed");
      refetch();
      router.push("/chat");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove contact";
      toast.error(message);
    } finally {
      setRemoving(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="p-3 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => router.push("/chat")}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="size-5" />
          </button>

          {/* Avatar */}
          <div className="relative">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
              {avatar ? (
                <img src={avatar} alt={name} className="size-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-primary">
                  {getInitials(name)}
                </span>
              )}
            </div>
            {/* Online dot */}
            <span
              className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card transition-colors ${
                isOnline ? "bg-success" : "bg-muted-foreground/30"
              }`}
            />
          </div>

          {/* Info */}
          <div>
            <h3 className="font-medium text-sm">{name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span
                className={`size-2 rounded-full ${
                  isOnline ? "bg-success" : "bg-muted-foreground/30"
                }`}
              />
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Remove contact?</span>
              <button
                onClick={handleRemoveContact}
                disabled={removing}
                className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs
                  font-medium hover:bg-destructive/20 transition-colors"
              >
                {removing ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-secondary text-xs font-medium
                  hover:bg-secondary/80 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowConfirm(true)}
                className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Remove Contact"
                aria-label="Remove contact"
              >
                <Trash2 className="size-4" />
              </button>
              <button
                onClick={() => router.push("/chat")}
                className="p-2 rounded-lg hover:bg-secondary transition-colors hidden md:flex"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
