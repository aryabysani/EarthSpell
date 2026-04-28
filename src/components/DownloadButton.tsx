"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import type { RefObject } from "react";

interface DownloadButtonProps {
  targetRef: RefObject<HTMLElement>;
  disabled?: boolean;
}

export function DownloadButton({ targetRef, disabled }: DownloadButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (!targetRef.current || busy) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(targetRef.current, {
        backgroundColor: "#000000",
        pixelRatio: window.devicePixelRatio || 2,
        skipFonts: false,
      });
      const link = document.createElement("a");
      link.download = "myname-in-landsat.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || busy}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-white/12 px-4 text-white/50 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      style={{ fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase" }}
      title="Download as PNG"
    >
      <Download size={11} aria-hidden="true" />
      {busy ? "Saving…" : "Download"}
    </button>
  );
}
