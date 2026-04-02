"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import AuthDeco from "@/components/AuthDeco";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const validate = (): boolean => {
    if (!formData.username.trim()) {
      toast.error("Username is required");
      return false;
    }
    if (!formData.fullname.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await authApi.post("/api/v1/auth/register", formData);
      toast.success("Account created! Please sign in.");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left: Form ───────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center
                  group-hover:bg-primary/20 transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-muted-foreground">
                Get started with your free account
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="signup-username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="signup-username"
                  type="text"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pl-10
                    text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2
                    focus:ring-ring focus:border-transparent transition-colors"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => update("username", e.target.value)}
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="signup-fullname">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="signup-fullname"
                  type="text"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pl-10
                    text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2
                    focus:ring-ring focus:border-transparent transition-colors"
                  placeholder="John Doe"
                  value={formData.fullname}
                  onChange={(e) => update("fullname", e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="signup-email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pl-10
                    text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2
                    focus:ring-ring focus:border-transparent transition-colors"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pl-10 pr-10
                    text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2
                    focus:ring-ring focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => update("password", e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold
                text-primary-foreground transition-colors hover:bg-primary/90
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center
                justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Link to login */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Decorative ────────────────────────────────── */}
      <AuthDeco
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </div>
  );
}
