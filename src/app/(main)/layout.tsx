"use client";

import Navbar from "@/components/Navbar";
import { ChatProvider } from "@/context/ChatContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
    </ChatProvider>
  );
}
