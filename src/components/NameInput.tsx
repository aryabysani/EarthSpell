"use client";

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
}

function normalizeName(value: string) {
  return value.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12);
}

export function NameInput({ value, onChange }: NameInputProps) {
  return (
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
      }}
      className="h-14 w-full border-b border-white/15 bg-transparent text-center uppercase text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#c9a84c]/60"
    />
  );
}
