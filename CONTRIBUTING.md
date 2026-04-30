# Contributing to alterli

Danke dass du beitragen möchtest. alterli lebt von der Community.

## Wo du helfen kannst

### Berechnungslogik
Die Kernlogik liegt in `src/components/AlterliApp.tsx` in der Funktion `calc()`.
Verbesserungen bei Steuersätzen, Rentenpunkten, Rürup-Berechnungen oder
neue Sonderfälle sind sehr willkommen — bitte immer mit Quellenangabe (Gesetzestext, BMAS, DRV).

### Neue Berufsgruppen
Neue Untergruppen können in `UNTERGRUPPEN` ergänzt werden.
Versorgungswerke sind bewusst mit Soft Exit implementiert — Vollberechnungen
sind zu komplex und würden falsche Sicherheit erzeugen.

### UI / UX
Das Design folgt einem konsistenten Dark-Theme mit Alterli Brand Tokens.
Neue shadcn-Komponenten gehören nach `src/components/ui/`.

### Bugs & Issues
Bitte öffne ein GitHub Issue mit:
- Berufsgruppe und Eingabewerten
- Erwartetem vs. tatsächlichem Verhalten
- Browser und Gerätetyp

## Entwicklung

```bash
git clone https://github.com/digipub/alterli.git
cd alterli
npm install
npm run dev
```

## Pull Request Prozess

1. Fork des Repos erstellen
2. Feature Branch: `git checkout -b feature/mein-feature`
3. Änderungen committen: `git commit -m 'feat: kurze Beschreibung'`
4. Push: `git push origin feature/mein-feature`
5. Pull Request öffnen

## Commit-Konvention

```
feat:     Neues Feature
fix:      Bugfix
calc:     Änderung an Berechnungslogik (immer mit Quelle)
style:    UI/CSS ohne Logikänderung
docs:     Dokumentation
refactor: Code-Umstrukturierung ohne Verhaltensänderung
```

## Rechtlicher Hinweis

Mit deinem Beitrag stimmst du zu, dass dein Code unter der MIT License
des Projekts veröffentlicht wird.

Berechnungsänderungen müssen mit einer verlässlichen Quelle belegt sein.
alterli übernimmt keine Haftung für Berechnungsfehler.
