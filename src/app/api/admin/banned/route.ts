import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

function auth(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  return token === process.env.ADMIN_PASSWORD;
}

// GET — list all banned words
export async function GET(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await db.collection("banned_words").orderBy("word").get();
  const words = snap.docs.map((d) => ({ id: d.id, word: d.data().word as string }));
  return NextResponse.json({ words });
}

// POST — add a banned word  { word: "..." }
export async function POST(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { word } = await request.json() as { word: string };
  if (!word?.trim()) return NextResponse.json({ error: "No word" }, { status: 400 });
  const w = word.trim().toUpperCase();
  await db.collection("banned_words").add({ word: w });
  return NextResponse.json({ ok: true, word: w });
}

// DELETE — remove a banned word by id  { id: "..." }
export async function DELETE(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json() as { id: string };
  if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });
  await db.collection("banned_words").doc(id).delete();
  return NextResponse.json({ ok: true });
}
