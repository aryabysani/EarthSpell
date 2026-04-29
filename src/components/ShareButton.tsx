"use client";

import { Check, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  name: string;
  disabled?: boolean;
}

export function ShareButton({ name, disabled }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = new URL(window.location.href);
    url.searchParams.set("name", name);
    await navigator.clipboard.writeText(url.toString());
    window.history.replaceState(null, "", url.toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={disabled || !name.trim()}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/12 px-3 text-white/50 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:px-5"
      style={{ fontSize: "clamp(0.58rem, 1.6vw, 0.68rem)", letterSpacing: "0.2em", textTransform: "uppercase" }}
      title="Copy share link"
    >
      {copied ? <Check size={12} aria-hidden="true" /> : <LinkIcon size={12} aria-hidden="true" />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
