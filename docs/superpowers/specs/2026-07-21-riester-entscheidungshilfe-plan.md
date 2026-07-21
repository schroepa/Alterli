# alterli — Riester-Entscheidungshilfe & Oberflächen-Ausbau

**Datum:** 2026-07-21  
**Status:** Approved — Phase 1–4 umgesetzt  
**Kontext:** Erweiterung des bestehenden Analysten (Wizard → Ehrlicher Moment → Ergebnis)

### Abgestimmte Defaults

1. Kündigung: grobe Euro-Warnzahl (Phase 2)  
2. Entscheidungsmodul: Abschnitt auf der Ergebnisseite  
3. Vertragsguthaben: optional mit Fallback auf Schätzung  
4. Desktop: zuerst Layout in `#app`, Route `/app` später  
5. Label: „Beitragsfrei stellen (stilllegen)“ mit Tooltip

### Umsetzungsstand

| Phase | Status |
|-------|--------|
| 1 — Schichtenmodell / Copy | ✅ |
| 2 — Entscheidungshilfe A–D | ✅ |
| 3 — Responsive + shadcn | ✅ (Wizard-Sidebar, Ergebnis-Grid, Mobile-Nav, Button/ToggleGroup) |
| 4 — Was-wäre-wenn & P1 | ✅ (Simulator, Sparrate, Timeline 2027, Glossar-Tooltips, Geschlecht-UI) |

---

## Ausgangslage

alterli beantwortet heute vor allem:

> *Reicht meine Vorsorge (inkl. Riester) für mein Wunschziel — und wie schneidet Riester vs. Depot 2027 vs. ETF ab?*

Was fehlt bzw. missverständlich ist:

1. **Vertragsentscheidung** — Was soll ich mit dem bestehenden Riester *tun*? (weiterführen, umwandeln/wechseln, beitragsfrei stellen, kündigen)
2. **Interpretation der Gesamtrente** — Nutzer:innen lesen das Ergebnis oft so, als wäre die angezeigte Summe *alles*, was im Alter zum Leben bleibt. Tatsächlich ist `gesamtRente = gesetzliche Rente (bzw. Pension) + Riester (+ ggf. VBL/Mietersparnis)`.
3. **Oberfläche** — Wizard ist mobil-first und schmal (`max-w-lg`); Desktop/Tablet nutzen den Platz schlecht. Mehrere Native-Elemente (Gruppen-Tiles, Stepper, Chips, Nav-Toggle) sind noch nicht shadcn.
4. **Produktversprechen** — README bewirbt u. a. „Was-wäre-wenn“, das noch nicht verdrahtet ist.

---

## Produktziel (erweitert)

alterli soll Riester-Inhaber:innen drei klare Antworten geben:

| # | Frage | Heute | Ziel |
|---|--------|-------|------|
| A | Was habe ich im Alter — und woraus setzt sich das zusammen? | Gesamtrente + GRV-KPI, aber wenig visuelle Klarheit | **Schichtenmodell**: Basisrente + Riester-Aufstockung = Gesamtrente vs. Wunsch |
| B | Reicht das für mein Ziel? | Ampel + Lücke | Beibehalten, aber klar auf **Gesamtbild** bezogen |
| C | Was mache ich mit dem Vertrag? | Nur Hinweise (Depot 2027, Wohn-Riester, Zulage) | **Entscheidungsmodul** mit Szenario-Vergleich |

Rechtlicher Rahmen bleibt: vereinfachte Schätzung, keine Anlageberatung, Zero Data.

---

## Teil 1 — Kommunikationsproblem: „Riester ist Aufstockung“

### Problem

KPI „Gesamtrente / Mo.“ steht prominent zuerst. „Gesetzl. Rente“ ist nur eine von drei Kacheln. Charts vergleichen Riester/Depot/ETF als *Alternativen*, ohne die Basisrente als Fundament zu zeigen. Der „Ehrliche Moment“ spricht oft nur über Zulage/Depot — nicht über die Schicht.

### Lösung: Schichten-Darstellung (Must-have)

**Ergebnis-Header neu strukturieren:**

```
┌─────────────────────────────────────────────────────────┐
│  Dein Einkommensbild im Alter (Schätzung)               │
│                                                         │
│  ████████████████  Gesetzliche Rente   1.420 €         │
│  ██████            + Riester             180 €         │
│  ─ ─ ─ ─ ─ ─ ─ ─   Wunschrente         2.000 €         │
│                                                         │
│  Summe Vorsorge: 1.600 €   Lücke: −400 €               │
│                                                         │
│  Hinweis: Riester kommt *zusätzlich* zur gesetzlichen   │
│  Rente (bzw. Pension) — nicht statt ihrer.              │
└─────────────────────────────────────────────────────────┘
```

