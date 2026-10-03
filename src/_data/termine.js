// Liefert die Termine für die Website aus inhalte/termine.md (gepflegt als lesbarer Text).
import { readFileSync } from "node:fs";
import { termineLesen } from "../../scripts/termine.mjs";

export default function () {
  const { dauerangebote, termine } = termineLesen(readFileSync(new URL("../../inhalte/termine.md", import.meta.url), "utf8"));
  return { dauerangebote, termine };
}
