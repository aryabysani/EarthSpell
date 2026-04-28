"use client";

import Image from "next/image";
import { useState } from "react";
import type { LetterImage } from "@/types";
import { Tooltip } from "./Tooltip";

interface LetterCardProps {
  char: string;
  image: LetterImage | null;
  index: number;
}

export function LetterCard({ char, image, index }: LetterCardProps) {
  const [loaded, setLoaded] = useState(false);

  if (char === " ") {
    return <div aria-label="Space" className="h-44 w-8 shrink-0 sm:h-52 sm:w-12" />;
  }

  return (
    <article
      className="group relative h-44 w-44 shrink-0 animate-rise overflow-visible opacity-0 sm:h-52 sm:w-52"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* thin gold corner ticks */}
      <span aria-hidden className="absolute -left-px -top-px z-10 h-3 w-3" style={{ borderTop: "1px solid rgba(201,168,76,0.5)", borderLeft: "1px solid rgba(201,168,76,0.5)" }} />
      <span aria-hidden className="absolute -right-px -top-px z-10 h-3 w-3" style={{ borderTop: "1px solid rgba(201,168,76,0.5)", borderRight: "1px solid rgba(201,168,76,0.5)" }} />
      <span aria-hidden className="absolute -left-px -bottom-px z-10 h-3 w-3" style={{ borderBottom: "1px solid rgba(201,168,76,0.5)", borderLeft: "1px solid rgba(201,168,76,0.5)" }} />
      <span aria-hidden className="absolute -right-px -bottom-px z-10 h-3 w-3" style={{ borderBottom: "1px solid rgba(201,168,76,0.5)", borderRight: "1px solid rgba(201,168,76,0.5)" }} />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.description || `Landsat image for ${char}`}
            fill
            sizes="(max-width: 640px) 176px, 208px"
            className={`object-cover transition duration-700 group-hover:scale-105 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
          />
        ) : null}

        {/* shimmer while loading */}
        {image?.url && !loaded ? (
          <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,#0a0a0a_8%,#1a1a1a_18%,#0a0a0a_33%)] bg-[length:200%_100%]" />
        ) : null}

        {/* subtle darkening overlay + desaturation for minimal feel */}
        {loaded ? (
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.28)", mixBlendMode: "multiply" }}
          />
        ) : null}

        {/* scan lines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
          }}
        />

        {/* top: index + location */}
        <div
          className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-2.5 py-2"
        >
          <span style={{ fontFamily: "monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(201,168,76,0.7)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          {image?.location ? (
            <span className="max-w-[65%] truncate text-right" style={{ fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              {image.location}
            </span>
          ) : null}
        </div>

        {/* bottom: letter */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 py-2.5">
          <span
            className="font-display font-light leading-none text-white"
            style={{ fontSize: "3rem" }}
          >
            {char}
          </span>
          {!image ? (
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              Missing
            </span>
          ) : (
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(201,168,76,0.5)", textTransform: "uppercase" }}>
              Landsat
            </span>
          )}
        </div>
      </div>

      {image ? <Tooltip image={image} /> : null}
    </article>
  );
}
