"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Appearance section */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Customize your chat experience
            </p>
          </div>

          {/* Theme toggle */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium">Appearance</h2>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Light */}
              <button
                onClick={() => theme === "dark" && toggleTheme()}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all
                  hover:shadow-md
                  ${
                    theme === "light"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
              >
                <div
                  className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                    theme === "light"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Sun className="size-6" />
                </div>
                <span className="text-sm font-medium">Light</span>
                {theme === "light" && (
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                    Active
                  </span>
                )}
              </button>

              {/* Dark */}
              <button
                onClick={() => theme === "light" && toggleTheme()}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all
                  hover:shadow-md
                  ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
              >
                <div
                  className={`size-12 rounded-full flex items-center justify-center transition-colors ${
                    theme === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Moon className="size-6" />
                </div>
                <span className="text-sm font-medium">Dark</span>
                {theme === "dark" && (
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium">Preview</h2>
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              {/* Mini chat header */}
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-primary">JD</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Jane Doe</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-success" />
                    Online
                  </p>
                </div>
              </div>

              {/* Mock messages */}
              <div className="p-3 space-y-2">
                {/* Received */}
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-tl-md px-3 py-1.5 max-w-[70%]">
                    <p className="text-xs">Hey! How are you? 👋</p>
                    <p className="text-[9px] text-muted-foreground text-right mt-0.5">10:30</p>
                  </div>
                </div>

                {/* Sent */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-3 py-1.5 max-w-[70%]">
                    <p className="text-xs">I&apos;m great, thanks! 😊</p>
                    <div className="flex items-center justify-end gap-0.5 mt-0.5">
                      <p className="text-[9px] text-primary-foreground/70">10:31</p>
                      <svg className="size-2.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M1 12l5 5L18 5M6 12l5 5L23 5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock input */}
              <div className="px-3 py-2 border-t border-border flex items-center gap-2">
                <div className="flex-1 h-7 rounded-md bg-secondary/50 border border-input" />
                <div className="size-7 rounded-md bg-primary flex items-center justify-center">
                  <svg className="size-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Future sections placeholder */}
        <div className="bg-card rounded-xl border border-border p-6 opacity-50">
          <div className="flex items-center gap-2">
            <Monitor className="size-5 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-medium">Notifications</h2>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
