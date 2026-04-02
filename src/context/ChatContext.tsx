"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useChat, type ChatCallbacks } from "@/hooks/useChat";
import type { Message } from "@/types";

// ─── Context shape ──────────────────────────────────────────────────────────

type MessageHandler = (message: Message) => void;
type ReadHandler = (data: { message_id?: string; message_ids?: string[]; reader_id: string }) => void;

interface ChatContextValue {
  onlineUsers: string[];
  wsReady: boolean;
  sendMessage: (receiverId: string, text: string, image?: string) => void;
  markRead: (messageIds: string[]) => void;

  /** Subscribe to incoming messages (returns unsubscribe fn) */
  subscribeIncoming: (handler: MessageHandler) => () => void;
  /** Subscribe to message ack events (returns unsubscribe fn) */
  subscribeAck: (handler: MessageHandler) => () => void;
  /** Subscribe to read receipt events (returns unsubscribe fn) */
  subscribeRead: (handler: ReadHandler) => () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
  // Subscriber refs — allows components to register/unregister handlers
  // without causing the hook to reconnect
  const incomingHandlers = useRef<Set<MessageHandler>>(new Set());
  const ackHandlers = useRef<Set<MessageHandler>>(new Set());
  const readHandlers = useRef<Set<ReadHandler>>(new Set());

  const callbacks: ChatCallbacks = {
    onIncomingMessage: (msg) => {
      incomingHandlers.current.forEach((fn) => fn(msg));
    },
    onMessageAck: (msg) => {
      ackHandlers.current.forEach((fn) => fn(msg));
    },
    onMessageRead: (data) => {
      readHandlers.current.forEach((fn) => fn(data));
    },
  };

  const { onlineUsers, sendMessage, markRead, wsReady } = useChat(callbacks);

  const subscribeIncoming = useCallback((handler: MessageHandler) => {
    incomingHandlers.current.add(handler);
    return () => { incomingHandlers.current.delete(handler); };
  }, []);

  const subscribeAck = useCallback((handler: MessageHandler) => {
    ackHandlers.current.add(handler);
    return () => { ackHandlers.current.delete(handler); };
  }, []);

  const subscribeRead = useCallback((handler: ReadHandler) => {
    readHandlers.current.add(handler);
    return () => { readHandlers.current.delete(handler); };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        onlineUsers,
        wsReady,
        sendMessage,
        markRead,
        subscribeIncoming,
        subscribeAck,
        subscribeRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
