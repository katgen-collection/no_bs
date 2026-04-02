"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import Modal from "@/components/Modal";
import type { ContactRequest } from "@/types";
import { toast } from "sonner";

interface ContactRequestsModalProps {
  open: boolean;
  onClose: () => void;
  onContactsChanged: () => void;
}

type Tab = "incoming" | "outgoing";

export default function ContactRequestsModal({
  open,
  onClose,
  onContactsChanged,
}: ContactRequestsModalProps) {
  const { user: me } = useAuth();
  const [tab, setTab] = useState<Tab>("incoming");
  const [incoming, setIncoming] = useState<ContactRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    try {
      const [inc, out] = await Promise.all([
        chatApi.get<ContactRequest[]>(
          `/api/v1/contact-requests?receiver_id=${me.id}&status=pending`,
        ),
        chatApi.get<ContactRequest[]>(
          `/api/v1/contact-requests?sender_id=${me.id}&status=pending`,
        ),
      ]);
      setIncoming(inc);
      setOutgoing(out);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load requests";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [me]);

  // Fetch when modal opens
  useEffect(() => {
    if (open) fetchRequests();
  }, [open, fetchRequests]);

  const handleAccept = useCallback(
    async (id: string) => {
      setActionId(id);
      try {
        await chatApi.put(`/api/v1/contact-requests/${id}`, { status: "accepted" });
        setIncoming((prev) => prev.filter((r) => r.id !== id));
        onContactsChanged();
        toast.success("Contact request accepted");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to accept request";
        toast.error(message);
      } finally {
        setActionId(null);
      }
    },
    [onContactsChanged],
  );

  const handleReject = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await chatApi.put(`/api/v1/contact-requests/${id}`, { status: "rejected" });
      setIncoming((prev) => prev.filter((r) => r.id !== id));
      toast.success("Request rejected");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reject request";
      toast.error(message);
    } finally {
      setActionId(null);
    }
  }, []);

  const handleCancel = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await chatApi.delete(`/api/v1/contact-requests/${id}`);
      setOutgoing((prev) => prev.filter((r) => r.id !== id));
      toast.success("Request cancelled");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel request";
      toast.error(message);
    } finally {
      setActionId(null);
    }
  }, []);

  const list = tab === "incoming" ? incoming : outgoing;

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Contact Requests">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Contact Requests</h3>
          {incoming.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {incoming.length}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 mb-4">
          {(["incoming", "outgoing"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
                ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {loading && list.length === 0 && (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && list.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No {tab} requests.
            </p>
          )}

          {list.map((req) => {
            const isActing = actionId === req.id;
            const name = (tab === "incoming" ? req.sender_name : req.receiver_name) || "Unknown User";

            return (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {getInitials(name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tab === "incoming" ? "Wants to connect" : "Pending"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {tab === "incoming" ? (
                    <>
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10
                          text-success text-xs font-medium hover:bg-success/20 transition-colors"
                      >
                        {isActing ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10
                          text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                      >
                        <X className="size-3" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCancel(req.id)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10
                        text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                    >
                      {isActing ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <X className="size-3" />
                      )}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border px-6 py-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
