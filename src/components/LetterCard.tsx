"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { LetterImage } from "@/types";

interface LetterCardProps {
  char: string;
  image: LetterImage | null;
  index: number;
  total: number;
  flipping?: boolean;
  onLoad?: () => void;
}

function toDMS(deg: number, posDir: string, negDir: string): string {
  const d = Math.abs(deg);
  const degrees = Math.floor(d);
  const minutesFloat = (d - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(1);
  const dir = deg >= 0 ? posDir : negDir;
  return `${degrees}°${String(minutes).padStart(2, "0")}'${seconds}" ${dir}`;
}

export function LetterCard({ char, image, index, total, flipping, onLoad }: LetterCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  if (char === " ") {
    return <div aria-label="Space" className="w-4 shrink-0 sm:w-8" />;
  }

  const hasCoords = typeof image?.lat === "number" && typeof image?.lng === "number";
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${image!.lat},${image!.lng}&z=8`
    : image?.location
    ? `https://www.google.com/maps/search/${encodeURIComponent(image.location)}`
    : null;

  // Use inline styles for dynamic sizing (Tailwind can't JIT dynamic values)
  const maxVw = Math.max(6, Math.floor(94 / total));
  const cardW = expanded ? Math.min(maxVw + 10, 42) : maxVw;
  const cardMaxRem = expanded ? 14 : 11;

  const sizeStyle: React.CSSProperties = {
    width: `min(${cardMaxRem}rem, ${cardW}vw)`,
    flexShrink: 0,
  };
  const photoStyle: React.CSSProperties = {
    width: "100%",
    height: `min(${cardMaxRem}rem, ${cardW}vw)`,
    position: "relative" as const,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "all 0.5s",
  };

  const letterFontSize = expanded
    ? `clamp(1.8rem, ${(cardW * 0.55).toFixed(1)}vw, 4rem)`
    : `clamp(1.2rem, ${(cardW * 0.42).toFixed(1)}vw, 3rem)`;
  const nameFontSize = expanded ? "clamp(0.55rem,1.5vw,0.85rem)" : "clamp(0.42rem,1.1vw,0.65rem)";
  const coordFontSize = expanded ? "clamp(0.48rem,1.3vw,0.78rem)" : "clamp(0.38rem,0.95vw,0.58rem)";

  // Flip animation: stagger each card, face-down for 300ms then reveal
  const flipDelay = index * 60;
  const flipStyle: React.CSSProperties = flipping ? {
    animation: `cardFlip 0.55s ease ${flipDelay}ms both`,
  } : {};

  return (
    <article
      className="group relative animate-rise opacity-0 cursor-pointer select-none"
      style={{ ...sizeStyle, animationDelay: `${index * 80}ms`, transition: "width 0.5s, opacity 0s" }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* ── photo ── */}
      <div style={{ ...photoStyle, ...flipStyle }} onClick={(e) => { if (image?.url) { e.stopPropagation(); setLightbox(true); } }}>
        {/* gold corner ticks */}
        <span aria-hidden className="absolute -left-px -top-px z-10 h-2.5 w-2.5" style={{ borderTop: "1px solid rgba(201,168,76,0.5)", borderLeft: "1px solid rgba(201,168,76,0.5)" }} />
        <span aria-hidden className="absolute -right-px -top-px z-10 h-2.5 w-2.5" style={{ borderTop: "1px solid rgba(201,168,76,0.5)", borderRight: "1px solid rgba(201,168,76,0.5)" }} />
        <span aria-hidden className="absolute -left-px -bottom-px z-10 h-2.5 w-2.5" style={{ borderBottom: "1px solid rgba(201,168,76,0.5)", borderLeft: "1px solid rgba(201,168,76,0.5)" }} />
        <span aria-hidden className="absolute -right-px -bottom-px z-10 h-2.5 w-2.5" style={{ borderBottom: "1px solid rgba(201,168,76,0.5)", borderRight: "1px solid rgba(201,168,76,0.5)" }} />

        {image?.url ? (
          <Image
            src={image.url}
            alt={image.description || `Landsat image for ${char}`}
            fill
            sizes="(max-width: 640px) 15vw, 176px"
            className={`object-cover transition duration-700 ${expanded ? "scale-105" : "group-hover:scale-105"} ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => { setLoaded(true); onLoad?.(); }}
          />
        ) : null}

        {image?.url && !loaded ? (
          <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,#0a0a0a_8%,#1a1a1a_18%,#0a0a0a_33%)] bg-[length:200%_100%]" />
        ) : null}

        {loaded && (
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.22)", mixBlendMode: "multiply" }} />
        )}

        {/* scan lines */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)" }}
        />

        {/* index badge */}
        <div className="absolute left-1.5 top-1.5 z-10">
          <span style={{ fontFamily: "monospace", fontSize: "clamp(0.38rem,0.85vw,0.6rem)", letterSpacing: "0.15em", color: "rgba(201,168,76,0.7)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* letter bottom-left */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-1.5 py-1 sm:px-3 sm:py-2">
          <span
            className="font-display font-light leading-none text-white"
            style={{ fontSize: letterFontSize, transition: "font-size 0.5s" }}
          >
            {char}
          </span>
        </div>
      </div>

      {/* ── info below photo ── */}
      <div
        className="overflow-hidden transition-all duration-500"
        style={{ maxHeight: expanded ? "120px" : "52px", paddingTop: "6px" }}
      >
        <p
          className="truncate font-medium text-white"
          style={{
            fontSize: nameFontSize,
            letterSpacing: expanded ? "0.05em" : "0.1em",
            textTransform: "uppercase",
            opacity: 0.8,
            transition: "font-size 0.5s, letter-spacing 0.5s",
          }}
        >
          {image?.location || char}
        </p>

        {hasCoords ? (
          <a
            href={mapsUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 block font-mono hover:opacity-100"
            style={{
              fontSize: coordFontSize,
              color: "rgba(201,168,76,0.85)",
              opacity: 0.8,
              textDecoration: "none",
              letterSpacing: "0.02em",
              transition: "font-size 0.5s",
            }}
          >
            {toDMS(image!.lat as number, "N", "S")}
            <br />
            {toDMS(image!.lng as number, "E", "W")}
          </a>
        ) : image?.location && mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 block font-mono hover:opacity-100"
            style={{ fontSize: coordFontSize, color: "rgba(201,168,76,0.6)", textDecoration: "none" }}
          >
            Open in Maps ↗
          </a>
        ) : null}
      </div>
      {lightbox && image?.url && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:border-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
          <div
            className="relative"
            style={{ maxWidth: "min(92vw, 900px)", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.description || `Landsat image for ${char}`}
              style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", display: "block" }}
            />
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                  {image.location || char}
                </p>
                {hasCoords && (
                  <p style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "rgba(201,168,76,0.8)", marginTop: "0.2rem" }}>
                    {toDMS(image.lat as number, "N", "S")} · {toDMS(image.lng as number, "E", "W")}
                  </p>
                )}
              </div>
              <span className="font-display text-5xl font-light text-white/20">{char}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}
