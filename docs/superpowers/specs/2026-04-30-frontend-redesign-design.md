# alterli — Frontend Redesign Design Spec

**Datum:** 2026-04-30  
**Status:** Approved  
**Autor:** Patrick Schröder

---

## Überblick

Vollständiger Umbau des alterli-Frontends auf Basis des shadcn-Presets `b5cjpD6Rs` (Vega-Style, Geist-Font, Lucide-Icons). Ziele: WCAG AAA Accessibility, echtes Light/Dark Mode System, saubere Komponentenarchitektur, keine Emojis.

---

## 1. Fundament

### shadcn Preset

```bash
npx shadcn@latest init --preset b5cjpD6Rs --template astro
```

Liefert: Vega-Style-Komponenten, Geist-Font, Lucide-Icon-Library, Tailwind-CSS-Variablen-System. Die generierten Dateien in `src/components/ui/` werden nicht manuell editiert.

### Primärfarbe (AAA-adjustiert)

| Modus | Hex | Kontrastverhältnis | WCAG |
|-------|-----|-------------------|------|
| Light auf `#ffffff` | `#0d6e64` | 7.4:1 | ✓ AAA |
| Dark auf `#0a0a0a` | `#2dd4bf` | 7.3:1 | ✓ AAA |

Nur `--primary` und `--primary-foreground` werden gegenüber dem Preset überschrieben. Alle anderen Tokens bleiben.

### CSS-Overrides in `globals.css`

```css
/* nach dem Preset-Import */
:root {
  --primary: oklch(36% 0.12 185);        /* #0d6e64 */
  --primary-foreground: oklch(99% 0 0);  /* #ffffff */
}
.dark {
  --primary: oklch(80% 0.15 185);        /* #2dd4bf */
  --primary-foreground: oklch(8% 0 0);   /* #0a0a0a */
}
```

---

## 2. Dark Mode

### Verhalten

- **Standard:** Hell (Light Mode)
- **Automatisch:** Folgt `prefers-color-scheme: dark` (z.B. nachts per OS-Einstellung)
- **Manuell:** Toggle-Button im Nav — speichert Präferenz in `localStorage("theme")`
- **Priorität:** localStorage > prefers-color-scheme

### FOUC-Prävention

Inline-`<script>` im `<head>` vor dem ersten Paint — liest localStorage, setzt `class="dark"` auf `<html>` bevor CSS geladen wird:

```html
<script>
  (function() {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

### Toggle-Button

- Lucide `Moon`-Icon im Light Mode (klicken → Dark)
- Lucide `Sun`-Icon im Dark Mode (klicken → Light)
- `aria-label` wechselt dynamisch: "Dunkles Design aktivieren" / "Helles Design aktivieren"
- shadcn `Button variant="ghost" size="icon"`

---

## 3. Accessibility (WCAG AAA)

### Infrastruktur

| Maßnahme | Umsetzung |
|----------|-----------|
| Skip Link | `<a href="#main-content">Zum Hauptinhalt springen</a>` — erstes fokussierbares Element, sichtbar bei Fokus |
| Focus-Indikatoren | 3px solid, 3:1 Kontrast — überschreibt shadcn-Standard auf AAA-Niveau |
| Landmarks | `<header>`, `<main id="main-content">`, `<nav aria-label="Hauptnavigation">`, `<footer>` |
| Überschriften | h1 (Hero) → h2 (Sections) → h3 (Cards) — keine Übersprünge |
| Emojis | Verboten. Ausschließlich Lucide SVG Icons mit `aria-hidden="true"` |
| Farbkontrast | Normaler Text ≥7:1 (AAA 1.4.6), Großtext + UI-Komponenten ≥4.5:1 (AA 1.4.3) |
| Farbe als Info | Nie alleiniger Informationsträger — immer Label oder Icon zusätzlich |

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Formulare (StepEingabe)

- Jedes Eingabefeld hat ein explizites `<label htmlFor="...">` — kein `placeholder` als einzige Beschriftung
- Pflichtfelder: `aria-required="true"`
- Slider: `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (z.B. "42 Jahre")
- Switch: `role="switch"`, `aria-checked`
- Fehlermeldungen: `aria-describedby` zeigt auf Fehler-Element

