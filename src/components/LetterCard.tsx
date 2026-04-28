"use client";

import Image from "next/image";
import { useState } from "react";
import type { LetterImage } from "@/types";

interface LetterCardProps {
  char: string;
  image: LetterImage | null;
  index: number;
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

export function LetterCard({ char, image, index }: LetterCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (char === " ") {
    return <div aria-label="Space" className="w-8 shrink-0 sm:w-12" />;
  }

  const hasCoords = typeof image?.lat === "number" && typeof image?.lng === "number";
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${image!.lat},${image!.lng}&z=8`
    : image?.location
    ? `https://www.google.com/maps/search/${encodeURIComponent(image.location)}`
    : null;

  const imgSize = expanded ? "w-56 sm:w-72" : "w-44 sm:w-52";
  const photoHeight = expanded ? "h-72 sm:h-96" : "h-44 sm:h-52";

  return (
    <article
      className={`group relative shrink-0 animate-rise opacity-0 cursor-pointer select-none transition-all duration-500 ${imgSize}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* ── photo ── */}
      <div
        className={`relative overflow-hidden transition-all duration-500 ${photoHeight}`}
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* gold corner ticks */}
        <span aria-hidden className="absolute -left-px -top-px z-10 h-3 w-3" style={{ borderTop: "1px solid rgba(201,168,76,0.5)", borderLeft: "1px solid rgba(201,168,76,0.5)" }} />
        <span aria-hidden className="absolute -right-px -top-px z-10 h-3 w-3" style={{ borderTop: "1px solid rgba(201,168,76,0.5)", borderRight: "1px solid rgba(201,168,76,0.5)" }} />
        <span aria-hidden className="absolute -left-px -bottom-px z-10 h-3 w-3" style={{ borderBottom: "1px solid rgba(201,168,76,0.5)", borderLeft: "1px solid rgba(201,168,76,0.5)" }} />
        <span aria-hidden className="absolute -right-px -bottom-px z-10 h-3 w-3" style={{ borderBottom: "1px solid rgba(201,168,76,0.5)", borderRight: "1px solid rgba(201,168,76,0.5)" }} />

        {image?.url ? (
          <Image
            src={image.url}
            alt={image.description || `Landsat image for ${char}`}
            fill
            sizes="(max-width: 640px) 224px, 288px"
            className={`object-cover transition duration-700 ${expanded ? "scale-105" : "group-hover:scale-105"} ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
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

        {/* index badge top-left */}
        <div className="absolute left-2.5 top-2 z-10">
          <span style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(201,168,76,0.7)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* letter bottom-left */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-3 py-2">
          <span
            className="font-display font-light leading-none text-white transition-all duration-500"
            style={{ fontSize: expanded ? "4rem" : "3rem" }}
          >
            {char}
          </span>
        </div>
      </div>

      {/* ── info below photo ── */}
      <div
        className="overflow-hidden transition-all duration-500"
        style={{
          maxHeight: expanded ? "120px" : "56px",
          paddingTop: "10px",
        }}
      >
        {/* location name */}
        <p
          className="truncate font-medium text-white transition-all duration-500"
          style={{
            fontSize: expanded ? "0.85rem" : "0.65rem",
            letterSpacing: expanded ? "0.05em" : "0.15em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          {image?.location || char}
        </p>

        {/* coordinates */}
        {hasCoords ? (
          <a
            href={mapsUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 block font-mono transition-all duration-500 hover:opacity-100"
            style={{
              fontSize: expanded ? "0.78rem" : "0.58rem",
              color: "rgba(201,168,76,0.85)",
              opacity: 0.8,
              textDecoration: "none",
              letterSpacing: "0.05em",
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
            className="mt-1 block font-mono transition-all duration-500 hover:opacity-100"
            style={{ fontSize: expanded ? "0.72rem" : "0.55rem", color: "rgba(201,168,76,0.6)", textDecoration: "none" }}
          >
            Open in Maps ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}
