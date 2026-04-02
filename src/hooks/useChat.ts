"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Message } from "@/types";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────────────────────

const WS_BASE =
  process.env.NEXT_PUBLIC_CHAT_WS_URL ??
  process.env.NEXT_PUBLIC_CHAT_API_URL?.replace(/^http/, "ws") ??
  "ws://localhost:3001";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
const AUTH_API =
  process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:3000";

// ─── Event types (must match hub.go) ────────────────────────────────────────

const WSEvents = {
  // Outbound (server → client)
  GET_ONLINE_USERS: "getOnlineUsers",
  MUTUAL_STATUS_UPDATE: "mutualStatusUpdate",
  MESSAGE_INCOMING: "message:incoming",
  MESSAGE_ACK: "message:ack",
  MESSAGE_READ: "message:read",
  ERROR: "error",

  // Inbound (client → server)
  SEND_MESSAGE: "message:send",
  MARK_READ: "message:mark_read",
} as const;

// ─── Callback types ─────────────────────────────────────────────────────────

export interface ChatCallbacks {
  onIncomingMessage?: (message: Message) => void;
  onMessageAck?: (message: Message) => void;
  onMessageRead?: (data: { message_id?: string; message_ids?: string[]; reader_id: string }) => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useChat(callbacks?: ChatCallbacks) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const callbacksRef = useRef(callbacks);

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [wsReady, setWsReady] = useState(false);

  // Keep callbacks ref up to date without triggering reconnect
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // ── Refresh token before reconnect ──────────────────────────────────────

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${AUTH_API}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // ── Connect / Reconnect ─────────────────────────────────────────────────

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    // Cookies auto-attach for same-domain; cross-origin needs ?token=
    const ws = new WebSocket(`${WS_BASE}/api/v1/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttemptRef.current = 0;
      setWsReady(true);
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;

      let parsed: { event: string; data: unknown };
      try {
        parsed = JSON.parse(e.data);
      } catch {
        return;
      }

      const { event, data } = parsed;

      switch (event) {
        case WSEvents.GET_ONLINE_USERS:
          setOnlineUsers(data as string[]);
          break;

        case WSEvents.MUTUAL_STATUS_UPDATE: {
          const { userId, status } = data as { userId: string; status: string };
          setOnlineUsers((prev) =>
            status === "online"
              ? [...new Set([...prev, userId])]
              : prev.filter((id) => id !== userId),
          );
          break;
        }

        case WSEvents.MESSAGE_INCOMING:
          callbacksRef.current?.onIncomingMessage?.(data as Message);
          break;

        case WSEvents.MESSAGE_ACK:
          callbacksRef.current?.onMessageAck?.(data as Message);
          break;

        case WSEvents.MESSAGE_READ:
          callbacksRef.current?.onMessageRead?.(
            data as { message_id?: string; message_ids?: string[]; reader_id: string },
          );
          break;

        case WSEvents.ERROR: {
          const errData = data as { message?: string };
          // Ignore 'unknown event' as we use it as a pong response for our heartbeat ping
          if (errData.message === "unknown event") break;
          toast.error(errData.message ?? "WebSocket error");
          break;
        }
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setWsReady(false);

      // Exponential backoff reconnect
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
      reconnectAttemptRef.current = attempt + 1;

      reconnectTimerRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        // Try to refresh token before reconnecting
        await refreshToken();
        if (mountedRef.current) {
          connect();
        }
      }, delay);
    };

    ws.onerror = () => {
      // onclose will fire after onerror, so reconnect is handled there
    };
  }, [refreshToken]);

  // ── Lifecycle ───────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }

      setWsReady(false);
    };
  }, [connect]);

  // ── Heartbeat (Ping/Pong) ────────────────────────────────────────────────

  // Send periodic pings to keep the TCP connection alive and detect silent drops
  useEffect(() => {
    if (!wsReady) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // The backend responds to unknown events with an error. 
        // We catch this in the onmessage handler and ignore it.
        wsRef.current.send(JSON.stringify({ event: "ping", data: {} }));
      }
    }, 25000); // 25 seconds

    return () => clearInterval(pingInterval);
  }, [wsReady]);

  // ── Send message ────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (receiverId: string, text: string, image?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      wsRef.current.send(
        JSON.stringify({
          event: WSEvents.SEND_MESSAGE,
          data: {
            receiver_id: receiverId,
            text,
            ...(image ? { image } : {}),
          },
        }),
      );
    },
    [],
  );

  // ── Mark read ───────────────────────────────────────────────────────────

  const markRead = useCallback((messageIds: string[]) => {
    if (
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN ||
      messageIds.length === 0
    )
      return;

    wsRef.current.send(
      JSON.stringify({
        event: WSEvents.MARK_READ,
        data: { message_ids: messageIds },
      }),
    );
  }, []);

  return { onlineUsers, sendMessage, markRead, wsReady };
}
