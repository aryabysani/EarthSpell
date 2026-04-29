"use client";

import { Dices } from "lucide-react";

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  onRandom?: () => void;
}

function normalizeName(value: string) {
  return value.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12);
}

export function NameInput({ value, onChange, onRandom }: NameInputProps) {
  return (
    <div className="relative flex items-center">
      <input
        value={value}
        maxLength={12}
        onChange={(e) => onChange(normalizeName(e.target.value))}
        placeholder="TYPE YOUR NAME"
        aria-label="Name to spell with Landsat imagery"
        style={{
          fontFamily: "var(--font-fraunces), serif",
          letterSpacing: "0.28em",
          fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
          textShadow: "0 1px 6px rgba(0,0,0,1)",
          paddingRight: onRandom ? "2.5rem" : undefined,
        }}
        className="h-14 w-full border-b border-white/40 bg-transparent text-center uppercase text-white outline-none transition-colors placeholder:text-white/60 focus:border-[#c9a84c]"
      />
      {onRandom && (
        <button
          type="button"
          onClick={onRandom}
          title="Random name"
          className="absolute right-0 flex h-8 w-8 items-center justify-center text-white/40 transition hover:text-[#c9a84c]"
        >
          <Dices size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
