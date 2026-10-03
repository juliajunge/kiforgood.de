// Prüft Termine (inhalte/termine.md) und Wissenspool (src/_data/wissenspool.yaml) vor jedem Build.
// Bei einem Fehler bricht der Build ab – dann geht nichts online und die bisherige Seite bleibt bestehen.
import { readFileSync, existsSync } from "node:fs";
import { load } from "js-yaml";
import { termineLesen } from "./termine.mjs";

const fehler = [];
const hinweise = [];
const datei = (pfad) => load(readFileSync(new URL("../" + pfad, import.meta.url), "utf8"));

const istUrl = (u) => typeof u === "string" && (/^https?:\/\/[^\s]+$/.test(u) || /^\/[^\s]*$/.test(u));
const bildDa = (b) => !b || /^https?:/.test(b) || existsSync(new URL("../src" + decodeURI(b), import.meta.url));

function felderPruefen(obj, wo, erlaubt, pflicht) {
  if (!obj || typeof obj !== "object") return fehler.push(`${wo}: Eintrag ist leer oder ungültig.`);
  for (const f of pflicht) if (obj[f] == null || String(obj[f]).trim() === "") fehler.push(`${wo}: Feld „${f}“ fehlt.`);
  for (const f of Object.keys(obj)) if (!erlaubt.includes(f)) fehler.push(`${wo}: Unbekanntes Feld „${f}“ (Tippfehler?). Erlaubt: ${erlaubt.join(", ")}`);
  for (const [f, w] of Object.entries(obj)) if (typeof w === "string" && /\d\s*€|€\s*\d|EUR\s*\d/.test(w)) fehler.push(`${wo}: Feld „${f}“ enthält einen Preis – Preise werden nicht veröffentlicht (nur „kostenlos“).`);
}

// ---------- Termine (inhalte/termine.md) ----------
const termineText = readFileSync(new URL("../inhalte/termine.md", import.meta.url), "utf8");
const termine = termineLesen(termineText);
fehler.push(...termine.fehler.map((f) => "termine.md › " + f));
hinweise.push(...termine.hinweise.map((h) => "termine.md › " + h));
const PREIS = /\d\s*€|€\s*\d|EUR\s*\d/;
termineText.replace(/<!--[\s\S]*?-->/g, (k) => k.replace(/[^\n]/g, "")).split(/\r?\n/).forEach((z, i) => {
  if (PREIS.test(z)) fehler.push(`termine.md › Zeile ${i + 1}: enthält einen Preis – Preise werden nicht veröffentlicht (nur „kostenlos“).`);
});
for (const d of termine.dauerangebote)
  if (d.url && !istUrl(d.url)) fehler.push(`termine.md › Zeile ${d.nr} („${d.rubrik}“): Der Link ist ungültig: ${d.url}`);
const gesehen = new Map();
for (const t of termine.termine) {
  const wo = `termine.md › Zeile ${t.nr} („${t.titel}“)`;
  if (!istUrl(t.url)) fehler.push(`${wo}: Der Link ist ungültig: ${t.url}`);
  const schluessel = `${t.url}|${t.datum}`;
  if (gesehen.has(schluessel)) fehler.push(`${wo}: Doppelter Termin (gleicher Link und gleiches Datum wie in Zeile ${gesehen.get(schluessel)}).`);
  gesehen.set(schluessel, t.nr);
}
const proUrl = {};
for (const t of termine.termine) (proUrl[t.url] ||= []).push(`Zeile ${t.nr}`);
for (const [url, stellen] of Object.entries(proUrl))
  if (stellen.length > 1) hinweise.push(`termine.md › Gleicher Link bei mehreren Terminen (${stellen.join(", ")}): ${url} – bitte prüfen, ob das Absicht ist.`);

// ---------- Wissenspool ----------
const pool = datei("src/_data/wissenspool.yaml") || {};
(pool.favoriten || []).forEach((f, i) => {
  const wo = `wissenspool.yaml › favoriten › Nr. ${i + 1} („${f?.text ?? "?"}“)`;
  felderPruefen(f, wo, ["bild", "bild_alt", "bild_url", "bild_position", "text", "url"], ["bild", "text", "url"]);
  if (f?.url && !istUrl(f.url)) fehler.push(`${wo}: „url“ ist kein gültiger Link.`);
  if (f?.bild && !bildDa(f.bild)) fehler.push(`${wo}: Bild nicht gefunden: ${f.bild}`);
});
if (!Array.isArray(pool.bereiche) || pool.bereiche.length === 0) fehler.push("wissenspool.yaml: Die Liste „bereiche:“ fehlt oder ist leer.");
const eintragPruefen = (e, wo) => {
  felderPruefen(e, wo, ["icon", "vor", "titel", "url", "zusatz", "text"], []);
  if (!e) return;
  if (!e.titel && !e.text) fehler.push(`${wo}: Braucht mindestens „titel“ (mit „url“) oder „text“.`);
  if (e.titel && !e.url) fehler.push(`${wo}: „titel“ ohne „url“.`);
  if (e.url && !istUrl(e.url)) fehler.push(`${wo}: „url“ ist kein gültiger Link.`);
};
(pool.bereiche || []).forEach((b, i) => {
  const wo = `wissenspool.yaml › bereiche › „${b?.titel ?? "Nr. " + (i + 1)}“`;
  felderPruefen(b, wo, ["titel", "bild", "bild_alt", "eintraege", "gruppen"], ["titel"]);
  if (b?.bild && !bildDa(b.bild)) fehler.push(`${wo}: Bild nicht gefunden: ${b.bild}`);
  (b?.eintraege || []).forEach((e, j) => eintragPruefen(e, `${wo} › Eintrag ${j + 1}`));
  (b?.gruppen || []).forEach((g, j) => {
    felderPruefen(g, `${wo} › Gruppe ${j + 1}`, ["titel", "ebene", "eintraege"], ["titel"]);
    (g?.eintraege || []).forEach((e, k) => eintragPruefen(e, `${wo} › ${g?.titel} › Eintrag ${k + 1}`));
  });
});

for (const h of hinweise) console.log("Hinweis: " + h);
if (fehler.length) {
  console.error(`\n✗ ${fehler.length} Fehler in den Daten – die Website wird NICHT veröffentlicht:\n`);
  for (const f of fehler) console.error("  • " + f);
  process.exit(1);
}
console.log("✓ Daten geprüft: " + (termine.termine || []).length + " Termine, " + (pool.bereiche || []).length + " Wissenspool-Bereiche.");
