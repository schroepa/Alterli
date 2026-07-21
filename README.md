# alterli

**Know your future self.**

Ein ehrlicher, freier Altersvorsorge-Analyst für alle Berufsgruppen in Deutschland.
Keine Registrierung, keine Datenspeicherung, keine versteckten Verkaufsabsichten.

→ **[alterli.de](https://alterli.de)** *(coming soon)*

---

## Was ist alterli?

Die meisten Altersvorsorge-Rechner im Netz gehören Versicherungen oder Banken.
alterli gehört niemandem — außer der Community.

Das Ziel: Menschen helfen zu verstehen was ihr Riester-Vertrag wirklich wert ist,
ob das Altersvorsorgedepot 2027 besser für sie ist, und wo ihre Versorgungslücke liegt.
Ehrlich, direkt, ohne Verkaufsabsicht.

## Features

- **Alle Berufsgruppen** — Angestellt, Selbstständig, Beamte, TVöD, Minijob, Versorgungswerk
- **Ehrlicher Moment** — ein einziger, direkt zugeschnittener Satz vor dem Dashboard
- **Drei-Wege-Vergleich** — Riester vs. Altersvorsorgedepot 2027 vs. ETF
- **Was-wäre-wenn Simulator** — Kind, Heirat, Frühpension, Gehaltserhöhung
- **Reform 2027 eingebaut** — Altersvorsorgedepot bereits als Option
- **Zero Data** — alle Berechnungen laufen lokal im Browser

## Tech Stack

- [Astro](https://astro.build) — Static Site Framework
- [React](https://react.dev) — UI als Client Island
- [shadcn/ui](https://ui.shadcn.com) — Komponenten-Bibliothek
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Recharts](https://recharts.org) — Diagramme

## Lokal starten

```bash
git clone https://github.com/digipub/alterli.git
cd alterli
npm install
npm run dev
```

Öffne [http://localhost:4321](http://localhost:4321) (Marketing) oder [http://localhost:4321/app](http://localhost:4321/app) (Analyse).

## Deploy

Das Projekt baut zu statischem HTML/JS und kann auf jeder Plattform deployed werden.

```bash
npm run build   # Output: dist/
```

Empfohlen: [Vercel](https://vercel.com) — Zero Config für Astro.

## Beitragen

Pull Requests sind willkommen. Besonders gesucht:

- Verbesserungen der Berechnungslogik (Steuer, Rente, Rürup)
- Neue Berufsgruppen oder Sonderfälle
- Übersetzungen (EN geplant)
- UX-Feedback und Bug Reports

Bitte lies vor einem größeren Beitrag die [Contributing Guidelines](CONTRIBUTING.md).

## Rechtlicher Hinweis

alterli erstellt vereinfachte Schätzungen ohne Gewähr.
Das Tool ersetzt keine individuelle Beratung durch zugelassene Finanz- oder Steuerberater.
Keine Anlageberatung im Sinne des WpHG.

Stand der Berechnungsgrundlagen: Build-Datum der jeweiligen Deployment-Version.

---

Ein Produkt von [DigiPub](https://digipub.de) · Patrick Schröder · Stuttgart

MIT License
