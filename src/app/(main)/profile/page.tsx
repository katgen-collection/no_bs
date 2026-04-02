"use client";

import { useState, useRef } from "react";
import { Camera, Mail, User as UserIcon, Shield, Loader2, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import type { User } from "@/types";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username ?? "");
  const [fullname, setFullname] = useState(user?.fullname ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const hasChanges = username !== user.username || fullname !== user.fullname;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      // TODO: Send avatar to backend once object storage is implemented
      // authApi.put<User>(`/api/v1/users/${user.id}`, { avatar: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const updated = await authApi.put<User>(`/api/v1/users/${user.id}`, {
        username,
        fullname,
      });
      updateUser(updated);
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-xl border border-border p-6 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage your profile information
            </p>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="size-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-border overflow-hidden">
                {avatarPreview || user.avatar ? (
                  <img
                    src={avatarPreview || user.avatar!}
                    alt="Avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-primary">
                    {getInitials(user.fullname)}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground
                  cursor-pointer hover:opacity-90 transition-opacity shadow-md"
              >
                <Camera className="size-5" />
                <input
                  ref={fileInputRef}
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Click the camera to change photo (preview only — upload coming soon)
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="size-4" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary/50
                  text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="size-4" />
                Full Name
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary/50
                  text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="size-4" />
                Email
              </label>
              <p className="px-4 py-2.5 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>

            {/* Role (read-only) */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="size-4" />
                Role
              </label>
              <p className="px-4 py-2.5 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!hasChanges || isSubmitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium
                text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </form>

          {/* Account info */}
          <div className="rounded-xl bg-secondary/30 p-5">
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
