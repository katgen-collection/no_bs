"use client";

import { useParams } from "next/navigation";
import ChatContainer from "@/components/ChatContainer";
import { useContacts } from "@/context/ContactsContext";

export default function ChatPeerPage() {
  const params = useParams<{ peerId: string }>();
  const peerId = params.peerId;
  const { getContact, loading } = useContacts();

  const contact = getContact(peerId);
  const contactName = contact?.assigned_name || contact?.name || "Contact";
  const contactAvatar = contact?.avatar ?? null;

  return <ChatContainer peerId={peerId} contactName={contactName} contactAvatar={contactAvatar} />;
}
