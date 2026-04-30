import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

function auth(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  return token === process.env.ADMIN_PASSWORD;
}

// GET — last 200 search logs
export async function GET(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await db.collection("search_logs").orderBy("ts", "desc").limit(200).get();
  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ logs });
}

// DELETE — clear all logs
export async function DELETE(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await db.collection("search_logs").get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return NextResponse.json({ ok: true, deleted: snap.size });
}
