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
| Workshops: Terminliste | `src/_data/termine.yaml` | Liste, siehe unten |
| Workshops: übriger Text | `src/seiten/workshops.njk` | HTML |
| Wissenspool: Favoriten und Links | `src/_data/wissenspool.yaml` | Liste, siehe unten |
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

## 3. Termine: die Felder

```yaml
termine:
  - anbieter: Haus des Stiftens          # Pflicht
    titel: Prompting mit Plan            # Pflicht
    url: https://www.hausdesstiftens.org/…   # Pflicht, Link zur Veranstaltung
    mit: Julia                           # Trainer*innen, ohne „mit“
    datum: 2026-10-07                    # Pflicht: JJJJ-MM-TT
    zeit: 9:00–13:00 Uhr
    ort: online
    kostenlos: true                      # nur wenn kostenlos; Preise nie eintragen
    anmeldeschluss: 12. November
```

Für mehrteilige Kurse gibt es zusätzlich:

```yaml
    bis: 2026-11-10                      # letzter Termin: bis dahin bleibt der Eintrag sichtbar
    datum_text: 20. Oktober bis 10. November 2026   # ersetzt „Dienstag, 20. Oktober 2026“
```

Daraus erzeugt die Seite automatisch Monatsüberschriften, die Sortierung und die Zeile
„📅 Mittwoch, 7. Oktober 2026 | 9:00–13:00 Uhr | online | kostenlos“.

## 4. Wissenspool: die Felder

```yaml
bereiche:
  - titel: Prompting                     # Überschrift des Bereichs
    bild: /wp-content/uploads/…          # optional, Bild unter dem Bereich
    eintraege:
      - icon: 📋
        titel: Fairlinked PromptGuide 2.0     # Linktext
        url: https://www.fairlinked.org/…
        text: Deutschsprachiger Prompt-Leitfaden, Stand August 2025.
```

- Bereiche mit Unterüberschriften nutzen `gruppen:` (jeweils mit `titel` und `eintraege`).
- Weitere Links im Text schreibt man so: `[Linktext](https://…)`.
- Farben und Ausrichtung der Bereiche wechseln automatisch ab.

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
