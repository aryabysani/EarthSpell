"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import type { LetterResult } from "@/types";

interface DownloadButtonProps {
  name: string;
  results: LetterResult[];
  disabled?: boolean;
}

const CARD = 320;   // px per card (square)
const PAD  = 24;    // outer padding
const INFO = 80;    // height of text area below each photo

async function loadImage(url: string): Promise<HTMLImageElement> {
  // Proxy through Next.js so Firebase Storage images are same-origin
  const proxied = `/_next/image?url=${encodeURIComponent(url)}&w=640&q=95`;
  const res = await fetch(proxied);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(blobUrl); resolve(img); };
    img.onerror = reject;
    img.src = blobUrl;
  });
}

export function DownloadButton({ name, results, disabled }: DownloadButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (busy) return;
    const cards = results.filter((r) => r.char !== " " && r.image?.url);
    if (!cards.length) return;
    setBusy(true);

    try {
      const count  = cards.length;
      const W      = PAD * 2 + count * CARD + (count - 1) * 12;
      const H      = PAD * 2 + CARD + INFO;

      const canvas  = document.createElement("canvas");
      canvas.width  = W;
      canvas.height = H;
      const ctx     = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // Load all images in parallel
      const imgs = await Promise.all(
        cards.map((r) => loadImage(r.image!.url!))
      );

      imgs.forEach((img, i) => {
        const x = PAD + i * (CARD + 12);
        const y = PAD;

        // Draw photo (cover-fit into square)
        const scale = Math.max(CARD / img.naturalWidth, CARD / img.naturalHeight);
        const sw    = CARD / scale;
        const sh    = CARD / scale;
        const sx    = (img.naturalWidth  - sw) / 2;
        const sy    = (img.naturalHeight - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, x, y, CARD, CARD);

        // Dark gradient at bottom of photo for letter readability
        const grad = ctx.createLinearGradient(x, y + CARD * 0.55, x, y + CARD);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.82)");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, CARD, CARD);

        // Gold corner ticks
        ctx.strokeStyle = "rgba(201,168,76,0.6)";
        ctx.lineWidth = 1.5;
        const tick = 14;
        [[x,y],[x+CARD,y],[x,y+CARD],[x+CARD,y+CARD]].forEach(([cx,cy], ti) => {
          ctx.beginPath();
          ctx.moveTo(cx + (ti%2===0?tick:-tick), cy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy + (ti<2?tick:-tick));
          ctx.stroke();
        });

        // Letter
        ctx.fillStyle = "#fff";
        ctx.font = `300 ${CARD * 0.32}px serif`;
        ctx.fillText(cards[i].char, x + 16, y + CARD - 20);

        // Index badge
        ctx.fillStyle = "rgba(201,168,76,0.8)";
        ctx.font = `400 11px monospace`;
        ctx.fillText(String(i + 1).padStart(2, "0"), x + 10, y + 18);

        // Location name below photo
        const loc = cards[i].image?.location || cards[i].char;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "500 13px sans-serif";
        ctx.fillText(loc.toUpperCase().slice(0, 22), x + 2, y + CARD + 22);

        // Coordinates
        const lat = cards[i].image?.lat;
        const lng = cards[i].image?.lng;
        if (typeof lat === "number" && typeof lng === "number") {
          ctx.fillStyle = "rgba(201,168,76,0.8)";
          ctx.font = "400 10px monospace";
          ctx.fillText(fmt(lat, "N","S"), x + 2, y + CARD + 42);
          ctx.fillText(fmt(lng, "E","W"), x + 2, y + CARD + 56);
        }
      });

      // Watermark
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.font = "400 13px monospace";
      ctx.textAlign = "right";
      ctx.fillText("earthspell.vercel.app", W - PAD, H - 8);

      // Save
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url  = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href     = url;
        link.download = `${name.trim()}-earthspell.vercel.app.png`;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png");

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

function fmt(deg: number, pos: string, neg: string) {
  const d = Math.abs(deg);
  const dd = Math.floor(d);
  const mf = (d - dd) * 60;
  const mm = Math.floor(mf);
  const ss = ((mf - mm) * 60).toFixed(1);
  return `${dd}°${String(mm).padStart(2,"0")}'${ss}" ${deg >= 0 ? pos : neg}`;
}
