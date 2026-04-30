"use client";

import confetti from "canvas-confetti";
import { ArrowLeft, Swords, Trophy } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { LetterImage, LetterResult, LettersApiResponse } from "@/types";

function encodeChars(name: string) {
  return name.split("").map((c) => encodeURIComponent(c)).join(",");
}

function normalizeName(v: string) {
  return v.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12);
}

function nameFontSize(str: string) {
  const chars = Math.max(str.trim().length, 1);
  return `clamp(1.2rem, ${Math.min(88 / chars, 9)}vw, 5rem)`;
}

function MiniStrip({ results }: { results: LetterResult[] }) {
  const letters = results.filter((r) => r.char !== " " && r.image?.url);
  const total   = letters.length || 1;
  const vw      = Math.max(6, Math.floor(94 / total / 2)); // half-screen
  return (
    <div style={{ display: "flex", gap: "clamp(2px,0.4vw,6px)", justifyContent: "center", flexWrap: "nowrap" }}>
      {letters.map((r, i) => (
        <div
          key={i}
          style={{
            width: `min(${vw * 2}vw, ${vw * 0.9}rem)`,
            aspectRatio: "1",
            position: "relative",
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <Image
            src={r.image!.url!}
            alt={r.char}
            fill
            sizes="10vw"
            style={{ objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)" }} />
          <span style={{
            position: "absolute", bottom: 2, left: 4,
            fontFamily: "var(--font-fraunces), serif",
            fontSize: `clamp(0.6rem, ${vw * 0.6}vw, 1.8rem)`,
            color: "#fff", fontWeight: 300, lineHeight: 1,
          }}>{r.char}</span>
        </div>
      ))}
    </div>
  );
}

export default function BattlePage() {
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [resA,  setResA]  = useState<LetterResult[]>([]);
  const [resB,  setResB]  = useState<LetterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [winner,  setWinner]  = useState<"A" | "B" | null>(null);
  const [error,   setError]   = useState("");

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!nameA.trim() || !nameB.trim()) return;
    setLoading(true); setError(""); setWinner(null);
    try {
      const [rA, rB] = await Promise.all([
        fetch(`/api/letters?chars=${encodeChars(nameA)}`),
        fetch(`/api/letters?chars=${encodeChars(nameB)}`),
      ]);
      if (rA.status === 403 || rB.status === 403) { setError("One of those names is banned gang 🚫"); setLoading(false); return; }
      const [dA, dB] = await Promise.all([rA.json() as Promise<LettersApiResponse>, rB.json() as Promise<LettersApiResponse>]);
      setResA(dA.results); setResB(dB.results);
      setStarted(true);
    } catch { setError("Failed to load. Try again."); }
    finally { setLoading(false); }
  }

  function vote(side: "A" | "B") {
    if (winner) return;
    setWinner(side);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { x: side === "A" ? 0.25 : 0.75, y: 0.5 },
      colors: ["#c9a84c", "#fff", "#e8d5a0"],
      gravity: 1.1,
      scalar: 0.9,
    });
  }

  function shareResult() {
    const url = new URL(window.location.href);
    url.searchParams.set("a", nameA);
    url.searchParams.set("b", nameB);
    url.searchParams.set("winner", winner === "A" ? nameA : nameB);
    navigator.clipboard.writeText(url.toString());
    window.history.replaceState(null, "", url.toString());
  }

  // Pre-fill from URL params
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const a = p.get("a"); const b = p.get("b");
    if (a) setNameA(normalizeName(a));
    if (b) setNameB(normalizeName(b));
  }, []);

  if (!started) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-black px-4">
        <a href="/" style={{ position: "absolute", top: "1.25rem", left: "1.25rem", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
          <ArrowLeft size={11} /> Home
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <Swords size={18} style={{ color: "#c9a84c" }} />
          <p style={{ fontSize: "clamp(0.55rem,1.8vw,0.65rem)", fontWeight: 500, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
            Name Battle
          </p>
        </div>

        <h1 className="font-display text-center font-light text-white" style={{ fontSize: "clamp(2rem,7vw,4rem)", lineHeight: 1.05, marginBottom: "0.4rem" }}>
          Whose name looks<br />
          <em style={{ color: "var(--gold)" }}>cooler on Earth?</em>
        </h1>
        <p style={{ fontSize: "clamp(0.68rem,2vw,0.82rem)", color: "rgba(255,255,255,0.45)", marginBottom: "2rem", textAlign: "center" }}>
          Two names. Real satellite images. You decide.
        </p>

        <form onSubmit={start} style={{ width: "min(90vw,24rem)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {error && <p style={{ color: "#f87171", fontSize: "0.72rem", letterSpacing: "0.1em", textAlign: "center" }}>{error}</p>}
          {(["A","B"] as const).map((side) => (
            <div key={side} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#c9a84c", letterSpacing: "0.2em", minWidth: "1.2rem" }}>{side}</span>
              <input
                value={side === "A" ? nameA : nameB}
                onChange={(e) => side === "A" ? setNameA(normalizeName(e.target.value)) : setNameB(normalizeName(e.target.value))}
                placeholder={side === "A" ? "FIRST NAME" : "SECOND NAME"}
                maxLength={12}
                style={{
                  flex: 1, background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff", padding: "0.5rem 0", outline: "none",
                  fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(1rem,3vw,1.3rem)",
                  letterSpacing: "0.2em", textTransform: "uppercase",
                }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={!nameA.trim() || !nameB.trim() || loading}
            style={{
              marginTop: "0.5rem", border: "1px solid #c9a84c", color: "#c9a84c", background: "rgba(0,0,0,0.4)",
              borderRadius: "999px", padding: "0.7rem", fontWeight: 700, fontSize: "clamp(0.62rem,1.8vw,0.72rem)",
              letterSpacing: "0.25em", textTransform: "uppercase", cursor: "pointer",
              opacity: !nameA.trim() || !nameB.trim() || loading ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
          >
            <Swords size={13} /> {loading ? "Loading…" : "Battle"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-black px-3 pb-12 pt-4 sm:px-6 sm:pt-8">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <button onClick={() => { setStarted(false); setWinner(null); }} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={11} /> Rematch
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Swords size={13} style={{ color: "#c9a84c" }} />
          <span style={{ fontSize: "0.62rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Name Battle</span>
        </div>
        {winner && (
          <button onClick={shareResult} style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a84c", background: "none", border: "1px solid rgba(201,168,76,0.4)", borderRadius: "999px", padding: "0.3rem 0.7rem", cursor: "pointer" }}>
            Share
          </button>
        )}
        {!winner && <div style={{ width: "3rem" }} />}
      </div>

      {/* instruction */}
      {!winner && (
        <p style={{ textAlign: "center", fontSize: "clamp(0.6rem,1.6vw,0.7rem)", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "1.5rem" }}>
          Tap the name that looks cooler
        </p>
      )}

      {winner && (
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Trophy size={16} style={{ color: "#c9a84c" }} />
            <p style={{ fontSize: "clamp(0.6rem,1.8vw,0.72rem)", letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a84c" }}>
              {winner === "A" ? nameA : nameB} wins
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "clamp(0.5rem,2vw,1.5rem)", alignItems: "start" }}>
        {(["A","B"] as const).map((side, si) => {
          const res  = side === "A" ? resA : resB;
          const nm   = side === "A" ? nameA : nameB;
          const isW  = winner === side;
          const isL  = winner !== null && winner !== side;
          return (
            <>
              {si === 1 && (
                <div key="vs" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "3rem", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "clamp(0.6rem,1.8vw,0.85rem)", color: "rgba(255,255,255,0.2)", letterSpacing: "0.3em" }}>VS</span>
                </div>
              )}
              <button
                key={side}
                type="button"
                onClick={() => vote(side)}
                disabled={!!winner}
                style={{
                  background: "none", border: "none", cursor: winner ? "default" : "pointer", padding: 0, textAlign: "left",
                  opacity: isL ? 0.35 : 1, transition: "opacity 0.5s",
                }}
              >
                <div style={{
                  border: isW ? "1px solid rgba(201,168,76,0.6)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px", padding: "clamp(0.5rem,2vw,1rem)",
                  background: isW ? "rgba(201,168,76,0.05)" : "rgba(255,255,255,0.02)",
                  transition: "all 0.4s",
                }}>
                  <p className="font-display font-light text-white" style={{ fontSize: nameFontSize(nm), whiteSpace: "nowrap", letterSpacing: "-0.02em", marginBottom: "0.6rem", textAlign: "center" }}>
                    {nm}
                    {isW && <Trophy size={14} style={{ display: "inline", marginLeft: "0.4rem", color: "#c9a84c", verticalAlign: "middle" }} />}
                  </p>
                  <MiniStrip results={res} />
                </div>
              </button>
            </>
          );
        })}
      </div>
    </main>
  );
}
