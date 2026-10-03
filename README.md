# KI for Good – Website

Quelle der Website [kiforgood.de](https://kiforgood.de): Trainings & Tools für KI in NGOs.

Die Seite ist eine **statische Website**. Es läuft kein WordPress, keine Datenbank und kein Login auf dem
Server, sondern nur fertige HTML-Dateien. Das macht sie schnell, sicher und wartungsarm.

## So funktioniert es

```
Inhalte (Texte, Termine, Links)  →  GitHub  →  automatische Prüfung  →  Veröffentlichung
        ↑                                ↑
  Menschen (Web-Editor)        KI-Agent: macht nur Vorschläge,
                               die eine von uns annimmt
```

- **Termine** stehen in einer Liste (`src/_data/termine.yaml`). Vergangene Termine verschwinden jede Nacht
  automatisch von der Seite.
- **Wissenspool-Links** stehen ebenfalls in einer Liste (`src/_data/wissenspool.yaml`).
- **Alle anderen Seiten** (Startseite, Trainer\*innen, Leitlinien, Impressum …) sind 1:1 aus WordPress
  übernommen.
- Vor jeder Veröffentlichung prüft ein Skript Daten und Seiten. **Bei einem Fehler wird nichts
  veröffentlicht, und die bisherige Seite bleibt online.**
- Jede Änderung wird gespeichert und kann mit einem Klick rückgängig gemacht werden.

## Automatische Abläufe

| Wann | Was | Ergebnis |
|---|---|---|
| bei jeder Änderung | Daten prüfen, Seite bauen, veröffentlichen | Seite ist aktuell |
| täglich ca. 5 Uhr | Seite neu bauen | vergangene Termine verschwinden |
| montags ca. 7 Uhr | KI recherchiert Termine + liest das Postfach | **Vorschlag** zum Annehmen |
| am 1. des Monats | Linkprüfung, KI sucht Ersatz für kaputte Links | **Vorschlag** zum Annehmen |

Die KI kann dabei **nichts selbst veröffentlichen**. Sie darf nur die Termin- bzw. Linkliste ändern,
keine kommenden Termine löschen, und jeder Vorschlag wartet auf eure Freigabe.

## Weiterlesen

- **[ANLEITUNG.md](ANLEITUNG.md)**: Pflege von Hand, Vorschläge annehmen, Einrichtung, Notfall
- [CLAUDE.md](CLAUDE.md): Regeln für KI-Agenten
