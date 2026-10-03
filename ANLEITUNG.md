# Anleitung: So pflegen wir die Website

## 1. Inhalte von Hand ändern

### Im Web-Editor (empfohlen)

1. [app.pagescms.org](https://app.pagescms.org) öffnen und mit GitHub anmelden.
2. Das Projekt **kiforgood.de** wählen.
3. Links im Menü: **Termine**, **Wissenspool** oder **Seiten**.
4. Ändern, dann **Speichern**. Nach etwa einer Minute ist die Änderung online.

Kolleginnen ohne GitHub-Konto können in Pages CMS per E-Mail eingeladen werden
(Einstellungen → Collaborators).

### Direkt auf GitHub

Jede Datei lässt sich auf github.com mit dem Stift-Symbol bearbeiten. Unten dann
„Commit changes“ wählen.

## 2. Was steht wo?

| Seite | Datei | Hinweis |
|---|---|---|
| Workshops: Terminliste | `inhalte/termine.md` | lesbarer Text, siehe unten |
| Workshops: übriger Text | `src/seiten/workshops.njk` | HTML |
| Wissenspool: Favoriten und Links | `inhalte/wissenspool.md` | lesbarer Text, siehe unten |
| Startseite | `src/seiten/index.html` | HTML |
| Trainer\*innen | `src/seiten/kontakt.html` | HTML |
| Leitlinien | `src/seiten/orientierungshilfe.html` | HTML |
| Impressum, Datenschutz, Newsletter | `src/seiten/….html` | HTML |
| Aktionsseiten (Barcamp, KI-Teambesuch) | `src/seiten/….html` | HTML |
| Kopf und Menü / Fußzeile | `src/_includes/partials/header.html`, `footer.html` | HTML |
| Bilder | `src/wp-content/uploads/…` | gleiche Adressen wie bei WordPress |

**HTML-Seiten:** Die Texte stehen zwischen den Zeichen `<p …>` und `</p>`. Den Text dazwischen könnt ihr
gefahrlos ändern. Die Zeichen in spitzen Klammern bitte stehen lassen. Geht doch etwas schief, meldet die
Prüfung den Fehler, und die alte Seite bleibt online.

## 3. Termine eintragen

Die Termine stehen in `inhalte/termine.md`, und zwar so, wie sie auf der Website erscheinen.
Am einfachsten kopiert ihr einen vorhandenen Termin und passt ihn an:

```
## Oktober 2026

Haus des Stiftens
[Prompting mit Plan – KI clever nutzen im NPO-Alltag](https://www.hausdesstiftens.org/…)
mit Julia
📅 Mittwoch, 7. Oktober 2026 | 9:00–13:00 Uhr | online | kostenlos

CorrelAid
[KI aber ohne den Hype](https://correlaid.org/…)
📅 Mittwoch, 7. Oktober 2026 | 13:00–14:00 Uhr | online
```

- **1. Zeile:** Anbieter. **2. Zeile:** Titel in eckigen Klammern, direkt dahinter der Link in runden
  Klammern. **3. Zeile:** „mit …“ (kann fehlen). **Letzte Zeile:** 📅 mit Datum und Jahreszahl.
- **Zwischen zwei Terminen eine Leerzeile.**
- Die 📅-Zeile erscheint wörtlich auf der Website. Nach dem Datum folgt mit `|` getrennt, was zutrifft:
  Uhrzeit, Ort, `kostenlos`, `Anmeldeschluss: 12. November`. **Keine Preise.**
- Mehrteilige Kurse: `📅 20. Oktober bis 10. November 2026 | …` oder
  `📅 25. November, 2. und 9. Dezember 2026 | …`. Sie bleiben bis zum letzten Tag sichtbar.
- Die Monatsüberschriften dienen nur der Übersicht. Die Website sortiert selbst.
- Vergangene Termine verschwinden automatisch. In der Datei dürfen sie stehen bleiben oder gelöscht werden.
- Die Prüfung meldet Tippfehler mit Zeilennummer, z. B. „Zeile 36: Der 6. Oktober 2026 ist ein Dienstag,
  nicht Montag.“ Dann wird nichts veröffentlicht, bis die Zeile korrigiert ist.

Die dauerhaften Angebote (z. B. der Selbstlernkurs) stehen in derselben Datei unter
`## Dauerhafte Angebote`, jeweils mit einer `### Überschrift`.

## 4. Wissenspool pflegen

Der Wissenspool steht in `inhalte/wissenspool.md`, ebenfalls so, wie er auf der Website erscheint:

```
## Prompting

📋 [Fairlinked PromptGuide 2.0](https://www.fairlinked.org/kostenloser-prompt-guide/)
Deutschsprachiger Prompt-Leitfaden, Stand August 2025.

✉️ [E-Mail-Kurs von Julia Junge](https://juliajunge.de/prompting)
Sieben Mails als Einstieg in generative KI und Prompting für NGOs.
```

- **Ein Eintrag:** 1. Zeile Symbol und Link (erscheint fett), 2. Zeile Beschreibung. Dazwischen eine Leerzeile.
- **Bereiche:** Jede Überschrift `## …` ist ein farbiger Abschnitt. Die Farben wechseln automatisch.
  Unterüberschriften: `### …` (größer) oder `#### …` (kleiner).
- **Weitere Links** in einer Zeile: einfach `[Linktext](https://…)` dazuschreiben.

### Bilder

- **Bild unter einem Bereich:** eine Bildzeile direkt unter der Bereichsüberschrift, mit Leerzeilen davor und danach:
  `![Kurze Bildbeschreibung](/wp-content/uploads/2024/04/drache.webp)`
- **Favoriten-Kacheln** (oben auf der Seite) bestehen aus einer Bildzeile und dem Knopf darunter:
  ```
  ![Bildbeschreibung](/wp-content/uploads/2026/08/image.png)
  [🎓 KI vereint: Lernpfade & Webinare](https://www.hausdesstiftens.org/…)
  ```
  Das Bild führt zum selben Ziel wie der Knopf. Bei hochformatigen Bildern lässt sich der Ausschnitt
  mit `"oben"`, `"mitte"` oder `"unten"` wählen: `![…](/wp-content/uploads/…png "unten")`.
- **Neues Bild:** Im Web-Editor links auf **Media**, Bild hochladen, dann den Pfad in die Bildzeile
  schreiben (beginnt mit `/wp-content/uploads/`). Ist der Pfad falsch, meldet die Prüfung
  „Bild nicht gefunden“, und nichts geht online.
- Die Bildbeschreibung in `![…]` lesen Screenreader vor. Ein paar Worte genügen.

## 5. KI-Vorschläge annehmen

Montags (Termine) und am Monatsanfang (Links) kommt eine Mail von GitHub:
„Termine-Update 2026-KW41 (KI-Vorschlag)“.

1. Mail öffnen → Link zum Vorschlag (Pull Request).
2. Oben steht der Bericht der KI: neue Termine, Rückfragen, nicht aufgenommene Hinweise.
3. Reiter **Files changed**: Grün ist neu, Rot fällt weg.
4. Passt alles → **Merge pull request** → **Confirm merge**. Nach etwa einer Minute ist es online.
5. Einzelne Einträge passen nicht → in **Files changed** über „…“ → **Edit file** die Zeilen löschen,
   dann mergen. Oder den Vorschlag mit **Close pull request** komplett verwerfen.

## 6. Einreichungen per Mail

Akteur\*innen schicken Veranstaltungshinweise oder Linktipps an **aktualisierung@kiforgood.de**.
Beim nächsten Montags-Update liest die KI das Postfach. Termine kommen in den Vorschlag, Linktipps
in den Bericht. Berücksichtigt werden nur Absender\*innen von der Freigabeliste (`ERLAUBTE_ABSENDER`,
siehe unten).

## 7. Notfall: etwas ist schiefgegangen

- **Eine Änderung zurücknehmen:** Auf GitHub unter **Commits** die Änderung öffnen und **Revert** wählen.
  Oder bei einem angenommenen Vorschlag im Pull Request auf **Revert** klicken und den neuen Vorschlag mergen.
- **Fehlerhafte Daten werden nie veröffentlicht:** Unter **Actions** steht bei einem roten ✗ in
  verständlichem Deutsch, was fehlt oder falsch ist (z. B. „„datum“ muss so aussehen: 2026-10-06“).

## 8. Einrichtung (einmalig)

| Was | Wo | Wert |
|---|---|---|
| Veröffentlichung einschalten | Settings → Pages → Source | **GitHub Actions** |
| KI-Zugang | Settings → Secrets and variables → Actions → Secrets | `ANTHROPIC_API_KEY` |
| Postfach (IMAP) | Secrets | `IMAP_HOST` (z. B. `mail.jpberlin.de`), `IMAP_BENUTZER`, `IMAP_PASSWORT` |
| Erlaubte Absender\*innen | Secrets | `ERLAUBTE_ABSENDER`, z. B. `mail@juliajunge.de, @fairlinked.org` |
| Postfach-Abruf einschalten | Variables | `POSTFACH_AKTIV` = `true` |
| KI-Vorschläge zulassen | Settings → Actions → General → Workflow permissions | „Allow GitHub Actions to create and approve pull requests“ anhaken |
| Hauptzweig schützen | Settings → Branches → Add rule für `main` | Löschen und Force-Push verbieten |

## 9. Technik (für Neugierige)

- Gebaut mit [Eleventy](https://www.11ty.dev). Lokal: `npm install`, dann `npm start` (Vorschau unter
  http://localhost:8080) oder `npm run build`.
- `npm run pruefen` prüft nur die Datenlisten.
- `HEUTE=2026-12-01 npm start` zeigt die Seite so, wie sie an einem anderen Tag aussähe.
- Die Stile stammen 1:1 aus dem WordPress-Theme „Twenty Twenty-Four“ (`src/assets/css/seiten/`).
  Eigene Anpassungen gehören in `src/assets/css/eigene.css`.
