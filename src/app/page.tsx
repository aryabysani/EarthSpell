"use client";

import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { GlobeClient } from "@/components/GlobeClient";
import { NameDisplay } from "@/components/NameDisplay";
import { NameInput } from "@/components/NameInput";
import { ShareButton } from "@/components/ShareButton";
import type { LetterImage, LetterResult, LettersApiResponse } from "@/types";

function encodeChars(name: string) {
  return name.split("").map((c) => encodeURIComponent(c)).join(",");
}

function pickDifferentVariant(variants: LetterImage[], used: Set<string>, current?: LetterImage | null) {
  if (!variants.length) return null;
  const unused = variants.filter((v) => {
    if (v.filename && used.has(v.filename)) return false;
    return !current?.filename || v.filename !== current.filename;
  });
  const pool = unused.length ? unused : variants;
  const img = pool[Math.floor(Math.random() * pool.length)] ?? null;
  if (img?.filename) used.add(img.filename);
  return img;
}

// Font size that keeps the name on one line: 88vw shared across all chars
function nameFontSize(str: string) {
  const chars = Math.max(str.trim().length, 1);
  const vw = Math.min(88 / chars, 10);
  return `clamp(1.6rem, ${vw}vw, 7rem)`;
}

export default function Home() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<LetterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("name");
    if (q) {
      const v = q.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12);
      setName(v);
      if (v.trim()) setSubmitted(true);
    }
  }, []);

  useEffect(() => {
    if (!name.trim() || !submitted) {
      if (!submitted) setResults([]);
      setError(""); setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const res = await fetch(`/api/letters?chars=${encodeChars(name)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error();
        const data = (await res.json()) as LettersApiResponse;
        setResults(data.results);
      } catch (e) {
        if ((e as Error).name !== "AbortError")
          setError("Could not reach the letter archive.");
      } finally { setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(t); ctrl.abort(); };
  }, [name, submitted]);

  const canAct = useMemo(() => results.some((r) => r.image), [results]);

  function shuffle() {
    setResults((cur) => {
      const map = new Map<string, Set<string>>();
      return cur.map((r) => {
        if (r.char === " " || !r.variants?.length) return r;
        const used = map.get(r.char) ?? new Set<string>();
        map.set(r.char, used);
        return { ...r, image: pickDifferentVariant(r.variants, used, r.image) };
      });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) setSubmitted(true);
  }

  function reset() { setSubmitted(false); setResults([]); setName(""); }

  function searchName(newName: string) {
    const v = newName.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12).trim();
    if (v) { setName(v); setSubmitted(true); }
  }

  if (submitted) {
    return (
      <ResultView
        name={name} results={results} loading={loading}
        error={error} canAct={canAct} displayRef={displayRef}
        onShuffle={shuffle} onReset={reset} onSearch={searchName}
      />
    );
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black">
      <div aria-hidden className="corner corner--tl" />
      <div aria-hidden className="corner corner--tr" />
      <div aria-hidden className="corner corner--bl" />
      <div aria-hidden className="corner corner--br" />

      {/* background video — brighter, vivid */}
      <video
        aria-hidden autoPlay loop muted playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ opacity: 0.75, filter: "saturate(1.6) brightness(1.1) contrast(1.05)" }}
      >
        <source src="https://storage.googleapis.com/earthspell-34aed.firebasestorage.app/earth-bg.mp4" type="video/mp4" />
      </video>

      {/* deep space atmosphere — dark at edges, clear in centre */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 65% 65% at 50% 48%, transparent 20%, rgba(0,0,0,0.45) 58%, rgba(0,0,0,0.92) 100%)"
      }} />

      {/* gold atmospheric halo around the globe */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 55% 55% at 50% 48%, transparent 35%, rgba(201,168,76,0.07) 60%, transparent 75%)"
      }} />

      {/* content */}
      <section className="relative z-10 flex h-full flex-col items-center justify-center px-5">
        <p className="eyebrow mb-6 sm:mb-8" style={{ color: "rgba(255,255,255,0.7)", textShadow: "0 1px 12px rgba(0,0,0,0.8)" }}>
          Landsat · Earth Observatory
        </p>

        <h1
          className="font-display text-center font-light text-white"
          style={{
            fontSize: "clamp(2.4rem, 6.5vw, 5.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textShadow: "0 2px 24px rgba(0,0,0,0.9)",
          }}
        >
          Your name,
          <br />
          <em style={{ color: "var(--gold)", fontStyle: "italic", filter: "drop-shadow(0 0 18px rgba(201,168,76,0.5))" }}>
            written in Earth
          </em>
        </h1>

        <p
          className="mt-5 max-w-xs text-center sm:max-w-sm"
          style={{
            fontSize: "clamp(0.72rem, 1.8vw, 0.88rem)",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.65)",
            textShadow: "0 1px 8px rgba(0,0,0,0.9)",
          }}
        >
          Real Landsat satellite imagery arranged into letters shaped by rivers, ridgelines, and coastlines.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-[17rem] sm:mt-10 sm:max-w-sm">
          <NameInput value={name} onChange={setName} />
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-[0.7rem] font-medium uppercase tracking-[0.28em] transition disabled:cursor-not-allowed disabled:opacity-25"
              style={{ borderColor: "var(--gold)", color: "var(--gold)", background: "rgba(0,0,0,0.4)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.4)"; e.currentTarget.style.color = "var(--gold)"; }}
            >
              Enter <ArrowRight size={12} aria-hidden />
            </button>
            {name.trim() && (
              <button
                type="button" onClick={() => setName("")}
                className="flex items-center justify-center rounded-full border border-white/20 px-4 py-3 text-[0.7rem] text-white/60 transition hover:border-white/40 hover:text-white/90"
                style={{ background: "rgba(0,0,0,0.4)" }}
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </section>

      {/* bottom credit */}
      <div className="absolute bottom-5 left-0 right-0 z-20 flex flex-col items-center gap-1">
        <p className="eyebrow" style={{ color: "rgba(255,255,255,0.35)" }}>
          Images credit:{" "}
          <a href="https://www.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.65)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>
            NASA
          </a>
          {" "}· USGS Landsat
        </p>
        <p className="eyebrow" style={{ color: "rgba(255,255,255,0.35)" }}>
          Built by{" "}
          <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>
            arya
          </a>
        </p>
      </div>
    </main>
  );
}

/* ─── Result page ─────────────────────────────────────────── */

interface ResultViewProps {
  name: string; results: LetterResult[]; loading: boolean;
  error: string; canAct: boolean; displayRef: React.RefObject<HTMLDivElement>;
  onShuffle: () => void; onReset: () => void; onSearch: (name: string) => void;
}

function ResultView({ name, results, loading, error, canAct, displayRef, onShuffle, onReset, onSearch }: ResultViewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <div aria-hidden className="corner corner--tl" />
      <div aria-hidden className="corner corner--tr" />
      <div aria-hidden className="corner corner--bl" />
      <div aria-hidden className="corner corner--br" />

      {/* ghost globe top-right, hidden on small screens */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[15vmin] -top-[15vmin] hidden opacity-25 sm:block"
        style={{ width: "min(50vmin, 380px)", height: "min(50vmin, 380px)" }}
      >
        <GlobeClient />
      </div>
      <div
        aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block"
        style={{ background: "radial-gradient(ellipse 60% 55% at 88% -5%, transparent 20%, rgba(0,0,0,0.88) 60%, #000 85%)" }}
      />

      {/* top nav */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-5 sm:px-8 sm:pt-7">
        <button
          type="button" onClick={onReset}
          className="group inline-flex items-center gap-2 text-white/40 transition hover:text-white"
          style={{ fontSize: "0.65rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
        >
          <ArrowLeft size={11} className="transition group-hover:-translate-x-1" />
          New name
        </button>
        <span className="eyebrow" style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.58rem" }}>
          Built by{" "}
          <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>arya</a>
        </span>
      </header>

      {/* body */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-3 pb-14 pt-6 sm:px-5 sm:pt-14">
        <p className="eyebrow mb-3" style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.6rem" }}>
          The Earth has spelled
        </p>

        {/* name — single line, tap to edit */}
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = draft.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12).trim();
              if (v && v !== name) { setEditing(false); onSearch(v); }
              else setEditing(false);
            }}
            className="flex w-full flex-col items-center gap-3"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12))}
              className="w-full bg-transparent text-center font-display font-light text-white outline-none border-b border-[#c9a84c]/50 focus:border-[#c9a84c] transition-colors"
              style={{ fontSize: nameFontSize(draft), lineHeight: 1.0, letterSpacing: "-0.02em" }}
              onKeyDown={(e) => { if (e.key === "Escape") { setEditing(false); setDraft(name); } }}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[0.68rem] uppercase tracking-[0.28em] transition"
              style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
            >
              Search <ArrowRight size={11} />
            </button>
          </form>
        ) : (
          <h1
            className="group relative w-full cursor-pointer text-center font-display font-light text-white"
            style={{ fontSize: nameFontSize(name), lineHeight: 1.0, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}
            onClick={() => { setDraft(name); setEditing(true); }}
            title="Tap to edit"
          >
            {name.split("").map((ch, i) => (
              <span
                key={`${ch}-${i}`}
                className="inline-block opacity-0 animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {ch === " " ? " " : ch}
              </span>
            ))}
            <span className="ml-2 text-white/25 opacity-0 transition group-hover:opacity-100" style={{ fontSize: "0.9rem" }}>✎</span>
          </h1>
        )}

        {/* gold rule */}
        <div className="mt-6 mb-5 w-10" style={{ height: "1px", background: "var(--gold)", opacity: 0.5 }} />

        {error && <p className="mb-4 text-sm" style={{ color: "#f87171" }}>{error}</p>}

        {/* letter strip */}
        <NameDisplay ref={displayRef} results={results} loading={loading} />

        {/* actions */}
        {results.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3">
            <button
              type="button" onClick={onShuffle} disabled={!canAct}
              className="group inline-flex h-9 items-center gap-2 rounded-full border border-white/12 px-4 text-white/50 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              style={{ fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase" }}
            >
              <RotateCcw size={11} className="transition group-hover:-rotate-45" />
              Shuffle
            </button>
            <DownloadButton targetRef={displayRef} disabled={!canAct} />
            <ShareButton name={name} disabled={!name.trim()} />
          </div>
        )}

        <p className="mt-12 eyebrow" style={{ color: "rgba(255,255,255,0.28)" }}>
          Images credit:{" "}
          <a href="https://www.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>NASA</a>
          {" "}· USGS Landsat
        </p>
        <p className="mt-1 eyebrow" style={{ color: "rgba(255,255,255,0.28)" }}>
          Built by{" "}
          <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>arya</a>
        </p>
      </section>
    </main>
  );
}
