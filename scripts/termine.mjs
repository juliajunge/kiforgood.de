// Gemeinsame Logik für Termine: wird von der Website und von der Datenprüfung verwendet.

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

/** Heutiges Datum als JJJJ-MM-TT in deutscher Zeit. Für Tests überschreibbar mit HEUTE=2026-12-01. */
export function heuteInBerlin() {
  if (process.env.HEUTE) return process.env.HEUTE;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
}

/** YAML kann Datumsangaben als Text oder als Datum liefern – hier wird beides zu JJJJ-MM-TT. */
export function alsText(datum) {
  if (datum instanceof Date) return datum.toISOString().slice(0, 10);
  return datum == null ? "" : String(datum).trim();
}

export function aktuelleTermine(termine = [], heute) {
  return termine
    .filter((t) => alsText(t.bis || t.datum) >= heute)
    .sort((a, b) => alsText(a.datum).localeCompare(alsText(b.datum)));
}

export function nachMonat(termine = [], heute) {
  const jahrHeute = heute.slice(0, 4);
  const gruppen = [];
  for (const t of aktuelleTermine(termine, heute)) {
    const [jahr, monat] = alsText(t.datum).split("-");
    const name = MONATE[Number(monat) - 1] + (jahr === jahrHeute ? "" : " " + jahr);
    if (!gruppen.length || gruppen.at(-1).name !== name) gruppen.push({ name, termine: [] });
    gruppen.at(-1).termine.push(t);
  }
  return gruppen;
}

export function datumLang(datum) {
  const [j, m, d] = alsText(datum).split("-").map(Number);
  const wochentag = WOCHENTAGE[new Date(Date.UTC(j, m - 1, d)).getUTCDay()];
  return `${wochentag}, ${d}. ${MONATE[m - 1]} ${j}`;
}

/** Die 📅-Zeile, z. B. „Dienstag, 6. Oktober 2026 | 9:00–10:00 Uhr | online | kostenlos“ */
export function terminZeile(t) {
  const teile = [t.datum_text || datumLang(t.datum), t.zeit, t.ort, t.kostenlos ? "kostenlos" : "", t.zusatz,
    t.anmeldeschluss ? `Anmeldeschluss: ${t.anmeldeschluss}` : ""];
  return teile.filter(Boolean).join(" | ");
}
