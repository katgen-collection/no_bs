"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatContext } from "@/context/ChatContext";
import { chatApi } from "@/lib/api";
import { formatMessageTime, formatDateBadge, getInitials } from "@/lib/utils";
import MessageSkeleton from "@/components/skeletons/MessageSkeleton";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";
import type { Message } from "@/types";
import { Check, CheckCheck } from "lucide-react";

interface ChatContainerProps {
  peerId: string;
  contactName: string;
  contactAvatar?: string | null;
}

interface HistoryResponse {
  messages: Message[];
  next_cursor: string;
  has_more: boolean;
}

// Extended message type with optimistic flag
interface DisplayMessage extends Message {
  _optimistic?: boolean;
}

export default function ChatContainer({ peerId, contactName, contactAvatar }: ChatContainerProps) {
  const { user: me } = useAuth();
  const { sendMessage, markRead, subscribeIncoming, subscribeAck, subscribeRead } = useChatContext();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Fetch initial messages ──────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);

    chatApi
      .get<HistoryResponse>(`/api/v1/messages/history?peer_id=${peerId}&limit=50`)
      .then((data) => {
        if (cancelled) return;
        // API returns newest-first, reverse for oldest-first display
        setMessages(data.messages.reverse());
        setNextCursor(data.next_cursor);
        setHasMore(data.has_more);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [peerId]);

  // ── Scroll to bottom on initial load ────────────────────────────────────

  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView();
    }
  }, [loading]);

  // ── Load older messages via IntersectionObserver ─────────────────────────

  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    setLoadingMore(true);

    const container = containerRef.current;
    const prevHeight = container?.scrollHeight ?? 0;

    try {
      const data = await chatApi.get<HistoryResponse>(
        `/api/v1/messages/history?peer_id=${peerId}&cursor=${nextCursor}&limit=50`,
      );
      // Prepend older messages (reversed from newest-first)
      setMessages((prev) => [...data.messages.reverse(), ...prev]);
      setNextCursor(data.next_cursor);
      setHasMore(data.has_more);

      // Maintain scroll position after prepend
      requestAnimationFrame(() => {
        if (container) {
          const newHeight = container.scrollHeight;
          container.scrollTop = newHeight - prevHeight;
        }
      });
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [peerId, nextCursor, hasMore, loadingMore]);

  // Set up IntersectionObserver on sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadOlder();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadOlder]);

  // ── Auto-scroll helper ──────────────────────────────────────────────────

  const isNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  // ── WebSocket event subscriptions ───────────────────────────────────────

  // Incoming messages from the peer
  useEffect(() => {
    return subscribeIncoming((msg) => {
      // Only append if this message is from/to our current peer
      if (msg.sender_id === peerId || msg.receiver_id === peerId) {
        setMessages((prev) => {
          // Deduplicate: don't add if message with same ID already exists
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Auto-scroll if near bottom
        if (isNearBottom()) {
          scrollToBottom();
        }
      }
    });
  }, [subscribeIncoming, peerId, isNearBottom, scrollToBottom]);

  // Message ack — replace optimistic messages with real ones
  useEffect(() => {
    return subscribeAck((msg) => {
      if (msg.sender_id === me?.id && msg.receiver_id === peerId) {
        setMessages((prev) => {
          // Find the optimistic message and replace it with the acked one
          const optimisticIdx = prev.findIndex(
            (m) =>
              (m as DisplayMessage)._optimistic &&
              m.receiver_id === msg.receiver_id &&
              m.text === msg.text,
          );

          if (optimisticIdx !== -1) {
            const updated = [...prev];
            updated[optimisticIdx] = msg;
            return updated;
          }

          // If no optimistic found, just append (shouldn't happen normally)
          if (!prev.some((m) => m.id === msg.id)) {
            return [...prev, msg];
          }
          return prev;
        });

        if (isNearBottom()) {
          scrollToBottom();
        }
      }
    });
  }, [subscribeAck, peerId, me?.id, isNearBottom, scrollToBottom]);

  // Read receipts
  useEffect(() => {
    return subscribeRead((data) => {
      setMessages((prev) =>
        prev.map((m) => {
          // Single message read notification (sent to sender)
          if (data.message_id && m.id === data.message_id) {
            return { ...m, read: true };
          }
          // Bulk read confirmation (sent to reader)
          if (data.message_ids && data.message_ids.includes(m.id)) {
            return { ...m, read: true };
          }
          return m;
        }),
      );
    });
  }, [subscribeRead]);

  // ── Mark unread messages as read ────────────────────────────────────────

  useEffect(() => {
    if (loading || !me) return;

    const unreadIds = messages
      .filter((m) => m.sender_id === peerId && !m.read && !(m as DisplayMessage)._optimistic)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      markRead(unreadIds);
    }
  }, [messages, peerId, me, loading, markRead]);

  // ── Send handler ────────────────────────────────────────────────────────

  const handleSend = useCallback(
    (text: string, image?: string) => {
      if (!me) return;

      // Create optimistic message
      const optimistic: DisplayMessage = {
        id: crypto.randomUUID(),
        sender_id: me.id,
        receiver_id: peerId,
        text,
        image: image ?? "",
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _optimistic: true,
      };

      setMessages((prev) => [...prev, optimistic]);
      scrollToBottom();

      // Send via WebSocket
      sendMessage(peerId, text, image);
    },
    [me, peerId, sendMessage, scrollToBottom],
  );

  // ── Group messages by date ──────────────────────────────────────────────

  const groupedByDate = messages.reduce<Record<string, DisplayMessage[]>>((acc, msg) => {
    const dateKey = new Date(msg.created_at).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader contactId={peerId} name={contactName} avatar={contactAvatar} />
        <MessageSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader contactId={peerId} name={contactName} avatar={contactAvatar} />

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Sentinel for loading older messages */}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-2">
            {loadingMore && (
              <div className="skeleton h-4 w-24 rounded-full" />
            )}
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {Object.entries(groupedByDate).map(([dateKey, msgs]) => (
          <div key={dateKey} className="space-y-3">
            {/* Date separator */}
            <div className="flex justify-center sticky top-0 z-10">
              <span className="bg-secondary text-xs px-3 py-1 rounded-full text-muted-foreground shadow-sm">
                {formatDateBadge(msgs[0].created_at)}
              </span>
            </div>

            {/* Messages */}
            {msgs.map((msg, idx) => {
              const isMine = msg.sender_id === me?.id;
              const prevMsg = idx > 0 ? msgs[idx - 1] : null;
              const isSequential = prevMsg?.sender_id === msg.sender_id;
              const isOptimistic = (msg as DisplayMessage)._optimistic;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                    isOptimistic ? "opacity-70" : ""
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[80%] ${
                      isMine ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar — only first in a sequence */}
                    {!isSequential && !isMine ? (
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {getInitials(contactName)}
                        </span>
                      </div>
                    ) : !isMine ? (
                      <div className="size-8 shrink-0" />
                    ) : null}

                    {/* Bubble */}
                    <div
                      className={`px-4 py-2 shadow-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                          : "bg-secondary rounded-2xl rounded-tl-md"
                      }`}
                    >
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Attachment"
                          className="max-w-full rounded-lg mb-2"
                          style={{ maxHeight: 300 }}
                        />
                      )}
                      {msg.text && <p className="break-words text-sm">{msg.text}</p>}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                          isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        <span>{formatMessageTime(msg.created_at)}</span>
                        {isMine && (
                          msg.read ? (
                            <CheckCheck className="size-3 text-blue-400" />
                          ) : (
                            <Check className="size-3" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <MessageInput onSend={handleSend} />
    </div>
  );
}
