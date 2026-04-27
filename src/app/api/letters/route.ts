import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { LetterImage, LetterResult } from "@/types";

export const revalidate = 3600;

function pickImage(images: LetterImage[], usedFilenames: Set<string>) {
  if (!images.length) {
    return null;
  }

  const unused = images.filter((image) => !image.filename || !usedFilenames.has(image.filename));
  const pool = unused.length ? unused : images;
  const image = pool[Math.floor(Math.random() * pool.length)];

  if (image?.filename) {
    usedFilenames.add(image.filename);
  }

  return image ?? null;
}

export async function GET(request: NextRequest) {
  let adminDb;

  try {
    adminDb = getAdminDb();
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message, results: [] },
      { status: 500 },
    );
  }

  const charsParam = request.nextUrl.searchParams.get("chars") ?? "";
  const chars = charsParam
    .split(",")
    .map((char) => decodeURIComponent(char).slice(0, 1).toUpperCase())
    .filter((char) => char.length > 0);

  const uniqueLetters = Array.from(new Set(chars.filter((char) => /^[A-Z]$/.test(char))));
  const snapshots = await Promise.all(
    uniqueLetters.map(async (letter) => {
      const snapshot = await adminDb.collection("letters").doc(letter).get();
      const data = snapshot.exists ? snapshot.data() : null;
      return [letter, (data?.images ?? []) as LetterImage[]] as const;
    }),
  );

  const imagesByLetter = new Map(snapshots);
  const usedByLetter = new Map<string, Set<string>>();

  const results: LetterResult[] = chars.map((char) => {
    if (char === " " || !/^[A-Z]$/.test(char)) {
      return { char, image: null, variants: [] };
    }

    const variants = imagesByLetter.get(char) ?? [];
    const used = usedByLetter.get(char) ?? new Set<string>();
    usedByLetter.set(char, used);

    return {
      char,
      image: pickImage(variants, used),
      variants,
    };
  });

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
