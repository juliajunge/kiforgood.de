// Schutzregel für KI-Vorschläge: Ein automatischer Vorschlag darf nur Termine und Wissenspool ändern
// und keine kommenden Termine oder ganze Wissenspool-Bereiche löschen.
// Aufruf: node scripts/vorschlag-pruefen.mjs <Vergleichsstand, z. B. origin/main>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { aktuelleTermine, heuteInBerlin, termineLesen } from "./termine.mjs";

const ERLAUBT = ["inhalte/termine.md", "src/_data/wissenspool.yaml"];
const basis = process.argv[2] || "origin/main";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
const fehler = [];

// Geänderte Dateien: Commits gegenüber der Basis plus noch nicht eingecheckte Änderungen
const geaendert = new Set([
  ...git("diff", "--name-only", `${basis}...HEAD`).split("\n"),
  ...git("diff", "--name-only", "HEAD").split("\n"),
  ...git("ls-files", "--others", "--exclude-standard").split("\n"),
].filter(Boolean));
for (const d of geaendert) if (!ERLAUBT.includes(d)) fehler.push(`Datei darf von der KI nicht geändert werden: ${d}`);

const alt = (pfad) => { try { return load(git("show", `${basis}:${pfad}`)) || {}; } catch { return {}; } };
const neu = (pfad) => {
  try { return load(readFileSync(pfad, "utf8")) || {}; }
  catch (e) { fehler.push(`${pfad} ist keine gültige YAML-Datei: ${e.reason} (Zeile ${e.mark?.line + 1})`); return {}; }
};

const heute = heuteInBerlin();
const altText = (pfad) => { try { return git("show", `${basis}:${pfad}`); } catch { return ""; } };
const schluessel = (t) => `${t.url}|${t.datum}`;
const termineNeu = termineLesen(readFileSync("inhalte/termine.md", "utf8"));
fehler.push(...termineNeu.fehler.map((f) => "termine.md › " + f));
const neueTermine = new Set(termineNeu.termine.map(schluessel));
for (const t of aktuelleTermine(termineLesen(altText("inhalte/termine.md")).termine, heute))
  if (!neueTermine.has(schluessel(t))) fehler.push(`Kommender Termin wurde gelöscht oder verändert: „${t.titel}“ (${schluessel(t)}). Das darf nur ein Mensch.`);

const poolAlt = alt("src/_data/wissenspool.yaml"), poolNeu = neu("src/_data/wissenspool.yaml");
const titel = (p) => (p.bereiche || []).map((b) => b.titel);
for (const t of titel(poolAlt)) if (!titel(poolNeu).includes(t)) fehler.push(`Wissenspool-Bereich wurde entfernt oder umbenannt: „${t}“.`);
const zaehle = (p) => (p.bereiche || []).reduce((n, b) => n + (b.eintraege || []).length +
  (b.gruppen || []).reduce((m, g) => m + (g.eintraege || []).length, 0), 0);
if (zaehle(poolNeu) < zaehle(poolAlt) - 3) fehler.push(`Im Wissenspool wurden mehr als 3 Einträge entfernt (${zaehle(poolAlt)} → ${zaehle(poolNeu)}).`);

if (fehler.length) {
  console.error("\n✗ Der KI-Vorschlag verletzt die Schutzregeln:\n");
  for (const f of fehler) console.error("  • " + f);
  process.exit(1);
}
console.log(`✓ KI-Vorschlag hält die Schutzregeln ein (${geaendert.size} geänderte Datei(en)).`);
