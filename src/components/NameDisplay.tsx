"use client";

import { forwardRef } from "react";
import type { LetterResult } from "@/types";
import { LetterCard } from "./LetterCard";

interface NameDisplayProps {
  results: LetterResult[];
  loading: boolean;
}

export const NameDisplay = forwardRef<HTMLDivElement, NameDisplayProps>(function NameDisplay(
  { results, loading },
  ref,
) {
  if (loading) {
    return (
      <div className="mt-6 flex w-full flex-wrap items-end justify-center gap-2 pb-2 sm:gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 w-28 shrink-0 animate-shimmer bg-[linear-gradient(110deg,#0a0a0a_8%,#1a1a1a_18%,#0a0a0a_33%)] bg-[length:200%_100%] sm:h-44 sm:w-44"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          />
        ))}
      </div>
    );
  }

  if (!results.length) {
    return null;
  }

  // Count non-space letters to compute per-card max width
  const letterCount = results.filter((r) => r.char !== " ").length || 1;

  return (
    <div
      ref={ref}
      className="earthstrip-capture mt-6 flex w-full flex-wrap items-end justify-center gap-2 px-1 pb-2 sm:gap-4"
    >
      {results.map((result, index) => (
        <LetterCard
          key={`${result.char}-${index}-${result.image?.filename ?? "blank"}`}
          char={result.char}
          image={result.image}
          index={index}
          total={letterCount}
        />
      ))}
    </div>
  );
});