### Charts (Recharts)

```tsx
<figure role="img" aria-labelledby={`chart-title-${id}`}>
  <figcaption id={`chart-title-${id}`} className="sr-only">
    {/* beschreibender Titel, z.B. "Kapitalentwicklung: Riester 187.000 € vs ETF 312.000 €" */}
  </figcaption>
  <ResponsiveContainer>...</ResponsiveContainer>
</figure>
```

Tooltip-Inhalte der Charts sind per Tastatur (Tab/Enter) erreichbar.

---

## 4. Marketing-Seite

Alle Astro-Komponenten werden neu gebaut — keine Inkrementalmigration.

### Nav (`Nav.astro`)

- shadcn-gestylter Header: Logo links, Links + Toggle + CTA rechts
- `position: sticky top-0` mit `backdrop-blur`
- Skip-Link als erstes Kind von `<body>`
- Dark-Mode-Toggle (Moon/Sun Lucide)
- Kein Hamburger-Menu im MVP (Links ab md sichtbar)

### Hero (`Hero.astro`)

- Eyebrow-Badge (Pill-Shape mit Teal-Dot)
- `h1`: "Know your **future self.**" — `em`-Element für Primary-Teal
- Subline, zwei Buttons (Primary + Outline), Trust-Badges als `role="list"`
- Subtiler Radial-Glow-Hintergrund (deaktiviert bei `prefers-reduced-motion`)
- Kein Scroll-Indikator mit Animation

### Features (`Features.astro`)

- 3×2 Grid mit `gap: 1px` auf `border`-Background (CSS-Grid-Trick für dünne Linien)
- Jede Karte: `<article>` mit Lucide Icon + Badge + h3 + Text
- `role="list"` auf Grid, `role="listitem"` auf Karten

### Groups (`Groups.astro`)

- 2×2 Grid, shadcn `Card`-Komponente
- Hover: `border-color` wechselt zu Primary + `box-shadow: 0 0 0 3px --primary-dim`
- Teal-Accent-Linie (2px) unten in jeder Karte
- Lucide Icons statt Initialen

### AppSection (`AppSection.astro`)

- Unveränderte Struktur: Section-Header + Slot für React-Island
- `id="app"` für Anker-Link aus Nav und Hero

### Footer (`Footer.astro`)

- 3-spaltig: Logo+Meta / Disclaimer / Checks
- Lucide Check-Icons statt Sonderzeichen
- Rechtlicher Hinweis + Copyright

---

## 5. App-Architektur

### Dateistruktur

```
src/
├── components/
│   ├── app/
│   │   ├── AlterliApp.tsx          State-Orchestrator (Step-Routing, kein UI)
│   │   ├── StepBerufsgruppe.tsx    Schritt 1: Berufsgruppe + Untergruppe
│   │   ├── StepEingabe.tsx         Schritt 2: Eingaben (Alter, Gehalt, Optionen)
│   │   ├── StepSzenario.tsx        Schritt 3: Was-wäre-wenn Simulator
│   │   └── StepErgebnis.tsx        Schritt 4: Ehrlicher Moment + Charts
│   └── ui/                         shadcn (vom Preset, nicht editieren)
├── lib/
│   ├── calc.ts                     Reine Berechnungslogik (extrahiert, kein JSX)
│   ├── types.ts                    CalcParams, CalcResult, Gruppe-Typen
│   └── utils.ts                    cn() — bleibt unverändert
└── styles/
    └── globals.css                 Preset-Import + AAA-Token-Overrides
```

### AlterliApp.tsx (Orchestrator)

Enthält ausschließlich:
- `useState` für `params: CalcParams`, `step: 1|2|3|4`
- `useMemo` für `result = calc(params)`
- Conditional Rendering der Step-Komponenten
- Kein eigenes Markup außer dem Root-Container

### StepBerufsgruppe