Konkrete UI-Maßnahmen:

1. **Stacked Bar / Wasserfall** statt isolierter KPI-Zahlen: Basis (GRV/Pension) → + Riester → (+ VBL / Mietersparnis) → Gesamtsumme vs. Wunschrente.
2. **Copy überall angleichen:** „Gesamtrente“ → „Geschätztes Alterseinkommen (inkl. gesetzl. Rente)“ oder „Basis + Riester“.
3. **Ehrlicher Moment:** mindestens eine Variante, die explizit beide Schichten nennt, z. B.  
   *„Deine gesetzliche Rente liegt bei ca. X €. Riester stockt das um ca. Y € auf — zusammen Z €. Dein Ziel: W €.“*
4. **Monatsrente-Vergleich-Chart:** nicht nur Säulen Riester/Depot/ETF/GRV nebeneinander, sondern optional Tab „Aufbau“ mit gestapelter Säule (Basis + private Säule).
5. **Disclaimer-Zeile** unter den KPIs (kurz, immer sichtbar bei `hatRiester` oder `hatGRV`).

### Nicht ändern

Die Berechnung (`gesamtRente = gesetzRente + riesterR + …`) ist bereits korrekt — nur die Darstellung und Texte.

---

## Teil 2 — Riester-Entscheidungshilfe

### Die realistischen Optionen (kein „Löschen“)

„Löschen“ existiert rechtlich nicht. Kommunizieren wir als:

| Option | Nutzer-Sprache | Was passiert (vereinfacht) | Wann typisch sinnvoll |
|--------|----------------|----------------------------|------------------------|
| **A — Weiterführen** | „Weiter besparen“ | Beiträge + Zulagen laufen weiter | Hohe Zulage (Kinder), kurze Restlaufzeit bis 2026, Wohn-Riester-Plan |
| **B — Beitragsfrei stellen** | „Stilllegen / pausieren“ | Keine neuen Beiträge/Zulagen; Kapital bleibt; langsame Verzinsung; Vertrag lebt | Vertrag teuer/schlecht, aber Kündigung zu teuer; Warten auf Depot-2027-Wechsel |
| **C — Umwandeln / Wechseln** | „Ins Altersvorsorgedepot 2027“ / Wohn-Riester | Kapitaltransfer bzw. Wohn-Riester-Hebel; Förderlogik ändert sich | Kinderlos + niedrige Zulage; Hypothek + Eigennutzung |
| **D — Kündigen** | „Auflösen / auszahlen“ | Zulagen + Steuervorteile oft rückzahlungspflichtig; Abzüge; meist Netto-Verlust | Nur in Sonderfällen (sehr kleines Kapital, akute Liquidität) — **selten empfehlenswert** |

Produktprinzip: **Option D nie als grüne Empfehlung**, sondern als Warnpfad mit Kosten-Schätzung.

### UX-Flow (neu nach dem Ergebnis)

```
… → Ehrlicher Moment → Ergebnis (Schichten + Ampel)
                              ↓
              [ Was tun mit meinem Riester? ]
                              ↓
         Szenario-Vergleich A / B / C (/ D)
                              ↓
         Eine priorisierte Empfehlung + Begründung
         + bestehende Handlungsempfehlungen
```

Einstieg nur wenn `hatRiester === true` (und `riesterMoegl`).

### Datenmodell (Erweiterung)

```ts
type RiesterAktion = 'weiter' | 'beitragsfrei' | 'depot2027' | 'wohnriester' | 'kuendigen';

interface RiesterSzenario {
  aktion: RiesterAktion;
  label: string;
  endkapital: number;
  monatsrente: number;       // aus dieser Säule
  gesamtMitBasis: number;    // + gesetzRente (+ …)
  foerderVerlust?: number;   // geschätzt bei Kündigung
  steuernachteil?: number;
  score: number;             // 0–100 relativer Nutzen
  empfohlen: boolean;
  warnung?: string;
  text: string;
}
```

Neue Eingaben (minimal, optional im Wizard oder im Entscheidungsmodul):

- geschätztes **aktuelles Vertragsguthaben** (Fallback: heutige `kapHeute`-Schätzung)
- grobe **Kostenquote** / Garantiezins-Band (optional, Default-Heuristik)
- bei Kündigung: vereinfachte Rückforderungs-Heuristik (Zulagen × Jahre, Steueranteil)

Ohne neue Pflichtfelder starten: Szenarien aus bestehenden `CalcParams` + Defaults ableiten.

### Empfehlungslogik (Heuristik, v1)

Priorisierung grob:

