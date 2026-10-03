---
name: links-pflegen
description: Wertet die monatliche Linkprüfung aus und schlägt für kaputte oder veraltete Links im Wissenspool (src/_data/wissenspool.yaml) Ersatz vor. Nutzen bei der monatlichen Linkpflege oder wenn kaputte Links auf kiforgood.de gemeldet werden.
---

# Links im Wissenspool pflegen

## Ausgangslage

`eingang/linkpruefung.md` enthält das Ergebnis des Linkcheckers für die ganze Website.
Du bearbeitest **nur** `src/_data/wissenspool.yaml` und schreibst einen Bericht nach `eingang/bericht.md`.

## Vorgehen je kaputtem Link

1. Prüfe den Link selbst (WebFetch). Manche Seiten blockieren nur Linkchecker – funktioniert die
   Seite, lass den Link unverändert und vermerke „Fehlalarm“.
2. Ist die Seite umgezogen, suche die neue Adresse desselben Inhalts (gleicher Anbieter, gleicher
   Titel). Ersetze nur die `url` (bei Favoriten ggf. auch `bild_url`). Titel und Text bleiben, außer
   der Titel ist offensichtlich veraltet – dann nur vorschlagen, nicht ändern.
3. Gibt es keinen gleichwertigen Ersatz, ändere nichts und führe den Eintrag im Bericht unter
   „Entfernen? – bitte entscheiden“ auf. Du löschst keine Einträge.

Kaputte Links auf anderen Seiten (Startseite, Trainer*innen, Leitlinien, Impressum …) änderst du nicht,
sondern listest sie im Bericht unter „Bitte von Hand korrigieren“ mit Seite, Linktext und Vorschlag.

Prüfe am Ende mit `npm run pruefen`, dass die Datei gültig ist.

## Bericht (eingang/bericht.md)

```markdown
## Ersetzte Links
- Bereich › Titel: alte URL → neue URL (Begründung)

## Entfernen? – bitte entscheiden
## Bitte von Hand korrigieren
## Fehlalarme
```