- 4 Hauptgruppen als shadcn `Card` mit Lucide Icon, Label, Subtext
- Klick → wählt Hauptgruppe, zeigt Untergruppen
- Bei Versorgungswerk: `Alert`-Komponente mit Soft-Exit-Hinweis
- Weiter-Button erst aktiv wenn Untergruppe gewählt

### StepEingabe

- shadcn `Input` + `Label` für alle Zahlenfelder
- shadcn `Slider` für Alter (18–65) und Bruttogehalt
- shadcn `Switch` für: Riester, verheiratet, Inflation
- shadcn `Select` für Geschlecht
- `Separator` zwischen Gruppen (Persönliches / Altersvorsorge / Szenarien)
- `Tooltip` auf Fachbegriffen (Rürup, VBL, Zulagenbetrag)

### StepSzenario

- Szenarien als Switch + konditionaler Slider/Input
- Kind in N Jahren: Switch → Slider (1–10)
- Frühpension: Switch → Slider (55–66)
- Inflation berücksichtigen: Switch
- Zurück- und Weiter-Button

### StepErgebnis

- "Ehrlicher Moment": hervorgehobene Textbox, 1 Satz
- KPI-Cards: Rentenerwartung, Versorgungslücke, Gesamtkapital
- shadcn `Tabs` für Chart-Ansichten: Kapital / Vergleich / Radar
- Charts in `<figure role="img">` mit `<figcaption className="sr-only">`
- Neue Analyse-Button → reset zu Schritt 1

### lib/calc.ts

- Exportiert: `getGruppe(params)`, `calc(params) → CalcResult`
- Berechnungslogik 1:1 aus AlterliApp.tsx übernommen — keine inhaltlichen Änderungen
- Kein React-Import, kein JSX
- Voll typisiert über `types.ts`

### lib/types.ts

```ts
export interface CalcParams {
  hauptgruppe: Hauptgruppe;
  untergruppe: string;
  alter: number;
  bruttoMonat: number;
  gewerbeMonat: number;
  geschlecht: 'w' | 'm';
  hatRiester: boolean;
  jahreRiester: number;
  kinder: number;
  verheiratet: boolean;
  partnerRiester: boolean;
  fruehRente: number | null;
  inflation: boolean;
}

export type Hauptgruppe = 'angestellt' | 'oeffentlich' | 'selbst' | 'freiberuf';

export interface CalcResult {
  renteGRV: number;
  riesterRente: number;
  rurupRente: number;
  pensionRente: number;
  vblRente: number;
  versorgungsluecke: number;
  proj: ProjectionPoint[];
  // Vollständige Felder werden 1:1 aus dem bestehenden calc()-Return-Objekt übernommen
}

export interface ProjectionPoint {
  jahr: number;
  riester: number;
  depot: number;
  etf: number;
}
```

---

## 6. Nicht im Scope

- Änderungen an der Berechnungslogik (Formeln, Grenzwerte, Steuersätze)
- Neue Features oder Berufsgruppen
- Mehrsprachigkeit (EN geplant, aber nicht Teil dieses Redesigns)
- Tests (Unit-Tests für calc.ts sind möglich, aber separates Ticket)
- Impressum / Datenschutz-Seiten

---

## 7. Implementierungsreihenfolge

1. Preset installieren + AAA-Token-Overrides in `globals.css`
2. Dark-Mode-Script in `Base.astro`, `html`-Class auf default `""` (kein hardcoded `dark`)
3. `lib/types.ts` + `lib/calc.ts` extrahieren
4. `Nav.astro` neu bauen (inkl. Skip-Link, Toggle)
5. `Hero.astro`, `Features.astro`, `Groups.astro`, `Footer.astro` neu bauen
6. `StepBerufsgruppe.tsx` → `StepEingabe.tsx` → `StepSzenario.tsx` → `StepErgebnis.tsx`
7. `AlterliApp.tsx` auf Orchestrator reduzieren + Import in `index.astro` auf `../components/app/AlterliApp` aktualisieren
8. Accessibility-Audit: Kontraste prüfen, Tab-Reihenfolge, Screenreader