1. `wohnMoegl` → C (Wohn-Riester) stark gewichten  
2. `kinder > 0` und hohe Zulage → A (Weiterführen) bis mind. Ende 2026  
3. `kinder === 0` und niedrige Zulage → C (Depot 2027) oder B als Brücke bis Wechsel möglich  
4. Kündigung (D) nur wenn `kapHeute` sehr klein **und** Nutzer explizit Liquidität braucht — sonst Warnung mit Netto-Vergleich

Immer: **Vergleichstabelle** der Szenarien nebeneinander (Desktop) / als Cards mit Swipe oder Tabs (Mobile).

### Copy-Guardrails

- Keine Formulierungen wie „lösche deinen Riester“.
- Immer: „Schätzung“, „keine Beratung“, bei Kündigung explizit Steuer/Zulagen-Risiko nennen.
- Depot 2027: als Option ab Reformzeitpunkt, nicht als Garantie.

---

## Teil 3 — Responsive Oberflächen (Desktop / Tablet / Handy)

### Breakpoint-Strategie

| Viewport | Layout-Idee |
|----------|-------------|
| **Handy** (&lt; 640px) | Einspaltiger Wizard wie heute; sticky Footer-Nav; Ergebnis gestapelt; Szenarien als Tabs |
| **Tablet** (640–1024px) | Wizard `max-w-2xl`; Fortschritt oben kompakt; KPI-Grid 3 Spalten; Charts höher |
| **Desktop** (≥ 1024px) | App nicht mehr als schmale Spalte in der Landing Page „einklemmen“: z. B. **Zwei-Spalten-Shell** — links Fortschritt + Kurzfassung der Eingaben, rechts aktiver Schritt / Ergebnis; Ergebnis mit Side-by-Side Schichten + Szenario-Tabelle |

### Konkrete Baustellen

1. `AlterliApp` / Wizard-Chrome: Layout-Varianten per `lg:` (Sidebar vs. Fullscreen-Stack).
2. `StepErgebnis`: Schichten-Chart + Entscheidungsmodul; auf Desktop 12-Column-Grid.
3. Marketing-Nav: Mobile-Menü (Sheet) — heute sind Features-Links `hidden md:block`.
4. Charts: auf Mobile Höhe/Tick-Dichte reduzieren; ggf. weniger gleichzeitige Areas.
5. Touch-Ziele: Tiles und Stepper mind. 44px.

### shadcn-Migration (Native → Komponenten)

Bereits genutzt: `Button`, `Badge`, `Tabs`, `Separator`, `Switch`, `Slider`, `Label`, `Input`.

Noch native / ersetzen:

| Stelle | Ziel-Komponente |
|--------|-----------------|
| Haupt-/Untergruppen-Tiles | `Button` variant outline / selected, oder `ToggleGroup` |
| Kinder +/− | `Button` size icon |
| Frühpension-Chips | `ToggleGroup` |
| Nebeneinkommen-Toggle | `Button` oder bestehendes `Switch` |
| Dark-Mode in `Nav.astro` | React-Island mit shadcn `Button` |
| Marketing-CTAs | optional `Button` asChild + `<a>` |
| Entscheidungs-Szenarien | `Card`, `Alert`, `Tooltip` (liegen schon in `ui/`, ungenutzt) |
| Geschlecht / ggf. Vertragsdetails | `Select` |

Neue shadcn-Komponenten nach Bedarf: `Sheet` (Mobile-Nav), `ToggleGroup`, ggf. `Accordion` (Erklärungstexte zu Optionen).

---

## Teil 4 — Weitere Ausbau-Ideen (was Menschen wirklich hilft)

Priorisiert nach Nutzen × Machbarkeit bei Zero-Data:

### P0 — Klarheit & Entscheidung (dieser Plan)

- Schichtenmodell Basis + Riester  
- Riester-Szenario-Vergleich (A–D)  
- Responsive + shadcn-Konsolidierung  

### P1 — Verständnis & Handlung

| Idee | Nutzen |
|------|--------|
| **Was-wäre-wenn** (bereits versprochen) | Kind, Heirat, Gehalt, Frühpension — Lücke live neu berechnen |
| **„Was bedeutet das heute?“** | Monatliche Lücke × 12 × Restjahre → fehlender Kapitalstock; Sparrate-Äquivalent |
| **Kosten der Kündigung** | Transparente Netto-Schätzung (Zulagenrückforderung, Steuer) — Abschreckung mit Zahlen |
| **Timeline bis 2027** | Visuell: „noch X Monate alte Zulagenlogik“ |
| **Glossar / Inline-Tooltips** | Zulage, Eigenbeitrag, Beitragsfreistellung, Depot 2027 in Alltagssprache |
| **Geschlecht im Wizard** | Bereits in `CalcParams`, beeinflusst Lebenserwartung — UI fehlt |

