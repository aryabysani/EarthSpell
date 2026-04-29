"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import type { RefObject } from "react";

interface DownloadButtonProps {
  targetRef: RefObject<HTMLElement>;
  disabled?: boolean;
}

async function urlToDataURL(src: string): Promise<string> {
  // Proxy through Next.js image optimizer so we get same-origin response
  const optimized = `/_next/image?url=${encodeURIComponent(src)}&w=256&q=90`;
  const res = await fetch(optimized);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export function DownloadButton({ targetRef, disabled }: DownloadButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (!targetRef.current || busy) return;
    setBusy(true);
    try {
      // Collect all <img> elements in the card strip
      const imgs = Array.from(
        targetRef.current.querySelectorAll<HTMLImageElement>("img")
      );

      // Pre-fetch every image as a data URL so the canvas can draw them
      const dataUrls = await Promise.all(
        imgs.map((img) => {
          const src = img.src || img.getAttribute("src") || "";
          return src ? urlToDataURL(src) : Promise.resolve("");
        })
      );

      // Swap src on cloned imgs → done inside toPng filter
      const { toPng } = await import("html-to-image");

      // Clone into an off-screen single-row strip
      const clone = targetRef.current.cloneNode(true) as HTMLElement;
      clone.style.cssText = [
        "position:fixed",
        "top:-9999px",
        "left:-9999px",
        "display:flex",
        "flex-wrap:nowrap",
        "align-items:flex-end",
        "gap:8px",
        "padding:16px",
        "background:#000",
        "width:max-content",
        "max-width:none",
        "overflow:visible",
      ].join(";");

      // Force articles visible and swap image srcs to data URLs
      const articles = clone.querySelectorAll<HTMLElement>("article");
      articles.forEach((el) => { el.style.opacity = "1"; });

      const cloneImgs = clone.querySelectorAll<HTMLImageElement>("img");
      cloneImgs.forEach((img, i) => {
        if (dataUrls[i]) {
          img.src = dataUrls[i];
          img.removeAttribute("srcset");
          img.style.opacity = "1";
        }
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
