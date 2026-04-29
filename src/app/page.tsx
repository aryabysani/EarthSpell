"use client";

import { ArrowLeft, ArrowRight, Dices, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { GlobeClient } from "@/components/GlobeClient";
import { GlobePinMap } from "@/components/GlobePinMap";
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

const RANDOM_NAMES = ["BUNTY","DOLLY","DHURANDHAR","KHAMENEI","CHOTABHEEM","SHINCHAN","VIGNESH"];
function randomName() {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
}

// Scales name heading to always fit one line
function nameFontSize(str: string) {
  const chars = Math.max(str.trim().length, 1);
  const vw = Math.min(88 / chars, 10);
  return `clamp(1.4rem, ${vw}vw, 7rem)`;
}

export default function Home() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [zooming, setZooming] = useState(false);
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

  function doZoomThen(n: string) {
    setName(n);
    setZooming(true);
    window.setTimeout(() => { setZooming(false); setSubmitted(true); }, 900);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) doZoomThen(name);
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

      {/* background video */}
      <video
        aria-hidden autoPlay loop muted playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: zooming ? 1 : 0.75,
          filter: `saturate(${zooming ? 2 : 1.6}) brightness(${zooming ? 1.4 : 1.1}) contrast(1.05)`,
          transform: zooming ? "scale(2.8)" : "scale(1)",
          transition: zooming ? "transform 0.9s cubic-bezier(0.4,0,0.2,1), opacity 0.4s, filter 0.5s" : "none",
          transformOrigin: "center center",
        }}
      >
        <source src="https://storage.googleapis.com/earthspell-34aed.firebasestorage.app/earth-bg.mp4" type="video/mp4" />
      </video>

      {/* overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        background: zooming
          ? "rgba(0,0,0,0.85)"
          : "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.62) 55%, rgba(0,0,0,0.95) 100%)",
        transition: "background 0.7s ease",
      }} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse 55% 55% at 50% 48%, transparent 35%, rgba(201,168,76,0.07) 60%, transparent 75%)",
        opacity: zooming ? 0 : 1, transition: "opacity 0.4s",
      }} />

      {/* ── Landing content ── */}
      <section
        className="relative z-10 flex h-full flex-col items-center justify-center px-4 sm:px-6"
        style={{ opacity: zooming ? 0 : 1, transition: "opacity 0.35s ease", pointerEvents: zooming ? "none" : undefined }}
      >
        {/* eyebrow */}
        <p style={{
          fontSize: "clamp(0.55rem, 1.8vw, 0.65rem)",
          fontWeight: 500,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.85)",
          textShadow: "0 1px 8px rgba(0,0,0,1)",
          marginBottom: "clamp(1rem, 3vw, 2rem)",
        }}>
          Landsat · Earth Observatory
        </p>

        {/* headline */}
        <h1
          className="font-display text-center font-light text-white"
          style={{
            fontSize: "clamp(2rem, 8vw, 5.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textShadow: "0 0 40px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1)",
          }}
        >
          Your name,
          <br />
          <em style={{ color: "var(--gold)", fontStyle: "italic", textShadow: "0 0 40px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,1), 0 0 60px rgba(201,168,76,0.4)" }}>
            written in Earth
          </em>
        </h1>

        {/* sub-copy */}
        <p
          className="mt-4 text-center"
          style={{
            fontSize: "clamp(0.7rem, 2.2vw, 0.88rem)",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 1px 4px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,1)",
            maxWidth: "min(90vw, 26rem)",
          }}
        >
          100% real NASA Landsat satellite images — not AI generated. Every letter is a real place on Earth, with exact coordinates and location names.
        </p>

        {/* form */}
        <form onSubmit={handleSubmit} style={{ marginTop: "clamp(1.5rem, 4vw, 2.5rem)", width: "min(90vw, 22rem)" }}>
          <NameInput
            value={name}
            onChange={setName}
            onRandom={() => doZoomThen(randomName())}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border py-3 font-medium uppercase transition disabled:cursor-not-allowed disabled:opacity-25"
              style={{ borderColor: "var(--gold)", color: "var(--gold)", background: "rgba(0,0,0,0.4)", fontSize: "clamp(0.62rem, 1.8vw, 0.72rem)", letterSpacing: "0.25em" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.4)"; e.currentTarget.style.color = "var(--gold)"; }}
            >
              Enter <ArrowRight size={12} aria-hidden />
            </button>
            {name.trim() && (
              <button
                type="button" onClick={() => setName("")}
                className="flex items-center justify-center rounded-full border border-white/20 px-3 py-3 text-white/60 transition hover:border-white/40 hover:text-white/90"
                style={{ background: "rgba(0,0,0,0.4)", fontSize: "clamp(0.62rem, 1.8vw, 0.72rem)" }}
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </section>

      {/* bottom credit */}
      <div
        className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-1"
        style={{ opacity: zooming ? 0 : 1, transition: "opacity 0.3s" }}
      >
        <p style={{ fontSize: "clamp(0.5rem, 1.4vw, 0.62rem)", fontWeight: 500, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
          Images credit:{" "}
          <a href="https://www.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>NASA</a>
          {" "}· USGS Landsat
        </p>
        <p style={{ fontSize: "clamp(0.5rem, 1.4vw, 0.62rem)", fontWeight: 500, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
          Built by{" "}
          <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>arya</a>
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

      {/* ghost globe — desktop only */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[15vmin] -top-[15vmin] hidden opacity-25 sm:block"
        style={{ width: "min(50vmin, 380px)", height: "min(50vmin, 380px)" }}
      >
        <GlobeClient />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block" style={{
        background: "radial-gradient(ellipse 60% 55% at 88% -5%, transparent 20%, rgba(0,0,0,0.88) 60%, #000 85%)"
      }} />

      {/* ── top nav ── */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-6">
        <button
          type="button" onClick={onReset}
          className="group inline-flex items-center gap-1.5 text-white/40 transition hover:text-white"
          style={{ fontSize: "clamp(0.58rem, 1.6vw, 0.68rem)", letterSpacing: "0.22em", textTransform: "uppercase" }}
        >
          <ArrowLeft size={11} className="transition group-hover:-translate-x-1" />
          New name
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSearch(randomName())}
            title="Random name"
            className="inline-flex items-center gap-1.5 transition hover:text-white"
            style={{ color: "#c9a84c", fontSize: "clamp(0.55rem, 1.5vw, 0.65rem)", letterSpacing: "0.2em", textTransform: "uppercase" }}
          >
            <Dices size={13} aria-hidden />
            <span className="hidden sm:inline">Random</span>
          </button>
          <span style={{ fontSize: "clamp(0.5rem, 1.4vw, 0.6rem)", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
            Built by{" "}
            <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>arya</a>
          </span>
        </div>
      </header>

      {/* ── body ── */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-3 pb-12 pt-4 sm:px-5 sm:pt-10">

        {/* eyebrow */}
        <p style={{ fontSize: "clamp(0.5rem, 1.4vw, 0.6rem)", fontWeight: 500, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.6rem" }}>
          The Earth has spelled
        </p>

        {/* name heading */}
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
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 uppercase transition"
              style={{ borderColor: "var(--gold)", color: "var(--gold)", fontSize: "clamp(0.6rem, 1.6vw, 0.68rem)", letterSpacing: "0.25em" }}
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
              <span key={`${ch}-${i}`} className="inline-block opacity-0 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                {ch === " " ? " " : ch}
              </span>
            ))}
            <span className="ml-1 text-white/25 opacity-0 transition group-hover:opacity-100 text-[0.8rem]">✎</span>
          </h1>
        )}

        {/* gold rule */}
        <div className="mt-4 mb-4 w-8 sm:mt-6 sm:mb-5 sm:w-10" style={{ height: "1px", background: "var(--gold)", opacity: 0.5 }} />

        {error && <p className="mb-3 text-xs sm:text-sm" style={{ color: "#f87171" }}>{error}</p>}

        {/* letter cards */}
        <NameDisplay ref={displayRef} results={results} loading={loading} />

        {/* action buttons */}
        {results.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:mt-8">
            <button
              type="button" onClick={onShuffle} disabled={!canAct}
              className="group inline-flex h-8 items-center gap-1.5 rounded-full border border-white/12 px-3 text-white/50 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:px-4"
              style={{ fontSize: "clamp(0.58rem, 1.6vw, 0.68rem)", letterSpacing: "0.2em", textTransform: "uppercase" }}
            >
              <RotateCcw size={10} className="transition group-hover:-rotate-45 sm:hidden" />
              <RotateCcw size={11} className="transition group-hover:-rotate-45 hidden sm:block" />
              Shuffle
            </button>
            <DownloadButton name={name} results={results} disabled={!canAct} />
            <ShareButton name={name} disabled={!name.trim()} />
          </div>
        )}

        {/* globe pin map */}
        {canAct && (() => {
          const pins = results
            .filter((r) => r.char !== " " && typeof r.image?.lat === "number" && typeof r.image?.lng === "number")
            .map((r) => ({ lat: r.image!.lat as number, lng: r.image!.lng as number, char: r.char, location: r.image!.location }));
          return pins.length > 0 ? (
            <div className="mt-8 sm:mt-12 w-full flex flex-col items-center">
              <p style={{ fontSize: "clamp(0.5rem, 1.4vw, 0.6rem)", fontWeight: 500, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.75rem" }}>
                Where on Earth
              </p>
              <div
                style={{
                  width: "min(90vw, 320px)",
                  height: "min(90vw, 320px)",
                  borderRadius: "50%",
                  overflow: "hidden",
                  boxShadow: "0 0 60px rgba(201,168,76,0.12), 0 0 120px rgba(201,168,76,0.06)",
                }}
              >
                <GlobePinMap pins={pins} />
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {pins.map((p, i) => (
                  <span key={i} style={{ fontSize: "clamp(0.48rem, 1.3vw, 0.58rem)", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                    <span style={{ color: "var(--gold)", marginRight: "0.3em" }}>{p.char}</span>
                    {p.location || `${p.lat.toFixed(1)}° ${p.lng.toFixed(1)}°`}
                  </span>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* footer */}
        <p className="mt-10 sm:mt-12" style={{ fontSize: "clamp(0.5rem, 1.4vw, 0.62rem)", fontWeight: 500, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
          Images credit:{" "}
          <a href="https://www.nasa.gov" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>NASA</a>
          {" "}· USGS Landsat
        </p>
        <p className="mt-1" style={{ fontSize: "clamp(0.5rem, 1.4vw, 0.62rem)", fontWeight: 500, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
          Built by{" "}
          <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>arya</a>
        </p>
      </section>
    </main>
  );
}
