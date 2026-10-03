// Schreibt nach einem KI-Lauf eine Zusammenfassung auf die Ergebnisseite in GitHub:
// Bericht der KI, Arbeitsschritte (nur Werkzeug + Kurzangabe) und verweigerte Zugriffe.
// Inhalte von Mails werden nicht ausgegeben – nur Suchbegriffe, Adressen und Dateinamen.
import { readFileSync, existsSync, appendFileSync } from "node:fs";

const [protokollDatei] = process.argv.slice(2);
const ziel = process.env.GITHUB_STEP_SUMMARY;
const aus = (text) => (ziel ? appendFileSync(ziel, text + "\n") : console.log(text));
const kurz = (s, n = 140) => (s.length > n ? s.slice(0, n) + " …" : s);

aus("## Bericht der KI\n");
aus(existsSync("eingang/bericht.md") ? readFileSync("eingang/bericht.md", "utf8") : "_Kein Bericht vorhanden._");

let nachrichten = [];
try { nachrichten = JSON.parse(readFileSync(protokollDatei, "utf8")); } catch { aus("\n_Kein Ablaufprotokoll gefunden._"); process.exit(0); }

const schritte = [];
for (const n of nachrichten) {
  for (const teil of n?.message?.content || []) {
    if (teil.type !== "tool_use") continue;
    const e = teil.input || {};
    const angabe = e.query || e.url || e.file_path || e.pattern || e.command || "";
    schritte.push(`${teil.name}${angabe ? ": " + kurz(String(angabe)) : ""}`);
  }
}
const ergebnis = nachrichten.find((n) => n.type === "result") || {};
aus(`\n## Arbeitsschritte (${schritte.length})\n`);
aus(schritte.length ? schritte.map((s, i) => `${i + 1}. ${s}`).join("\n") : "_Keine._");
const verweigert = ergebnis.permission_denials || [];
aus(`\n## Verweigerte Zugriffe (${verweigert.length})\n`);
for (const v of verweigert) aus(`- ${v.tool_name}: ${kurz(JSON.stringify(v.tool_input || {}))}`);
aus(`\nDauer: ${Math.round((ergebnis.duration_ms || 0) / 1000)} s, Runden: ${ergebnis.num_turns ?? "?"}`);
if (ergebnis.is_error) aus(`\n**Fehler:** ${kurz(String(ergebnis.result || ""), 500)}`);
