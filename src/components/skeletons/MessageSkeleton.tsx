"use client";

export default function MessageSkeleton() {
  const rows = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {rows.map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <div className={`flex items-end gap-2 ${i % 2 !== 0 ? "flex-row-reverse" : ""}`}>
            <div className="skeleton size-8 rounded-full shrink-0" />
            <div className="skeleton h-16 w-[200px] rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
