"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ContactsProvider } from "@/context/ContactsContext";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // On mobile: show sidebar at /chat, hide it when viewing /chat/[peerId]
  const isInChat = pathname !== "/chat";

  return (
    <ContactsProvider>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar: hidden on mobile when a chat is open, always visible on md+ */}
        <div className={`${isInChat ? "hidden md:flex" : "flex"} w-full md:w-20 lg:w-72 shrink-0`}>
          <Sidebar />
        </div>
        {/* Chat panel: hidden on mobile when no chat is selected, always visible on md+ */}
        <div className={`${isInChat ? "flex" : "hidden md:flex"} flex-1 min-w-0`}>
          {children}
        </div>
      </div>
    </ContactsProvider>
  );
}
