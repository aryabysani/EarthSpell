"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Plus, RefreshCw, LogOut } from "lucide-react";

interface BannedWord { id: string; word: string; }
interface LogEntry   { id: string; name: string; ip: string; ts: string; }

function api(path: string, token: string, opts: RequestInit = {}) {
  return fetch(path, {
    ...opts,
    headers: { "x-admin-token": token, "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
}

export default function AdminPage() {
  const [token, setToken]     = useState("");
  const [authed, setAuthed]   = useState(false);
  const [error, setError]     = useState("");

  const [banned, setBanned]   = useState<BannedWord[]>([]);
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [newWord, setNewWord] = useState("");
  const [busy, setBusy]       = useState(false);
  const [tab, setTab]         = useState<"logs" | "banned">("logs");

  const load = useCallback(async (t: string) => {
    const [br, lr] = await Promise.all([
      api("/api/admin/banned", t),
      api("/api/admin/logs",   t),
    ]);
    if (br.status === 401 || lr.status === 401) { setAuthed(false); setError("Wrong password"); return; }
    const bd = await br.json();
    const ld = await lr.json();
    setBanned(bd.words ?? []);
    setLogs(ld.logs ?? []);
    setAuthed(true);
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    await load(token);
  }

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    if (!newWord.trim() || busy) return;
    setBusy(true);
    await api("/api/admin/banned", token, { method: "POST", body: JSON.stringify({ word: newWord.trim() }) });
    setNewWord("");
    await load(token);
    setBusy(false);
  }

  async function removeWord(id: string) {
    await api("/api/admin/banned", token, { method: "DELETE", body: JSON.stringify({ id }) });
    await load(token);
  }

  async function clearLogs() {
    if (!confirm("Clear all logs?")) return;
    await api("/api/admin/logs", token, { method: "DELETE" });
    await load(token);
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) { setToken(saved); load(saved); }
  }, [load]);

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4">
        <form onSubmit={login} className="flex w-full max-w-xs flex-col gap-3">
          <h1 style={{ fontFamily: "monospace", fontSize: "1rem", letterSpacing: "0.3em", color: "#c9a84c", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Admin · EarthSpell
          </h1>
          {error && <p style={{ color: "#f87171", fontSize: "0.75rem", letterSpacing: "0.1em" }}>{error}</p>}
          <input
            type="password"
            placeholder="Password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", padding: "0.6rem 0.8rem", borderRadius: "6px",
              fontSize: "0.85rem", outline: "none", fontFamily: "monospace",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#c9a84c", color: "#000", border: "none", borderRadius: "6px",
              padding: "0.6rem", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.2em",
              textTransform: "uppercase", cursor: "pointer",
            }}
          >
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "monospace", padding: "1.5rem" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "0.85rem", letterSpacing: "0.35em", color: "#c9a84c", textTransform: "uppercase" }}>
          Admin · EarthSpell
        </h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => load(token)} title="Refresh" style={iconBtn}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => { setAuthed(false); sessionStorage.removeItem("admin_token"); }} title="Log out" style={iconBtn}>
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* stats */}
      {(() => {
        const unique = new Set(logs.map((l) => l.name)).size;
        const freq = logs.reduce<Record<string, number>>((acc, l) => { acc[l.name] = (acc[l.name] ?? 0) + 1; return acc; }, {});
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total searches", value: logs.length },
              { label: "Unique names", value: unique },
              { label: "Most searched", value: top ? `${top[0]} (${top[1]}×)` : "—" },
            ].map((s) => (
              <div key={s.label} style={{ flex: "1 1 140px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "0.75rem 1rem" }}>
                <p style={{ fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.35rem" }}>{s.label}</p>
                <p style={{ fontSize: "1.1rem", color: "#c9a84c", fontWeight: 700 }}>{s.value}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {(["logs", "banned"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.35rem 0.9rem", borderRadius: "999px", fontSize: "0.68rem",
              letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
              border: tab === t ? "1px solid #c9a84c" : "1px solid rgba(255,255,255,0.12)",
              background: tab === t ? "rgba(201,168,76,0.12)" : "transparent",
              color: tab === t ? "#c9a84c" : "rgba(255,255,255,0.45)",
            }}
          >
            {t === "logs" ? `Logs (${logs.length})` : `Banned (${banned.length})`}
          </button>
        ))}
      </div>

      {/* logs tab */}
      {tab === "logs" && (
        <section>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
            <button onClick={clearLogs} style={{ ...iconBtn, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              <Trash2 size={11} /> Clear all
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  <th style={th}>Name</th>
                  <th style={th}>IP</th>
                  <th style={th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ ...td, color: "#fff", fontWeight: 600, letterSpacing: "0.1em" }}>{l.name}</td>
                    <td style={{ ...td, color: "rgba(255,255,255,0.35)" }}>{l.ip}</td>
                    <td style={{ ...td, color: "rgba(255,255,255,0.35)" }}>{new Date(l.ts).toLocaleString()}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={3} style={{ ...td, textAlign: "center", color: "rgba(255,255,255,0.2)", paddingTop: "2rem" }}>No logs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* banned tab */}
      {tab === "banned" && (
        <section>
          <form onSubmit={addWord} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ""))}
              placeholder="ADD WORD..."
              maxLength={20}
              style={{
                flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff", padding: "0.5rem 0.75rem", borderRadius: "6px",
                fontSize: "0.8rem", outline: "none", letterSpacing: "0.15em",
              }}
            />
            <button
              type="submit"
              disabled={!newWord.trim() || busy}
              style={{
                background: "#c9a84c", color: "#000", border: "none", borderRadius: "6px",
                padding: "0.5rem 0.9rem", fontWeight: 700, fontSize: "0.72rem",
                letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.35rem",
                opacity: !newWord.trim() || busy ? 0.4 : 1,
              }}
            >
              <Plus size={13} /> Add
            </button>
          </form>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {banned.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  border: "1px solid rgba(248,113,113,0.3)", borderRadius: "999px",
                  padding: "0.3rem 0.7rem 0.3rem 0.9rem",
                  background: "rgba(248,113,113,0.06)", fontSize: "0.72rem",
                  letterSpacing: "0.15em", color: "#f87171",
                }}
              >
                {b.word}
                <button
                  onClick={() => removeWord(b.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", display: "flex", padding: 0 }}
                  title="Remove"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            {banned.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", letterSpacing: "0.15em" }}>No banned words</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

const iconBtn: React.CSSProperties = {
  background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)",
  borderRadius: "6px", padding: "0.35rem 0.5rem", cursor: "pointer", display: "flex", alignItems: "center",
};
const th: React.CSSProperties = { padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 500 };
const td: React.CSSProperties = { padding: "0.55rem 0.75rem" };
