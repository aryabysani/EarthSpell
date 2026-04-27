"use client";

import { Download } from "lucide-react";
import type { RefObject } from "react";

interface DownloadButtonProps {
  targetRef: RefObject<HTMLElement>;
  disabled?: boolean;
}

export function DownloadButton({ targetRef, disabled }: DownloadButtonProps) {
  async function handleDownload() {
    if (!targetRef.current) {
      return;
    }

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(targetRef.current, {
      backgroundColor: "#000000",
      useCORS: true,
      scale: window.devicePixelRatio || 2,
    });

    const link = document.createElement("a");
    link.download = "myname-in-landsat.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-white/12 px-5 text-white/50 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      style={{ fontSize: "0.72rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
      title="Download as PNG"
    >
      <Download size={12} aria-hidden="true" />
      Download
    </button>
  );
}
