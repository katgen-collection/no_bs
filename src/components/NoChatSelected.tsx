"use client";

import { MessageSquare } from "lucide-react";

export default function NoChatSelected() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Pulsing icon */}
      <div className="relative flex justify-center mb-8">
        <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center absolute animate-ping opacity-20" />
        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center absolute animate-pulse" />
        <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center relative">
          <MessageSquare className="size-8 text-primary" />
        </div>
      </div>

      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold">Welcome to no_bs</h2>
        <p className="text-muted-foreground max-w-[280px] mx-auto">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
}
