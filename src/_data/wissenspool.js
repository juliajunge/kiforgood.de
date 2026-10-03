// Liefert den Wissenspool für die Website aus inhalte/wissenspool.md (gepflegt als lesbarer Text).
import { readFileSync } from "node:fs";
import { wissenspoolLesen } from "../../scripts/wissenspool.mjs";

export default function () {
  const { favoriten, bereiche } = wissenspoolLesen(readFileSync(new URL("../../inhalte/wissenspool.md", import.meta.url), "utf8"));
  return { favoriten, bereiche };
}
