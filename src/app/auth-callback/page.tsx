"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  useEffect(() => {
    if (window.opener) {
      window.opener.location.href = "/chat";
      window.close();
    } else {
      window.location.href = "/chat";
    }
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}
