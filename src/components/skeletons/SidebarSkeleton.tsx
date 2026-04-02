"use client";

import { Users } from "lucide-react";

export default function SidebarSkeleton() {
  const rows = Array(8).fill(null);

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-border flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="border-b border-border w-full p-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
      </div>

      {/* Skeleton rows */}
      <div className="overflow-y-auto w-full py-3 flex-1">
        {rows.map((_, i) => (
          <div key={i} className="w-full p-3 flex items-center gap-3">
            <div className="skeleton size-12 rounded-full shrink-0" />
            <div className="hidden lg:block flex-1 min-w-0 space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
