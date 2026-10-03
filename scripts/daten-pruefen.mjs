// Prüft die Datenlisten (Termine, Wissenspool) vor jedem Build.
// Bei einem Fehler bricht der Build ab – dann geht nichts online und die bisherige Seite bleibt bestehen.
import { readFileSync, existsSync } from "node:fs";
import { load } from "js-yaml";
import { alsText } from "./termine.mjs";

const fehler = [];
const hinweise = [];
const datei = (pfad) => load(readFileSync(new URL("../" + pfad, import.meta.url), "utf8"));

const istDatum = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d + "T00:00:00Z")) &&
  new Date(d + "T00:00:00Z").toISOString().startsWith(d);
const istUrl = (u) => typeof u === "string" && (/^https?:\/\/[^\s]+$/.test(u) || /^\/[^\s]*$/.test(u));
const bildDa = (b) => !b || /^https?:/.test(b) || existsSync(new URL("../src" + decodeURI(b), import.meta.url));

function felderPruefen(obj, wo, erlaubt, pflicht) {
  if (!obj || typeof obj !== "object") return fehler.push(`${wo}: Eintrag ist leer oder ungültig.`);
  for (const f of pflicht) if (obj[f] == null || String(obj[f]).trim() === "") fehler.push(`${wo}: Feld „${f}“ fehlt.`);
  for (const f of Object.keys(obj)) if (!erlaubt.includes(f)) fehler.push(`${wo}: Unbekanntes Feld „${f}“ (Tippfehler?). Erlaubt: ${erlaubt.join(", ")}`);
  for (const [f, w] of Object.entries(obj)) if (typeof w === "string" && /\d\s*€|€\s*\d|EUR\s*\d/.test(w)) fehler.push(`${wo}: Feld „${f}“ enthält einen Preis – Preise werden nicht veröffentlicht (nur „kostenlos“).`);
}

// ---------- Termine ----------
const termine = datei("src/_data/termine.yaml") || {};
(termine.dauerangebote || []).forEach((d, i) => {
  const wo = `termine.yaml › dauerangebote › Nr. ${i + 1} („${d?.titel ?? "?"}“)`;
  felderPruefen(d, wo, ["rubrik", "hinweis", "titel", "url", "mit", "beschreibung"], ["rubrik", "titel", "url"]);
  if (d?.url && !istUrl(d.url)) fehler.push(`${wo}: „url“ ist kein gültiger Link.`);
});
if (!Array.isArray(termine.termine)) fehler.push("termine.yaml: Die Liste „termine:“ fehlt.");
const gesehen = new Map();
(termine.termine || []).forEach((t, i) => {
  const wo = `termine.yaml › termine › Nr. ${i + 1} („${t?.titel ?? "?"}“)`;
  felderPruefen(t, wo,
    ["anbieter", "titel", "url", "mit", "datum", "bis", "datum_text", "zeit", "ort", "kostenlos", "anmeldeschluss", "zusatz", "notiz"],
    ["anbieter", "titel", "url", "datum"]);
  if (!t) return;
  const datum = alsText(t.datum), bis = alsText(t.bis);
  if (t.datum != null && !istDatum(datum)) fehler.push(`${wo}: „datum“ muss so aussehen: 2026-10-06 (ist: ${datum}).`);
  if (t.bis != null && !istDatum(bis)) fehler.push(`${wo}: „bis“ muss so aussehen: 2026-11-10 (ist: ${bis}).`);
  if (istDatum(datum) && istDatum(bis) && bis < datum) fehler.push(`${wo}: „bis“ liegt vor „datum“.`);
  if (t.url && !istUrl(t.url)) fehler.push(`${wo}: „url“ ist kein gültiger Link.`);
  if (t.kostenlos != null && typeof t.kostenlos !== "boolean") fehler.push(`${wo}: „kostenlos“ muss true oder false sein.`);
  const schluessel = `${t.url}|${datum}`;
  if (gesehen.has(schluessel)) fehler.push(`${wo}: Doppelter Eintrag (gleicher Link und gleiches Datum wie Nr. ${gesehen.get(schluessel)}).`);
  gesehen.set(schluessel, i + 1);
});
const proUrl = {};
for (const t of termine.termine || []) (proUrl[t?.url] ||= []).push(alsText(t?.datum));
for (const [url, daten] of Object.entries(proUrl))
  if (daten.length > 1) hinweise.push(`Gleicher Link bei mehreren Terminen (${daten.join(", ")}): ${url} – bitte prüfen, ob das Absicht ist.`);

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
