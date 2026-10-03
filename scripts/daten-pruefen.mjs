// Prüft Termine, Wissenspool und Seiten (alles in inhalte/) vor jedem Build.
// Bei einem Fehler bricht der Build ab – dann geht nichts online und die bisherige Seite bleibt bestehen.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { termineLesen } from "./termine.mjs";
import { wissenspoolLesen, alleEintraege, linksIn } from "./wissenspool.mjs";
import { seiteLesen, seitePruefen, abschnitteLesen, bilderIn } from "./seiten.mjs";

const fehler = [];
const hinweise = [];

const istUrl = (u) => typeof u === "string" && (/^https?:\/\/[^\s]+$/.test(u) || /^\/[^\s]*$/.test(u));
const bildDa = (b) => !b || /^https?:/.test(b) || existsSync(new URL("../src" + decodeURI(b), import.meta.url));


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

// ---------- Wissenspool (inhalte/wissenspool.md) ----------
const pool = wissenspoolLesen(readFileSync(new URL("../inhalte/wissenspool.md", import.meta.url), "utf8"));
fehler.push(...pool.fehler.map((f) => "wissenspool.md › " + f));
hinweise.push(...pool.hinweise.map((h) => "wissenspool.md › " + h));
const linksPruefen = (zeile, wo) => {
  const links = linksIn(zeile);
  if ((zeile.match(/\]\(/g) || []).length !== links.length || /\]\s+\(/.test(zeile))
    fehler.push(`${wo}: Ein Link ist falsch geschrieben. Richtig: [Linktext](https://…) – ohne Leerzeichen zwischen ] und (.`);
  for (const l of links) if (!istUrl(l.url)) fehler.push(`${wo}: Der Link ist ungültig: ${l.url}`);
};
for (const f of pool.favoriten) {
  const wo = `wissenspool.md › Zeile ${f.nr} („${f.text}“)`;
  if (!istUrl(f.url)) fehler.push(`${wo}: Der Link ist ungültig: ${f.url}`);
  if (!bildDa(f.bild)) fehler.push(`${wo}: Bild nicht gefunden: ${f.bild}`);
}
if (!pool.bereiche.length) fehler.push("wissenspool.md: Es gibt keinen Bereich (## …).");
for (const b of pool.bereiche) {
  if (b.bild && !bildDa(b.bild)) fehler.push(`wissenspool.md › Zeile ${b.nr} („${b.titel}“): Bild nicht gefunden: ${b.bild}`);
  for (const e of alleEintraege({ bereiche: [b] }))
    for (const z of [e.kopf, ...(e.text || [])]) linksPruefen(z, `wissenspool.md › Zeile ${e.nr}`);
}

// ---------- Seiten (inhalte/seiten/*.md) ----------
const SEITEN = new URL("../inhalte/seiten/", import.meta.url);
// Seiten mit festem Layout brauchen eine bestimmte Zahl von Abschnitten (## …)
const ABSCHNITTE = { startseite: 5, workshops: 5 };
let seitenAnzahl = 0;
for (const datei of readdirSync(SEITEN).filter((d) => d.endsWith(".md"))) {
  const name = datei.slice(0, -3);
  const text = readFileSync(new URL(datei, SEITEN), "utf8");
  const wo = `seiten/${datei}`;
  seitenAnzahl++;
  fehler.push(...seitePruefen(text).map((f) => `${wo} › ${f}`));
  if (!seiteLesen(text).titel) fehler.push(`${wo}: Die erste Überschrift „# Seitentitel“ fehlt.`);
  for (const b of bilderIn(text)) if (!bildDa(b)) fehler.push(`${wo}: Bild nicht gefunden: ${b}`);
  if (ABSCHNITTE[name]) {
    const titel = abschnitteLesen(text).map((a) => a.titel);
    if (titel.length !== ABSCHNITTE[name])
      fehler.push(`${wo}: Diese Seite hat ein festes Layout und braucht genau ${ABSCHNITTE[name]} Abschnitte (## …), gefunden: ${titel.length} (${titel.join(" / ")}).`);
  }
}

for (const h of hinweise) console.log("Hinweis: " + h);
if (fehler.length) {
  console.error(`\n✗ ${fehler.length} Fehler in den Daten – die Website wird NICHT veröffentlicht:\n`);
  for (const f of fehler) console.error("  • " + f);
  process.exit(1);
}
console.log(`✓ Daten geprüft: ${termine.termine.length} Termine, ${pool.bereiche.length} Wissenspool-Bereiche mit ${alleEintraege(pool).length} Einträgen, ${seitenAnzahl} Seiten.`);
