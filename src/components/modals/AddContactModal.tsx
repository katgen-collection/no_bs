"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, Loader2, Check } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/context/AuthContext";
import { authApi, chatApi } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import Modal from "@/components/Modal";
import type { User } from "@/types";
import { toast } from "sonner";

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddContactModal({ open, onClose }: AddContactModalProps) {
  const { user: me } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 500);

  // Search users when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    authApi
      .get<User[]>(`/api/v1/users?search=${encodeURIComponent(debouncedQuery)}`)
      .then((data) => {
        if (!cancelled) {
          // Filter out ourselves
          setResults(data.filter((u) => u.id !== me?.id));
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, me?.id]);

  const handleSendRequest = useCallback(
    async (userId: string) => {
      setSendingId(userId);
      try {
        await chatApi.post("/api/v1/contact-requests", { receiver_id: userId });
        setSentIds((prev) => new Set(prev).add(userId));
        toast.success("Contact request sent");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send contact request";
        toast.error(message);
      } finally {
        setSendingId(null);
      }
    },
    [],
  );

  const handleClose = useCallback(() => {
    setQuery("");
    setResults([]);
    setSentIds(new Set());
    onClose();
  }, [onClose]);

  return (
    <Modal open={open} onClose={handleClose} ariaLabel="Add Contact">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">Add Contact</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Search by username, name, or email.
        </p>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-input bg-secondary/50
              text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2
              focus:ring-ring"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-1">
          {results.length === 0 && debouncedQuery && !isSearching && (
            <p className="text-center text-sm text-muted-foreground py-6">
              No users found for &quot;{debouncedQuery}&quot;
            </p>
          )}

          {results.map((user) => {
            const isSent = sentIds.has(user.id);
            const isSending = sendingId === user.id;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar initials */}
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {getInitials(user.fullname || user.username)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.fullname}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSendRequest(user.id)}
                  disabled={isSent || isSending}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    text-xs font-medium transition-colors
                    ${
                      isSent
                        ? "bg-success/10 text-success cursor-default"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                >
                  {isSending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : isSent ? (
                    <Check className="size-3" />
                  ) : (
                    <UserPlus className="size-3" />
                  )}
                  {isSent ? "Requested" : "Request"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4 flex justify-end">
        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
