import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import type { LetterImage, LetterResult } from "@/types";

export const revalidate = 0;

function pickImage(images: LetterImage[], usedFilenames: Set<string>) {
  if (!images.length) return null;
  const unused = images.filter((img) => !img.filename || !usedFilenames.has(img.filename));
  const pool = unused.length ? unused : images;
  const image = pool[Math.floor(Math.random() * pool.length)];
  if (image?.filename) usedFilenames.add(image.filename);
  return image ?? null;
}

export async function GET(request: NextRequest) {
  const charsParam = request.nextUrl.searchParams.get("chars") ?? "";
  const chars = charsParam
    .split(",")
    .map((c) => decodeURIComponent(c).slice(0, 1).toUpperCase())
    .filter((c) => c.length > 0);

  const name = chars.join("");

  // Check banned words
  const bannedSnap = await db.collection("banned_words").get();
  const banned = bannedSnap.docs.map((d) => (d.data().word as string).toUpperCase());
  if (banned.some((w) => name.includes(w))) {
    return NextResponse.json({ error: "banned", results: [] }, { status: 403 });
  }

  // Log the search (skip single-char or empty)
  if (name.trim().length > 1) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const ua = request.headers.get("user-agent") ?? "unknown";
    await db.collection("search_logs").add({
      name,
      ip,
      ua,
      ts: new Date().toISOString(),
    });
  }

  const uniqueLetters = Array.from(new Set(chars.filter((c) => /^[A-Z]$/.test(c))));
  const snapshots = await Promise.all(
    uniqueLetters.map(async (letter) => {
      const snap = await db.collection("letters").doc(letter).get();
      return [letter, ((snap.data()?.images ?? []) as LetterImage[])] as const;
    }),
  );

  const imagesByLetter = new Map(snapshots);
  const usedByLetter = new Map<string, Set<string>>();

  const results: LetterResult[] = chars.map((char) => {
    if (char === " " || !/^[A-Z]$/.test(char)) return { char, image: null, variants: [] };
    const variants = imagesByLetter.get(char) ?? [];
    const used = usedByLetter.get(char) ?? new Set<string>();
    usedByLetter.set(char, used);
    return { char, image: pickImage(variants, used), variants };
  });

  return NextResponse.json({ results }, {
    headers: { "Cache-Control": "no-store" },
  });
}
