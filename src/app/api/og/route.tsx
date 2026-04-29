import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { LetterImage } from "@/types";

export const runtime = "nodejs";

const GOLD = "#c9a84c";

function pickImage(images: LetterImage[]): LetterImage | null {
  return images[Math.floor(Math.random() * images.length)] ?? null;
}

export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") ?? "").toUpperCase().replace(/[^A-Z ]/g, "").slice(0, 12).trim();

  const letters = name.split("").filter((c) => c !== " " && /^[A-Z]$/.test(c));
  const unique  = Array.from(new Set(letters));

  let imagesByLetter: Map<string, LetterImage[]> = new Map();

  try {
    const db = getAdminDb();
    const snaps = await Promise.all(
      unique.map((l) => db.collection("letters").doc(l).get())
    );
    snaps.forEach((snap, i) => {
      const data = snap.exists ? snap.data() : null;
      imagesByLetter.set(unique[i], (data?.images ?? []) as LetterImage[]);
    });
  } catch {
    // fall through — render text-only OG
  }

  const cards = letters.slice(0, 8).map((l) => ({
    char: l,
    img: pickImage(imagesByLetter.get(l) ?? []),
  }));

  const CARD   = 120;
  const GAP    = 8;
  const PAD    = 40;
  const totalW = 1200;
  const totalH = 630;

  // Strip of cards centred horizontally
  const stripW = cards.length * CARD + (cards.length - 1) * GAP;
  const stripX = (totalW - stripW) / 2;
  const stripY = totalH / 2 - CARD / 2 - 30;

  return new ImageResponse(
    (
      <div
        style={{
          width: totalW,
          height: totalH,
          background: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* subtle gold glow */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 70%)",
          display: "flex",
        }} />

        {/* eyebrow */}
        <div style={{
          fontSize: 13,
          letterSpacing: "0.3em",
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          marginBottom: 20,
          display: "flex",
        }}>
          Landsat · Earth Observatory
        </div>

        {/* card strip */}
        <div style={{ display: "flex", gap: GAP, alignItems: "flex-end", marginBottom: 24 }}>
          {cards.map(({ char, img }, i) => (
            <div key={i} style={{
              width: CARD,
              height: CARD,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              background: "#111",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {img?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={char}
                  width={CARD}
                  height={CARD}
                  style={{ objectFit: "cover", width: CARD, height: CARD, position: "absolute", inset: 0 }}
                />
              )}
              {/* gradient overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)",
                display: "flex",
              }} />
              {/* letter */}
              <div style={{
                position: "absolute", bottom: 6, left: 10,
                fontSize: 42, fontWeight: 300, color: "#fff",
                display: "flex",
              }}>
                {char}
              </div>
              {/* gold corner ticks */}
              <div style={{ position:"absolute", top:0, left:0, width:8, height:8, borderTop:`1px solid ${GOLD}`, borderLeft:`1px solid ${GOLD}`, display:"flex" }} />
              <div style={{ position:"absolute", top:0, right:0, width:8, height:8, borderTop:`1px solid ${GOLD}`, borderRight:`1px solid ${GOLD}`, display:"flex" }} />
              <div style={{ position:"absolute", bottom:0, left:0, width:8, height:8, borderBottom:`1px solid ${GOLD}`, borderLeft:`1px solid ${GOLD}`, display:"flex" }} />
              <div style={{ position:"absolute", bottom:0, right:0, width:8, height:8, borderBottom:`1px solid ${GOLD}`, borderRight:`1px solid ${GOLD}`, display:"flex" }} />
            </div>
          ))}
        </div>

        {/* name */}
        <div style={{
          fontSize: 28,
          fontWeight: 300,
          color: "#fff",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 6,
          display: "flex",
        }}>
          {name}
        </div>

        {/* tagline */}
        <div style={{
          fontSize: 13,
          color: GOLD,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          display: "flex",
        }}>
          earthspell.vercel.app
        </div>
      </div>
    ),
    { width: totalW, height: totalH }
  );
}
