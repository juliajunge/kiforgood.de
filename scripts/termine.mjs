// Gemeinsame Logik für Termine: liest inhalte/termine.md und wird von der Website,
// der Datenprüfung und der Schutzregel für KI-Vorschläge verwendet.

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONAT = `(${MONATE.join("|")})`;

/** Heutiges Datum als JJJJ-MM-TT in deutscher Zeit. Für Tests überschreibbar mit HEUTE=2026-12-01. */
export function heuteInBerlin() {
  if (process.env.HEUTE) return process.env.HEUTE;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}

const iso = (j, m, t) => `${j}-${String(m).padStart(2, "0")}-${String(t).padStart(2, "0")}`;
const gibtEs = (j, m, t) => new Date(Date.UTC(j, m - 1, t)).getUTCDate() === t;
const wochentag = (j, m, t) => WOCHENTAGE[new Date(Date.UTC(j, m - 1, t)).getUTCDay()];

export function aktuelleTermine(termine = [], heute) {
  return termine
    .filter((t) => (t.bis || t.datum) >= heute)
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

export function nachMonat(termine = [], heute) {
  const jahrHeute = heute.slice(0, 4);
  const gruppen = [];
  for (const t of aktuelleTermine(termine, heute)) {
    const [jahr, monat] = t.datum.split("-");
    const name = MONATE[Number(monat) - 1] + (jahr === jahrHeute ? "" : " " + jahr);
    if (!gruppen.length || gruppen.at(-1).name !== name) gruppen.push({ name, termine: [] });
    gruppen.at(-1).termine.push(t);
  }
  return gruppen;
}

/**
 * Liest den Datumsteil der 📅-Zeile, z. B. „Mittwoch, 7. Oktober 2026“,
 * „20. Oktober bis 10. November 2026“ oder „25. November, 2. und 9. Dezember 2026“.
 * Liefert { datum, bis } oder { fehler }.
 */
export function datumLesen(text) {
  const wt = text.match(/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag),?\s*/);
  const rest = wt ? text.slice(wt[0].length) : text;
  const jahre = [...rest.matchAll(/\b(20\d\d)\b/g)].map((m) => Number(m[1]));
  if (!jahre.length) return { fehler: `Im Datum fehlt die Jahreszahl („${text}“).` };

  // Tage sammeln; ein Tag ohne Monat („2. und 9. Dezember“) bekommt den nächsten genannten Monat
  const paare = [];
  let offen = [];
  for (const m of rest.matchAll(new RegExp(`(\\d{1,2})\\.\\s*${MONAT}?`, "g"))) {
    offen.push(Number(m[1]));
    if (m[2]) {
      for (const tag of offen) paare.push({ tag, monat: MONATE.indexOf(m[2]) + 1 });
      offen = [];
    }
  }
  if (!paare.length || offen.length) return { fehler: `Datum nicht erkannt („${text}“). Beispiel: „Mittwoch, 7. Oktober 2026“.` };

  // Jahr von hinten vergeben: „15. Dezember bis 12. Januar 2027“ beginnt 2026
  let jahr = jahre.at(-1);
  for (let i = paare.length - 1; i >= 0; i--) {
    if (i < paare.length - 1 && paare[i].monat > paare[i + 1].monat) jahr--;
    paare[i].jahr = jahr;
  }
  for (const p of paare)
    if (!gibtEs(p.jahr, p.monat, p.tag)) return { fehler: `Den ${p.tag}. ${MONATE[p.monat - 1]} ${p.jahr} gibt es nicht.` };

  const erster = paare[0], letzter = paare.at(-1);
  if (wt && paare.length === 1) {
    const richtig = wochentag(erster.jahr, erster.monat, erster.tag);
    if (richtig !== wt[1])
      return { fehler: `Der ${erster.tag}. ${MONATE[erster.monat - 1]} ${erster.jahr} ist ein ${richtig}, nicht ${wt[1]}.` };
  }
  const datum = iso(erster.jahr, erster.monat, erster.tag);
  const bis = iso(letzter.jahr, letzter.monat, letzter.tag);
  if (bis < datum) return { fehler: `Der letzte Termin liegt vor dem ersten („${text}“).` };
  return bis === datum ? { datum } : { datum, bis };
}

/** Zerlegt die 📅-Zeile in Datum und die übrigen Angaben. */
function zeileLesen(zeile) {
  const teile = zeile.split("|").map((s) => s.trim()).filter(Boolean);
  const t = { zeile: teile.join(" | "), ...datumLesen(teile[0] || "") };
  for (const teil of teile.slice(1)) {
    if (/^kostenlos$/i.test(teil)) t.kostenlos = true;
    else if (/^anmelde(schluss|frist)/i.test(teil)) t.anmeldeschluss = teil.replace(/^[^:]*:\s*/, "");
    else if (/Uhr/.test(teil) && !t.zeit) t.zeit = teil;
    else if (!t.ort) t.ort = teil;
  }
  return t;
}

/**
 * Liest inhalte/termine.md.
 * Liefert { dauerangebote, termine, fehler, hinweise }. Fehler und Hinweise nennen die Zeilennummer.
 */
