// Liest alle Seiten aus inhalte/seiten/*.md (gepflegt als lesbarer Text) und erzeugt daraus HTML.
import { readFileSync, readdirSync } from "node:fs";
import { seiteLesen, abschnitteLesen } from "../../scripts/seiten.mjs";

const ORDNER = new URL("../../inhalte/seiten/", import.meta.url);

// Seiten mit festem Layout: Texte werden nach „## Abschnitten“ eingesetzt
const ABSCHNITTSEITEN = ["startseite", "workshops"];
// Besondere Knopf-Farben je Seite (wie im WordPress-Original)
const OPTIONEN = {
  orientierungshilfe: { knopfKlasse: "has-accent-3-background-color has-background" },
};

export default function () {
  const seiten = {};
  for (const datei of readdirSync(ORDNER).filter((d) => d.endsWith(".md"))) {
    const name = datei.slice(0, -3);
    const text = readFileSync(new URL(datei, ORDNER), "utf8");
    const seite = seiteLesen(text, OPTIONEN[name]);
    seiten[name] = ABSCHNITTSEITEN.includes(name) ? { ...seite, abschnitte: abschnitteLesen(text, OPTIONEN[name]) } : seite;
  }
  return seiten;
}
