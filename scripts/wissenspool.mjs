// Liest inhalte/wissenspool.md – wird von der Website, der Datenprüfung und der Schutzregel verwendet.
//
// Aufbau der Datei:
//   ## Unsere Favoriten     → Kacheln: je Block eine Bildzeile ![…](…) und eine Linkzeile […](…)
//   ## <Bereich>            → optional zuerst eine Bildzeile, dann Einträge
//   ### / #### <Gruppe>     → Unterüberschrift innerhalb eines Bereichs
//   Eintrag                 → 1. Zeile fett (Symbol + Link), weitere Zeilen = Beschreibung.
//                             Ein einzeiliger Eintrag erscheint als normaler Text.

const BILD = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;
const LINK = /^\[(.+)\]\((\S+)\)$/;
const POSITIONEN = { oben: "50% 0%", unten: "50% 100%", mitte: "50% 50%" };

/** Alle Links [Text](url) einer Zeile */
export function linksIn(zeile) {
  return [...zeile.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({ text: m[1], url: m[2] }));
}

export function wissenspoolLesen(text) {
  const fehler = [], hinweise = [];
  const favoriten = [], bereiche = [];

  text = text.replace(/<!--[\s\S]*?-->/g, (k) => k.replace(/[^\n]/g, ""));
  const zeilen = text.split(/\r?\n/);
  let i = 0;
  if (zeilen[0]?.trim() === "---") {
    const ende = zeilen.findIndex((z, n) => n > 0 && z.trim() === "---");
    if (ende > 0) i = ende + 1;
  }

  const bloecke = [];
  for (; i < zeilen.length; i++) {
    const z = zeilen[i].trim();
    if (!z) continue;
    if (/^#{1,4}\s/.test(z)) { bloecke.push({ ueberschrift: z, nr: i + 1 }); continue; }
    if (bloecke.at(-1)?.zeilen && zeilen[i - 1]?.trim()) bloecke.at(-1).zeilen.push(z);
    else bloecke.push({ zeilen: [z], nr: i + 1 });
  }

  let bereich = null, gruppe = null, favoritenAbschnitt = false;
  for (const b of bloecke) {
    const wo = `Zeile ${b.nr}`;
    if (b.ueberschrift) {
      const [, ebene, titel] = b.ueberschrift.match(/^(#+)\s+(.*)$/);
      if (ebene === "#") continue;
      if (ebene === "##") {
        favoritenAbschnitt = /^unsere favoriten$/i.test(titel);
        bereich = favoritenAbschnitt ? null : { titel, nr: b.nr, eintraege: [], gruppen: [] };
        if (bereich) bereiche.push(bereich);
        gruppe = null;
      } else if (!bereich) {
        fehler.push(`${wo}: Die Unterüberschrift „${titel}“ steht vor dem ersten Bereich (## …).`);
      } else {
        gruppe = { titel, ebene: ebene.length, eintraege: [] };
        bereich.gruppen.push(gruppe);
      }
      continue;
    }

    // ---- Favoriten: Bild + Knopf ----
    if (favoritenAbschnitt) {
      const [bildZeile, linkZeile, ...rest] = b.zeilen;
      const bild = bildZeile.match(BILD), link = linkZeile?.match(LINK);
      if (!bild || !link || rest.length) {
        fehler.push(`${wo}: Eine Favoriten-Kachel besteht aus genau zwei Zeilen: ![Bildbeschreibung](/wp-content/uploads/…) und darunter [Text auf dem Knopf](https://…)`);
        continue;
      }
      const f = { bild: bild[2], bild_alt: bild[1], text: link[1], url: link[2], nr: b.nr };
      if (bild[3]) {
        if (POSITIONEN[bild[3]]) f.bild_position = POSITIONEN[bild[3]];
        else fehler.push(`${wo}: Bildausschnitt „${bild[3]}“ unbekannt – erlaubt sind „oben“, „mitte“, „unten“.`);
      }
      favoriten.push(f);
      continue;
    }

    if (!bereich) {
      fehler.push(`${wo}: Dieser Text steht vor dem ersten Bereich. Bitte zuerst eine Überschrift „## …“ setzen.`);
      continue;
    }

    // ---- Bereichsbild: ein Block, der nur aus einer Bildzeile besteht ----
    const bild = b.zeilen.length === 1 && b.zeilen[0].match(BILD);
    if (bild) {
      if (bereich.bild) fehler.push(`${wo}: Der Bereich „${bereich.titel}“ hat schon ein Bild.`);
      else { bereich.bild = bild[2]; bereich.bild_alt = bild[1]; }
      continue;
    }
    if (b.zeilen.some((z) => z.startsWith("!["))) {
      fehler.push(`${wo}: Ein Bild muss allein in einem Absatz stehen (mit Leerzeilen davor und danach).`);
      continue;
    }

    // ---- Eintrag ----
    const [kopf, ...beschreibung] = b.zeilen;
    const e = { kopf, nr: b.nr };
    if (beschreibung.length) e.text = beschreibung;
    if (beschreibung.length && !linksIn(kopf).length)
      hinweise.push(`${wo}: Die erste Zeile („${kopf.slice(0, 40)}…“) enthält keinen Link.`);
    (gruppe || bereich).eintraege.push(e);
  }

  for (const b of bereiche)
    if (!b.eintraege.length && !b.gruppen.some((g) => g.eintraege.length))
      fehler.push(`Zeile ${b.nr}: Der Bereich „${b.titel}“ hat keine Einträge.`);
  return { favoriten, bereiche, fehler, hinweise };
}

/** Alle Einträge eines gelesenen Wissenspools (für Zählungen) */
export function alleEintraege(pool) {
  return pool.bereiche.flatMap((b) => [...b.eintraege, ...b.gruppen.flatMap((g) => g.eintraege)]);
}
