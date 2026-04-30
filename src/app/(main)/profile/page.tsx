"use client";

import { Mail, User as UserIcon, Shield, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const handleEditProfile = () => {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000";
    window.open(`${authUrl}/profile?redirect_url=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-xl border border-border p-6 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your centralized Katgen account
            </p>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="size-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-border overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-primary">
                    {getInitials(user.fullname)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Read-only Form */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="size-4" />
                Username
              </label>
              <p className="px-4 py-2.5 rounded-lg border border-input bg-muted/50 text-sm font-medium">
                {user.username}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="size-4" />
                Full Name
              </label>
              <p className="px-4 py-2.5 rounded-lg border border-input bg-muted/50 text-sm font-medium">
                {user.fullname}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="size-4" />
                Email
              </label>
              <p className="px-4 py-2.5 rounded-lg border border-input bg-muted/50 text-sm font-medium text-muted-foreground">
                {user.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="size-4" />
                Role
              </label>
              <p className="px-4 py-2.5 rounded-lg border border-input bg-muted/50 text-sm font-medium text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>

            <button
              onClick={handleEditProfile}
              className="w-full py-2.5 mt-4 rounded-lg bg-primary text-primary-foreground font-medium
                text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="size-4" />
              Edit Profile in Katgen SSO
            </button>
          </div>

          {/* Account info */}
          <div className="rounded-xl bg-secondary/30 p-5 mt-8">
            <h2 className="text-sm font-medium mb-3">Account Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Member Since</span>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Account Status</span>
                <span className="text-success font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
