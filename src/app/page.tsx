"use client";

import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { GlobeClient } from "@/components/GlobeClient";
import { NameDisplay } from "@/components/NameDisplay";
import { NameInput } from "@/components/NameInput";
import { ShareButton } from "@/components/ShareButton";
import type { LetterImage, LetterResult, LettersApiResponse } from "@/types";

function toDMS(deg: number, posDir: string, negDir: string): string {
  const d = Math.abs(deg);
  const degrees = Math.floor(d);
  const minutesFloat = (d - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(1);
  const dir = deg >= 0 ? posDir : negDir;
  return `${degrees}°${String(minutes).padStart(2, "0")}'${seconds.padStart(4, "0")}" ${dir}`;
}

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
      {/* corner marks */}
      <div aria-hidden className="corner corner--tl" />
      <div aria-hidden className="corner corner--tr" />
      <div aria-hidden className="corner corner--bl" />
      <div aria-hidden className="corner corner--br" />

      {/* ── 3-D Globe ── */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* glow behind globe */}
        <div
          aria-hidden
          className="absolute"
          style={{
            width: "min(72vmin, 600px)",
            height: "min(72vmin, 600px)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,0.13) 0%, transparent 70%)",
            animation: "glow-pulse 5s ease-in-out infinite alternate",
          }}
        />

        {/* orbit rings */}
        <div
          aria-hidden
          className="orbit absolute"
          style={{ width: "min(80vmin, 660px)", height: "min(80vmin, 660px)" }}
        />
        <div
          aria-hidden
          className="orbit orbit-2 absolute"
          style={{ width: "min(60vmin, 490px)", height: "min(60vmin, 490px)" }}
        />

        {/* globe canvas */}
        <div style={{ width: "min(60vmin, 500px)", height: "min(60vmin, 500px)", position: "relative", zIndex: 2 }}>
          <GlobeClient />
        </div>
      </div>

      {/* radial vignette so text is legible over globe */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 62% at 50% 50%, transparent 25%, rgba(0,0,0,0.72) 68%, #000 100%)",
        }}
      />

      {/* ── Content ── */}
      <section className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        {/* eyebrow */}
        <p className="eyebrow mb-8">Landsat · Earth Observatory</p>

        {/* headline */}
        <h1
          className="font-display text-center font-light text-white"
          style={{ fontSize: "clamp(2.6rem, 6.5vw, 5.5rem)", lineHeight: 1.0, letterSpacing: "-0.02em" }}
        >
          Your name,
          <br />
          <em style={{ color: "var(--gold)", fontStyle: "italic" }}>written in Earth</em>
        </h1>

        {/* sub-copy */}
        <p
          className="mt-4 max-w-xs text-center text-white/40 sm:mt-5 sm:max-w-sm"
          style={{ fontSize: "clamp(0.72rem, 1.8vw, 0.9rem)", lineHeight: 1.7 }}
        >
          Real Landsat satellite imagery arranged into letters shaped by rivers,
          ridgelines, and coastlines.
        </p>

        {/* form */}
        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-[18rem] sm:mt-10 sm:max-w-sm">
          <NameInput value={name} onChange={setName} />
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border py-3 text-[0.72rem] font-medium uppercase tracking-[0.3em] transition disabled:cursor-not-allowed disabled:opacity-25"
              style={{ borderColor: "var(--gold)", color: "var(--gold)", background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--gold)"; e.currentTarget.style.color = "#000"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--gold)"; }}
            >
              Enter
              <ArrowRight size={13} aria-hidden />
            </button>
            {name.trim() && (
              <button
                type="button"
                onClick={() => setName("")}
                className="flex items-center justify-center rounded-full border border-white/15 px-4 py-3 text-[0.72rem] text-white/40 transition hover:border-white/30 hover:text-white/70"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-white/20" style={{ fontSize: "0.6rem", letterSpacing: "0.3em" }}>
            PRESS ENTER OR CLICK
          </p>
        </form>

        {/* sample prompts */}
        <div className="mt-8 flex items-center gap-6 text-white/25" style={{ fontSize: "0.62rem", letterSpacing: "0.4em" }}>
          {["AURORA", "EARTH", "VOYAGER"].map((s) => (
            <button
              key={s}
              type="button"
              className="uppercase transition hover:text-white/70"
              onClick={() => { setName(s); setSubmitted(true); }}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* bottom credit */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1.5">
        <p className="eyebrow" style={{ color: "rgba(255,255,255,0.18)" }}>NASA · USGS Landsat program</p>
        <p className="eyebrow" style={{ color: "rgba(255,255,255,0.18)" }}>
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
  const locations = useMemo(
    () =>
      results
        .map((r) => r.image)
        .filter((img): img is LetterImage => Boolean(img))
        .map((img) => ({
          location: img.location || "",
          lat: typeof img.lat === "number" ? img.lat : null,
          lng: typeof img.lng === "number" ? img.lng : null,
        })),
    [results],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      {/* corner marks */}
      <div aria-hidden className="corner corner--tl" />
      <div aria-hidden className="corner corner--tr" />
      <div aria-hidden className="corner corner--bl" />
      <div aria-hidden className="corner corner--br" />

      {/* ghost globe — top right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[15vmin] -top-[15vmin] opacity-30"
        style={{ width: "min(55vmin, 420px)", height: "min(55vmin, 420px)" }}
      >
        <GlobeClient />
      </div>
      {/* fade it out */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 88% -5%, transparent 20%, rgba(0,0,0,0.88) 60%, #000 85%)",
        }}
      />

      {/* top nav */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-5 sm:px-10 sm:pt-7">
        <button
          type="button"
          onClick={onReset}
          className="group inline-flex items-center gap-2 text-white/40 transition hover:text-white"
          style={{ fontSize: "0.68rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
        >
          <ArrowLeft size={12} className="transition group-hover:-translate-x-1" />
          New name
        </button>

        <span
          className="eyebrow"
          style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.6rem" }}
        >
          Built by{" "}
          <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>arya</a>
        </span>
      </header>

      {/* body */}
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-3 pb-16 pt-8 sm:px-5 sm:pt-16">

        {/* "Earth has spelled" eyebrow */}
        <p className="eyebrow mb-4" style={{ color: "rgba(255,255,255,0.28)" }}>
          Earth has spelled
        </p>

        {/* the name — click to edit */}
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = draft.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12).trim();
              if (v && v !== name) {
                setEditing(false);
                onSearch(v);
              } else {
                setEditing(false);
              }
            }}
            className="flex flex-col items-center gap-3"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12))}
              className="bg-transparent text-center font-display font-light text-white outline-none border-b border-[#c9a84c]/50 focus:border-[#c9a84c] transition-colors"
              style={{
                fontSize: `clamp(2.5rem, ${Math.max(4.5, 15 - draft.replace(/ /g, "").length * 0.7)}vw, 9rem)`,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                minWidth: "3ch",
                width: `${Math.max(draft.length, 3)}ch`,
              }}
              onKeyDown={(e) => { if (e.key === "Escape") { setEditing(false); setDraft(name); } }}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[0.7rem] uppercase tracking-[0.3em] transition"
              style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
            >
              Search <ArrowRight size={12} />
            </button>
          </form>
        ) : (
          <h1
            className="group relative cursor-pointer font-display text-center font-light text-white"
            style={{
              fontSize: `clamp(3rem, ${Math.max(4.5, 15 - name.replace(/ /g, "").length * 0.7)}vw, 9rem)`,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
            onClick={() => { setDraft(name); setEditing(true); }}
            title="Click to edit"
          >
            {name.split("").map((ch, i) => (
              <span
                key={`${ch}-${i}`}
                className="inline-block opacity-0 animate-rise"
                style={{ animationDelay: `${i * 60}ms`, color: ch === " " ? "transparent" : undefined }}
              >
                {ch === " " ? " " : ch}
              </span>
            ))}
            <span className="absolute -right-8 top-1/2 -translate-y-1/2 text-white/30 opacity-0 transition group-hover:opacity-100" style={{ fontSize: "1.2rem" }}>✎</span>
          </h1>
        )}

        {/* thin gold rule */}
        <div
          className="mt-8 mb-6 w-12"
          style={{ height: "1px", background: "var(--gold)", opacity: 0.5 }}
        />

        {/* coordinate strip */}
        {locations.length > 0 && (
          <div
            className="mb-6 flex w-full max-w-2xl flex-wrap justify-center gap-x-3 gap-y-2 px-2"
            style={{ fontFamily: "monospace", fontSize: "clamp(0.5rem, 1.5vw, 0.65rem)", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)" }}
          >
            {locations.map((loc, i) => {
              const hasCoords = loc.lat !== null && loc.lng !== null;
              const mapsUrl = hasCoords
                ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}&z=8`
                : loc.location
                ? `https://www.google.com/maps/search/${encodeURIComponent(loc.location)}`
                : null;

              const inner = (
                <span className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-100" style={{ opacity: mapsUrl ? undefined : 1 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", opacity: 0.7, display: "inline-block", flexShrink: 0 }} />
                  {hasCoords && (
                    <span style={{ color: "rgba(201,168,76,0.8)" }}>
                      {toDMS(loc.lat!, "N", "S")} {toDMS(loc.lng!, "E", "W")}
                    </span>
                  )}
                  {loc.location && (
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>{loc.location}</span>
                  )}
                  {mapsUrl && (
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
                      <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </span>
              );

              return mapsUrl ? (
                <a
                  key={i}
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open in Google Maps"
                  style={{ color: "inherit", textDecoration: "none", opacity: 0.7 }}
                  className="transition-opacity hover:opacity-100"
                >
                  {inner}
                </a>
              ) : (
                <span key={i}>{inner}</span>
              );
            })}
          </div>
        )}

        {error && <p className="mb-4 text-sm" style={{ color: "#f87171" }}>{error}</p>}

        {/* letter strip */}
        <NameDisplay ref={displayRef} results={results} loading={loading} />

        {/* actions */}
        {results.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onShuffle}
              disabled={!canAct}
              className="group inline-flex h-9 items-center gap-2 rounded-full border border-white/12 px-5 text-white/50 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              style={{ fontSize: "0.72rem", letterSpacing: "0.25em", textTransform: "uppercase" }}
            >
              <RotateCcw size={12} className="transition group-hover:-rotate-45" />
              Shuffle
            </button>
            <DownloadButton targetRef={displayRef} disabled={!canAct} />
            <ShareButton name={name} disabled={!name.trim()} />
          </div>
        )}

        {/* footer */}
        <p className="mt-14 eyebrow" style={{ color: "rgba(255,255,255,0.18)" }}>
          NASA · USGS Landsat program
        </p>
        <p
          className="mt-1.5 eyebrow"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          Built by{" "}
          <a href="https://aryab.in" target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>arya</a>
        </p>
      </section>
    </main>
  );
}
