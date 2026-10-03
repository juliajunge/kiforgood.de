// Schutzregel für KI-Vorschläge: Ein automatischer Vorschlag darf nur Termine und Wissenspool ändern
// und keine kommenden Termine oder ganze Wissenspool-Bereiche löschen.
// Aufruf: node scripts/vorschlag-pruefen.mjs <Vergleichsstand, z. B. origin/main>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { aktuelleTermine, heuteInBerlin, termineLesen } from "./termine.mjs";
import { wissenspoolLesen, alleEintraege } from "./wissenspool.mjs";

const ERLAUBT = ["inhalte/termine.md", "inhalte/wissenspool.md"];
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

const heute = heuteInBerlin();
const altText = (pfad) => { try { return git("show", `${basis}:${pfad}`); } catch { return ""; } };
const schluessel = (t) => `${t.url}|${t.datum}`;
const termineNeu = termineLesen(readFileSync("inhalte/termine.md", "utf8"));
fehler.push(...termineNeu.fehler.map((f) => "termine.md › " + f));
const neueTermine = new Set(termineNeu.termine.map(schluessel));
for (const t of aktuelleTermine(termineLesen(altText("inhalte/termine.md")).termine, heute))
  if (!neueTermine.has(schluessel(t))) fehler.push(`Kommender Termin wurde gelöscht oder verändert: „${t.titel}“ (${schluessel(t)}). Das darf nur ein Mensch.`);

const poolNeu = wissenspoolLesen(readFileSync("inhalte/wissenspool.md", "utf8"));
const poolAlt = wissenspoolLesen(altText("inhalte/wissenspool.md"));
fehler.push(...poolNeu.fehler.map((f) => "wissenspool.md › " + f));
const titel = (p) => p.bereiche.map((b) => b.titel);
for (const t of titel(poolAlt)) if (!titel(poolNeu).includes(t)) fehler.push(`Wissenspool-Bereich wurde entfernt oder umbenannt: „${t}“.`);
const anzahl = (p) => alleEintraege(p).length + p.favoriten.length;
if (anzahl(poolNeu) < anzahl(poolAlt))
  fehler.push(`Im Wissenspool wurden Einträge entfernt (${anzahl(poolAlt)} → ${anzahl(poolNeu)}). Löschen darf nur ein Mensch.`);

if (fehler.length) {
  console.error("\n✗ Der KI-Vorschlag verletzt die Schutzregeln:\n");
  for (const f of fehler) console.error("  • " + f);
  process.exit(1);
}
console.log(`✓ KI-Vorschlag hält die Schutzregeln ein (${geaendert.size} geänderte Datei(en)).`);
