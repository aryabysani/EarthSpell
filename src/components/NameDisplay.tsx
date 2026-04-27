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
      <div className="mt-6 flex w-full justify-center gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-44 w-44 shrink-0 animate-shimmer bg-[linear-gradient(110deg,#0a0a0a_8%,#1a1a1a_18%,#0a0a0a_33%)] bg-[length:200%_100%] sm:h-52 sm:w-52"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          />
        ))}
      </div>
    );
  }

  if (!results.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="earthstrip-capture mt-6 flex w-full justify-center gap-4 overflow-x-auto px-2 pb-2"
    >
      {results.map((result, index) => (
        <LetterCard
          key={`${result.char}-${index}-${result.image?.filename ?? "blank"}`}
          char={result.char}
          image={result.image}
          index={index}
        />
      ))}
    </div>
  );
});
