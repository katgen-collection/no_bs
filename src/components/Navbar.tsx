"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, MessageSquareX, Settings, User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-border
        bg-background/80 backdrop-blur-lg"
    >
      <div className="mx-auto h-full max-w-7xl px-4 flex items-center justify-between">
        {/* ── Logo ────────────────────────────────────────────── */}
        <Link
          href="/chat"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <MessageSquareX className="size-6 shrink-0" />
          <div className="typewriter-container">
            <h1 className="text-logo text-xl typewriter">no_bs</h1>
          </div>
        </Link>

        {/* ── Nav items ───────────────────────────────────────── */}
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
              font-medium text-foreground/80 transition-colors hover:bg-secondary"
          >
            <Settings className="size-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          {user && (
            <>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
                  font-medium text-foreground/80 transition-colors hover:bg-secondary"
              >
                <User className="size-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm
                  font-medium text-foreground/60 transition-colors hover:bg-destructive/10
                  hover:text-destructive"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