export function termineLesen(text) {
  const fehler = [], hinweise = [];
  const dauerangebote = [], termine = [];

  // Kommentare <!-- … --> entfernen, Zeilennummern aber erhalten
  text = text.replace(/<!--[\s\S]*?-->/g, (k) => k.replace(/[^\n]/g, ""));
  const zeilen = text.split(/\r?\n/);
  let i = 0;
  if (zeilen[0]?.trim() === "---") { // Kopfbereich (z. B. vom Web-Editor) überspringen
    const ende = zeilen.findIndex((z, n) => n > 0 && z.trim() === "---");
    if (ende > 0) i = ende + 1;
  }

  // In Blöcke zerlegen: Überschriften einzeln, sonst zusammenhängende Zeilen bis zur Leerzeile
  const bloecke = [];
  for (; i < zeilen.length; i++) {
    const z = zeilen[i].trim();
    if (!z) continue;
    if (/^#{1,3}\s/.test(z)) { bloecke.push({ ueberschrift: z, nr: i + 1 }); continue; }
    if (bloecke.at(-1)?.zeilen && zeilen[i - 1]?.trim()) bloecke.at(-1).zeilen.push(z);
    else bloecke.push({ zeilen: [z], nr: i + 1 });
  }

  let abschnitt = null; // { dauerhaft } oder { monat, jahr, text }
  let dauer = null;
  for (const b of bloecke) {
    const wo = `Zeile ${b.nr}`;
    if (b.ueberschrift) {
      const [, ebene, titel] = b.ueberschrift.match(/^(#+)\s+(.*)$/);
      if (ebene === "#") continue;
      if (ebene === "##") {
        dauer = null;
        if (/dauerhaft/i.test(titel)) abschnitt = { dauerhaft: true };
        else {
          const m = titel.match(new RegExp(`^${MONAT}\\s+(20\\d\\d)$`));
          if (!m) fehler.push(`${wo}: Überschrift „${titel}“ nicht erkannt. Erlaubt sind „## Dauerhafte Angebote“ oder ein Monat mit Jahr, z. B. „## Oktober 2026“.`);
          abschnitt = m ? { monat: MONATE.indexOf(m[1]) + 1, jahr: Number(m[2]), text: titel } : null;
        }
      } else if (abschnitt?.dauerhaft) {
        dauer = { rubrik: titel, nr: b.nr };
        dauerangebote.push(dauer);
      } else fehler.push(`${wo}: „### …“-Überschriften gibt es nur unter „## Dauerhafte Angebote“.`);
      continue;
    }

    // ---- Dauerhafte Angebote ----
    if (abschnitt?.dauerhaft) {
      if (!dauer) { fehler.push(`${wo}: Dauerhaftes Angebot ohne „### Überschrift“ davor.`); continue; }
      for (const z of b.zeilen) {
        const link = z.match(/^\[(.+)\]\((\S+)\)$/);
        if (!dauer.titel && !dauer.beschreibung && /^\*[^*].*\*$/.test(z) && !dauer.hinweis) dauer.hinweis = z.slice(1, -1);
        else if (!dauer.titel && link) [, dauer.titel, dauer.url] = link;
        else if (dauer.titel && !dauer.mit && !dauer.beschreibung && /^mit\s+/.test(z)) dauer.mit = z.replace(/^mit\s+/, "");
        else if (dauer.titel) dauer.beschreibung = (dauer.beschreibung ? dauer.beschreibung + "\n" : "") + z;
        else fehler.push(`${wo}: Beim Angebot „${dauer.rubrik}“ muss zuerst der Link stehen: [Titel](https://…)`);
      }
      continue;
    }

    // ---- Termine ----
    const [anbieter, linkZeile, ...rest] = b.zeilen;
    const t = { anbieter, nr: b.nr };
    const link = linkZeile?.match(/^\[(.+)\]\((\S+)\)$/);
    if (!anbieter || /^\[|^📅|^mit\s/.test(anbieter)) {
      fehler.push(`${wo}: Ein Termin beginnt mit dem Anbieter (z. B. „Haus des Stiftens“), gefolgt von der Link-Zeile.`);
      continue;
    }
    if (!link) {
      fehler.push(`${wo} („${anbieter}“): Die 2. Zeile muss der verlinkte Titel sein: [Titel](https://…)`);
      continue;
    }
    [, t.titel, t.url] = link;
    if (/^mit\s+/.test(rest[0] || "")) t.mit = rest.shift().replace(/^mit\s+/, "");
    const kalender = rest.shift();
    if (!kalender?.startsWith("📅")) {
      fehler.push(`${wo} („${t.titel}“): Es fehlt die Zeile mit 📅 und Datum.`);
      continue;
    }
    if (rest.length)
      fehler.push(`${wo} („${t.titel}“): Nach der 📅-Zeile folgt ohne Leerzeile „${rest[0]}“. Zwischen zwei Terminen muss eine Leerzeile stehen.`);
    Object.assign(t, zeileLesen(kalender.replace(/^📅\s*/, "")));
    if (t.fehler) { fehler.push(`${wo} („${t.titel}“): ${t.fehler}`); continue; }
    if (!abschnitt) hinweise.push(`${wo} („${t.titel}“): Steht unter keiner Monatsüberschrift.`);
    else if (Number(t.datum.slice(0, 4)) !== abschnitt.jahr || Number(t.datum.slice(5, 7)) !== abschnitt.monat)
      hinweise.push(`${wo} („${t.titel}“): Steht unter „${abschnitt.text}“, beginnt aber am ${t.datum}. Auf der Website erscheint er trotzdem im richtigen Monat.`);
    termine.push(t);
  }

  for (const d of dauerangebote) if (!d.titel) fehler.push(`Zeile ${d.nr}: Beim Angebot „${d.rubrik}“ fehlt der Link: [Titel](https://…)`);
  return { dauerangebote, termine, fehler, hinweise };
}
