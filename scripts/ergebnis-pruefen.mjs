// Prüft die fertig gebaute Website in _site/, bevor sie veröffentlicht wird.
// Fehlt eine Seite oder ist ein interner Link kaputt, bricht der Ablauf ab und die alte Seite bleibt online.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SITE = new URL("../_site/", import.meta.url).pathname;
const PREFIX = (process.env.PATH_PREFIX || "/").replace(/\/?$/, "/");
const PFLICHTSEITEN = ["index.html", "workshops/index.html", "wissenspool/index.html", "kontakt/index.html",
  "orientierungshilfe/index.html", "newsletter/index.html", "impressum/index.html", "datenschutz/index.html"];
const fehler = [];

for (const s of PFLICHTSEITEN) {
  const pfad = join(SITE, s);
  if (!existsSync(pfad)) { fehler.push(`Seite fehlt: /${s}`); continue; }
  const html = readFileSync(pfad, "utf8");
  if (html.length < 5000) fehler.push(`Seite ist verdächtig kurz (${html.length} Zeichen): /${s}`);
  for (const teil of ['class="wp-site-blocks"', "<header", "<main", "<footer", "Impressum"])
    if (!html.includes(teil)) fehler.push(`/${s}: Baustein fehlt (${teil}).`);
}

// Alle internen Links und Bilder müssen auf vorhandene Dateien zeigen
const alleHtml = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? alleHtml(p) : p.endsWith(".html") ? [p] : [];
});
for (const datei of alleHtml(SITE)) {
  const html = readFileSync(datei, "utf8");
  for (const [, ziel] of html.matchAll(/(?:href|src)="([^"#?]+)/g)) {
    if (!ziel.startsWith(PREFIX) || ziel.startsWith("//")) continue;
    let pfad = decodeURI(ziel.slice(PREFIX.length));
    if (pfad === "" || pfad.endsWith("/")) pfad += "index.html";
    if (!existsSync(join(SITE, pfad))) fehler.push(`${datei.slice(SITE.length)}: interner Link/Bild ohne Ziel: ${ziel}`);
  }
}

if (fehler.length) {
  console.error(`\n✗ Die gebaute Website hat ${fehler.length} Problem(e) – sie wird NICHT veröffentlicht:\n`);
  for (const f of [...new Set(fehler)]) console.error("  • " + f);
  process.exit(1);
}
console.log(`✓ Gebaute Website geprüft: ${PFLICHTSEITEN.length} Pflichtseiten vorhanden, interne Links in Ordnung.`);
