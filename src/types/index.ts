// ─── User (user-auth-service) ───────────────────────────────────────────────
export interface User {
  readonly id: string;           // UUID v4
  readonly username: string;
  readonly fullname: string;
  readonly email: string;
  readonly avatar: string | null;
  readonly role: "user" | "admin";
  readonly created_at: string;   // ISO 8601
  readonly updated_at: string;
}

// ─── Session (user-auth-service) ────────────────────────────────────────────
export interface Session {
  readonly id: string;           // UUID, same as session_id in JWT
  readonly user_id: string;
  readonly ip_address: string;
  readonly user_agent: string;
  readonly valid: boolean;
  readonly expires_at: string;
  readonly created_at: string;
  readonly updated_at: string;
}

// ─── Contact (chat-service) ─────────────────────────────────────────────────
export interface Contact {
  readonly id: string;           // UUID
  readonly user_id: string;
  readonly contact_id: string;
  readonly name: string;
  readonly username: string;
  readonly email: string;
  readonly avatar: string | null;
  readonly assigned_name: string | null;
  readonly muted: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

// ─── Contact Request (chat-service) ─────────────────────────────────────────
export interface ContactRequest {
  readonly id: string;           // UUID
  readonly sender_id: string;
  readonly receiver_id: string;
  readonly sender_name: string;
  readonly receiver_name: string;
  readonly status: "pending" | "accepted" | "rejected";
  readonly message: string;
  readonly created_at: string;
  readonly updated_at: string;
}

// ─── Message (chat-service — MongoDB) ───────────────────────────────────────
export interface Message {
  readonly id: string;           // 24-char MongoDB ObjectID hex
  readonly sender_id: string;    // UUID
  readonly receiver_id: string;  // UUID
  readonly text: string;
  readonly image: string;
  readonly read: boolean;
  readonly created_at: string;   // RFC3339Nano
  readonly updated_at: string;
}

// ─── Optimistic Message (client-side, before server ack) ────────────────────
export interface OptimisticMessage extends Omit<Message, "readonly"> {
  _optimistic?: boolean;
}

// ─── WebSocket Envelope ─────────────────────────────────────────────────────
export interface WSEvent {
  event: string;
  data: unknown;
}

// ─── API Envelope ───────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  message: string;
  data: T;
  error?: string;
}

// ─── Login Response Shape ───────────────────────────────────────────────────
export interface LoginData {
  user: User;
  session_id: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
}
