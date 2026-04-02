"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { Send, Image as ImageIcon, Smile, X } from "lucide-react";

interface MessageInputProps {
  onSend: (text: string, image?: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  // Click outside to close emoji picker
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // Send handler
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !imagePreview) return;

    onSend(trimmed, imagePreview ?? undefined);
    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, imagePreview, onSend]);

  // Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const canSend = (text.trim().length > 0 || !!imagePreview) && !disabled;

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3">
      {/* Image preview strip */}
      {imagePreview && (
        <div className="mb-2 flex items-start gap-2">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 rounded-lg object-cover border border-border"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground
                flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Attach image"
        >
          <ImageIcon className="size-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Emoji picker */}
        <div className="relative shrink-0" ref={emojiRef}>
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Emoji"
          >
            <Smile className="size-5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <EmojiQuickPicker onSelect={handleEmojiSelect} />
            </div>
          )}
        </div>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-lg border border-input bg-secondary/50 px-3 py-2
            text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring
            max-h-[120px] overflow-y-auto"
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 p-2.5 rounded-lg bg-primary text-primary-foreground
            hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          title="Send"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Lightweight emoji picker (no heavy dependency) ─────────────────────────

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀", "😂", "🥹", "😊", "😎", "🤩", "😍", "🥰", "😘", "😋", "🤔", "😅", "😢", "😡", "🥺", "😴"],
  },
  {
    label: "Gestures",
    emojis: ["👍", "👎", "👋", "🤝", "✌️", "🤞", "👏", "🙏", "💪", "🫶", "❤️", "🔥", "⭐", "✨", "💯", "🎉"],
  },
  {
    label: "Objects",
    emojis: ["☕", "🍕", "🎵", "📱", "💻", "🎮", "📸", "✈️", "🏠", "⏰", "📚", "💡", "🎁", "🔔", "📌", "🗑️"],
  },
];

function EmojiQuickPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="w-72 bg-card border border-border rounded-xl shadow-xl p-3 space-y-2">
      {EMOJI_CATEGORIES.map((cat) => (
        <div key={cat.label}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
            {cat.label}
          </p>
          <div className="grid grid-cols-8 gap-0.5">
            {cat.emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                className="size-8 flex items-center justify-center rounded hover:bg-secondary
                  transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