### P2 — Tiefe & Vertrauen

| Idee | Nutzen |
|------|--------|
| **Vertragsguthaben manuell** | Genauere Szenarien als reine Beitrags-Hochrechnung |
| **Haushaltssicht Partner** | Zwei Säulen, mittelbarer Riester |
| **PDF / Teilen-Summary** | Offline-Gespräch mit Berater:in vorbereiten (weiterhin ohne Server-Speicherung) |
| **Quellen & Annahmen aufklappen** | Rentenwert, Zulagen, Wachstumsraten — Vertrauen + CONTRIBUTING-Alignment |
| **Inflation als Toggle mit Erklärung** | Ist vorhanden; Wirkung stärker visualisieren |

### P3 — Später / bewusst nicht

- Konto-Login, Cloud-Sync (widerspricht Zero Data)  
- Produktverkauf / Lead-Funnel  
- Exakte Steuerbescheide / ELSTER-Import  
- „Riester löschen“-Button ohne Kostenaufklärung  

---

## Teil 5 — Vorgeschlagene Umsetzungsphasen

### Phase 1 — Klarheit (schnell, hoher Impact)

1. Schichten-UI + Copy in `StepErgebnis` / `EhrlicherMoment` / `calc.ts` Texte  
2. Disclaimer „Riester zusätzlich zur gesetzlichen Rente“  
3. Gestapeltes Monatsrente-Chart  

**Dateien (erwartet):** `StepErgebnis.tsx`, `EhrlicherMoment.tsx`, `calc.ts` (nur Texte), ggf. neues `EinkommensSchichten.tsx`

### Phase 2 — Entscheidungshilfe

1. Typen + Szenario-Berechnung in `src/lib/` (z. B. `riesterSzenarien.ts`)  
2. UI-Modul `RiesterEntscheidung.tsx` unter Ergebnis  
3. Empfehlung an bestehendes `empf`-System anbinden  

### Phase 3 — Responsive Shell + shadcn

1. Desktop-Zweispalter für Wizard/Ergebnis  
2. Native Controls → shadcn  
3. Mobile Sheet-Nav  

### Phase 4 — Was-wäre-wenn & P1-Features

`ereignisse` verdrahten, Glossar, Geschlecht-Select, Kündigungskosten-Detail.

---

## Offene Entscheidungen (zur Abstimmung)

1. **Tiefe der Kündigungsschätzung:** nur qualitative Warnung vs. grobe Euro-Zahl (Zulagen × Jahre − Abzüge)?  
2. **Einstieg Entscheidungsmodul:** eigener Screen nach Ergebnis vs. Abschnitt *auf* der Ergebnisseite?  
3. **Zusatzfelder:** Vertragsguthaben jetzt abfragen oder erst in Phase 2 optional?  
4. **Desktop-Layout:** App weiterhin eingebettet in Landing Page vs. `/app`-Route mit eigenem Full-Layout?  
5. **Ton:** „Stilllegen“ vs. „Beitragsfrei stellen“ — welche Nutzer-Sprache?

**Empfehlung des Entwurfs:**  
(1) grobe Euro-Warnzahl, (2) Abschnitt auf Ergebnisseite mit Deep-Dive-Expand, (3) Guthaben optional mit Fallback, (4) erst Layout in `#app` verbessern, Route später, (5) Label „Beitragsfrei stellen (stilllegen)“ mit Tooltip.

---

## Erfolgskriterien

- Nutzer:in versteht in &lt; 5 Sekunden, dass die gesetzliche Rente die Basis ist und Riester *dazukommt*.  
- Bei `hatRiester` gibt es eine klare, begründete Handlungsoption unter A–D (nicht nur Ampel).  
- Desktop-, Tablet- und Mobile-Layouts sind bewusst unterschiedlich, nicht nur „schmal zentriert“.  
- Keine neuen Native-Controls dort, wo shadcn-Äquivalente existieren bzw. ergänzt werden.  
- Zero-Data und „keine Beratung“-Disclaimer bleiben sichtbar und ehrlich.

---

## Bezug zum Code (Ist-Stand)

| Thema | Ort |
|-------|-----|
| Gesamtrente-Formel | `src/lib/calc.ts` (`gesamtRente`) |
| Ergebnis-KPIs / Charts | `src/components/app/StepErgebnis.tsx` |
| Empfehlungen | `calc.ts` → `empf` |
| Riester-Eingabe | `WizardVorsorge.tsx` |
| Typen | `src/lib/types.ts` |
| Unbenutzte shadcn | `Card`, `Select`, `Alert`, `Tooltip` in `src/components/ui/` |
| Früheres Redesign | `docs/superpowers/specs/2026-04-30-frontend-redesign-design.md` |
