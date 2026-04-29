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

      // Build a single-row clone so the download is always one horizontal strip
      const clone = targetRef.current.cloneNode(true) as HTMLElement;
      clone.style.cssText = [
        "position:fixed",
        "top:-9999px",
        "left:-9999px",
        "display:flex",
        "flex-wrap:nowrap",       // force single row
        "align-items:flex-end",
        "gap:8px",
        "padding:16px",
        "background:#000",
        "width:max-content",
        "max-width:none",
        "overflow:visible",
        "opacity:1",
      ].join(";");

      // Make all child cards visible (they start opacity-0 from animate-rise)
      clone.querySelectorAll("article").forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
      });

      document.body.appendChild(clone);

      const dataUrl = await toPng(clone, {
        backgroundColor: "#000000",
        pixelRatio: 2,
        skipFonts: false,
      });

      document.body.removeChild(clone);

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
