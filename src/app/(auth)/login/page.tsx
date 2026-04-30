"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthDeco from "@/components/AuthDeco";

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/chat");
    }
  }, [user, router]);

  const handleLoginClick = () => {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000";
    const redirectUrl = encodeURIComponent(window.location.origin + "/auth-callback");
    
    // Calculate center of screen for popup
    const width = 500;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      `${authUrl}/login?redirect_url=${redirectUrl}`,
      "Katgen SSO",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* ── Left: Action ───────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center
                  group-hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to your account</p>
            </div>
          </div>

          <button
            onClick={handleLoginClick}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold
              text-primary-foreground transition-colors hover:bg-primary/90 flex items-center
              justify-center gap-2 shadow-sm"
          >
            <ExternalLink className="h-5 w-5" />
            Continue with Katgen SSO
          </button>
        </div>
      </div>

      {/* ── Right: Decorative ────────────────────────────────── */}
      <AuthDeco
        title="Centralized Authentication"
        subtitle="One secure account for the entire ecosystem."
      />
    </div>
  );
}
